import { useState, useEffect } from "react"
import Link from "next/link"

import { LayoutWrapper } from "@/components/LayoutWrapper"
import PortfolioCompany from "@/components/PortfolioCompany"

import { getVestingData as getRequestVestingData } from "@/lib/indexer/RequestNetwork"
import { getVestingData as getZoraclesVestingData } from "@/lib/indexer/Zoracles"
import { getVestingData as getCurveVestingData } from "@/lib/indexer/Curve"

import CurveLogo from "@/public/logos/curve.svg"
import RequestLogo from "@/public/logos/request.svg"
import { formatToken } from "@/lib/utils"
import { getProvider } from "@wagmi/core"

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

const getPortfolio = async () => {
  const portfolio = await Promise.all(PORTFOLIO.map(async entry => {
    const indexer = VESTING_CONTRACT_INDEXERS[entry.contractType]
    const vestingData = await indexer(entry.chainId, entry.contractAddress)
    const beneficiaryGrants = vestingData?.grants?.filter(grant => grant.beneficiary === entry.beneficiaryAddress) || []
    return {
      ...vestingData,
      beneficiaryGrants
    }
  }))
  return portfolio.filter(entry => entry?.beneficiaryGrants?.length > 0)
}

const PortfolioItem = ({ contractType, contractAddress, chainId, beneficiaryAddress, companyName, companyLogo }) => {
  const [vestingData, setVestingData] = useState()
  const beneficiaryGrants = vestingData?.grants?.filter(grant => grant.beneficiary === beneficiaryAddress) || []

  const tokenFormatter = (tokenAddress, amount, short = false) => {
    const { symbol, decimals } = vestingData?.tokens?.[tokenAddress] || { symbol: '', decimals: 18 }
    return formatToken(symbol, decimals, amount, short)
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

  return beneficiaryGrants.map((grant, index) => {
    const allocationTokenFormatted = tokenFormatter(grant.tokenAddress, grant.amount, true)
    return (
      <PortfolioCompany
        key={index}
        companyName={companyName}
        companyLogo={companyLogo}
        vestingStartTime={grant.startTime}
        vestingEndTime={grant.endTime}
        vestingCliffTime={grant.cliffTime}
        allocationToken={allocationTokenFormatted}
        allocationUSD=""
        marketCapCurrent=""
        marketCapTGE=""
        circulatingSupply=""
      />
    )
  })
}

const Portfolio = () => (
  <div className="flex flex-col gap-4 py-4">
    {PORTFOLIO.map((item, index) => (
      <div key={`portfolio-item-${index}`} className="">
        <PortfolioItem {...item} />
      </div>
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