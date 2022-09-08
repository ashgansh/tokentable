import { chain, configureChains } from "wagmi"
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';

export const { chains, provider } = configureChains(
  [chain.mainnet, chain.goerli],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_API_KEY }),
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_GOERLI_API_KEY }),
    publicProvider()
  ]
);

export const getProvider = (chainId) => {
  return provider({chainId})
}