import './App.css';
import { EthereumClient, w3mConnectors } from '@web3modal/ethereum';
import { configureChains, WagmiConfig, createConfig, mainnet } from 'wagmi';
import { polygonMumbai } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

import App from './App';
import { Web3Modal } from '@web3modal/react';

const chains = [polygonMumbai];

const projectId = String(process.env.REACT_APP_WC_PROJECT_ID);

const { publicClient } = configureChains([mainnet], [publicProvider()]);
const wagmiClient = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
});

const ethereumClient = new EthereumClient(wagmiClient, chains);

export default function WagmiContainer() {
  return (
    <WagmiConfig config={wagmiClient}>
      <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
      <App />
    </WagmiConfig>
  );
}
