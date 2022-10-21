import { chains, wagmiClient } from "@/lib/wagmi"

export const getProvider = (chainId) => {
  return wagmiClient.getProvider({chainId})
}

export const getBlockExplorer = (chainId) => {
  const chain = chains.find(chain => chain.id === chainId)
  return chain?.blockExplorers.default.url
}

export const getAddressBlockExplorerLink = (chainId, address) => {
  return `${getBlockExplorer(chainId)}/address/${address}`
}