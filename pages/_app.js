import '../styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css';

import {
  wallet,
  RainbowKitProvider,
  connectorsForWallets,
} from '@rainbow-me/rainbowkit';
import {
  createClient,
  WagmiConfig,
} from 'wagmi';
import { chains } from "@/lib/provider"
import { Toaster } from 'react-hot-toast';
import { useAutoConnectSafe, wagmiClient } from '@/lib/wagmi';

const AutoConnectSafe = ({ children }) => {
  useAutoConnectSafe()
  return children
}

function MyApp({ Component, pageProps }) {
  return (
    <WagmiConfig client={wagmiClient}>
      <AutoConnectSafe>
        <RainbowKitProvider chains={chains}>
          <Component {...pageProps} />
          <Toaster position="bottom-center" />
        </RainbowKitProvider>
      </AutoConnectSafe>
    </WagmiConfig>
  );
}

export default MyApp
