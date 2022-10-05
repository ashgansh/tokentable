import { useTokenFormatter, useTokenPrice } from "@/lib/tokens"
import { formatCurrency } from "@/lib/utils"

const VestingInsights = ({ totalAllocated, totalWithdrawn, totalVested, tokenAddress, chainId, isLoading }) => {
  const formatToken = useTokenFormatter(chainId, tokenAddress)
  const tokenPrice = useTokenPrice(chainId, tokenAddress)

  const getUSDValue = (amount) => {
    if (!tokenPrice) return

    const formattedAmount = +(formatToken(amount, { symbol: null, commify: false }))
    return formatCurrency(tokenPrice * formattedAmount, 'USD', { shorten: true })
  }

  const stats = [
    {
      name: "Tokens Allocated",
      stat: formatToken(totalAllocated, { shorten: true }),
      percentage: null,
      amount: totalAllocated
    },
    {
      name: "Tokens Vested",
      stat: formatToken(totalVested, { shorten: true }),
      percentage: totalAllocated > 0 ? totalVested.mul(10000).div(totalAllocated).toNumber() / 100 : null,
      amount: totalVested
    },
    {
      name: "Tokens Withdrawn",
      stat: formatToken(totalWithdrawn, { shorten: true }),
      percentage: totalAllocated > 0 ? totalWithdrawn.mul(10000).div(totalAllocated).toNumber() / 100 : null,
      amount: totalWithdrawn
    }
  ]

  return (
    <div>
      <dl className="grid grid-cols-1 divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow md:grid-cols-3 md:divide-y-0 md:divide-x">
        {stats.map((item) => (
          <div key={item.name} className="px-4 py-5 sm:p-6">
            <dt className="text-base font-normal text-gray-900">{item.name}</dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              {isLoading ? (
                <div className="w-36 bg-gray-300 rounded-md animate-pulse text-2xl font-semibold items-baseline">&nbsp;</div>
              ) : (
                <div className="flex items-baseline text-2xl font-semibold text-tokenops-primary-700">
                  {item.stat}
                  {item.percentage !== null && <span className="ml-2 text-sm font-medium text-gray-500">{item.percentage}%</span>}
                </div>
              )}
            </dd>
            <div className="inline-flex items-baseline py-0.5 text-sm font-medium md:mt-2 lg:mt-0">
              {getUSDValue(item.amount)}
            </div>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default VestingInsights