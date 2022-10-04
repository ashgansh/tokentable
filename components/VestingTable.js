import Moment from "react-moment"

import { ClipboardIcon, LinkIcon } from "@heroicons/react/24/outline"

import ProgressBar from "@/components/ProgressBar"

import { useTokenFormatter } from "@/lib/tokens"
import { shortAddress } from "@/lib/utils"
import { getAddressBlockExplorerLink } from "@/lib/provider"

const GrantRow = ({ grant, chainId }) => {
  const formatToken = useTokenFormatter(chainId, grant.tokenAddress)

  const now = Date.now() / 1000
  const nowOrEndTime = Math.min(now, grant.revokedTime || grant.endTime)
  const elapsedTime = Math.max(0, nowOrEndTime - grant.startTime)
  const duration = grant.endTime - grant.startTime
  const progressPercentage = Math.round((elapsedTime / duration) * 100)
  const progressPercentageFormatted = `${progressPercentage}%`

  const vestedPercentage = Math.round(grant.vestedAmount.mul(10000).div(grant.amount).toNumber() / 100)
  const vestedPercentageFormatted = `${vestedPercentage}%`

  const cliffPercentage = Math.round(((grant.cliffTime - grant.startTime) / (grant.endTime - grant.startTime)) * 100)
  const cliffPercentageFormatted = `${cliffPercentage}%`

  const vestedStatus = () => {
    if (grant.isRevoked && grant.revokedTime < Date.now() / 1000) return "Revoked"
    if (vestedPercentage < 100) return "Vesting"
    return "Finished"
  }

  const beneficiaryLink = getAddressBlockExplorerLink(chainId, grant.beneficiary)

  const copyBeneficiaryToClipboard = () => navigator.clipboard.writeText(grant.beneficiary)

  return (
    <tr className="border-t">
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        <div className="flex gap-1 group">
          {shortAddress(grant.beneficiary)}
          <a className="invisible group-hover:visible hover:cursor-pointer text-gray-500 hover:text-gray-900" href={beneficiaryLink} alt="Block Explorer Link" target="_blank" rel="noreferrer">
            <LinkIcon className="h-4" />
          </a>
          <span className="invisible group-hover:visible hover:cursor-pointer text-gray-500 hover:text-gray-900" onClick={copyBeneficiaryToClipboard}>
            <ClipboardIcon className="h-4" />
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        {vestedStatus()}
      </td>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        {formatToken(grant.amount, {shorten: true})}
      </td>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        {formatToken(grant.vestedAmount, {shorten: true})} ({vestedPercentageFormatted})
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <ProgressBar
          percentage={progressPercentageFormatted}
          thresholdPercentage={cliffPercentageFormatted}
          cancelled={grant.isRevoked}
        />
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 py-1.5">
            <Moment unix format="MMM YYYY">{grant.startTime}</Moment>
          </span>
          <span className="text-sm text-gray-500 py-1.5">
            <Moment unix format="MMM YYYY">{grant.endTime}</Moment>
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {grant.revokedTime && (
          <Moment format="YYYY-MM-DD" unix date={grant.revokedTime} />
        )}
      </td>
    </tr>
  )
}

const LoadingGrantRow = () => (
  <tr className="border-t">
    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
      <div className="w-32 bg-gray-300 rounded-md animate-pulse text-sm">&nbsp;</div>
    </td>
    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
      <div className="w-12 bg-gray-300 rounded-md animate-pulse text-sm">&nbsp;</div>
    </td>
    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
      <div className="w-12 bg-gray-300 rounded-md animate-pulse text-sm">&nbsp;</div>
    </td>
    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
      <div className="w-16 bg-gray-300 rounded-md animate-pulse text-sm">&nbsp;</div>
    </td>
    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
      <div className="w-12 bg-gray-300 rounded-md animate-pulse text-sm">&nbsp;</div>
    </td>
    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
      <div className="w-12 bg-gray-300 rounded-md animate-pulse text-sm">&nbsp;</div>
    </td>
    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
      <div className="w-12 bg-gray-300 rounded-md animate-pulse text-sm">&nbsp;</div>
    </td>
    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
      <div className="w-12 bg-gray-300 rounded-md animate-pulse text-sm">&nbsp;</div>
    </td>
  </tr>
)

const VestingTable = ({ grants, chainId, isLoading }) => {
  return (
    <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Stakeholder
                </th>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Status
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Allocation
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Vested Amount
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Progress
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Revoked
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {grants.map((grant, idx) => <GrantRow key={idx} grant={grant} chainId={chainId} />)}
              {isLoading && <LoadingGrantRow />}
            </tbody>
          </table>
        </div>
      </div>
    </div >
  )
}

export default VestingTable