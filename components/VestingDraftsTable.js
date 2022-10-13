import { ClipboardIcon, LinkIcon } from "@heroicons/react/24/outline"

import { useTokenFormatter } from "@/lib/tokens"
import { shortAddress } from "@/lib/utils"
import { getAddressBlockExplorerLink } from "@/lib/provider"

const DraftRow = ({ draft, chainId }) => {
  const formatToken = useTokenFormatter(chainId, draft.tokenAddress)

  const beneficiaryLink = getAddressBlockExplorerLink(chainId, draft.beneficiary)
  const copyBeneficiaryToClipboard = () => navigator.clipboard.writeText(draft.beneficiary)

  return (
    <tr className="border-t">
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        <div className="flex gap-1 group">
          {shortAddress(draft.beneficiary)}
          <a className="invisible group-hover:visible hover:cursor-pointer text-gray-500 hover:text-gray-900" href={beneficiaryLink} alt="Block Explorer Link" target="_blank" rel="noreferrer">
            <LinkIcon className="h-4" />
          </a>
          <span className="invisible group-hover:visible hover:cursor-pointer text-gray-500 hover:text-gray-900" onClick={copyBeneficiaryToClipboard}>
            <ClipboardIcon className="h-4" />
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        {formatToken(draft.amount, {shorten: true})}
      </td>
    </tr>
  )
}

const VestingDraftsTable = ({ drafts, chainId }) => {
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
                  Allocation
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {drafts.map((draft, idx) => <DraftRow key={idx} draft={draft} chainId={chainId} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default VestingDraftsTable