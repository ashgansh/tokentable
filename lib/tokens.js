import axios from "axios";
import produce from "immer";
import create from "zustand";
import { Contract } from "ethers";
import { getProvider } from "./provider";
import { formatCurrency } from "./utils";
import { formatUnits } from "ethers/lib/utils";

const ERC20Abi = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
]

const COINGECKO_NETWORK_IDS = {
  1: 'ethereum',
  137: 'polygon-pos'
}

const getTokenMarketData = async (chainId, tokenAddress) => {
  // Hardcoded demo value
  if (chainId === 5 && tokenAddress === "0xC8BD9935f911Cef074AbB8774d775840091e8907") {
    return { price: 1.67 }
  }

  if (chainId !== 1 && chainId !== 137) return {}


  const networkId = COINGECKO_NETWORK_IDS[chainId]

  try {
    const res = await axios.get(`https://api.coingecko.com/api/v3/coins/${networkId}/contract/${tokenAddress}`)
    const price = res.data?.market_data?.current_price?.usd
    const circulatingSupply = res.data?.market_data?.circulating_supply

    return {
      price,
      circulatingSupply
    }
  } catch (_) {
    return {}
  }
}

export const getTokenBalance = async (chainId, tokenAddress, ownerAddress) => {
  const provider = getProvider(chainId)
  const tokenContract = new Contract(tokenAddress, ERC20Abi, provider)
  return await tokenContract.balanceOf(ownerAddress)
}

export const getTokenAllowance = async (chainId, tokenAddress, ownerAddress, spenderAddress) => {
  const provider = getProvider(chainId)
  const tokenContract = new Contract(tokenAddress, ERC20Abi, provider)
  return await tokenContract.allowance(ownerAddress, spenderAddress)
}

export const getTokenDetails = async (chainId, tokenAddress) => {
  const provider = getProvider(chainId)
  const tokenContract = new Contract(tokenAddress, ERC20Abi, provider)
  try {
    const [symbol, decimals] = await Promise.all([
      await tokenContract.symbol(),
      await tokenContract.decimals(),
    ])
    return { symbol, decimals }
  } catch (_) {
    return {}
  }
}

export const tokenStore = create((set) => ({
  tokens: {},
  addToken: async (chainId, tokenAddress) => {
    const { symbol, decimals } = await getTokenDetails(chainId, tokenAddress)

    // Don't add tokens that are non existent
    if (!symbol || !decimals) return

    set(produce(state => {
      state.tokens[chainId] = { ...(state.tokens[chainId] || {}) }
      state.tokens[chainId][tokenAddress] = { ...(state.tokens[chainId][tokenAddress] || {}) }
      state.tokens[chainId][tokenAddress].symbol = symbol
      state.tokens[chainId][tokenAddress].decimals = decimals
    }))

    const tokenMarketData = await getTokenMarketData(chainId, tokenAddress)
    set(produce(state => { state.tokens[chainId][tokenAddress].marketData = tokenMarketData }))
  }
}))

export const useTokenPrice = (chainId, tokenAddress) =>
  tokenStore(state => state?.tokens?.[chainId]?.[tokenAddress]?.marketData?.price)

export const useTokenCirculatingSupply = (chainId, tokenAddress) =>
  tokenStore(state => state?.tokens?.[chainId]?.[tokenAddress]?.marketData?.circulatingSupply)

export const useTokenDetails = (chainId, tokenAddress) => {
  const symbol = tokenStore(state => state.tokens?.[chainId]?.[tokenAddress]?.symbol)
  const decimals = tokenStore(state => state.tokens?.[chainId]?.[tokenAddress]?.decimals)
  return { symbol, decimals }
}

export const useMultipleTokenDetails = (chainId, tokenAddresses) => {
  const tokens = tokenStore(state => state.tokens?.[chainId]) || {}
  return Object.fromEntries(Object.entries(tokens).filter(([address]) => (tokenAddresses || []).includes(address)))
}

export const useTokenFormatter = (chainId, tokenAddress) => {
  const { symbol, decimals } = useTokenDetails(chainId, tokenAddress)
  return (amount, options) => formatCurrency(+formatUnits(amount, decimals), symbol, options)
}