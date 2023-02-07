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
import TagManager from 'react-gtm-module'
import axios from "axios";

import Header from "./components/Header";
import ListComponent from "./components/ListComponent";
import Footer from "./components/Footer";

import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Typography from '@mui/material/Typography';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const chains = [polygonMumbai];

const projectId = String(process.env.REACT_APP_WC_PROJECT_ID)

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

export default function App() {
  const [deployed, setDeployed] = React.useState(false);
  const [contractAddress, setContractAddress] = React.useState<string|undefined>();
  const projectId = String(process.env.REACT_APP_WC_PROJECT_ID)
  const { address } = useAccount()
  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);

  const tagManagerArgs = {
    gtmId: String(process.env.REACT_APP_GOOGLE_TAG_MANAGER_ID),
    auth: process.env.REACT_APP_GOOGLE_TAG_MANAGER_AUTH,
    preview: process.env.REACT_APP_GOOGLE_TAG_MANAGER_PREVIEW
  }

  useEffect(() => {
    TagManager.initialize(tagManagerArgs)
  }, [])

  function requestDeployToGateway(address:string) {
    const url = `${process.env.REACT_APP_GRAPHQL_GATEWAY_BASE_URL}/deploy`
    const payload = {
      email: "example.com",
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
      setContractAddress(response.data.contract_address)
      setDeployed(true)
      setOpen(false)
    })
      .catch(function (error: any) {
        console.log(error);
        setOpen(false)
      })
  }

  useEffect(() => {
    if (address) {
      requestDeployToGateway(address)
    }
  }, [address])

  return (
    <>
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
          {/* {address ? <DeployButton /> : null} */}
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
                <Typography id="transition-modal-title" variant="h6" component="h2">
                  We are deploying the schema in Polygon Mumbai!
                </Typography>
                <Typography id="transition-modal-description" sx={{ mt: 2 }}>
                  This could take between 15 to 20 seconds, please don't close the window
                </Typography>
              </Box>
            </Fade>
          </Modal>
          <Footer contractAddress={contractAddress}/>
        </WagmiConfig>
      </div>
    </>
  );
}