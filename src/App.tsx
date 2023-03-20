import React, { useEffect } from "react";
import "./App.css"
import { usePrivy } from '@privy-io/react-auth';

import axios from "axios";

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

import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

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

const TRACKING_ID = String(process.env.REACT_APP_TRACKING_ID)
// const chains = [polygonMumbai];

// const projectId = String(process.env.REACT_APP_WC_PROJECT_ID)

// // Wagmi client
// const { provider } = configureChains(chains, [
//   walletConnectProvider({ projectId: projectId }),
// ]);
// const wagmiClient = createClient({
//   autoConnect: true,
//   connectors: modalConnectors({ appName: "web3Modal", chains }),
//   provider,
// });

// // Web3Modal Ethereum Client
// const ethereumClient = new EthereumClient(wagmiClient, chains);

export default function App() {
  const [deployed, setDeployed] = React.useState(false);
  const [uri, setUri] = React.useState('');
  const [contractAddress, setContractAddress] = React.useState<string | undefined>();
  const projectId = String(process.env.REACT_APP_WC_PROJECT_ID)
  // const { address } = useAccount()
  const [open, setOpen] = React.useState(false);
  const [response, setResponse] = React.useState("");
  const handleClose = () => setOpen(false);
  const { ready, authenticated, user, login } = usePrivy()

  function requestDeployToGateway(address: string) {
    const url = `${process.env.REACT_APP_GRAPHQL_GATEWAY_BASE_URL}/deploy`
    const payload = {
      email: "todo-multi.cedalio.com",
      schema: `type Todo {
            id: UUID!
            title: String!
            description: String
            priority: Int!
            owner: String!
            tags: [String!]
            status: String
          }
          
          `,
      schema_owner: address,
      network: "polygon:mumbai"
    }
    setOpen(true)
    axios.post(
      url, payload
    ).then(function (response: any) {
      localStorage.setItem('deploymentId', response.data.deployment_id);
      localStorage.setItem('contractAddress', response.data.contract_address);
      localStorage.setItem('deployed', 'true');
      setContractAddress(response.data.contract_address)
      setDeployed(true)
      setOpen(false)
      setResponse("success")
      setUri(`${String(process.env.REACT_APP_GRAPHQL_GATEWAY_BASE_URL)}/${response.data.deployment_id}/graphql`)
    })
      .catch(function (error: any) {
        console.log(error);
        setResponse("error")
      })
  }

  function redeploy() {
    setResponse("")
    if (user?.wallet?.address) {
      return requestDeployToGateway(String(user?.wallet?.address))
    }
  }

  useEffect(() => {
    const deployed = Boolean(localStorage.getItem('deployed'))
    const contractAddress = localStorage.getItem('contractAddress')
    const deploymentId = localStorage.getItem('deploymentId')

    if (deployed && contractAddress && deploymentId) {
      setUri(`${String(process.env.REACT_APP_GRAPHQL_GATEWAY_BASE_URL)}/${deploymentId}/graphql`)
      setDeployed(deployed)
      setContractAddress(contractAddress)
    }
    else if (ready && authenticated) {
      if (user?.wallet?.address) {
        return requestDeployToGateway(String(user?.wallet?.address))
      }
    }
    else {
      return
    }
  }, [ready, authenticated])

  const client = new ApolloClient({
    uri,
    cache: new InMemoryCache({
      addTypename: false,
    }),
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
        <Header />
        <div className={authenticated ? `button-container connected` : `button-container`} >
          {authenticated
            ? <button className="logged-icon">{user?.wallet?.address}</button>
            : <button className="login-button" onClick={login} >LOGIN TO DEPLOY</button>}
        </div>
        <div className="gif-container" style={authenticated ? { display: 'none' } : { display: 'flex' }} >
          <div className="web">
            <img className="gif" src="home-gif.gif" alt="explained gif" />
          </div>
        </div>
        {deployed ? <ListComponent address={user?.wallet?.address} /> : null}
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
        {/* </WagmiConfig> */}
      </div>
    </ApolloProvider>
  );
}