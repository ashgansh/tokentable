import { chain, configureChains } from "wagmi"
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';

export const { chains, provider } = configureChains(
  [chain.mainnet, chain.goerli, chain.polygon],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_API_KEY }),
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_GOERLI_API_KEY }),
    publicProvider()
  ]
);

export const getProvider = (chainId) => {
  return provider({chainId})
}

export const getBlockExplorer = (chainId) => {
  const chain = chains.find(chain => chain.id === chainId)
  return chain?.blockExplorers.default.url
}

export const getAddressBlockExplorerLink = (chainId, address) => {
  return `${getBlockExplorer(chainId)}/address/${address}`
}