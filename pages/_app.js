import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";

import { SessionProvider } from "next-auth/react";
import { WagmiConfig } from "wagmi";
import { Toaster } from "react-hot-toast";
import { lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { RainbowKitSiweNextAuthProvider } from "@rainbow-me/rainbowkit-siwe-next-auth";
import { useAutoConnectSafe, wagmiClient, chains } from "@/lib/wagmi";
import PlausibleProvider from "next-plausible";
import { Fragment } from "react";

const AutoConnectSafe = ({ children }) => {
  useAutoConnectSafe();
  return children;
};

const RAINBOWKIT_AUTH_ENABLED = false;
const RainbowKitAuthenticationProvider = RAINBOWKIT_AUTH_ENABLED
  ? RainbowKitSiweNextAuthProvider
  : Fragment;

function MyApp({ Component, pageProps }) {
  return (
    <PlausibleProvider domain="tokentable.org">
      <WagmiConfig client={wagmiClient}>
        <AutoConnectSafe>
          <SessionProvider refetchInterval={0} session={pageProps.session}>
            <RainbowKitAuthenticationProvider>
              <RainbowKitProvider
                chains={chains}
                theme={lightTheme({ accentColor: "#1455FE" })}
              >
                <Component {...pageProps} />
                <Toaster position="bottom-center" />
              </RainbowKitProvider>
            </RainbowKitAuthenticationProvider>
          </SessionProvider>
        </AutoConnectSafe>
      </WagmiConfig>
    </PlausibleProvider>
  );
}

export default MyApp;
