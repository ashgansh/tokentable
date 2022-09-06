import { useState, useEffect } from "react"
import Link from "next/link"

import { LayoutWrapper } from "@/components/LayoutWrapper"
import PortfolioCompany from "@/components/PortfolioCompany"

import CurveLogo from "@/public/logos/curve.svg"
import RequestLogo from "@/public/logos/request.svg"

import { formatCurrency, formatAmount } from "@/lib/utils"
import { getVestingData } from "@/lib/vesting"
import { useTokenCirculatingSupply, useTokenFormatter, useTokenPrice } from "@/lib/tokens"

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

const NewPortfolioItem = ({ companyName, companyLogo, startTime, endTime, cliffTime, amount, tokenAddress, chainId }) => {
  const tokenFormatter = useTokenFormatter(chainId, tokenAddress)
  const tokenPrice = useTokenPrice(chainId, tokenAddress)
  const tokenCirculatingSupply = useTokenCirculatingSupply(chainId, tokenAddress)
  const tokenAllocationAmount = +(tokenFormatter(amount, { symbol: null, commify: false }))

  const formattedTokenAllocation = tokenFormatter(amount, { shorten: true })
  const formattedDollarAllocation = formatCurrency(tokenPrice * tokenAllocationAmount, 'USD', { shorten: true })
  const formattedCirculatingSupply = formatAmount(tokenCirculatingSupply, { digits: 0 })

  return (
    <PortfolioCompany
      companyName={companyName}
      companyLogo={companyLogo}
      vestingStartTime={startTime}
      vestingEndTime={endTime}
      vestingCliffTime={cliffTime}
      allocationToken={formattedTokenAllocation}
      allocationUSD={formattedDollarAllocation}
      circulatingSupply={formattedCirculatingSupply}
    />
  )
}

const NewPortfolio = () => {
  const [portfolioVestingContracts, setPortfolioVestingContracts] = useState([])
  const portfolioVestingGrants = portfolioVestingContracts.reduce((grants, portfolioItem) => {
    const { vestingContract, meta } = portfolioItem
    const beneficiaryGrants = vestingContract.grants?.filter(grant => grant.beneficiary === meta.beneficiaryAddress) || []
    const newGrants = beneficiaryGrants.map(beneficiaryGrant => ({ meta, beneficiaryGrant, vestingContract }))
    return [...grants, ...newGrants]
  }, [])

  useEffect(() => {
    const retrieveVestingData = async () => {
      const vestingContracts = PORTFOLIO.map(async (portfolioItem) => ({
        meta: portfolioItem,
        vestingContract: await getVestingData(portfolioItem.contractType, portfolioItem.chainId, portfolioItem.contractAddress)
      }))
      setPortfolioVestingContracts(await Promise.all(vestingContracts))
    }
    retrieveVestingData()
  }, [])

  return (
    <div className="flex flex-col gap-4 py-4">
      {portfolioVestingGrants.map((portfolioItem, index) => {
        const { companyName, companyLogo, chainId, contractType, contractAddress } = portfolioItem.meta
        const { startTime, endTime, cliffTime, amount, tokenAddress } = portfolioItem.beneficiaryGrant
        return (
          <Link key={`portfolio-item-${index}`} href={`/vesting/${contractType}/${contractAddress}`}>
            <div className="hover:cursor-pointer hover:shadow-md rounded-lg">
              <NewPortfolioItem
                key={index}
                companyName={companyName}
                companyLogo={companyLogo}
                startTime={startTime}
                endTime={endTime}
                cliffTime={cliffTime}
                amount={amount}
                tokenAddress={tokenAddress}
                chainId={chainId}
              />
            </div>
          </Link>
        )
      })}
    </div>
  )
}

const Home = () => {
  return (
    <LayoutWrapper>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Portfolio</h1>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <NewPortfolio />
      </div>
    </LayoutWrapper>
  )
}

export default Home