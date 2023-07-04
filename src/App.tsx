import React, { useEffect } from "react";
import "./App.css"
import {
  EthereumClient,
  modalConnectors,
  walletConnectProvider,
} from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";
import { configureChains, createClient, WagmiConfig, useAccount } from "wagmi";
import { polygonMumbai } from "wagmi/chains";
import { Web3Button } from "@web3modal/react";
import axios from "axios";
import Web3 from "web3";

import Header from "./components/Header";
import ListComponent from "./components/ListComponent";
import Footer from "./components/Footer";

import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Typography from '@mui/material/Typography';
import ReactGA from 'react-ga';
import { Rings } from 'react-loader-spinner'
import Pusher from 'pusher-js';

import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink, ApolloLink } from '@apollo/client';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #FF7D3A',
  borderRadius: '10px',
  boxShadow: 24,
  p: 4,
  display: "flex",
  flexDirection: "column",
};

const chains = [polygonMumbai];

const projectId = String(process.env.REACT_APP_WC_PROJECT_ID)
const TRACKING_ID = String(process.env.REACT_APP_TRACKING_ID)

// Wagmi client
const { provider } = configureChains(chains, [
  walletConnectProvider({ projectId: projectId }),
]);
const wagmiClient = createClient({
  autoConnect: true,
  connectors: modalConnectors({ appName: "web3Modal", chains }),
  provider,
});

// Web3Modal Ethereum Client
const ethereumClient = new EthereumClient(wagmiClient, chains);

const web3Provider = new Web3(Web3.givenProvider);

export default function App() {
  const [deployed, setDeployed] = React.useState(false);
  const [deployProcess, setDeployProcess] = React.useState(false);
  const [uri, setUri] = React.useState('');
  const [contractAddress, setContractAddress] = React.useState<string | undefined>();
  const projectId = String(process.env.REACT_APP_WC_PROJECT_ID)
  const { address } = useAccount()
  const [open, setOpen] = React.useState(false);
  const [response, setResponse] = React.useState("");
  const [token, setToken] = React.useState();
  const handleClose = () => setOpen(false);
  const [deploymentId, setDeploymentId] =React.useState<string>()


  async function requestDeployToGateway(address: string) {
    const url = `${process.env.REACT_APP_PROJECT_URL}/deploy`
    const payload = {
      email: "todo-multi.cedalio.com",
      schema: `type Todo {
            id: UUID!
            title: String!
            description: String
            priority: Int!
            tags: [String!]
            status: String
          }
          
          `,
      schema_owner: address,
      network: "polygon:mumbai"
    }
    setOpen(true)
    const nonce = await getNonce()
    const token = await getToken(nonce, address)
    setToken(token)
    localStorage.setItem('auth_token', token)

    axios.post(
      url, payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
    ).then(function (response: any) {
      localStorage.setItem('deploymentId', response.data.deployment_id);
      localStorage.setItem('contractAddress', response.data.contract_address);
      localStorage.setItem('deployed', 'true');
      setContractAddress(response.data.contract_address)
      setOpen(false)
      setResponse("success")
      setDeploymentId(response.data.deployment_id)
      setDeployProcess(true)
      setUri(`${String(process.env.REACT_APP_PROJECT_URL)}/${response.data.deployment_id}/graphql`)
    })
      .catch(function (error: any) {
        console.log(error);
        setResponse("error")
      })
  }

  async function getNonce() {
    const url = `${process.env.REACT_APP_PROJECT_URL}/auth`
    const response = await axios.post(
      url
    )
    return response.data.nonce
  }

  async function getToken(nonce: string, address: string) {
    const message = "TODO"
    const messageToSign = message + nonce

    const signature = await web3Provider.eth.personal.sign(messageToSign, address, "");

    const url = `${process.env.REACT_APP_PROJECT_URL}/auth/verify`
    const payload = {
      "message": message,
      "account": address,
      nonce,
      "signature": signature.slice(2)
    }

    const response = await axios.post(
      url, payload
    )
    return response.data.token
  }

  function redeploy() {
    setResponse("")
    return requestDeployToGateway(String(address))
  }

  useEffect(() => {
    const deployed = Boolean(localStorage.getItem('deployed'))
    const contractAddress = localStorage.getItem('contractAddress')
    const deploymentId = localStorage.getItem('deploymentId')

    if (deployed && contractAddress && deploymentId) {
      setUri(`${String(process.env.REACT_APP_PROJECT_URL)}/${deploymentId}/graphql`)
      setDeployed(deployed)
      setContractAddress(contractAddress)
    }
    else if (address) {
      requestDeployToGateway(address)
    }
    else {
      return
    }
  }, [address])

  const httpLink = new HttpLink({ uri: uri });
  const authLink = new ApolloLink((operation, forward) => {
    // Retrieve the authorization token from local storage.
    const token = localStorage.getItem('auth_token');

    // Use the setContext method to set the HTTP headers.
    operation.setContext({
      headers: {
        authorization: token ? `Bearer ${token}` : ''
      }
    });

    // Call the next link in the middleware chain.
    return forward(operation);
  });
  
  useEffect(()=>{
    if(deployProcess){
      bindPusherChannel()
    }
  }, [deployProcess])

  function bindPusherChannel() {
    var pusher = new Pusher(String(process.env.REACT_APP_PUSHER_KEY), {
        cluster: 'us2'
    });
    const channelName = String(deploymentId)
    var channel = pusher.subscribe(channelName);
    channel.bind('DEPLOYMENT_STATUS_UPDATE', function (data: any) {
        if (data.status == "READY") {
          setDeployed(true)
        }
        else if (data.status == "FAILED") {
          setResponse("error")
        }
    });
}


  const client = new ApolloClient({
    link: authLink.concat(httpLink), // Chain it with the HttpLink
    cache: new InMemoryCache({
      addTypename: false, //TODO this must be removed
    })
  });

  ReactGA.initialize(TRACKING_ID);

  const Loader = () => {
    if (response === "error") {
      return (
        <div className="loader-layer" style={{ justifyContent: 'center', display: "flex", flexDirection: "column" }}>
          <p className='error-message' style={{ textTransform: 'uppercase', textAlign: "center", color: "black", fontWeight: "200" }}>We had a <strong> problem </strong>trying to deploy please <strong>retry</strong>.</p>
          <button className="retry-button" onClick={redeploy}>RETRY</button>
        </div>
      )
    }
    else {
      return (
        <div className="loader-layer" style={{ justifyContent: 'center' }}>
          <Rings
            height="100"
            width="100"
            radius={2}
            color="#FF7D3A"
            ariaLabel="puff-loading"
            wrapperStyle={{}}
            wrapperClass=""
            visible={true}
          />
        </div>
      )
    }
  }

  return (
    <ApolloProvider client={client}>
      <div className="App">
        <WagmiConfig client={wagmiClient}>
          <Header />
          <div className={address ? `button-container connected` : `button-container`} >
            <Web3Button />
          </div>
          <div className="gif-container" style={address ? { display: 'none' } : { display: 'flex' }} >
            <div className="web">
              <img className="gif" src="home-gif.gif" alt="explained gif" />
            </div>
          </div>
          {deployed ? <ListComponent address={address} /> : null}
          <Web3Modal
            projectId={projectId}
            ethereumClient={ethereumClient}
          />
          <Modal
            aria-labelledby="transition-modal-title"
            aria-describedby="transition-modal-description"
            open={open}
            onClose={handleClose}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
              timeout: 500,
            }}
          >
            <Fade in={open}>
              <Box sx={style}>
                <Typography id="transition-modal-title" variant="h6" component="h2" sx={{ fontWeight: "800", textAlign: "center" }}>
                  Creating your account and deploying the Smart Contract Database in Polygon Mumbai!
                </Typography>
                <Typography id="transition-modal-description" sx={{ mt: 2, textAlign: "center" }}>
                  This could take between <strong> 15 to 30 seconds</strong> depending on the network congestion. Please <strong>don’t close the window.</strong>
                </Typography>
                <Loader />
              </Box>
            </Fade>
          </Modal>
          <Footer contractAddress={contractAddress} />
        </WagmiConfig>
      </div>
    </ApolloProvider>
  );
}