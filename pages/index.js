import { useState, useEffect } from "react"
import Link from "next/link"

import { LayoutWrapper } from "@/components/LayoutWrapper"
import PortfolioCompany from "@/components/PortfolioCompany"

import { getVestingData as getRequestVestingData } from "@/lib/indexer/RequestNetwork"
import { getVestingData as getZoraclesVestingData } from "@/lib/indexer/Zoracles"
import { getVestingData as getCurveVestingData } from "@/lib/indexer/Curve"

import CurveLogo from "@/public/logos/curve.svg"
import RequestLogo from "@/public/logos/request.svg"
import { formatToken, nFormatter } from "@/lib/utils"
import axios from "axios"
import { formatUnits } from "ethers/lib/utils"

const VESTING_CONTRACT_INDEXERS = {
  request: getRequestVestingData,
  curve: getCurveVestingData,
  zoracles: getZoraclesVestingData,
}

const PORTFOLIO = [
  {
    chainId: 1,
    contractType: "request",
    contractAddress: "0x45E6fF0885ebf5d616e460d14855455D92d6CC04",
    beneficiaryAddress: "0xF0068a27c323766B8DAF8720dF20a404Cf447727",
    companyLogo: RequestLogo,
    companyName: "Request"
  },
  {
    chainId: 1,
    contractType: "curve",
    contractAddress: "0x2a7d59e327759acd5d11a8fb652bf4072d28ac04",
    beneficiaryAddress: "0x279a7DBFaE376427FFac52fcb0883147D42165FF",
    companyLogo: CurveLogo,
    companyName: "Curve Finance"
  }
]

const PortfolioItem = ({ contractType, contractAddress, chainId, beneficiaryAddress, companyName, companyLogo }) => {
  const [vestingData, setVestingData] = useState()
  const [tokenData, setTokenData] = useState()
  const beneficiaryGrants = vestingData?.grants?.filter(grant => grant.beneficiary === beneficiaryAddress) || []

  const tokenFormatter = (tokenAddress, amount, short = false) => {
    const { symbol, decimals } = vestingData?.tokens?.[tokenAddress] || { symbol: '', decimals: 18 }
    return formatToken(symbol, decimals, amount, short)
}

  const tokenFormatterUnits = (tokenAddress, amount) => {
    const decimals = vestingData?.tokens?.[tokenAddress]?.decimals || 18
    return formatUnits(amount, decimals)
  }

  useEffect(() => {
    if (!contractType || !contractAddress || !chainId) return

    const retrieveVestingData = async () => {
      const indexer = VESTING_CONTRACT_INDEXERS[contractType]
      const vestingData = await indexer(chainId, contractAddress)
      setVestingData(vestingData)
    }
    retrieveVestingData()
  }, [contractType, contractAddress, chainId])

  useEffect(() => {
    if (!vestingData?.tokens) return

    const retrieveMarketData = async () => {
      const tokenAddresses = Object.keys(vestingData?.tokens || {})
      const tokenMarketData = await Promise.all(
        tokenAddresses.map(async tokenAddress => {
          const res = await axios.get(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${tokenAddress}`)
          const price = res.data?.market_data?.current_price?.usd
          const marketCapCurrent = res.data?.market_data?.market_cap?.usd
          const marketCapTGE = res.data?.ico_data?.total_raised
          const circulatingSupply = res.data?.market_data?.circulating_supply

          return {
            tokenAddress,
            price,
            marketCapCurrent,
            marketCapTGE,
            circulatingSupply
          }
        })
      )
      setTokenData(tokenMarketData)
    }

    retrieveMarketData()
  }, [vestingData])

  return beneficiaryGrants.map((grant, index) => {
    const tokenMarketData = tokenData?.find(token => token.tokenAddress === grant.tokenAddress)
    const circulatingSupply = nFormatter(tokenMarketData?.circulatingSupply, true)
    const allocationTokenFormatted = tokenFormatter(grant.tokenAddress, grant.amount, true)
    const allocationUSDFormatted = `$ ${nFormatter(tokenMarketData?.price * Number(tokenFormatterUnits(grant.tokenAddress, grant.amount)), 0)}`

    return (
      <PortfolioCompany
        key={index}
        companyName={companyName}
        companyLogo={companyLogo}
        vestingStartTime={grant.startTime}
        vestingEndTime={grant.endTime}
        vestingCliffTime={grant.cliffTime}
        allocationToken={allocationTokenFormatted}
        allocationUSD={allocationUSDFormatted}
        circulatingSupply={circulatingSupply}
      />
    )
  })
}

const Portfolio = () => (
  <div className="flex flex-col gap-4 py-4">
    {PORTFOLIO.map((item, index) => (
      <Link key={`portfolio-item-${index}`} href={`/vesting/${item.contractType}/${item.contractAddress}`}>
        <div className="hover:cursor-pointer hover:shadow-md rounded-lg">
          <PortfolioItem {...item} />
        </div>
      </Link>
    ))}
  </div>
)

const Home = () => (
  <LayoutWrapper>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">Portfolio</h1>
    </div>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
      <Portfolio />
    </div>
  </LayoutWrapper>
)

export default Home