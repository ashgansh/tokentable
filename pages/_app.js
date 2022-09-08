import '../styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css';

import {
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import {
  createClient,
  WagmiConfig,
} from 'wagmi';
import { chains, provider } from "@/lib/provider"
import { Toaster } from 'react-hot-toast';

const { connectors } = getDefaultWallets({
  appName: 'Token Ops',
  chains
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider
})

function MyApp({ Component, pageProps }) {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <Component {...pageProps} />
        <Toaster position="bottom-center" />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default MyApp
