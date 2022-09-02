import VestingInsights from "@/components/VestingInsights"
import VestingTable from "@/components/VestingTable"
import { getVestingData as getRequestVestingData } from "@/lib/indexer/RequestNetwork"
import { getVestingData as getZoraclesVestingData } from "@/lib/indexer/Zoracles"
import { getVestingData as getCurveVestingData } from "@/lib/indexer/Curve"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { BigNumber } from "ethers"

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
    <div className="px-4 sm:px-6 lg:px-8">
      <h1 className="text-xl font-semibold text-gray-900">{contractType} - {contractAddress}</h1>
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

const Home = () => {
  const { query } = useRouter()
  const { contractType, contractAddress } = query

  if (!contractAddress || !contractType) {
    return (
      <ul>
        <li><Link href="/?contractType=request&contractAddress=0x45E6fF0885ebf5d616e460d14855455D92d6CC04">Request Network</Link></li>
        <li><Link href="/?contractType=zoracles&contractAddress=0x2369921551f2417d8d5cD4C1EDb1ac7eEe156380">Zoracles</Link></li>
        <li><Link href="/?contractType=curve&contractAddress=0x2a7d59e327759acd5d11a8fb652bf4072d28ac04">Curve</Link></li>
      </ul>
    )
  }

  return <VestingDashboard contractType={contractType} contractAddress={contractAddress} chainId={1} />
}

export default Home