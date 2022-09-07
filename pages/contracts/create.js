import { LayoutWrapper } from "@/components/LayoutWrapper"
import { NULL_ADDRESS } from "@/lib/constants"
import { classNames, formatToken } from "@/lib/utils"
import { CheckIcon } from "@heroicons/react/20/solid"
import { isAddress } from "ethers/lib/utils"
import { useForm } from "react-hook-form"
import { useBalance } from "wagmi"

const CreateVestingContractForm = () => {
  const { register, watch, formState: { errors } } = useForm({mode: 'onBlur'})
  const tokenAddress = watch("tokenAddress") || NULL_ADDRESS
  const { data: balanceData, isError: isBalanceError, isLoading: isBalanceLoading} = useBalance({
    addressOrName: '0xe8c475e7d1783d342FE11B7a35E034980aed0769',
    token: tokenAddress
  })
  const {value: tokenBalance, decimals, symbol} = balanceData || {}
  const isValidERC20 = !!balanceData
  console.log(isAddress(''))
  return (
    <div>
      <h3 className="text-lg font-medium leading-6 text-gray-900">Token</h3>
      <div className="mt-2 max-w-xl text-sm text-gray-500">
        <p>Insert the token address you want to vest.</p>
      </div>
      <form className="mt-5 sm:flex sm:items-center">
        <div className="w-full sm:max-w-xs">
          <input
            type="text"
            name="tokenAddress"
            id="tokenAddress"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="0x6B175474E89094C44Da98b954EedeAC495271d0F"
            {...register("tokenAddress", {required: true, validate: isAddress})}
          />
        </div>
        <button
          type="submit"
          className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
        >
          Create
        </button>
      </form>
      <span className="text-sm text-gray-500">
        {tokenBalance && (
          <>Your balance: {formatToken(tokenBalance, decimals, symbol)}</>
        )}
        {errors && (
          <>Invalid token</>
        )}
      </span>
    </div>
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