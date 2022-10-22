import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { useAccount, useNetwork, useSigner } from "wagmi";
import { BigNumber } from "ethers";
import { isAddress, parseUnits } from "ethers/lib/utils";
import { useForm } from "react-hook-form";
import {
  ArrowsRightLeftIcon,
  BookmarkIcon as BookmarkIconOutline,
  CalendarDaysIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkIconSolid } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

import { getVestingContractDetails } from "@/lib/vesting";
import { getTokenBalance, useTokenDetails, useTokenPrice } from "@/lib/tokens";
import { portfolioStore } from "@/lib/portfolio";
import {
  formatAddress,
  formatCurrency,
  shortAddress,
  record,
} from "@/lib/utils";

import { CurrencyInput, Label } from "@/components/Input";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import {
  Modal,
  ModalActionFooter,
  ModalBody,
  ModalTitle,
} from "@/components/Modal";
import { PrimaryButton, SecondaryButton } from "@/components/Button";
import Spinner from "@/components/Spinner";
import VestingPosition from "@/components/VestingPosition";
import SwitchChainButton from "@/components/SwitchChainButton";
import VestingInsights from "@/components/VestingInsights";
import VestingTable from "@/components/VestingTable";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import AddScheduleModal from "@/components/CreateSchedule";
import { useHasHydrated } from "@/lib/hooks";
import { getAddressBlockExplorerLink } from "@/lib/provider";
import axios from "axios";
import VestingDraftsTable from "@/components/VestingDraftsTable";
import { useSession } from "next-auth/react";

const ENABLE_DRAFTS = false

const VestingDashboard = ({ vestingData, vestingDrafts, isLoading }) => {
  const { address: account } = useAccount();
  const myGrants =
    vestingData?.grants?.filter((grant) => grant.beneficiary === account) || [];

  return (
    <div className="flex flex-col gap-4 py-4">
      <div>
        <h2 className="py-2 text-lg">Vesting overview</h2>
        {Object.keys(vestingData?.tokens || { dummyToken: "ok" }).map(
          (tokenAddress) => (
            <VestingInsights
              key={tokenAddress}
              totalAllocated={
                vestingData?.totalAllocatedAmounts?.[tokenAddress] ||
                BigNumber.from(0)
              }
              totalWithdrawn={
                vestingData?.totalWithdrawnAmounts?.[tokenAddress] ||
                BigNumber.from(0)
              }
              totalVested={
                vestingData?.totalVestedAmounts?.[tokenAddress] ||
                BigNumber.from(0)
              }
              chainId={vestingData?.chainId}
              tokenAddress={tokenAddress}
              isLoading={isLoading}
            />
          )
        )}
      </div>
      <ConnectCTA hasGrants={myGrants.length > 0} />
      {myGrants.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg">Your position</h2>
          {myGrants.map((grant) => (
            <VestingPosition
              key={grant.id}
              grant={grant}
              chainId={vestingData?.chainId}
              getReleasableAmount={vestingData?.getReleasableAmount}
              releaseAndWithdraw={vestingData?.releaseAndWithdraw}
            />
          ))}
        </div>
      )}
      <div>
        <h2 className="py-2 text-lg">Stakeholders</h2>
        <VestingTable
          grants={vestingData?.grants || []}
          chainId={vestingData?.chainId}
          isLoading={isLoading}
        />
      </div>
      {vestingDrafts && vestingDrafts.length > 0 && (
        <>
          <h2 className="py-2 text-lg">Drafts</h2>
          <VestingDraftsTable
            drafts={vestingDrafts}
            chainId={vestingData?.chainId}
          />
        </>
      )}
    </div>
  );
};

const BookmarkButton = ({ contractAddress, chainId }) => {
  const { addPortfolioItem, removePortfolioItem, isInPortfolio } =
    portfolioStore();
  const isBookmarked = isInPortfolio({ contractAddress, chainId });

  const handleAddPortfolioItem = () => {
    addPortfolioItem({ contractAddress, chainId });
  };

  const handleRemovePorfolioItem = () => {
    removePortfolioItem({ contractAddress, chainId });
  };

  const handleClickBookmark = () => {
    record('bookmarkClicked', { message: "The bookmark button was clicked" })
    isBookmarked ? handleRemovePorfolioItem() : handleAddPortfolioItem();
  };

  return (
    <div
      className="min-w-max cursor-pointer text-tokenops-primary-500  "
      onClick={handleClickBookmark}
    >
      {!isBookmarked && (
        <>
          <BookmarkIconOutline className=" w-6 stroke-2" />
        </>
      )}
      {isBookmarked && (
        <>
          <BookmarkIconSolid className="w-6 stroke-2" />
        </>
      )}
    </div>
  );
};

const ConnectCTA = ({ hasGrants }) => {
  const { address: account, isConnecting } = useAccount();
  const [isClosed, setIsClosed] = useState(false);
  const { openConnectModal } = useConnectModal();
  const hasHydrated = useHasHydrated();

  const showCTA =
    !isClosed && ((!account && !isConnecting) || (account && !hasGrants));

  const handleClose = () => setIsClosed(true);

  if (!hasHydrated) return <></>;
  if (!showCTA) return <></>;

  return (
    <div className="rounded-lg bg-tokenops-primary-600 p-2 shadow sm:p-3">
      <div className="flex flex-wrap items-center justify-between">
        <div className="flex w-0 flex-1 items-center">
          <p className="ml-3 truncate font-medium text-white">
            <span>
              Are you a stakeholder? Connect your wallet to claim your vested
              tokens.
            </span>
          </p>
        </div>
        <div className="order-3 mt-2 w-full flex-shrink-0 sm:order-2 sm:mt-0 sm:w-auto">
          <SecondaryButton onClick={openConnectModal}>Connect</SecondaryButton>
        </div>
        <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-2">
          <button
            type="button"
            className="-mr-1 flex rounded-md p-2 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-white"
            onClick={handleClose}
          >
            <span className="sr-only">Dismiss</span>
            <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const TableTitle = ({ children }) => {
  return <h1 className="text-2xl font-semibold text-gray-800">{children}</h1>;
};

const AddFundsModal = ({
  show,
  onClose,
  chainId,
  tokenAddresses,
  addFunds,
}) => {
  const {
    handleSubmit,
    register,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();
  const [tokenBalance, setTokenBalance] = useState(BigNumber.from(0));
  const { data: signer } = useSigner();
  const { address: account } = useAccount();
  const tokenAddress = tokenAddresses?.[0];
  const { symbol: tokenSymbol, decimals: tokenDecimals } = useTokenDetails(
    chainId,
    tokenAddress
  );
  const tokenPrice = useTokenPrice(chainId, tokenAddress);
  const amount = watch("amount");

  useEffect(() => {
    setTokenBalance({});

    if (!chainId) return;
    if (!tokenAddress) return;
    if (!isAddress(tokenAddress)) return;

    const retrieveTokenBalance = async () => {
      try {
        const tokenBalance = await getTokenBalance(
          chainId,
          tokenAddress,
          account
        );
        setTokenBalance(tokenBalance);
      } catch (e) {
        console.error(e);
      }
    };

    retrieveTokenBalance();
  }, [tokenAddress, chainId, account]);

  const getUSDValue = (amount) => {
    if (!tokenPrice) return;
    if (!amount) return;
    return formatCurrency(tokenPrice * amount, "USD");
  };

  const withinBalance = (tokenAmount) => {
    try {
      return tokenBalance.gte(parseUnits(tokenAmount, tokenDecimals));
    } catch (e) {
      return true;
    }
  };

  const handleAddFunds = async ({ amount }) => {
    const tx = await addFunds(parseUnits(amount, tokenDecimals));
    const toastId = toast.loading("Sign transaction to add funds");
    try {
      const txResponse = await signer.sendTransaction(tx);
      toast.loading("Adding funds...", { id: toastId });
      await txResponse.wait();
      toast.success("Success", { id: toastId });
      onClose();
    } catch (e) {
      console.error(e);

      // User didn't sign transaction
      if (e?.code === 4001 || e?.code === "ACTION_REJECTED") {
        toast.dismiss(toastId);
        return;
      }

      // Display error message
      const message = e?.data?.message || e?.error?.message || e.message;
      toast.error("Something went wrong...", { id: toastId });
      toast.error(message);
    }
  };

  return (
    <Modal show={show} onClose={onClose}>
      <form onSubmit={handleSubmit(handleAddFunds)}>
        <ModalTitle>Add funds</ModalTitle>
        <ModalBody>
          <div className="flex flex-col gap-2.5">
            <div>
              <Label>Amount</Label>
              <CurrencyInput
                symbol={tokenSymbol}
                placeholder="0.00"
                {...register("amount", {
                  required: true,
                  min: 0,
                  validate: { withinBalance },
                })}
              />
              {tokenPrice && amount && (
                <span className="flex gap-1 py-2 text-xs text-gray-500">
                  <ArrowsRightLeftIcon className="h-4 w-4" />
                  {getUSDValue(amount)}
                </span>
              )}
              <span className="text-xs text-red-400">
                {errors?.amount?.type === "withinBalance" &&
                  "You don't have enough tokens available"}
                {errors?.amount?.type === "min" &&
                  "The amount cannot be negative"}
                {errors?.amount?.type === "required" && "A amount is required"}
              </span>
            </div>
          </div>
        </ModalBody>
        <ModalActionFooter>
          <div className="flex w-full items-center justify-between">
            <PrimaryButton type="submit" disabled={isSubmitting}>
              <span className="inline-flex items-center gap-1.5">
                {isSubmitting && <Spinner className="h-4 w-4" />}
                {isSubmitting && <span>Adding funds</span>}
                {!isSubmitting && <span>Add funds</span>}
              </span>
            </PrimaryButton>
          </div>
        </ModalActionFooter>
      </form>
    </Modal>
  );
};

export const Vesting = ({
  chainId: contractChainIdUnformatted,
  contractAddress: contractAddressUnformatted,
  filters,
}) => {
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [vestingData, setVestingData] = useState(null);
  const [vestingDrafts, setVestingDrafts] = useState(null);
  const [vestingMetaData, setVestingMetaData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  // this is the current chain!
  const { chain } = useNetwork();
  const { address: account } = useAccount();
  const { status: authStatus } = useSession()
  const isAuthenticated = authStatus === "authenticated"

  const handleOpenAddScheduleModal = () => setShowAddScheduleModal(true);
  const handleCloseAddScheduleModal = () => setShowAddScheduleModal(false);

  const handleOpenAddFundsModal = () => setShowAddFundsModal(true);
  const handleCloseAddFundsModal = () => setShowAddFundsModal(false);

  const contractChainId = Number(contractChainIdUnformatted);
  const contractAddress = formatAddress(contractAddressUnformatted);
  const currentChainId = chain?.id;
  const {
    tokenAddresses,
    addVestingSchedule,
    addFunds,
    capabilities,
    admins,
    getAdminTokenAllowance,
  } = vestingData || {};
  const canAddSchedule =
    !!capabilities?.addVestingSchedule && admins.includes(account);
  const canAddFunds = !!capabilities?.fundable && admins.includes(account);
  const isMultiToken = !!capabilities?.multiToken;
  const isConnectedWithCorrectChain = currentChainId === contractChainId;
  const contractLink = getAddressBlockExplorerLink(
    contractChainId,
    contractAddress
  );

  const retrieveVestingData = useCallback(() => {
    if (!contractAddress || !contractChainId) return;

    const retrieveVestingData = async () => {
      const { meta, getVestingData } = await getVestingContractDetails(
        contractChainId,
        contractAddress
      );
      setVestingMetaData(meta);
      setIsLoading(true);
      const vestingData = await getVestingData(filters);
      setVestingData(vestingData);
      setIsLoading(false);
    };

    const retrieveVestingDrafts = async () => {
      if (!ENABLE_DRAFTS) return
      if (!isAuthenticated) return
      const response = await axios.get("/api/drafts");
      setVestingDrafts(response.data);
    };

    retrieveVestingData();
    retrieveVestingDrafts();
  }, [contractAddress, contractChainId, filters, isAuthenticated]);

  useEffect(() => {
    retrieveVestingData();
  }, [retrieveVestingData]);

  return (
    <LayoutWrapper>
      {contractChainId !== undefined &&
        tokenAddresses !== undefined &&
        addVestingSchedule !== undefined && (
          <AddScheduleModal
            show={showAddScheduleModal}
            onClose={handleCloseAddScheduleModal}
            onSuccess={retrieveVestingData}
            chainId={contractChainId}
            contractAddress={contractAddress}
            tokenAddresses={tokenAddresses}
            addVestingSchedule={addVestingSchedule}
            getAdminTokenAllowance={getAdminTokenAllowance}
            isMultiToken={isMultiToken}
          />
        )}
      {contractChainId !== undefined &&
        tokenAddresses !== undefined &&
        addFunds !== undefined && (
          <AddFundsModal
            show={showAddFundsModal}
            onClose={handleCloseAddFundsModal}
            chainId={contractChainId}
            tokenAddresses={tokenAddresses}
            addFunds={addFunds}
          />
        )}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a
              href={contractLink}
              alt="Block Explorer Link"
              target="_blank"
              rel="noreferrer"
            >
              <div className="flex w-full justify-between">
                {vestingMetaData?.companyName && (
                  <TableTitle>{vestingMetaData?.companyName}</TableTitle>
                )}
                {vestingMetaData?.contractAddress &&
                  !vestingMetaData.companyName && (
                    <TableTitle>
                      {shortAddress(vestingMetaData?.contractAddress)}
                    </TableTitle>
                  )}
              </div>
            </a>
            <BookmarkButton
              chainId={contractChainId}
              contractAddress={contractAddress}
            />
          </div>
          <div className="flex gap-2">
            {canAddFunds && isConnectedWithCorrectChain && (
              <SecondaryButton onClick={handleOpenAddFundsModal}>
                <PlusIcon className="mr-1 h-5 w-5"></PlusIcon> Add Funds
              </SecondaryButton>
            )}
            {canAddSchedule && isConnectedWithCorrectChain && (
              <PrimaryButton onClick={handleOpenAddScheduleModal}>
                <CalendarDaysIcon className="mr-1 h-5 w-5" /> Add Schedule
              </PrimaryButton>
            )}
            {(canAddSchedule || canAddFunds) &&
              !isConnectedWithCorrectChain && (
                <SwitchChainButton chainId={contractChainId} />
              )}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <VestingDashboard
          vestingData={vestingData}
          vestingDrafts={vestingDrafts}
          isLoading={isLoading}
        />
      </div>
    </LayoutWrapper>
  );
};

const VestingPage = () => {
  const { query } = useRouter();
  const { contractAddress, chainId } = query;

  return (
    <Vesting contractAddress={contractAddress} chainId={chainId} filters={{}} />
  );
};

export default VestingPage;
