import React, { useCallback, useState } from 'react';
import './App.css';
import { EthereumClient, modalConnectors, walletConnectProvider } from '@web3modal/ethereum';
import { Web3Modal } from '@web3modal/react';
import { configureChains, createClient, WagmiConfig, useAccount } from 'wagmi';
import { polygonMumbai } from 'wagmi/chains';
import { createUploadLink } from 'apollo-upload-client';

import Header from './components/Header';
import Footer from './components/Footer';

import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Typography from '@mui/material/Typography';
import ReactGA from 'react-ga';
import { Rings } from 'react-loader-spinner';

import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, NormalizedCacheObject } from '@apollo/client';
import Login from './components/Login';
import { cedalioSdk } from './utils/sdk';
import TodosView from './components/TodosView';
import { CEDALIO_PROJECT_ID } from './utils/envs';

const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #FF7D3A',
  borderRadius: '10px',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column'
};

const chains = [polygonMumbai];

const projectId = String(process.env.REACT_APP_WC_PROJECT_ID);
const TRACKING_ID = String(process.env.REACT_APP_TRACKING_ID);

// Wagmi client
const { provider } = configureChains(chains, [walletConnectProvider({ projectId: projectId })]);
const wagmiClient = createClient({
  autoConnect: true,
  connectors: modalConnectors({ appName: 'web3Modal', chains }),
  provider
});

// Web3Modal Ethereum Client
const ethereumClient = new EthereumClient(wagmiClient, chains);

export default function App() {
  const [contractAddress, setContractAddress] = useState<string | undefined>();
  const projectId = String(process.env.REACT_APP_WC_PROJECT_ID);
  const [deployLoading, setDeployLoading] = useState(false);
  const [deployError, setDeployError] = useState<string>();
  const [databaseReady, setDatabaseReady] = useState(false);
  const [apolloClient, setApolloClient] = useState<ApolloClient<NormalizedCacheObject>>();

  const loginToCedalio = async (address: string) => {
    const response = await cedalioSdk?.login({ address });
    if (response?.ok) {
      localStorage.setItem('token', response.data.token);
      return response.data.token;
    }
    return undefined;
  };

  const logoutFromCedalio = () => {
    cedalioSdk?.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('deploymentId');
  };

  useAccount({
    onConnect: async (data) => {
      if (data.address) {
        // Login is executing every time. Need a way to save address and token
        const token = await loginToCedalio(data.address);

        const savedDeploymentId = localStorage.getItem('deploymentId');
        if (token && savedDeploymentId) {
          setApolloClient(createApolloClient(token, savedDeploymentId));
          setDatabaseReady(true);
          waitForDbDeployment(savedDeploymentId);
        } else {
          deploy();
        }
      }
    },
    onDisconnect: () => {
      logoutFromCedalio();
    }
  });

  const waitForDbDeployment = useCallback(async (deploymentId: string) => {
    console.log('waiting for deployment status');
    const deployStatusResponse = await cedalioSdk.waitForDatabaseDeployment({
      deploymentId
    });
    setDeployLoading(false);
    console.log('status: ', deployStatusResponse);
    if (deployStatusResponse.ok) {
      setDatabaseReady(true);
      if (deployStatusResponse.data.status === 'READY') {
        setContractAddress(deployStatusResponse.data.databaseContract);
        const token = cedalioSdk.getAuthToken();
        if (token) {
          setApolloClient(createApolloClient(token, deploymentId));
        }
        localStorage.setItem('deploymentId', deploymentId);
      } else {
        setDeployError('Deploy has failed');
      }
    } else {
      setDeployError(deployStatusResponse.error.message);
      localStorage.removeItem('deploymentId');
    }
  }, []);

  const deploy = useCallback(async () => {
    if (cedalioSdk.isLoggedIn()) {
      setDeployError(undefined);
      setDeployLoading(true);
      const deployResponse = await cedalioSdk.createDatabase();
      if (deployResponse.ok) {
        const { deploymentId } = deployResponse.data;
        localStorage.setItem('deploymentId', deploymentId);
        waitForDbDeployment(deploymentId);
      } else {
        setDeployError(deployResponse.error.message);
      }
    }
  }, [waitForDbDeployment]);

  const createApolloClient = (token: string, deploymentId: string) => {
    const httpLink = createUploadLink({
      uri: `https://${CEDALIO_PROJECT_ID}.gtw.cedalio.io/deployments/${deploymentId}/graphql`
    });
    const authLink = new ApolloLink((operation, forward) => {
      operation.setContext({
        headers: {
          authorization: token ? `Bearer ${token}` : ''
        }
      });

      return forward(operation);
    });

    return new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache({
        addTypename: false //TODO this must be removed
      })
    });
  };

  ReactGA.initialize(TRACKING_ID);

  const Loader = () => {
    console.log('deployError', deployError);
    if (deployError) {
      return (
        <div
          className="loader-layer"
          style={{ justifyContent: 'center', display: 'flex', flexDirection: 'column' }}
        >
          <p
            className="error-message"
            style={{ textTransform: 'uppercase', textAlign: 'center', color: 'black', fontWeight: '200' }}
          >
            We had a <strong> problem </strong>trying to deploy please <strong>retry</strong>.{deployError}
          </p>
          <button className="retry-button" onClick={deploy}>
            RETRY
          </button>
        </div>
      );
    } else {
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
      );
    }
  };

  const isLoggedIn = cedalioSdk.isLoggedIn();

  return (
    <div className="App">
      <WagmiConfig client={wagmiClient}>
        <Header isLoggedIn={isLoggedIn} />
        {!isLoggedIn && <Login />}
        {isLoggedIn && databaseReady && apolloClient && <TodosView apolloClient={apolloClient} />}
        <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
        <Modal
          aria-labelledby="transition-modal-title"
          aria-describedby="transition-modal-description"
          open={deployLoading || !!deployError}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500
          }}
        >
          <Fade in={deployLoading || !!deployError}>
            <Box sx={style}>
              <Typography
                id="transition-modal-title"
                variant="h6"
                component="h2"
                sx={{ fontWeight: '800', textAlign: 'center' }}
              >
                Creating your account and deploying the Smart Contract Database in Polygon Mumbai!
              </Typography>
              <Typography id="transition-modal-description" sx={{ mt: 2, textAlign: 'center' }}>
                This could take between <strong> 15 to 30 seconds</strong> depending on the network
                congestion. Please <strong>don’t close the window.</strong>
              </Typography>
              <Loader />
            </Box>
          </Fade>
        </Modal>
        <Footer contractAddress={contractAddress} />
      </WagmiConfig>
    </div>
  );
}
