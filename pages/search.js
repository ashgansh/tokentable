import { useState, useEffect } from "react"
import { useForm } from "react-hook-form";
import { isAddress } from "ethers/lib/utils";
import axios from "axios";
import Link from "next/link"

import { PlusIcon, QueueListIcon } from "@heroicons/react/24/outline";

import { formatCurrency, formatAmount } from "@/lib/utils"
import { getVestingContractDetails } from "@/lib/vesting"
import { useTokenCirculatingSupply, useTokenFormatter, useTokenPrice } from "@/lib/tokens"
import { usePortfolioItems } from "@/lib/portfolio"
import { useHasHydrated } from "@/lib/hooks"

import PortfolioContract from "@/components/PortfolioContract"
import PortfolioPosition from "@/components/PortfolioPosition";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { Input } from "@/components/Input";
import Spinner from "@/components/Spinner";
import { chainId, useAccount } from "wagmi";
import { useRouter } from "next/router";

const BENEFICIARY_ADDRESSES = [
  "0xF0068a27c323766B8DAF8720dF20a404Cf447727",
  "0x279a7DBFaE376427FFac52fcb0883147D42165FF",
]


export const NoPortfolioItems = () => {
  const exampleContracts = [
    {
      address: '0x2a7d59e327759acd5d11a8fb652bf4072d28ac04',
    },
    {
      address: '0x38569f73190d6d2f3927c0551526451e3af4d8d6',
    },
  ]

  const {
    reset,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitSuccessful, isSubmitting },
  } = useForm();
  const { push } = useRouter()
  const [showIndexing, setShowIndexing] = useState(false)

  const handleAddContract = async (data) => {
    const details = await getVestingContractDetails(1, data.vestingContract)
    const isIndexed = !!details?.meta.contractType
    if (isIndexed) {
      push(`/vesting/${details.meta.chainId}/${details.meta.contractAddress}`)
      return
    }

    await axios.post("https://formspree.io/f/xaykqkok", data);
    setShowIndexing(true)

    reset();
  };

  const handleTryContract = (contractAddress) => {
    setValue("vestingContract", contractAddress)
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="text-center mb-2">
        <QueueListIcon className="h-12 w-12 text-gray-300 mx-auto" />
        <h2 className="mt-2 text-lg font-medium text-gray-900">
          Track Vesting Schedules
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {`Start tracking your first vesting contract`}
        </p>
        <div>
          <form
            onSubmit={handleSubmit(handleAddContract)}
            className="mt-6 flex"
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
              disabled={isSubmitting}
              className="flex items-center gap-3 ml-4 flex-shrink-0 rounded-md border border-transparent bg-tokenops-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-tokenops-primary700 focus:outline-none focus:ring-2 focus:ring-tokenops-primary500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting && <Spinner className="text-white h-4" />}
              Track your vesting
            </button>
          </form>
          <div className="mt-10">
            <h3 className="text-sm font-medium text-gray-500 text-left">Try one of these examples. Just copy it in the search box.</h3>
            <ul role="list" className="mt-4 divide-y divide-gray-200 border-t border-b border-gray-200 text-left">
              {exampleContracts.map(contract => (
                <li key={contract.address} className="flex items-center justify-between space-x-3 py-2">
                  <div className="flex min-w-0 flex-1 items-center space-x-3">
                    <div className="min-w-0 flex-1 min-h-[2rem] flex items-center">
                      <p className="truncate text-sm text-gray-500">{contract.address}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {/* <button
                        type="button"
                        className="inline-flex items-center rounded-full border border-transparent bg-gray-100 py-2 px-3 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={() => handleTryContract(contract.address)}
                      >
                        <span className="text-sm font-medium text-gray-900">Copy</span>
                      </button> */}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {showIndexing && (
          <>
            <div className="py-12 items-center flex flex-col gap-4">
              <span>
                {"We're indexing your contract. This may take up to a 24h."}
              </span>
              <span>{"Please check back again later."}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

;

const Portfolio = () => {
  const hasHydrated = useHasHydrated()
  const portfolioItemObject = usePortfolioItems()
  Object.values(portfolioItemObject)
  const { address: account } = useAccount()

  if (!hasHydrated) return <></>


  return (
    <>
      <NoPortfolioItems />
    </>
  )
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
