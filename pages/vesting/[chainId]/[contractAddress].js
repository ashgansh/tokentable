import { useRouter } from "next/router"
import { useCallback, useEffect, useState } from "react"
import { useAccount, useNetwork, useSigner } from "wagmi"
import { BigNumber } from "ethers"
import { isAddress, parseUnits } from "ethers/lib/utils"
import { useForm } from "react-hook-form"
import { BookmarkIcon as BookmarkIconOutline, InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { BookmarkIcon as BookmarkIconSolid } from "@heroicons/react/24/solid"
import toast from "react-hot-toast"

import { getVestingContractDetails } from "@/lib/vesting"
import { useTokenDetails, useTokenFormatter } from "@/lib/tokens"
import { portfolioStore } from "@/lib/portfolio"
import { formatAddress, classNames } from "@/lib/utils"

import { CurrencyInput, Input, Label } from "@/components/Input"
import { LayoutWrapper } from "@/components/LayoutWrapper"
import { Modal, ModalActionFooter, ModalBody, ModalTitle } from "@/components/Modal"
import { PrimaryButton, SecondaryButton } from "@/components/Button"
import Spinner from "@/components/Spinner"
import VestingPosition from "@/components/VestingPosition"
import SwitchChainButton from "@/components/SwitchChainButton"
import VestingInsights from "@/components/VestingInsights"
import VestingTable from "@/components/VestingTable"
import { useConnectModal } from "@rainbow-me/rainbowkit"

const VestingDashboard = ({ vestingData, isLoading }) => {
  const { address: account } = useAccount()
  const myGrants = vestingData?.grants?.filter(grant => grant.beneficiary === account) || []

  return (
    <div className="flex flex-col gap-4 py-4">
      <div>
        <h2 className="text-lg py-2">Vesting overview</h2>
        {Object.keys(vestingData?.tokens || { 'dummyToken': 'ok' }).map(tokenAddress => (
          <VestingInsights
            key={tokenAddress}
            totalAllocated={vestingData?.totalAllocatedAmounts?.[tokenAddress] || BigNumber.from(0)}
            totalWithdrawn={vestingData?.totalWithdrawnAmounts?.[tokenAddress] || BigNumber.from(0)}
            totalVested={vestingData?.totalVestedAmounts?.[tokenAddress] || BigNumber.from(0)}
            chainId={vestingData?.chainId}
            tokenAddress={tokenAddress}
            isLoading={isLoading}
          />
        ))}
      </div>
      <ConnectCTA hasGrants={myGrants.length > 0} />
      {myGrants.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg">Your position</h2>
          {myGrants.map(grant => (
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
        <h2 className="text-lg py-2">Stakeholders</h2>
        <VestingTable grants={vestingData?.grants || []} chainId={vestingData?.chainId} isLoading={isLoading} />
      </div>
    </div>
  )
}

const AddScheduleModal = ({ show, onClose, onSuccess, chainId, tokenAddresses, addVestingSchedule, getAdminTokenAllowance }) => {
  const { handleSubmit, register, reset, getValues, formState: { errors, isSubmitting } } = useForm()
  const { address: account } = useAccount()
  const [tokenAllowance, setTokenAllowance] = useState(null)
  const tokenAddress = tokenAddresses?.[0]
  const { symbol: tokenSymbol, decimals: tokenDecimals } = useTokenDetails(chainId, tokenAddress)
  const { data: signer } = useSigner()
  const formatToken = useTokenFormatter(chainId, tokenAddress)

  useEffect(() => {
    if (!account) return
    if (!tokenAddress) return
    if (!getAdminTokenAllowance) return

    const retrieveTokenAllowance = async () => {
      const allowance = await getAdminTokenAllowance(tokenAddress, account)
      setTokenAllowance(allowance)
    }

    retrieveTokenAllowance()
  }, [getAdminTokenAllowance, account, tokenAddress])

  const withinTokenAllowance = (amount) => {
    if (!tokenAllowance) return true

    try {
      return tokenAllowance.gte(parseUnits(amount, tokenDecimals))
    } catch (e) {
      return true
    }
  }

  const endIsAfterStart = (end) => {
    const start = getValues("start")
    const startTime = Math.round(new Date(start).getTime() / 1000)
    const endTime = Math.round(new Date(end).getTime() / 1000)
    return endTime > startTime
  }

  const handleAddVestingSchedule = async ({ start, end, amount, beneficiary }) => {
    const schedule = {
      startTime: Math.round(new Date(start).getTime() / 1000),
      endTime: Math.round(new Date(end).getTime() / 1000),
      amount: parseUnits(amount, tokenDecimals),
      beneficiary,
      tokenAddress
    }
    const toastId = toast.loading("Sign transaction to add a schedule")
    try {
      const tx = await addVestingSchedule(signer, schedule)
      toast.loading(`Adding a schedule...`, { id: toastId })
      await tx.wait()
      toast.success("Successfully added a schedule to your vesting contract", { id: toastId })
      onClose()
      onSuccess()
      reset()
    } catch (e) {
      console.error(e)

      // User didn't sign transaction
      if (e?.code === 4001 || e?.code === "ACTION_REJECTED") {
        toast.dismiss(toastId)
        return
      }

      // Display error message
      const message = e?.data?.message || e?.error?.message || e.message;
      toast.error("Something went wrong adding a schedule to your vesting contract", { id: toastId })
      toast.error(message)
    }
  }

  return (
    <Modal show={show} onClose={onClose}>
      <form onSubmit={handleSubmit(handleAddVestingSchedule)}>
        <ModalTitle>Add a vesting schedule</ModalTitle>
        <ModalBody>
          <div className="flex flex-col gap-2.5">
            <div>
              <Label>Stakeholder Address</Label>
              <Input
                placeholder="0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe"
                {...register("beneficiary", { required: true, validate: { isAddress } })}
              />
              <span className="text-xs text-red-400">
                {errors?.beneficiary?.type === "required" && "A valid address is required"}
                {errors?.beneficiary?.type === "isAddress" && "Invalid address"}
              </span>
            </div>
            <div>
              <Label>Start</Label>
              <Input
                type="datetime-local"
                {...register("start", { required: true })}
              />
              <span className="text-xs text-red-400">
                {errors?.start?.type === "required" && "A vesting start is required"}
              </span>
            </div>
            <div>
              <Label>End</Label>
              <Input
                type="datetime-local"
                {...register("end", { required: true, validate: { endIsAfterStart } })}
              />
              <span className="text-xs text-red-400">
                {errors?.end?.type === "endIsAfterStart" && "Vesting cannot end before it has started"}
                {errors?.end?.type === "required" && "A vesting end is required"}
              </span>
            </div>
            <div>
              <Label>Vesting Amount</Label>
              <CurrencyInput
                symbol={tokenSymbol}
                placeholder="0.00"
                {...register("amount", { required: true, min: 0, validate: { withinTokenAllowance } })}
              />
              <span className="text-xs text-red-400">
                {errors?.amount?.type === "withinTokenAllowance" && "Vesting contract does not have enough tokens available"}
                {errors?.amount?.type === "min" && "The vesting amount cannot be negative"}
                {errors?.amount?.type === "required" && "A vesting amount is required"}
              </span>
            </div>
          </div>
        </ModalBody>
        <ModalActionFooter>
          <div className="flex justify-between items-center w-full">
            <p className="text text-gray-800">
              {tokenAllowance && (
                <>Available tokens to allocate: {formatToken(tokenAllowance)}</>
              )}
            </p>
            <PrimaryButton type="submit" disabled={isSubmitting}>
              <span className="inline-flex items-center gap-1.5">
                {isSubmitting && <Spinner className="h-4 w-4" />}
                {isSubmitting && <span>Adding schedule</span>}
                {!isSubmitting && <span>Add schedule</span>}
              </span>
            </PrimaryButton>
          </div>
        </ModalActionFooter>
      </form>
    </Modal>
  )
}

const BookmarkButton = ({ contractAddress, chainId }) => {
  const { addPortfolioItem, removePortfolioItem, isInPortfolio } = portfolioStore()
  const isBookmarked = isInPortfolio({ contractAddress, chainId })

  const handleAddPortfolioItem = () => {
    addPortfolioItem({ contractAddress, chainId })
  }

  const handleRemovePorfolioItem = () => {
    removePortfolioItem({ contractAddress, chainId })
  }

  const handleClickBookmark = () => {
    isBookmarked ? handleRemovePorfolioItem() : handleAddPortfolioItem()
  }

  return (
    <SecondaryButton className="flex gap-1 items-center " onClick={handleClickBookmark}>
      {!isBookmarked && <>Add to portfolio <BookmarkIconOutline className="h-6 w-6 stroke-2" /></>}
      {isBookmarked && <>Remove from portfolio <BookmarkIconSolid className="h-6 w-6 stroke-2" /></>}
    </SecondaryButton>
  )
}

const ConnectCTA = ({ hasGrants }) => {
  const { address: account, isConnecting } = useAccount()
  const [isClosed, setIsClosed] = useState(false)
  const { openConnectModal } = useConnectModal()

  const showCTA = !isClosed && (
    (!account && !isConnecting) ||
    (account && !hasGrants)
  )

  const handleClose = () => setIsClosed(true)

  return (
    <div className={classNames("rounded-lg bg-tokenops-primary-600 p-2 shadow sm:p-3", !showCTA && "hidden")}>
      <div className="flex flex-wrap items-center justify-between">
        <div className="flex w-0 flex-1 items-center">
          <p className="ml-3 truncate font-medium text-white">
            <span>Are you a stakeholder? Connect your wallet to claim your vested tokens.</span>
          </p>
        </div>
        <div className="order-3 mt-2 w-full flex-shrink-0 sm:order-2 sm:mt-0 sm:w-auto">
          <SecondaryButton onClick={openConnectModal}>
            Connect
          </SecondaryButton>
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
  )
}
export const Vesting = ({chainId: contractChainIdUnformatted, contractAddress: contractAddressUnformatted, filters}) => {
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false)
  const [vestingData, setVestingData] = useState(null)
  const [vestingMetaData, setVestingMetaData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const { chain } = useNetwork()
  const { address: account } = useAccount()

  const handleOpenAddScheduleModal = () => setShowAddScheduleModal(true)
  const handleCloseAddScheduleModal = () => setShowAddScheduleModal(false)

  const contractChainId = Number(contractChainIdUnformatted)
  const contractAddress = formatAddress(contractAddressUnformatted)
  const currentChainId = chain?.id
  const { tokenAddresses, addVestingSchedule, capabilities, admins, getAdminTokenAllowance } = vestingData || {}
  const canAddSchedule = !!capabilities?.addVestingSchedule && admins.includes(account)
  const isConnectedWithCorrectChain = currentChainId === contractChainId

  const retrieveVestingData = useCallback(() => {
    if (!contractAddress || !contractChainId) return

    const retrieveVestingData = async () => {
      const { meta, getVestingData } = await getVestingContractDetails(contractChainId, contractAddress)
      setVestingMetaData(meta)
      setIsLoading(true)
      const vestingData = await getVestingData(filters)
      setVestingData(vestingData)
      setIsLoading(false)
    }

    retrieveVestingData()
  }, [contractAddress, contractChainId, filters])

  useEffect(() => {
    retrieveVestingData()
  }, [retrieveVestingData])

  return (
    <LayoutWrapper>
      <AddScheduleModal
        show={showAddScheduleModal}
        onClose={handleCloseAddScheduleModal}
        onSuccess={retrieveVestingData}
        chainId={contractChainId}
        tokenAddresses={tokenAddresses}
        addVestingSchedule={addVestingSchedule}
        getAdminTokenAllowance={getAdminTokenAllowance}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <div className="flex justify-between w-full">
              {vestingMetaData?.companyName && (
                <h1 className="text-2xl font-semibold text-gray-800">{vestingMetaData?.companyName}</h1>
              )}
              {!vestingMetaData?.companyName && (
                <h1 className="text-gray-800">{vestingMetaData?.contractAddress}</h1>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <BookmarkButton chainId={contractChainId} contractAddress={contractAddress} />
            {canAddSchedule && isConnectedWithCorrectChain &&
              <PrimaryButton onClick={handleOpenAddScheduleModal}>Add Schedule</PrimaryButton>}
            {canAddSchedule && !isConnectedWithCorrectChain &&
              <SwitchChainButton chainId={contractChainId} />}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <VestingDashboard vestingData={vestingData} isLoading={isLoading} />
      </div>
    </LayoutWrapper>
  )
}

const VestingPage = () => {
  const { query } = useRouter()
  const { contractAddress, chainId } = query

  return <Vesting contractAddress={contractAddress} chainId={chainId} filters={{}} />
}

export default VestingPage