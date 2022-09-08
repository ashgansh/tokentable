import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useAccount, useNetwork, useSigner } from "wagmi"
import { Contract } from "ethers"
import { isAddress } from "ethers/lib/utils"
import toast from "react-hot-toast"

import { CheckIcon } from "@heroicons/react/20/solid"

import { TOKENOPS_VESTING_CREATOR_CONTRACT_ABI, TOKENOPS_VESTING_CREATOR_CONTRACT_ADDRESS } from "@/lib/contracts/TokenOpsVestingCreator"
import { getTokenBalance, getTokenDetails } from "@/lib/tokens"
import { classNames, formatToken } from "@/lib/utils"

import { PrimaryButton } from "@/components/Button"
import { LayoutWrapper } from "@/components/LayoutWrapper"
import Spinner from "@/components/Spinner"

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

const CreateVestingContractForm = () => {
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
                  <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-indigo-600" aria-hidden="true" />
                ) : null}
                <a href={step.href} className="group relative flex items-center">
                  <span className="flex h-9 items-center">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 group-hover:bg-indigo-800">
                      <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                    </span>
                  </span>
                  <span className="ml-4 flex min-w-0 flex-col">
                    <span className="text-sm font-medium">{step.name}</span>
                  </span>
                </a>
              </>
            ) : step.status === 'current' ? (
              <>
                {stepIdx !== steps.length - 1 ? (
                  <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300" aria-hidden="true" />
                ) : null}
                <div className="group relative flex items-center" aria-current="step">
                  <span className="flex h-9 items-center" aria-hidden="true">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white">
                      <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                    </span>
                  </span>
                  <span className="ml-4 flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-indigo-600">{step.name}</span>
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
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white group-hover:border-gray-400">
                      <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" />
                    </span>
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
  return (
    <LayoutWrapper>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create a Vesting Contract</h1>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="flex gap-8 py-6 px-4 sm:p-6">
            <CreateVestingContractProgressBar currentStep={0} />
            <div className="flex-grow">
              <CreateVestingContractForm />
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}

export default Contracts