import { useRouter } from "next/router"
import { useCallback, useEffect, useState } from "react"
import { BigNumber } from "ethers"

import { getVestingData } from "@/lib/vesting"
import { formatAddress, classNames } from "@/lib/utils"

import { LayoutWrapper } from "@/components/LayoutWrapper"
import VestingInsights from "@/components/VestingInsights"
import StreamsTable from "@/components/StreamsTable"

const VestingDashboard = ({ vestingData, isLoading }) => {
  return (
    <div className="flex flex-col gap-4 py-4">
      <div>
        <h2 className="text-lg py-2">Vesting overview</h2>
        {Object.keys(vestingData?.tokens || { 'dummyToken': 'ok' }).map(tokenAddress => (
          <VestingInsights
            key={tokenAddress}
            totalAllocated={vestingData?.totalAllocatedAmounts?.[tokenAddress] || BigNumber.from(0)}
            totalWithdrawn={vestingData?.totalWithdrawnAmounts?.[tokenAddress] || BigNumber.from(0)}
            totalVested={vestingData?.totalVestedAmounts?.[tokenAddress] || BigNumber.from(0)}
            chainId={vestingData?.chainId}
            tokenAddress={tokenAddress}
            isLoading={isLoading}
          />
        ))}
      </div>
      <div>
        <h2 className="text-lg py-2">Stakeholders</h2>
        <StreamsTable streams={vestingData?.grants || []} chainId={vestingData?.chainId} isLoading={isLoading} />
      </div>
    </div>
  )
}

const Superfluid = () => {
  const [vestingData, setVestingData] = useState(null)
  const [vestingMetaData, setVestingMetaData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const { query } = useRouter()

  const { senderAccount: senderAccountUnformatted, chainId: contractChainIdString } = query
  const contractChainId = Number(contractChainIdString)
  const senderAccount = formatAddress(senderAccountUnformatted)

  const retrieveVestingData = useCallback(() => {
    if (!senderAccount || !contractChainId) return

    const retrieveVestingData = async () => {
      setIsLoading(true)
      const vestingData = await getVestingData('superfluid', contractChainId, senderAccount)
      setVestingData(vestingData)
      setIsLoading(false)
    }

    retrieveVestingData()
  }, [senderAccount, contractChainId])

  useEffect(() => {
    retrieveVestingData()
  }, [retrieveVestingData])

  return (
    <LayoutWrapper>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <div className="flex justify-between w-full">
              {vestingMetaData?.companyName && (
                <h1 className="text-2xl font-semibold text-gray-800">{vestingMetaData?.companyName}</h1>
              )}
              {!vestingMetaData?.companyName && (
                <h1 className="text-gray-800">{vestingMetaData?.contractAddress}</h1>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <VestingDashboard vestingData={vestingData} isLoading={isLoading} />
      </div>
    </LayoutWrapper>
  )
}

export default Superfluid