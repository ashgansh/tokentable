import { ERC20_SYMBOLS, REQUEST_VESTING_ABI, REQUEST_VESTING_CONTRACT } from "@/lib/constants"
import { Contract, providers } from "ethers"
import { formatEther } from "ethers/lib/utils"
import { useEffect, useState } from "react"

const provider = new providers.AlchemyProvider(1, "YEYRkmN24MyBT8cNXvEEL_LzrWHMBstJ")
const vestingContract = new Contract(REQUEST_VESTING_CONTRACT, REQUEST_VESTING_ABI, provider)

const getTokenSymbol = (tokenAddress) => ERC20_SYMBOLS?.[tokenAddress]

const VestingTable = ({ grants }) => {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <h1 className="text-xl font-semibold text-gray-900">Request Network Vesting Contract</h1>
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
                      % Vested
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
                <tbody className="divide-y divide-gray-200 bg-white">
                  {grants.map((grant, idx) => {
                    const formatter = new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: getTokenSymbol(grant.tokenAddress)
                    })
                    return (
                      <tr key={idx} className={grant.blockRevoked && "bg-red-100"}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {grant.vester}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatter.format(grant.amount)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"></td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{grant.start}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{grant.end}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{grant.cliff}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

}

export default function Home() {
  const [grants, setGrants] = useState([])
  useEffect(() => {
    const retrieveNewGrantEvents = async () => {
      const newGrants = await vestingContract.queryFilter("NewGrant")
      const revokedGrants = await vestingContract.queryFilter("GrantRevoked")
      const grants = newGrants.map(log => {
        const { token: tokenAddress, vester, granter } = log.args
        const blockRevoked = revokedGrants
          .filter(revokedGrant => (
            granter === revokedGrant.args?.granter &&
            vester === revokedGrant.args?.vester &&
            tokenAddress === revokedGrant.args?.token
          ))
          .shift()
          ?.blockNumber
        const grant = {
          granter,
          vester,
          tokenAddress,
          amount: formatEther(log.args?.vestedAmount),
          start: log.args?.startTime?.toNumber(),
          end: log.args?.endTime?.toNumber(),
          cliff: log.args?.cliffTime?.toNumber(),
          blockCreated: log.blockNumber,
          blockRevoked: blockRevoked
        }
        return grant
      })
      console.log(grants)
      setGrants(grants)
    }
    retrieveNewGrantEvents()
  }, [])

  return (
    <>
      <VestingTable grants={grants} />
    </>
  )
}
