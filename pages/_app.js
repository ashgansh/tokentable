import '../styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css';

import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiConfig } from 'wagmi';
import { Toaster } from 'react-hot-toast';
import { useAutoConnectSafe, wagmiClient, chains } from '@/lib/wagmi';

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
