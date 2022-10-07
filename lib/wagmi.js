import { chain, configureChains, createClient, useConnect } from "wagmi"
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { SafeConnector } from '@gnosis.pm/safe-apps-wagmi';
import { wallet, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { useEffect } from "react";

const __IS_SERVER__ = typeof window === 'undefined';
const __IS_IFRAME__ = !__IS_SERVER__ && window?.parent !== window;

export const { chains, provider } = configureChains(
  [chain.mainnet, chain.goerli, chain.polygon],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_API_KEY }),
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_GOERLI_API_KEY }),
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_API_KEY }),
    publicProvider()
  ]
);

const connectors = connectorsForWallets([
  {
    groupName: "Popular",
    wallets: [
      wallet.metaMask({ chains }),
      wallet.rainbow({ chains }),
      wallet.coinbase({ appName: "Token Ops", chains }),
      wallet.walletConnect({ chains }),
      {
        id: "safe",
        iconBackground: "#FFF",
        name: "Gnosis Safe",
        iconUrl: "/logos/safe.svg",
        downloadUrls: {
          android: "https://play.google.com/store/apps/details?id=io.gnosis.safe",
          ios: "https://apps.apple.com/us/app/gnosis-safe/idid1515759131"
        },
        createConnector: () => ({
          connector: new SafeConnector({ chains })
        })
      }
    ]
  },
  {
    groupName: "More",
    wallets: [
      wallet.ledger({ chains }),
      wallet.brave({ chains, shimDisconnect: true }),
      wallet.trust({ chains })
    ]
  }
]);

export const wagmiClient = createClient({
  autoConnect: !__IS_IFRAME__,
  connectors,
  provider
})

export const useAutoConnectSafe = () => {
  const { connect, connectors } = useConnect();

  useEffect(() => {
    const connectorInstance = connectors.find((c) => c.id === 'safe' && c.ready);

    if (connectorInstance) {
      connect({ connector: connectorInstance });
    }
  }, [connect, connectors]);
}