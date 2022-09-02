import { formatUnits } from "ethers/lib/utils"

export const formatToken = (symbol, decimals, amount) => {
  const formattedAmount = (+formatUnits(amount, decimals)).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')
  return `${formattedAmount} ${symbol}`
}