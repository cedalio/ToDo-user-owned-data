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

import Header from "./components/Header";
import ListComponent from "./components/ListComponent";
import Footer from "./components/Footer";
import { useEffect } from "react";
import DeployButton from "./components/DeployButton";
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
  const projectId = String(process.env.REACT_APP_WC_PROJECT_ID)
  const { address } = useAccount()
  const tagManagerArgs = {
    gtmId: String(process.env.REACT_APP_GOOGLE_TAG_MANAGER_ID),
    auth: process.env.REACT_APP_GOOGLE_TAG_MANAGER_AUTH,
    preview: process.env.REACT_APP_GOOGLE_TAG_MANAGER_PREVIEW
  }

  useEffect(() => {
    TagManager.initialize(tagManagerArgs)
  }, [])

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
          {/* <ListComponent address={address} /> */}
          {address ? <DeployButton /> : null}
          <Web3Modal
            projectId={projectId}
            ethereumClient={ethereumClient}
          />
          <Footer />
        </WagmiConfig>
      </div>
    </>
  );
}