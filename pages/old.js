import { ERC20_REQ, ERC20_SYMBOLS, REQUEST_VESTING_ABI, REQUEST_VESTING_CONTRACT } from "@/lib/constants"
import { BigNumber, Contract, ethers, providers } from "ethers"
import { commify, formatEther } from "ethers/lib/utils"
import { useEffect, useState } from "react"
import Moment from "react-moment"

const provider = new providers.AlchemyProvider(1, "YEYRkmN24MyBT8cNXvEEL_LzrWHMBstJ")
const vestingContract = new Contract(REQUEST_VESTING_CONTRACT, REQUEST_VESTING_ABI, provider)

const getTokenSymbol = (tokenAddress) => ERC20_SYMBOLS?.[tokenAddress] || "XXX"

const VestingStats = ({ totalDeposits, totalWithdrawals, totalVested }) => {
  const stats = [
    {
      name: "Tokens in Vesting Contract",
      stat: `${commify(Math.round(formatEther(totalDeposits)))} REQ`
    },
    {
      name: "Tokens Withdrawn",
      stat: `${commify(Math.round(formatEther(totalWithdrawals)))} REQ`,
      percentage: totalWithdrawals.mul(10000).div(totalDeposits).toNumber() / 100
    },
    {
      name: "Tokens Vested",
      stat: `${commify(Math.round(formatEther(totalVested)))} REQ`,
      percentage: totalVested.mul(10000).div(totalDeposits).toNumber() / 100
    }
  ]

  return (
    <div>
      <dl className="mt-5 grid grid-cols-1 divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow md:grid-cols-3 md:divide-y-0 md:divide-x">
        {stats.map((item) => (
          <div key={item.name} className="px-4 py-5 sm:p-6">
            <dt className="text-base font-normal text-gray-900">{item.name}</dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div className="flex items-baseline text-2xl font-semibold text-indigo-600">
                {item.stat}
                {item.percentage && <span className="ml-2 text-sm font-medium text-gray-500">{item.percentage}%</span>}
              </div>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

const VestingTable = ({ grants, withdrawals }) => {
  return (
    <div className="mt-8 flex flex-col">
      <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Stakeholder
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Allocation
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Withdrawn
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Vested
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Start
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Cliff
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    End (Revoked)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {grants.map((grant, idx) => {
                  const formatter = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: getTokenSymbol(grant.tokenAddress)
                  })
                  const totalStakeholderWithdrawn = withdrawals
                    .filter(withdrawal => (
                      grant.vester === withdrawal.vester &&
                      grant.tokenAddress === withdrawal.tokenAddress
                    ))
                    .reduce((prev, current) => prev.add(current.amount), BigNumber.from(0))
                  const withdrawn = totalStakeholderWithdrawn.gt(grant.amount) ? grant.amount : totalStakeholderWithdrawn
                  const withdrawnFormatted = formatEther(withdrawn)

                  return (
                    <tr key={idx} className={grant.revokedTimestamp && "bg-red-100"}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {grant.vester}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatter.format(grant.amountFormatted)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatter.format(withdrawnFormatted)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {grant.vestedPercentageFormatted}%
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <Moment format="YYYY-MM-DD" unix date={grant.start} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <Moment format="YYYY-MM-DD" unix date={grant.cliff} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <Moment format="YYYY-MM-DD" unix date={grant.end} />
                        {grant.revokedTimestamp && (
                          <span className="pl-2">
                            (<Moment format="YYYY-MM-DD" unix date={grant.revokedTimestamp} />)
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )

}

export default function Home() {
  const [grants, setGrants] = useState([])
  const [totalDeposits, setTotalDeposits] = useState()
  const [totalWithdrawals, setTotalWithdrawals] = useState()
  const [withdrawals, setWithdrawals] = useState([])

  const reqTotalDeposits = totalDeposits?.[ERC20_REQ]
  const reqTotalWithdrawals = totalWithdrawals?.[ERC20_REQ]
  const reqTotalVested = grants.reduce((prev, current) => {
    const precision = 10000
    const vestedAmount = current.amount.div(precision).mul(BigNumber.from(Math.round(current.vestedPercentage * precision)))
    return prev.add(vestedAmount)
  }, BigNumber.from(0))

  useEffect(() => {
    const retrieveNewGrantEvents = async () => {
      const newGrants = await vestingContract.queryFilter("NewGrant")
      const revokedGrants = await vestingContract.queryFilter("GrantRevoked")
      const grants = await Promise.all(newGrants.map(async log => {
        const { token: tokenAddress, vester, granter, startTime: start, endTime: end } = log.args
        const revokedBlock = revokedGrants
          .filter(revokedGrant => (
            granter === revokedGrant.args?.granter &&
            vester === revokedGrant.args?.vester &&
            tokenAddress === revokedGrant.args?.token
          ))
          .shift()
          ?.blockNumber
        const revokedTimestamp = revokedBlock && (await provider.getBlock(revokedBlock)).timestamp
        const today = Date.now() / 1000
        const revokedTimestampOrToday = revokedTimestamp || today
        const duration = end - start
        const vestedPercentage = Math.min((revokedTimestampOrToday - start) / duration, 1)
        const vestedPercentageFormatted = (Math.round(vestedPercentage * 10000) / 100).toFixed(2)
        const grant = {
          granter,
          vester,
          tokenAddress,
          amount: log.args?.vestedAmount,
          amountFormatted: formatEther(log.args?.vestedAmount),
          start: log.args?.startTime?.toNumber(),
          end: log.args?.endTime?.toNumber(),
          cliff: log.args?.cliffTime?.toNumber(),
          createdBlock: log.blockNumber,
          revokedBlock,
          revokedTimestamp,
          vestedPercentage,
          vestedPercentageFormatted
        }
        return grant
      }))
      setGrants(grants)
    }

    const retrieveDeposits = async () => {
      const depositEvents = await vestingContract.queryFilter("Deposit")
      const deposits = depositEvents.map(deposit => ({
        tokenAddress: deposit.args?.token,
        granter: deposit.args?.granter,
        amount: deposit.args?.amount
      }))

      const totals = deposits.reduce((prev, current) => {
        const prevAmount = prev?.[current.tokenAddress] || BigNumber.from(0)
        const newAmount = prevAmount.add(current.amount)
        return {
          ...prev,
          [current.tokenAddress]: newAmount
        }
      }, {})
      setTotalDeposits(totals)
    }

    const retrieveWithdrawals = async () => {
      const withdrawalEvents = await vestingContract.queryFilter("Withdraw")
      const withdrawals = withdrawalEvents.map(withdrawal => ({
        tokenAddress: withdrawal.args?.token,
        vester: withdrawal.args?.user,
        amount: withdrawal.args?.amount
      }))
      setWithdrawals(withdrawals)
      const totals = withdrawals.reduce((prev, current) => {
        const prevAmount = prev?.[current.tokenAddress] || BigNumber.from(0)
        const newAmount = prevAmount.add(current.amount)
        return {
          ...prev,
          [current.tokenAddress]: newAmount
        }
      }, {})
      setTotalWithdrawals(totals)
    }

    retrieveNewGrantEvents()
    retrieveDeposits()
    retrieveWithdrawals()
  }, [])

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <h1 className="text-xl font-semibold text-gray-900">Request Network Vesting Contract</h1>
      {reqTotalDeposits && reqTotalWithdrawals && reqTotalVested && (
        <VestingStats totalDeposits={reqTotalDeposits} totalWithdrawals={reqTotalWithdrawals} totalVested={reqTotalVested} />
      )}
      <VestingTable grants={grants.sort((a, b) => a.startTime - b.startTime)} withdrawals={withdrawals} />
    </div>
  )
}  
