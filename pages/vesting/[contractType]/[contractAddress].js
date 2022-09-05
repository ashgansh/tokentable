import VestingInsights from "@/components/VestingInsights"
import VestingTable from "@/components/VestingTable"
import { getVestingData as getRequestVestingData } from "@/lib/indexer/RequestNetwork"
import { getVestingData as getZoraclesVestingData } from "@/lib/indexer/Zoracles"
import { getVestingData as getCurveVestingData } from "@/lib/indexer/Curve"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { BigNumber } from "ethers"
import { LayoutWrapper } from "@/components/LayoutWrapper"

const VestingDashboard = ({ contractType, contractAddress, chainId }) => {
  const [vestingData, setVestingData] = useState()

  useEffect(() => {
    if (!contractType || !contractAddress || !chainId) return

    const retrieveVestingData = async () => {
      if (contractType === 'request') {
        const vestingData = await getRequestVestingData(chainId, contractAddress)
        setVestingData(vestingData)
        return
      }
      if (contractType === 'zoracles') {
        const vestingData = await getZoraclesVestingData(chainId, contractAddress)
        setVestingData(vestingData)
        return
      }
      if (contractType === 'curve') {
        const vestingData = await getCurveVestingData(chainId, contractAddress)
        setVestingData(vestingData)
        return
      }
    }

    retrieveVestingData()
  }, [contractType, contractAddress, chainId])

  if (!vestingData) return <>Loading</>

  return (
    <>
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
    </>
  )
}

const Vesting = () => {
  const { query } = useRouter()
  const { contractType, contractAddress } = query

  return (
    <LayoutWrapper>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">{contractType}</h1>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <VestingDashboard contractType={contractType} contractAddress={contractAddress} chainId={1} />
      </div>
    </LayoutWrapper>
  )
}

export default Vesting