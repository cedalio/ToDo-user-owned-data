import React, { useCallback, useEffect, useState } from 'react';
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

import { ApolloClient, InMemoryCache, ApolloLink, NormalizedCacheObject, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import Login from './components/Login';
import { cedalioSdk, loginToCedalio, logoutFromCedalio, validateJwt } from './utils/sdk';
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

const createApolloClient = ({
  deploymentId,
  onTokenExpiration
}: {
  deploymentId: string;
  onTokenExpiration: () => void;
}) => {
  const { token } = cedalioSdk.getAuthSession();

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    // Error with the token, possible because it expired. Logout.
    onTokenExpiration();
  });

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

  const apolloClient = new ApolloClient({
    link: from([errorLink, authLink.concat(httpLink)]),
    cache: new InMemoryCache({
      addTypename: false
    })
  });

  return apolloClient;
};

export default function App() {
  const [contractAddress, setContractAddress] = useState<string | undefined>();
  const projectId = String(process.env.REACT_APP_WC_PROJECT_ID);
  const [deployLoading, setDeployLoading] = useState(false);
  const [deployError, setDeployError] = useState<string>();
  const [databaseReady, setDatabaseReady] = useState(false);
  const [apolloClient, setApolloClient] = useState<ApolloClient<NormalizedCacheObject>>();

  const waitForDbDeployment = useCallback(async (deploymentId: string) => {
    const deployStatusResponse = await cedalioSdk.waitForDatabaseDeployment({
      deploymentId
    });
    setDeployLoading(false);
    if (deployStatusResponse.ok) {
      setDatabaseReady(true);
      if (deployStatusResponse.data.status === 'READY') {
        setContractAddress(deployStatusResponse.data.databaseContract);
        const { token } = cedalioSdk.getAuthSession();
        if (token) {
          setApolloClient(createApolloClient({ deploymentId, onTokenExpiration: logoutFromCedalio }));
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
  }, [waitForDbDeployment]);

  const { isConnected, address } = useAccount({
    onConnect: async (data) => {
      if (data.address) {
        let token: string | undefined | null = localStorage.getItem('token');
        const { address } = data;

        // If current token is invalid/expired, logout
        if (token && !validateJwt(token)) {
          logoutFromCedalio();
          return;
        }

        // Current token is valid, set it as session token to avoid login request
        if (token) {
          cedalioSdk.setAuthSession({ token });
        } else {
          // No token, perform login
          token = await loginToCedalio(address);
        }

        // If there's a deploymentId avoid deploy and check database status
        const deploymentId = localStorage.getItem('deploymentId');
        if (token && deploymentId) {
          setApolloClient(createApolloClient({ deploymentId, onTokenExpiration: logoutFromCedalio }));
          setDatabaseReady(true);
          waitForDbDeployment(deploymentId);
        } else {
          deploy();
        }
      }
    },
    onDisconnect: () => {
      logoutFromCedalio();
    }
  });

  // If token is invalid or expired, logout
  useEffect(() => {
    const { token } = cedalioSdk.getAuthSession();
    if (token && !validateJwt(token)) {
      logoutFromCedalio();
    }
  }, [address]);

  ReactGA.initialize(TRACKING_ID);

  const isLoggedIn = cedalioSdk?.isLoggedIn() && isConnected;

  const Loader = () => {
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
