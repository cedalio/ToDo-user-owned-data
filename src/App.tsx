import React, { useEffect, useState } from 'react';
import './App.css';
import { EthereumClient, modalConnectors, walletConnectProvider } from '@web3modal/ethereum';
import { Web3Modal } from '@web3modal/react';
import { configureChains, createClient, WagmiConfig, useAccount } from 'wagmi';
import { polygonMumbai } from 'wagmi/chains';
import { Web3Button } from '@web3modal/react';
import CedalioSDK from '@cedalio/sdk-js';

import Header from './components/Header';
import ListComponent from './components/ListComponent';
import Footer from './components/Footer';

import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Typography from '@mui/material/Typography';
import ReactGA from 'react-ga';
import { Rings } from 'react-loader-spinner';

import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  HttpLink,
  ApolloLink,
  NormalizedCacheObject
} from '@apollo/client';

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
const CEDALIO_PROJECT_ID = String(process.env.REACT_APP_CEDALIO_PROJECT_ID);

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
  const [cedalioSdk, setCedalioSDK] = useState<CedalioSDK>();
  const [deployLoading, setDeployLoading] = useState(false);
  const [deployError, setDeployError] = useState<string>();
  const [deployed, setDeployed] = useState(false);
  const [apolloClient, setApolloClient] = useState<ApolloClient<NormalizedCacheObject>>();
  const [token, setToken] = useState<string>();
  const { address } = useAccount({
    onConnect: (data) => {
      if (data.address) {
        setCedalioSDK(new CedalioSDK({ projectId: CEDALIO_PROJECT_ID, address: data.address }));
      }
    }
  });

  // Use saved token and deploymentId to avoid a new login
  useEffect(() => {
    if (!cedalioSdk) {
      return;
    }
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      cedalioSdk?.setAuthToken(savedToken);
    }

    const savedDeploymentId = localStorage.getItem('deploymentId');
    if (savedToken && savedDeploymentId) {
      setApolloClient(createApolloClient(savedToken, savedDeploymentId));
      setDeployed(true);
    }
  }, [cedalioSdk]);

  const loginToCedalio = async () => {
    const response = await cedalioSdk?.login();
    if (response?.ok) {
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);
    }
  };

  const logoutFromCedalio = () => {
    cedalioSdk?.logout();
    setToken(undefined);
    localStorage.removeItem('token');
    localStorage.removeItem('deploymentId');
  };

  const deploy = async () => {
    // TODO: Change getAuthToken to isLoggedIn ?
    if (cedalioSdk && cedalioSdk.getAuthToken()) {
      setDeployLoading(true);
      const deployResponse = await cedalioSdk.createDatabase();
      if (deployResponse.ok) {
        const { deploymentId } = deployResponse.data;
        const deployStatusResponse = await cedalioSdk.waitForDatabaseDeployment({
          deploymentId: deployResponse.data.deploymentId
        });
        setDeployLoading(false);

        if (deployStatusResponse.ok) {
          setDeployed(true);
          const token = cedalioSdk.getAuthToken();
          if (token) {
            setApolloClient(createApolloClient(token, deploymentId));
          }
          localStorage.setItem('deploymentId', deploymentId);
        } else {
          setDeployError(deployStatusResponse.error.message);
        }
      } else {
        setDeployError(deployResponse.error.message);
      }
    }
  };

  const createApolloClient = (token: string, deploymentId: string) => {
    const httpLink = new HttpLink({
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

  const isLoggedIn = !!token;

  const setAccess = async () => {
    const deploymentId = localStorage.getItem('deploymentId');
    console.log(deploymentId);
    if (!deploymentId) {
      return;
    }
    const res = await cedalioSdk?.setAccessRules({
      deploymentId,
      rules: [
        {
          accessControl: 'PUBLIC',
          address
        }
      ]
    });
    console.log('res', res);
  };

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
        <Header />
        <div className={address ? `button-container connected` : `button-container`}>
          <Web3Button />
        </div>
        <div className="gif-container" style={address ? { display: 'none' } : { display: 'flex' }}>
          <div className="web">
            <img className="gif" src="home-gif.gif" alt="explained gif" />
          </div>
        </div>
        {address && !isLoggedIn && (
          <button type="button" onClick={loginToCedalio}>
            Log in
          </button>
        )}
        {isLoggedIn && !deployed && (
          <button type="button" onClick={deploy}>
            Deploy
          </button>
        )}
        {isLoggedIn && (
          <button type="button" onClick={logoutFromCedalio}>
            Log out
          </button>
        )}
        {deployed && apolloClient && (
          <>
            <button onClick={setAccess}>Set access</button>
            <ApolloProvider client={apolloClient}>
              <ListComponent address={address} />
            </ApolloProvider>
          </>
        )}
        <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
        <Modal
          aria-labelledby="transition-modal-title"
          aria-describedby="transition-modal-description"
          open={deployLoading}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500
          }}
        >
          <Fade in={deployLoading}>
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
