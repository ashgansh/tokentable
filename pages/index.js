import { useState, useEffect } from "react"
import Link from "next/link"

import { formatCurrency, formatAmount } from "@/lib/utils"
import { getVestingData } from "@/lib/vesting"
import { useTokenCirculatingSupply, useTokenFormatter, useTokenPrice } from "@/lib/tokens"
import { usePortfolioItems } from "@/lib/portfolio"

import { LayoutWrapper } from "@/components/LayoutWrapper"
import PortfolioCompany from "@/components/PortfolioCompany"
import { QueueListIcon } from "@heroicons/react/24/outline"

const PortfolioItem = ({ companyName, companyLogo, startTime, endTime, cliffTime, amount, tokenAddress, chainId }) => {
  const formatToken = useTokenFormatter(chainId, tokenAddress)
  const tokenPrice = useTokenPrice(chainId, tokenAddress)
  const tokenCirculatingSupply = useTokenCirculatingSupply(chainId, tokenAddress)
  const tokenAllocationAmount = +(formatToken(amount, { symbol: null, commify: false }))

  const formattedTokenAllocation = formatToken(amount, { shorten: true })
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

const NoPortfolioItems = () => (
  <div className="flex flex-col items-center text-center m-12">
    <QueueListIcon className="h-12 w-12" />
    <h3 className="mt-2 text-lg font-medium text-gray-900">No vesting contracts</h3>
    <p className="mt-1 text-sm text-gray-500">We {"can't"} find your vesting contract. Please ask the vesting contract admin for the vesting contract link.</p>
  </div>
)

const Portfolio = () => {
  const portfolioItemObject = usePortfolioItems()
  const portfolioItems = Object.values(portfolioItemObject)
  const [portfolioVestingContracts, setPortfolioVestingContracts] = useState([])
  const portfolioVestingGrants = portfolioVestingContracts.reduce((grants, portfolioItem) => {
    const { vestingContract, meta } = portfolioItem
    const beneficiaryGrants = vestingContract.grants?.filter(grant => grant.beneficiary === meta.beneficiaryAddress) || []
    const newGrants = beneficiaryGrants.map(beneficiaryGrant => ({ meta, beneficiaryGrant, vestingContract }))
    return [...grants, ...newGrants]
  }, [])

  useEffect(() => {
    const retrieveVestingData = async () => {
      const vestingContracts = await Promise.all(
        portfolioItems.map(async (portfolioItem) => ({
          meta: portfolioItem,
          vestingContract: await getVestingData(portfolioItem.contractType, portfolioItem.chainId, portfolioItem.contractAddress)
        }))
      )
      setPortfolioVestingContracts(vestingContracts)
    }
    retrieveVestingData()
  }, [portfolioItems])

  if (portfolioItems.length === 0) return <NoPortfolioItems />

  return (
    <div className="flex flex-col gap-4 py-4">
      {portfolioVestingGrants.map((portfolioItem, index) => {
        const { companyName, companyLogo, chainId, contractType, contractAddress } = portfolioItem.meta
        const { startTime, endTime, cliffTime, amount, tokenAddress } = portfolioItem.beneficiaryGrant
        return (
          <Link key={`portfolio-item-${index}`} href={`/vesting/${contractType}/${chainId}/${contractAddress}`}>
            <div className="hover:cursor-pointer hover:shadow-md rounded-lg">
              <PortfolioItem
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
        <Portfolio />
      </div>
    </LayoutWrapper>
  )
}

export default Home