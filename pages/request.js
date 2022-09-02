import VestingInsights from "@/components/VestingInsights"
import VestingTable from "@/components/VestingTable"
import { REQUEST_VESTING_CONTRACT } from "@/lib/constants"
import { getVestingData } from "@/lib/indexer/RequestNetwork"
import { BigNumber } from "ethers"
import { useEffect, useState } from "react"

const RequestVestingPage = () => {
  const [vestingData, setVestingData] = useState()

  useEffect(() => {
    const retrieveVestingData = async () => {
      const vestingData = await getVestingData(1, REQUEST_VESTING_CONTRACT)
      setVestingData(vestingData)
    }
    retrieveVestingData()
  }, [])

  if (!vestingData) return <>Loading</>

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <h1 className="text-xl font-semibold text-gray-900">Request Network Vesting Contract</h1>
      {Object.keys(vestingData.tokens).map(tokenAddress => (
        <>
          <VestingInsights
            totalAllocated={vestingData.totalAllocatedAmounts?.[tokenAddress] || BigNumber.from(0)}
            totalWithdrawn={vestingData.totalWithdrawnAmounts?.[tokenAddress] || BigNumber.from(0)}
            totalVested={vestingData.totalVestedAmounts?.[tokenAddress] || BigNumber.from(0)}
            tokenAddress={tokenAddress}
            tokens={vestingData.tokens} />
          <VestingTable grants={vestingData.grants} tokens={vestingData.tokens} />
        </>
      ))}
    </div>
  )
}

export default RequestVestingPage