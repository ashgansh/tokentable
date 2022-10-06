import { useRouter } from "next/router"
import { useCallback, useEffect, useState } from "react"

import { formatAddress, classNames } from "@/lib/utils"

import { LayoutWrapper } from "@/components/LayoutWrapper"
import StreamsTable from "@/components/StreamsTable"
import { Framework } from "@superfluid-finance/sdk-core"
import { getProvider } from "@/lib/provider"
import { tokenStore } from "@/lib/tokens"
import { Modal, ModalActionFooter, ModalBody, ModalTitle } from "@/components/Modal"
import { Label, Input } from "@/components/Input"
import { useAccount, useNetwork, useSigner } from "wagmi"
import { PrimaryButton } from "@/components/Button"
import { useForm } from "react-hook-form"
import { isAddress, parseEther } from "ethers/lib/utils"
import Spinner from "@/components/Spinner"
import toast from "react-hot-toast"

const VestingDashboard = ({ vestingData, isLoading }) => {
  return (
    <div className="flex flex-col gap-4 py-4">
      <div>
        <h2 className="text-lg py-2">Streams</h2>
        <StreamsTable streams={vestingData?.streams || []} chainId={vestingData?.chainId} isLoading={isLoading} />
      </div>
    </div>
  )
}

const AddStreamModal = ({ show, onClose, onSuccess, chainId }) => {
  const { handleSubmit, register, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      tokenAddress: "0x5943f705abb6834cad767e6e4bb258bc48d9c947" //goerli superETH
    }
  })
  const { address: account } = useAccount()
  const { data: signer } = useSigner()

  const handleAddStream = async ({ monthlyFlowRate, beneficiary, tokenAddress }) => {
    const flowRate = parseEther(monthlyFlowRate).div(30 * 24 * 60 * 60)
    const provider = getProvider(chainId)

    const toastId = toast.loading("Sign transaction to create stream")
    try {
      const sf = await Framework.create({
        chainId,
        provider
      });
      const createFlowOperation = sf.cfaV1.createFlow({
        sender: account,
        receiver: beneficiary,
        superToken: tokenAddress,
        flowRate
      });
      const txResponse = await createFlowOperation.exec(signer)
      toast.loading("Creating new stream...", { id: toastId })
      await txResponse.wait()
      toast.success("Success", { id: toastId })
      onClose()
    } catch (e) {
      console.error(e)

      // User didn't sign transaction
      if (e?.code === 4001 || e?.code === "ACTION_REJECTED") {
        toast.dismiss(toastId)
        return
      }

      // Display error message
      const message = e?.data?.message || e?.error?.message || e.message;
      toast.error("Something went wrong...", { id: toastId })
      toast.error(message)
    }
  }

  return (
    <Modal show={show} onClose={onClose}>
      <form onSubmit={handleSubmit(handleAddStream)}>
        <ModalTitle>Add a vesting schedule</ModalTitle>
        <ModalBody>
          <div className="flex flex-col gap-2.5">
            <div>
              <Label>Beneficiary Address</Label>
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
              <Label>Tokens per month</Label>
              <Input
                type="number"
                {...register("monthlyFlowRate", { required: true })}
              />
            </div>
            <div>
              <Label>Super Token Address</Label>
              <Input
                type="text"
                {...register("tokenAddress", { required: true, validate: { isAddress } })}
              />
              <span className="text-xs text-red-400">
                {errors?.tokenAddress?.type === "required" && "A valid address is required"}
                {errors?.tokenAddress?.type === "isAddress" && "Invalid address"}
              </span>
            </div>
          </div>
        </ModalBody>
        <ModalActionFooter>
          <div className="flex justify-between items-center w-full">
            <PrimaryButton type="submit" disabled={isSubmitting}>
              <span className="inline-flex items-center gap-1.5">
                {isSubmitting && <Spinner className="h-4 w-4" />}
                {isSubmitting && <span>Adding stream</span>}
                {!isSubmitting && <span>Add stream</span>}
              </span>
            </PrimaryButton>
          </div>
        </ModalActionFooter>
      </form>
    </Modal>
  )
}

const Superfluid = () => {
  const [showAddStreamModal, setShowAddStreamModal] = useState(false)
  const [vestingData, setVestingData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const { query } = useRouter()
  const addToken = tokenStore(state => state.addToken)
  const { chain } = useNetwork()
  const { address: account } = useAccount()

  const handleOpenAddStreamModal = () => setShowAddStreamModal(true)
  const handleCloseAddStreamModal = () => setShowAddStreamModal(false)

  const { senderAccount: senderAccountUnformatted, chainId: contractChainIdString } = query
  const senderAccount = formatAddress(senderAccountUnformatted)
  const contractChainId = Number(contractChainIdString)
  const currentChainId = chain?.id

  const canAddStream = account === senderAccount
  const isConnectedWithCorrectChain = currentChainId === contractChainId

  const retrieveVestingData = useCallback(() => {
    if (!senderAccount || contractChainId === NaN) return

    const retrieveVestingData = async () => {
      setIsLoading(true)
      const provider = getProvider(contractChainId)
      const superfluid = await Framework.create({
        chainId: contractChainId,
        provider
      })

      const { data: streams } = await superfluid.query.listStreams({ sender: senderAccount });
      const tokenAddresses = Array.from(new Set(streams.map(stream => stream.token.id)))
      tokenAddresses.forEach(tokenAddress => addToken(contractChainId, tokenAddress))
      const vestingData = { streams, chainId: contractChainId, tokenAddresses }
      setVestingData(vestingData)
      setIsLoading(false)
    }

    retrieveVestingData()
  }, [senderAccount, contractChainId, addToken])

  useEffect(() => {
    retrieveVestingData()
  }, [retrieveVestingData])

  return (
    <LayoutWrapper>
      <AddStreamModal
        show={showAddStreamModal}
        onClose={handleCloseAddStreamModal}
        onSuccess={retrieveVestingData}
        chainId={contractChainId}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-gray-800">{senderAccount}</h1>
          <div className="flex gap-2">
            {canAddStream && isConnectedWithCorrectChain &&
              <PrimaryButton onClick={handleOpenAddStreamModal}>Add Stream</PrimaryButton>}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <VestingDashboard vestingData={vestingData} isLoading={isLoading} />
      </div>
    </LayoutWrapper>
  )
}

export default Superfluid