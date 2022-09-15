import { useTokenFormatter } from "@/lib/tokens"
import Moment from "react-moment"

const GrantRow = ({ grant }) => {
  const formatToken = useTokenFormatter(grant.tokenAddress)

  const now = Date.now() / 1000
  const nowOrVestingEnd = Math.min(now, grant.endTime)
  const startOrVestingStart = Math.min(now, grant.startTime)
  const vestingPercentage = Math.round(((nowOrVestingEnd - startOrVestingStart) / (grant.endTime - grant.startTime)) * 100)
  const vestingPercentageFormatted = `${vestingPercentage}%`

  return (
    <tr className="border-t">
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        {grant.beneficiary}
      </td>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        {formatToken(grant.amount)}
      </td>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        {formatToken(grant.vestedAmount)} ({vestingPercentageFormatted})
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <Moment format="YYYY-MM-DD" unix date={grant.startTime} />
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <Moment format="YYYY-MM-DD" unix date={grant.cliffTime} />
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <Moment format="YYYY-MM-DD" unix date={grant.endTime} />
      </td>
    </tr>
  )
}

const LoadingGrantRow = () => (
    <tr className="border-t">
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        <div className="w-56 bg-gray-300 rounded-md animate-pulse text-sm">&nbsp;</div>
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
    </tr>
)

const VestingTable = ({ grants, chainId, isLoading }) => {
  console.log(isLoading)
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
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Vested Amount
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Start
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Cliff
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  End
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