import { useState, useEffect } from "react"
import { useForm } from "react-hook-form";
import { isAddress } from "ethers/lib/utils";
import axios from "axios";
import Link from "next/link"

import { QueueListIcon } from "@heroicons/react/24/outline";

import { formatCurrency, formatAmount } from "@/lib/utils"
import { getVestingContractDetails } from "@/lib/vesting"
import { useTokenCirculatingSupply, useTokenFormatter, useTokenPrice } from "@/lib/tokens"
import { usePortfolioItems } from "@/lib/portfolio"
import { useHasHydrated } from "@/lib/hooks"

import PortfolioContract from "@/components/PortfolioContract"
import PortfolioCompany from "@/components/PortfolioCompany";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { Input } from "@/components/Input";
import Spinner from "@/components/Spinner";

const BENEFICIARY_ADDRESSES = [
  "0xF0068a27c323766B8DAF8720dF20a404Cf447727",
  "0x279a7DBFaE376427FFac52fcb0883147D42165FF",
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
  );
};

const PortfolioContractItem = ({contractAddress, companyLogoURL, companyName, totalAllocatedAmount, totalVestedAmount, stakeholderCount, tokenAddress, chainId}) => {
  const formatToken = useTokenFormatter(chainId, tokenAddress)

  const formattedTokenAllocation = formatToken(totalAllocatedAmount)
  const formattedTokenVested = formatToken(totalVestedAmount)

  return (
    <PortfolioContract
      companyLogoURL={companyLogoURL}
      companyName={companyName}
      contractAddress={contractAddress}
      totalAllocatedAmount={formattedTokenAllocation}
      totalVestedAmount={formattedTokenVested}
      stakeholderCount={stakeholderCount}
    />
  )
}


const NoPortfolioItems = () => {
  const {
    reset,
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful, isSubmitting },
  } = useForm();

  const handleAddContract = async (data) => {
    await axios.post("https://formspree.io/f/xaykqkok", data);
    reset();
  };

  return (
    <div className="flex flex-col items-center text-center m-12 w-full">

      <QueueListIcon className="h-12 w-12 stroke-gray-300" />
      <h2 className="mt-2 text-lg font-medium text-gray-900">
        Track Vesting Schedules
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {`
      Start tracking your first vesting contract
`}
      </p>
      <form
        onSubmit={handleSubmit(handleAddContract)}
        className="mt-6 flex max-w-2xl"
      >
            <Input
              placeholder="0x0003ca24e19c30db588aabb81d55bfcec6e196c4"
              className="min-w-[350px]"
              {...register("vestingContract", {
                required: true,
                validate: { isAddress },
              })}
            />
            <span className="text-xs text-red-400">
              {errors?.beneficiaryAddress && "A valid vesting address is required"}
            </span>

        <button
          type="submit"
          className="ml-4 flex-shrink-0 rounded-md border border-transparent bg-tokenops-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-tokenops-primary700 focus:outline-none focus:ring-2 focus:ring-tokenops-primary500 focus:ring-offset-2"
        >
          Track your vesting
        </button>
      </form>
      {isSubmitSuccessful && (
        <>
          <div className="py-12 items-center flex flex-col gap-4">
            <span>
              <Spinner className="text-tokenops-primary-600 h-8" />
            </span>
            <span>
              {"We're indexing your contract. This may take up to a 24h."}
            </span>
            <span>{"Please check back again later."}</span>
          </div>
        </>
      )}
    </div>
  );
};

export const PortfolioItemList = ({ portfolioItems, beneficiaryAddresses }) => {
  const [vestingContracts, setVestingContracts] = useState([])
  const myVestingGrants = vestingContracts.reduce((grants, contract) => {
    const { vestingData, meta } = contract
    const beneficiaryGrants = vestingData.grants?.filter(grant => beneficiaryAddresses.includes(grant.beneficiary)) || []
    const newGrants = beneficiaryGrants.map(beneficiaryGrant => ({ meta, beneficiaryGrant, vestingData }))
    return [...grants, ...newGrants]
  }, [])

  const myTrackedContracts = vestingContracts.filter(contract => contract.vestingData.grants?.filter(grant => beneficiaryAddresses.includes(grant.beneficiary)).length === 0)
  const myIndexingContracts = vestingContracts.filter(contract => !contract.vestingData)

  useEffect(() => {
    if (portfolioItems.length === 0) return

    const retrieveVestingData = async () => {
      const vestingContracts = await Promise.all(
        portfolioItems.map(async (portfolioItem) => {
          const {meta, getVestingData} = await getVestingContractDetails(portfolioItem.chainId, portfolioItem.contractAddress)
          return {
            meta,
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
        const { companyName, companyLogoURL, chainId, contractAddress } = portfolioItem.meta
        const { startTime, endTime, cliffTime, amount, tokenAddress } = portfolioItem.beneficiaryGrant
        return (
          <Link key={`position-${index}`} href={`/vesting/${chainId}/${contractAddress}`}>
            <div className="hover:cursor-pointer hover:shadow-md rounded-lg">
              <PortfolioItem
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
        );
      })}
      {myTrackedContracts.map((contract, index) => {
        const { companyName, companyLogoURL, chainId, contractAddress } = contract.meta
        const { totalAllocatedAmounts, totalVestedAmounts, tokens, grants } = contract.vestingData

        const tokenAddress = Object.keys(tokens).shift()
        if (!tokenAddress) <></>

        const totalAllocatedAmount = totalAllocatedAmounts[tokenAddress]
        const totalVestedAmount = totalVestedAmounts[tokenAddress]
        const stakeholders = new Set(grants.filter(grant => grant.tokenAddress === tokenAddress).map(grant => grant.beneficiary))
        const stakeholderCount = stakeholders.size
        return (
          <Link key={`portfolio-item-${index}`} href={`/vesting/${chainId}/${contractAddress}`}>
            <div className="hover:cursor-pointer hover:shadow-md rounded-lg">
              <PortfolioContractItem
                key={`tracked-${index}`}
                companyName={companyName}
                companyLogoURL={companyLogoURL}
                contractAddress={contractAddress}
                totalAllocatedAmount={totalAllocatedAmount}
                totalVestedAmount={totalVestedAmount}
                stakeholderCount={stakeholderCount}
                tokenAddress={tokenAddress}
                chainId={chainId}
              />
            </div>
          </Link>
        )
      })}
    </div>
  );
};

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
  );
};

export default Home;
