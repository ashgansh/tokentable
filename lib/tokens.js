import axios from "axios";
import produce from "immer";
import create from "zustand";
import { Contract } from "ethers";
import { getProvider } from "./provider";
import { formatCurrency, nFormatter } from "./utils";
import { formatUnits } from "ethers/lib/utils";

const ERC20Abi = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
]

const getTokenMarketData = async (chainId, tokenAddress) => {
  if (chainId !== 1) return {}

  const res = await axios.get(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${tokenAddress}`)
  const price = res.data?.market_data?.current_price?.usd
  const circulatingSupply = res.data?.market_data?.circulating_supply

  return {
    price,
    circulatingSupply
  }
}

export const getTokenBalance = async (chainId, tokenAddress, ownerAddress) => {
  const provider = getProvider(chainId)
  const tokenContract = new Contract(tokenAddress, ERC20Abi, provider)
  return await tokenContract.balanceOf(ownerAddress)
}

export const getTokenDetails = async (chainId, tokenAddress) => {
  const provider = getProvider(chainId)
  const tokenContract = new Contract(tokenAddress, ERC20Abi, provider)
  const [symbol, decimals] = await Promise.all([
    await tokenContract.symbol(),
    await tokenContract.decimals(),
  ])
  return { symbol, decimals }
}

export const tokenStore = create((set) => ({
  tokens: {},
  addToken: async (chainId, tokenAddress) => {
    set(produce(state => {
      state.tokens[chainId] = { ...(state.tokens[chainId] || {}) }
      state.tokens[chainId][tokenAddress] = { ...(state.tokens[chainId][tokenAddress] || {}) }
    }))

    const { symbol, decimals } = await getTokenDetails(chainId, tokenAddress)
    set(produce(state => {
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

export const useTokenFormatter = (chainId, tokenAddress) => {
  const { symbol, decimals } = useTokenDetails(chainId, tokenAddress)
  return (amount, options) => formatCurrency(+formatUnits(amount, decimals), symbol, options)
}

export const useIsDust = (chainId, tokenAddress) => {
  const { symbol, decimals } = useTokenDetails(chainId, tokenAddress)
  return (amount) => console.log(amount.div((decimals-2)^10))
}