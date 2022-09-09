import { oldFormatToken } from "@/lib/utils"
import { Fragment } from "react"
import Moment from "react-moment"

const VestingTable = ({ grants, tokens }) => {
  const stakeholders = [... new Set(grants.map(grant => grant.beneficiary))]

  const tokenFormatter = (tokenAddress, amount) => {
    const { symbol, decimals } = tokens?.[tokenAddress] || { symbol: '', decimals: 18 }
    return oldFormatToken(symbol, decimals, amount)
  }

  const getPercentage = (numerator, denominator) => {
    const percentage = (numerator.mul(1000).div(denominator).toNumber() / 10).toFixed(2)
    return `${percentage}%`
  }

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
              {grants.map((grant, idx) => {
                return (
                  <tr key={idx} className="border-t">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {grant.beneficiary}
                    </td>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {tokenFormatter(grant.tokenAddress, grant.amount)}
                    </td>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {tokenFormatter(grant.tokenAddress, grant.vestedAmount)} ({getPercentage(grant.vestedAmount, grant.amount)})
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div >
  )
}

export default VestingTable