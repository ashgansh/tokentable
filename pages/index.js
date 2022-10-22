import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { isAddress } from "ethers/lib/utils";
import axios from "axios";
import Link from "next/link";

import { PlusIcon, QueueListIcon } from "@heroicons/react/24/outline";

import { formatCurrency, formatAmount, record } from "@/lib/utils";
import {
  findVestingContractChainId,
  getVestingContractDetails,
} from "@/lib/vesting";
import {
  useTokenCirculatingSupply,
  useTokenFormatter,
  useTokenPrice,
} from "@/lib/tokens";
import { usePortfolioItems } from "@/lib/portfolio";
import { useHasHydrated } from "@/lib/hooks";

import PortfolioContract from "@/components/PortfolioContract";
import PortfolioPosition from "@/components/PortfolioPosition";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { Input, Label } from "@/components/Input";
import Spinner from "@/components/Spinner";
import { chainId, useAccount } from "wagmi";
import { useRouter } from "next/router";
import { PrimaryButton } from "@/components/Button";

export const NoPortfolioItems = () => {
  const exampleContracts = [
    { address: "0x2a7d59e327759acd5d11a8fb652bf4072d28ac04" },
  ];

  const {
    reset,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitSuccessful, isSubmitting },
  } = useForm();
  const { push } = useRouter();
  const [showIndexing, setShowIndexing] = useState(false);

  const handleAddContract = async (data) => {
    const chainId = await findVestingContractChainId(data.vestingContract);
    const isIndexed = !!chainId;


    record('vestingLookup', { message: `Someone looked up a vesting contract. (${data.vestingContract}) (${isIndexed ? "supported" : "not supported"})` })

    if (isIndexed) {
      const details = await getVestingContractDetails(
        chainId,
        data.vestingContract
      );
      push(`/vesting/${details.meta.chainId}/${details.meta.contractAddress}`);
      return;
    }

    await axios.post("https://formspree.io/f/xaykqkok", data);
    setShowIndexing(true);
    reset();
  };

  const handleTryContract = (contractAddress) => {
    setValue("vestingContract", contractAddress);
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-2 text-center">
        <QueueListIcon className="mx-auto h-12 w-12 text-tokenops-primary-500" />
        <h2 className="mt-2 text-lg font-medium text-gray-900">
          Track Vesting Schedules
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {`Start tracking your first vesting contract.`}
        </p>
        <div>
          <form
            onSubmit={handleSubmit(handleAddContract)}
            className="mt-6 flex"
          >
            <div>
              <Label>Enter a vesting smart contract address</Label>
              <div className="flex">
                <Input
                  placeholder="0x0003ca24e19c30db588aabb81d55bfcec6e196c4"
                  className="min-w-[350px]"
                  {...register("vestingContract", {
                    required: true,
                    validate: { isAddress },
                  })}
                />
                <PrimaryButton
                  className="ml-2 min-w-max min-h-content"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Spinner className="h-4 text-white" />}
                  Load Vesting Contract
                </PrimaryButton>

              </div>
              <span className="text-xs text-red-400">
                {errors?.beneficiaryAddress &&
                  "A valid vesting address is required"}
              </span>
            </div>


          </form>
          <div className="mt-10">
            <h3 className="text-left text-sm font-medium text-gray-500">
              Try one of these examples. Just copy it in the search box.
            </h3>
            <ul
              role="list"
              className="mt-4 divide-y divide-gray-200 border-t border-b border-gray-200 text-left"
            >
              {exampleContracts.map((contract) => (
                <li
                  key={contract.address}
                  className="flex items-center justify-between space-x-3 py-2"
                >
                  <div className="flex min-w-0 flex-1 items-center space-x-3">
                    <div className="flex min-h-[2rem] min-w-0 flex-1 items-center">
                      <p className="truncate text-sm text-gray-500">
                        {contract.address}
                      </p>
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
            <div className="flex flex-col items-center gap-4 py-12">
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

const Portfolio = () => {
  const hasHydrated = useHasHydrated();
  const portfolioItemObject = usePortfolioItems();
  Object.values(portfolioItemObject);
  const { address: account } = useAccount();

  if (!hasHydrated) return <></>;

  return (
    <>
      <NoPortfolioItems />
    </>
  );
};

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
