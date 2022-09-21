import { useRouter } from "next/router"
import { useCallback, useEffect, useState } from "react"
import { useAccount, useNetwork, useSigner } from "wagmi"
import { BigNumber } from "ethers"
import { isAddress, parseUnits } from "ethers/lib/utils"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"

import { useConnectModal } from "@rainbow-me/rainbowkit"
import { BookmarkIcon } from "@heroicons/react/24/outline"

import { getVestingContractDetails } from "@/lib/vesting"
import { useTokenDetails, useTokenFormatter } from "@/lib/tokens"

import { CurrencyInput, Input, Label } from "@/components/Input"
import { LayoutWrapper } from "@/components/LayoutWrapper"
import { Modal, ModalActionFooter, ModalBody, ModalTitle } from "@/components/Modal"
import { PrimaryButton, SecondaryButton } from "@/components/Button"
import Spinner from "@/components/Spinner"
import VestingPosition from "@/components/VestingPosition"
import SwitchChainButton from "@/components/SwitchChainButton"
import VestingInsights from "@/components/VestingInsights"
import VestingTable from "@/components/VestingTable"
import { portfolioStore } from "@/lib/portfolio"

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
  const { addPortfolioItem } = portfolioStore()
  const handleAddPortfolioItem = () => {
    addPortfolioItem({ contractAddress, chainId })
  }

  return <SecondaryButton className="flex gap-1 items-center " onClick={handleAddPortfolioItem}>Add to portfolio <BookmarkIcon className="h-6 w-6 stroke-2" /></SecondaryButton>
}

const ConnectCTA = () => {
  return (
    <div className="bg-indigo-50">
      <div className="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:flex lg:items-center lg:justify-between lg:py-24 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
          <span className="block">Ready to dive in?</span>
          <span className="block text-indigo-600">Start your free trial today.</span>
        </h2>
        <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
          <div className="inline-flex rounded-md shadow">
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-5 py-3 text-base font-medium text-white hover:bg-indigo-700"
            >
              Get started
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

const Vesting = () => {
  const { addPortfolioItem } = portfolioStore()
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false)
  const [vestingData, setVestingData] = useState(null)
  const [vestingMetaData, setVestingMetaData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const { openConnectModal } = useConnectModal()
  const { chain } = useNetwork()
  const { address: account } = useAccount()
  const { query } = useRouter()

  const handleOpenAddScheduleModal = () => setShowAddScheduleModal(true)
  const handleCloseAddScheduleModal = () => setShowAddScheduleModal(false)

  const { contractAddress, chainId: contractChainIdString } = query
  const contractChainId = Number(contractChainIdString)
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
      const vestingData = await getVestingData()
      setVestingData(vestingData)
      setIsLoading(false)
    }

    retrieveVestingData()
  }, [contractAddress, contractChainId])

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
          <BookmarkButton chainId={contractChainId} contractAddress={contractAddress} />
          {!account &&
            <PrimaryButton onClick={openConnectModal}>Connect Wallet</PrimaryButton>
          }
          {canAddSchedule && isConnectedWithCorrectChain &&
            <PrimaryButton onClick={handleOpenAddScheduleModal}>Add Schedule</PrimaryButton>}
          {canAddSchedule && !isConnectedWithCorrectChain &&
            <SwitchChainButton chainId={contractChainId} />}
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <VestingDashboard vestingData={vestingData} isLoading={isLoading} />
      </div>
    </LayoutWrapper>
  )
}

export default Vesting