import axios from 'axios'
import { useEffect, useState } from 'react'



const TokenAmountValue = ({ tokenAddress, currency, children }) => {
  const [coinPrice, setCoinPrice] = useState(0)
  const formatter = new Intl.NumberFormat('en-US', {type: 'currency', currency})
  const amount = Number(children)

  useEffect(() => {
    if (!tokenAddress || !currency) return

    const retrieveTokenPrice = async () => {
      try {
        const res = await axios.get(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${tokenAddress}`)
        const coinPrice = res.data?.market_data?.current_price?.[currency.toLowerCase()]
        setCoinPrice(coinPrice)
      } catch (e) {
        setCoinPrice(0)
      }
    }

    retrieveTokenPrice()
  }, [tokenAddress, currency])

  if (!coinPrice) return <></>

  return <>{formatter.format(coinPrice * amount)} {currency.toUpperCase()}</>
}

export default TokenAmountValue