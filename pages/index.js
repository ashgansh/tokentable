import { useState, useEffect } from "react"
import Link from "next/link"

import { formatCurrency, formatAmount } from "@/lib/utils"
import { getVestingContractDetails } from "@/lib/vesting"
import { useTokenCirculatingSupply, useTokenFormatter, useTokenPrice } from "@/lib/tokens"
import { usePortfolioItems } from "@/lib/portfolio"
import { useHasHydrated } from "@/lib/hooks"

import { LayoutWrapper } from "@/components/LayoutWrapper"
import PortfolioCompany from "@/components/PortfolioCompany"
import { QueueListIcon } from "@heroicons/react/24/outline"

const BENEFICIARY_ADDRESSES = [
  "0xF0068a27c323766B8DAF8720dF20a404Cf447727",
  "0x279a7DBFaE376427FFac52fcb0883147D42165FF",
  "0xe774b24115EBF630bF4f3690F442176938DdF61E"
]

const PortfolioItem = ({ companyName, companyLogoURL, startTime, endTime, cliffTime, amount, tokenAddress, chainId }) => {
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
      companyLogoURL={companyLogoURL}
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

export const PortfolioItemList = ({ portfolioItems, beneficiaryAddresses }) => {
  const [vestingContracts, setVestingContracts] = useState([])
  const myVestingGrants = vestingContracts.reduce((grants, portfolioItem) => {
    const { vestingData, meta } = portfolioItem
    const beneficiaryGrants = vestingData.grants?.filter(grant => beneficiaryAddresses.includes(grant.beneficiary)) || []
    const newGrants = beneficiaryGrants.map(beneficiaryGrant => ({ meta, beneficiaryGrant, vestingData }))
    return [...grants, ...newGrants]
  }, [])

  useEffect(() => {
    if (portfolioItems.length === 0) return

    const retrieveVestingData = async () => {
      const vestingContracts = await Promise.all(
        portfolioItems.map(async (portfolioItem) => {
          const {meta, getVestingData} = getVestingContractDetails(portfolioItem.chainId, portfolioItem.contractAddress)
          return {
            meta: meta,
            vestingData: await getVestingData()
          }
        })
      )

      setVestingContracts(vestingContracts)
    }
    retrieveVestingData()
  }, [portfolioItems])

  return (
    <div className="flex flex-col gap-4 py-4">
      {myVestingGrants.map((portfolioItem, index) => {
        const { companyName, companyLogoURL, chainId, contractType, contractAddress } = portfolioItem.meta
        const { startTime, endTime, cliffTime, amount, tokenAddress } = portfolioItem.beneficiaryGrant
        return (
          <Link key={`portfolio-item-${index}`} href={`/vesting/${chainId}/${contractAddress}`}>
            <div className="hover:cursor-pointer hover:shadow-md rounded-lg">
              <PortfolioItem
                key={index}
                companyName={companyName}
                companyLogoURL={companyLogoURL}
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

const Portfolio = () => {
  const hasHydrated = useHasHydrated()
  const portfolioItemObject = usePortfolioItems()
  const portfolioItems = Object.values(portfolioItemObject)
  const beneficiaryAddresses = BENEFICIARY_ADDRESSES

  if (!hasHydrated) return <></>

  if (portfolioItems.length === 0) return <NoPortfolioItems />

  return <PortfolioItemList portfolioItems={portfolioItems} beneficiaryAddresses={beneficiaryAddresses} />
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