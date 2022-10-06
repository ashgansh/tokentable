import { useRouter } from "next/router"
import { useCallback, useEffect, useMemo, useState } from "react"

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
import { useController, useForm } from "react-hook-form"
import { isAddress, parseEther } from "ethers/lib/utils"
import Spinner from "@/components/Spinner"
import toast from "react-hot-toast"
import { Combobox } from "@headlessui/react"
import { ChevronUpDownIcon, EnvelopeIcon } from "@heroicons/react/24/outline"
import axios from "axios"

const SUPERFLUID_ASSETS_BASE_PATH = "https://raw.githubusercontent.com/superfluid-finance/assets/master/public"

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

const TokenCombobox = ({ chainId, tokens, ...args }) => {
  const [query, setQuery] = useState('')
  const [tokenIcons, setTokenIcons] = useState([])
  const { field: { value, onChange } } = useController(args);

  const tokenDetails = useMemo(() => {
    return tokens.reduce((tokenDetails, token) => {
      const tokenIcon = tokenIcons.find(tokenIcon => tokenIcon.id === token.id)
      return { ...tokenDetails, [token.id]: { ...token, iconUrl: tokenIcon?.iconUrl } }
    }, {})
  }, [tokens, tokenIcons])

  useEffect(() => {
    const retreiveTokenManifests = async () => {
      const tokenManifests = await Promise.all(tokens.map(async token => {
        const manifestURL = `${SUPERFLUID_ASSETS_BASE_PATH}/tokens/${token.symbol.toLowerCase()}/manifest.json`
        const manifestResponse = await axios.get(manifestURL)
        const manifest = manifestResponse.data
        return { id: token.id, iconUrl: manifest.svgIconPath }
      }))
      setTokenIcons(tokenManifests)
    }

    retreiveTokenManifests()
  }, [tokens])

  const filteredTokens =
    query === ''
      ? tokens
      : tokens.filter(token =>
        token.name.toLowerCase().includes(query.toLowerCase()) ||
        token.symbol.toLowerCase().includes(query.toLowerCase()))

  return (
    <Combobox as="div" value={value} onChange={onChange}>
      {({ open }) => (
        <div className="relative">
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              {!open && value && <img src={`${SUPERFLUID_ASSETS_BASE_PATH}${tokenDetails?.[value]?.iconUrl}`} className="h-6 w-6" alt="" />}
            </div>
            <Combobox.Input
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              onChange={(event) => setQuery(event.target.value)}
              displayValue={(tokenAddress) => tokenDetails?.[tokenAddress]?.name}
            />
          </div>
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </Combobox.Button>
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredTokens.map((filteredToken) => {
              const token = tokenDetails?.[filteredToken.id]
              return (
                <Combobox.Option
                  key={token.id}
                  value={token.id}
                  className={({ active }) =>
                    classNames(
                      'relative cursor-default select-none py-2 pl-3 pr-9',
                      active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                    )
                  }
                >
                  {({ selected }) => (
                    <div className="flex items-center flex-shrink-0 rounded-full gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${SUPERFLUID_ASSETS_BASE_PATH}${token.iconUrl}`} className="h-6 w-6" alt={token.name} />
                      <span className={classNames('block truncate', selected && 'font-semibold')}>
                        {token.name}
                      </span>
                    </div>
                  )}
                </Combobox.Option>
              )
            })}
          </Combobox.Options>
        </div>
      )}
    </Combobox>
  )
}

const AddStreamModal = ({ show, onClose, onSuccess, chainId }) => {
  const [superTokens, setSuperTokens] = useState([])
  const { handleSubmit, register, control, formState: { errors, isSubmitting } } = useForm()
  const { address: account } = useAccount()
  const { data: signer } = useSigner()

  useEffect(() => {
    if (!chainId) return

    const retrieveSuperTokens = async () => {
      const provider = getProvider(chainId)
      const superfluid = await Framework.create({
        chainId,
        provider
      });
      const { data: tokens } = await superfluid.query.listAllSuperTokens({ isListed: true })
      setSuperTokens(tokens)
    }

    retrieveSuperTokens()
  }, [chainId])


  const handleAddStream = async ({ monthlyFlowRate, beneficiary, tokenAddress }) => {
    const flowRate = parseEther(monthlyFlowRate).div(30 * 24 * 60 * 60)
    const provider = getProvider(chainId)
    const superfluid = await Framework.create({
      chainId,
      provider
    });

    const toastId = toast.loading("Sign transaction to create stream")
    try {
      const createFlowOperation = superfluid.cfaV1.createFlow({
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
              <TokenCombobox
                type="text"
                tokens={superTokens}
                chainId={chainId}
                control={control}
                rules={{ required: true }}
                name="tokenAddress"
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