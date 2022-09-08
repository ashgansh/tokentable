import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { erc20ABI, useAccount, useBalance, useNetwork, useSigner } from "wagmi"
import { Contract } from "ethers"
import { formatUnits, isAddress, parseUnits } from "ethers/lib/utils"
import toast from "react-hot-toast"

import { CheckIcon } from "@heroicons/react/20/solid"

import { TOKENOPS_VESTING_CREATOR_CONTRACT_ABI, TOKENOPS_VESTING_CREATOR_CONTRACT_ADDRESS } from "@/lib/contracts/TokenOpsVestingCreator"
import { getTokenBalance, getTokenDetails } from "@/lib/tokens"
import { classNames, formatToken } from "@/lib/utils"

import { PrimaryButton, SecondaryButton } from "@/components/Button"
import { LayoutWrapper } from "@/components/LayoutWrapper"
import Spinner from "@/components/Spinner"

const FundVestingContractStep = ({ vestingContractAddress, tokenAddress }) => {
  const { handleSubmit, register, formState: { errors, isValid, isSubmitting } } = useForm({ mode: 'onChange' })
  const { address: account } = useAccount()
  const { data: signer } = useSigner()
  const { chain } = useNetwork()
  const [tokenBalanceData, setTokenBalanceData] = useState({})
  const { decimals, symbol, tokenBalance } = tokenBalanceData

  useEffect(() => {
    setTokenBalanceData({})

    if (!chain) return
    if (!tokenAddress) return
    if (!isAddress(tokenAddress)) return

    const retrieveTokenBalance = async () => {
      try {
        const [tokenBalance, tokenDetails] = await Promise.all([
          await getTokenBalance(chain?.id, tokenAddress, account),
          await getTokenDetails(chain?.id, tokenAddress)
        ])
        setTokenBalanceData({ tokenBalance, ...tokenDetails })
      } catch (e) { }
    }

    retrieveTokenBalance()
  }, [tokenAddress, chain, account])

  const withinBalance = (tokenAmount) => {
    try { return tokenBalance.gte(parseUnits(tokenAmount)) } catch (e) { }
  }

  const handleFundVestingContract = async ({tokenAmount}) => {
    const toastId = toast.loading("Sign transaction to fund your vesting contract")
    try {
      const amount = parseUnits(tokenAmount, decimals)
      const tokenContract = new Contract(tokenAddress, erc20ABI, signer)
      const tx = await tokenContract.transfer(vestingContractAddress, amount)
      toast.loading(`Funding your vesting contract...`, { id: toastId })
      await tx.wait()
      toast.success("Successfully funded your vesting contract", { id: toastId })
    } catch (e) {
      console.error(e)

      // User didn't sign transaction
      if (e?.code === 4001 || e?.code === "ACTION_REJECTED") {
        toast.dismiss(toastId)
        return
      }

      // Display error message
      const message = e?.data?.message || e?.error?.message || e.message;
      toast.error("Something went wrong funding your vesting contract", { id: toastId })
      toast.error(message)
    }
  }

  return (
    <form className="h-full" onSubmit={handleSubmit(handleFundVestingContract)}>
      <div className="flex flex-col justify-between gap-4 h-full">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Fund</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Fund your vesting contract. You can always do this later.</p>
          </div>
          <div className="mt-1">
            <div className="relative mt-1 rounded-md shadow-sm w-48">
              <input
                type="number"
                id="tokenAmount"
                className="block w-full rounded-md border-gray-300 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="0.00"
                {...register("tokenAmount", { required: true, min: 0, validate: { withinBalance } })}
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 sm:text-sm" id="price-currency">
                  {symbol}
                </span>
              </div>
            </div>
            {tokenBalance && (
              <div className="text-sm text-gray-500">
                Your balance: {formatToken(tokenBalance, decimals, symbol)}
              </div>
            )}
            {errors?.tokenAmount?.type === "withinBalance" && (
              <div className="text-sm text-gray-500">
                Balance is too low
              </div>
            )}
            {errors?.tokenAmount?.type === "min" && (
              <div className="text-sm text-gray-500">
                The transfer amount cannot be negative
              </div>
            )}
          </div>
          <span className="text-sm text-gray-500">
          </span>
        </div>
        <div className="flex justify-between">
          <PrimaryButton type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <span className="inline-flex items-center gap-1.5"><Spinner className="h-4 w-4" /><span>Funding</span></span>
            ) : (
              <span>Fund</span>
            )}
          </PrimaryButton>
          <SecondaryButton type="submit" disabled={isSubmitting}>
            <span>Skip</span>
          </SecondaryButton>
        </div>
      </div >
    </form>
  )
}

const useTokenAddressResolver = chain =>
  useCallback(async values => {
    const { tokenAddress } = values

    const data = (errorMessage) => {
      if (!errorMessage) {
        return {
          values,
          errors: {}
        }
      }

      return {
        values,
        errors: {
          tokenAddress: {
            type: "validation",
            message: errorMessage
          }
        }
      }
    }

    if (!chain || chain.unsupported) {
      return data("Unsupported token chain. Please switch to a supported chain.")
    }

    if (!isAddress(tokenAddress)) {
      return data("Invalid token address")
    }

    try {
      await getTokenDetails(chain.id, tokenAddress)
    } catch (e) {
      return data("This address is not a valid ERC20 token")
    }

    return data()
  }, [chain])

const CreateVestingContractStep = () => {
  const { chain } = useNetwork()
  const { data: signer } = useSigner()
  const { address: account } = useAccount()
  const resolver = useTokenAddressResolver(chain)

  const { handleSubmit, register, watch, formState: { errors, isValid, isSubmitting } } = useForm({ mode: 'onChange', resolver })
  const tokenAddress = watch("tokenAddress")

  const [tokenBalance, setTokenBalance] = useState()

  useEffect(() => {
    setTokenBalance("")

    if (!chain) return
    if (!tokenAddress) return
    if (!isAddress(tokenAddress)) return

    const retrieveTokenBalance = async () => {
      try {
        const [tokenBalance, tokenDetails] = await Promise.all([
          await getTokenBalance(chain?.id, tokenAddress, account),
          await getTokenDetails(chain?.id, tokenAddress)
        ])
        const formattedBalance = formatToken(tokenBalance, tokenDetails.decimals, tokenDetails.symbol)
        setTokenBalance(formattedBalance)
      } catch (e) { }
    }

    retrieveTokenBalance()
  }, [tokenAddress, chain, account])

  const handleCreateVestingContract = async ({ tokenAddress }) => {
    const toastId = toast.loading("Sign transaction in your wallet to create your vesting contract")
    try {
      const tokenVestingCreator = new Contract(
        TOKENOPS_VESTING_CREATOR_CONTRACT_ADDRESS[5],
        TOKENOPS_VESTING_CREATOR_CONTRACT_ABI,
        signer
      )
      const tx = await tokenVestingCreator.createVestingContract(tokenAddress)
      toast.loading(`Creating your vesting contract...`, { id: toastId })
      const receipt = await tx.wait()
      //const vestingContractAddress = getVestingContractAddressFromTxReceipt(receipt)
      toast.success("Successfully created your vesting contract", { id: toastId })
      //router.push(`/contracts/tokenops/${chainId}/${vestingContractAddress}`)
    } catch (e) {
      console.error(e)

      // User didn't sign transaction
      if (e?.code === 4001 || e?.code === "ACTION_REJECTED") {
        toast.dismiss(toastId)
        return
      }

      // Display error message
      const message = e?.data?.message || e?.error?.message || e.message;
      toast.error("Something went wrong creating your vesting contract", { id: toastId })
      toast.error(message)
    }
  }

  return (
    <form className="h-full" onSubmit={handleSubmit(handleCreateVestingContract)}>
      <div className="flex flex-col justify-between gap-4 h-full">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Token</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Insert the token address you want to vest.</p>
          </div>
          <div className="mt-1 w-full sm:max-w-md">
            <input
              type="text"
              name="tokenAddress"
              id="tokenAddress"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="0x6B175474E89094C44Da98b954EedeAC495271d0F"
              {...register("tokenAddress", { required: true })}
            />
          </div>
          <span className="text-sm text-gray-500">
            {errors.tokenAddress && (
              <>{errors.tokenAddress.message}</>
            )}
            {!errors?.tokenAddress && tokenBalance && (
              <>Your balance: {tokenBalance}</>
            )}
          </span>
        </div>
        <div>
          <PrimaryButton type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <span className="inline-flex items-center gap-1.5"><Spinner className="h-4 w-4" /><span>Creating</span></span>
            ) : (
              <span>Create</span>
            )}
          </PrimaryButton>
        </div>
      </div >
    </form>
  )
}

const CreateVestingContractProgressBar = ({ currentStep }) => {
  const status = (currentStep, position) => {
    if (currentStep < position) return 'upcoming'
    if (currentStep === position) return 'current'
    if (currentStep > position) return 'complete'
  }
  const steps = [
    { name: 'Create vesting contract', status: status(currentStep, 0) },
    { name: 'Fund the vesting contract', status: status(currentStep, 1) },
    { name: 'Add the first stakeholder', status: status(currentStep, 2) },
  ]

  return (
    <nav aria-label="Progress">
      <ol role="list" className="overflow-hidden">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className={classNames(stepIdx !== steps.length - 1 ? 'pb-10' : '', 'relative')}>
            {step.status === 'complete' ? (
              <>
                {stepIdx !== steps.length - 1 ? (
                  <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-tokenops-primary-600" aria-hidden="true" />
                ) : null}
                <div className="group relative flex items-center">
                  <span className="flex h-9 items-center">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-tokenops-primary-600">
                      <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                    </span>
                  </span>
                  <span className="ml-4 flex min-w-0 flex-col">
                    <span className="text-sm font-medium">{step.name}</span>
                  </span>
                </div>
              </>
            ) : step.status === 'current' ? (
              <>
                {stepIdx !== steps.length - 1 ? (
                  <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300" aria-hidden="true" />
                ) : null}
                <div className="group relative flex items-center" aria-current="step">
                  <span className="flex h-9 items-center" aria-hidden="true">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-tokenops-primary-600 bg-white">
                      <span className="h-2.5 w-2.5 rounded-full bg-tokenops-primary-600" />
                    </span>
                  </span>
                  <span className="ml-4 flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-tokenops-primary-700">{step.name}</span>
                  </span>
                </div>
              </>
            ) : (
              <>
                {stepIdx !== steps.length - 1 ? (
                  <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300" aria-hidden="true" />
                ) : null}
                <a href={step.href} className="group relative flex items-center">
                  <span className="flex h-9 items-center" aria-hidden="true">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white" />
                  </span>
                  <span className="ml-4 flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-gray-500">{step.name}</span>
                  </span>
                </a>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

const Contracts = () => {
  const STEP = 1
  return (
    <LayoutWrapper>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create a Vesting Contract</h1>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          {STEP === 0 && (
            <div className="flex gap-8 py-6 px-4 sm:p-6">
              <CreateVestingContractProgressBar currentStep={0} />
              <div className="flex-grow">
                <CreateVestingContractStep />
              </div>
            </div>
          )}
          {STEP === 1 && (
            <div className="flex gap-8 py-6 px-4 sm:p-6">
              <CreateVestingContractProgressBar currentStep={1} />
              <div className="flex-grow">
                <FundVestingContractStep
                  vestingContractAddress="0x3Da274c95823Aaa0717cc572FE2C9604Ec8bF4BD"
                  tokenAddress="0xC8BD9935f911Cef074AbB8774d775840091e8907"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </LayoutWrapper>
  )
}

export default Contracts