import { AlchemyProvider } from "@ethersproject/providers"

const ALCHEMY_API_KEYS = {
  1: "YEYRkmN24MyBT8cNXvEEL_LzrWHMBstJ",
  1337: "FtvDI5GlZGeLEqyQuhWd1zRtRkli41y0"
}

export const getProvider = (chainId) => {
  const alchemyKey = ALCHEMY_API_KEYS?.[chainId]
  if (!alchemyKey) return
  return new AlchemyProvider(chainId, alchemyKey)
}