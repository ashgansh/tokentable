import VestingInsights from "@/components/VestingInsights"
import VestingTable from "@/components/VestingTable"
import { getVestingData as getRequestVestingData } from "@/lib/indexer/RequestNetwork"
import { getVestingData as getZoraclesVestingData } from "@/lib/indexer/Zoracles"
import { getVestingData as getCurveVestingData } from "@/lib/indexer/Curve"
import Link from "next/link"
import { useRouter } from "next/router"
import { Fragment, useEffect, useState } from "react"
import { BigNumber } from "ethers"
import { LayoutWrapper } from "@/components/LayoutWrapper"
import { getVestingData } from "@/lib/vesting"

const VestingDashboard = ({ contractType, contractAddress, chainId }) => {
  const [vestingData, setVestingData] = useState(null)

  useEffect(() => {
    if (!contractType || !contractAddress || !chainId) return

    const retrieveVestingData = async () => {
      const vestingData = await getVestingData(contractType, chainId, contractAddress)
      setVestingData(vestingData)
    }

    retrieveVestingData()
  }, [contractType, contractAddress, chainId])

  if (!vestingData) return <>Loading</>

  return (
    <>
      {Object.keys(vestingData.tokens).map(tokenAddress => (
        <Fragment key={tokenAddress}>
          <VestingInsights
            totalAllocated={vestingData.totalAllocatedAmounts?.[tokenAddress] || BigNumber.from(0)}
            totalWithdrawn={vestingData.totalWithdrawnAmounts?.[tokenAddress] || BigNumber.from(0)}
            totalVested={vestingData.totalVestedAmounts?.[tokenAddress] || BigNumber.from(0)}
            tokenAddress={tokenAddress}
            tokens={vestingData.tokens} />
          <VestingTable grants={vestingData.grants} tokens={vestingData.tokens} />
        </Fragment>
      ))}
    </>
  )
}

const Vesting = () => {
  const { query } = useRouter()
  const { contractType, contractAddress, chainId } = query

  return (
    <LayoutWrapper>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">{contractType}</h1>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <VestingDashboard contractType={contractType} contractAddress={contractAddress} chainId={Number(chainId)} />
      </div>
    </LayoutWrapper>
  )
}

export default Vesting