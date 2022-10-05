import Moment from "react-moment"

import { ClipboardIcon, LinkIcon } from "@heroicons/react/24/outline"

import { useTokenFormatter } from "@/lib/tokens"
import { shortAddress } from "@/lib/utils"
import { getAddressBlockExplorerLink } from "@/lib/provider"
import { BigNumber } from "ethers"

const StreamRow = ({ stream, chainId }) => {
  const formatToken = useTokenFormatter(chainId, stream.token.id)
  const beneficiaryLink = getAddressBlockExplorerLink(chainId, stream.receiver)
  const copyBeneficiaryToClipboard = () => navigator.clipboard.writeText(stream.receiver)

  const streamedAmount = (stream) => {
    const lastKnownStreamedAmount = BigNumber.from(stream.streamedUntilUpdatedAt)

    if (stream.currentFlowRate === "0") return lastKnownStreamedAmount

    const currentFlowTimestamp = Math.max(Number(stream.createdAtTimestamp), Number(stream.updatedAtTimestamp))
    const currentFlowRate = BigNumber.from(stream.currentFlowRate)

    const now = Date.now() / 1000
    const timeElapsedInCurrentFlow = Math.round(now - currentFlowTimestamp)
    const streamedAmountInCurrentFlow = currentFlowRate.mul(timeElapsedInCurrentFlow)
  
    return lastKnownStreamedAmount.add(streamedAmountInCurrentFlow)
  }

  return (
    <tr className="border-t">
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        <div className="flex gap-1 group">
          {shortAddress(stream.receiver)}
          <a className="invisible group-hover:visible hover:cursor-pointer text-gray-500 hover:text-gray-900" href={beneficiaryLink} alt="Block Explorer Link" target="_blank" rel="noreferrer">
            <LinkIcon className="h-4" />
          </a>
          <span className="invisible group-hover:visible hover:cursor-pointer text-gray-500 hover:text-gray-900" onClick={copyBeneficiaryToClipboard}>
            <ClipboardIcon className="h-4" />
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        {formatToken(streamedAmount(stream))}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <Moment format="YYYY-MM-DD" unix date={stream.createdAtTimestamp} />
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <Moment format="YYYY-MM-DD" unix date={stream.updatedAtTimestamp} />
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
      <div className="w-16 bg-gray-300 rounded-md animate-pulse text-sm">&nbsp;</div>
    </td>
    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
      <div className="w-16 bg-gray-300 rounded-md animate-pulse text-sm">&nbsp;</div>
    </td>
    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
      <div className="w-16 bg-gray-300 rounded-md animate-pulse text-sm">&nbsp;</div>
    </td>
  </tr>
)

const VestingTable = ({ streams, chainId, isLoading }) => {
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
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Vested Amount
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Start
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {streams.map((stream, idx) => <StreamRow key={idx} stream={stream} chainId={chainId} />)}
              {isLoading && <LoadingGrantRow />}
            </tbody>
          </table>
        </div>
      </div>
    </div >
  )
}

export default VestingTable