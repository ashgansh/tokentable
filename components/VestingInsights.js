import { formatToken } from "@/lib/utils"

const VestingInsights = ({ totalAllocated, totalWithdrawn, totalVested, tokenAddress, tokens }) => {
  const tokenFormatter = (tokenAddress, amount) => {
    const { symbol, decimals } = tokens?.[tokenAddress] || { symbol: '', decimals: 18 }
    return formatToken(symbol, decimals, amount)
  }

  const stats = [
    {
      name: "Tokens Allocated",
      stat: tokenFormatter(tokenAddress, totalAllocated)
    },
    {
      name: "Tokens Withdrawn",
      stat: tokenFormatter(tokenAddress, totalWithdrawn),
      percentage: totalAllocated > 0 ? totalWithdrawn.mul(10000).div(totalAllocated).toNumber() / 100 : null
    },
    {
      name: "Tokens Vested",
      stat: tokenFormatter(tokenAddress, totalVested),
      percentage: totalAllocated > 0 ? totalVested.mul(10000).div(totalAllocated).toNumber() / 100 : null
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

export default VestingInsights