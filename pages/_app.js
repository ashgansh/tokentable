import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";

import { SessionProvider } from "next-auth/react";
import { WagmiConfig } from "wagmi";
import { Toaster } from "react-hot-toast";
import { lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { RainbowKitSiweNextAuthProvider } from "@rainbow-me/rainbowkit-siwe-next-auth";
import { useAutoConnectSafe, wagmiClient, chains } from "@/lib/wagmi";
import { Fragment } from "react";
import { usePostHog } from "next-use-posthog";

const AutoConnectSafe = ({ children }) => {
  useAutoConnectSafe();
  return children;
};

const RAINBOWKIT_AUTH_ENABLED = false;
const RainbowKitAuthenticationProvider = RAINBOWKIT_AUTH_ENABLED
  ? RainbowKitSiweNextAuthProvider
  : Fragment;

function MyApp({ Component, pageProps }) {
  usePostHog('phc_VSkCZnXOSrwzLGrJXjV3AfjZ2wmiCtDKEMLuiTMGS7H', {
    api_host: 'https://app.posthog.com',
    loaded: (posthog) => {
      // we only track tokentable.org
      if (process.env.NODE_ENV === 'development') posthog.opt_out_capturing()
      if (window.location.hostname.includes('tokenops')) posthog.opt_out_capturing()
      if (window.location.hostname.includes('vesting')) posthog.opt_out_capturing()
    },
  })

  return (
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
  );
}

export default MyApp;
