import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";

import { SessionProvider } from "next-auth/react";
import { WagmiConfig } from "wagmi";
import { Toaster } from "react-hot-toast";
import { lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { useAutoConnectSafe, wagmiClient, chains } from "@/lib/wagmi";
import PlausibleProvider from "next-plausible";

const AutoConnectSafe = ({ children }) => {
  useAutoConnectSafe();
  return children;
};

function MyApp({ Component, pageProps }) {
  return (
    <PlausibleProvider domain="tokentable.org">
      <WagmiConfig client={wagmiClient}>
        <AutoConnectSafe>
          <SessionProvider refetchInterval={0} session={pageProps.session}>
            <RainbowKitProvider
              chains={chains}
              theme={lightTheme({ accentColor: "#1455FE" })}
            >
              <Component {...pageProps} />
              <Toaster position="bottom-center" />
            </RainbowKitProvider>
          </SessionProvider>
        </AutoConnectSafe>
      </WagmiConfig>
    </PlausibleProvider>
  );
}

export default MyApp;
