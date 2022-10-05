import { useRouter } from "next/router"
import { useCallback, useEffect, useState } from "react"

import { formatAddress, classNames } from "@/lib/utils"

import { LayoutWrapper } from "@/components/LayoutWrapper"
import StreamsTable from "@/components/StreamsTable"
import { Framework } from "@superfluid-finance/sdk-core"
import { getProvider } from "@/lib/provider"
import { tokenStore } from "@/lib/tokens"

const VestingDashboard = ({ vestingData, isLoading }) => {
  return (
    <div className="flex flex-col gap-4 py-4">
      <div>
        <h2 className="text-lg py-2">Streams</h2>
        <StreamsTable streams={vestingData?.streams || []} chainId={vestingData?.chainId} isLoading={isLoading} />
      </div>
    </div>
  )
}

const Superfluid = () => {
  const [vestingData, setVestingData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const { query } = useRouter()
  const addToken = tokenStore(state => state.addToken)

  const { senderAccount: senderAccountUnformatted, chainId: contractChainIdString } = query
  const contractChainId = Number(contractChainIdString)
  const senderAccount = formatAddress(senderAccountUnformatted)

  const retrieveVestingData = useCallback(() => {
    if (!senderAccount || contractChainId === NaN) return

    const retrieveVestingData = async () => {
      setIsLoading(true)
      const provider = getProvider(contractChainId)
      const superfluid = await Framework.create({
        chainId: contractChainId,
        provider
      })

      const { data: streams } = await superfluid.query.listStreams({ sender: senderAccount });
      const tokenAddresses = Array.from(new Set(streams.map(stream => stream.token.id)))
      tokenAddresses.forEach(tokenAddress => addToken(contractChainId, tokenAddress))
      const vestingData = { streams, chainId: contractChainId, tokenAddresses }
      setVestingData(vestingData)
      setIsLoading(false)
    }

    retrieveVestingData()
  }, [senderAccount, contractChainId, addToken])

  useEffect(() => {
    retrieveVestingData()
  }, [retrieveVestingData])

  return (
    <LayoutWrapper>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <div className="flex justify-between w-full">
              <h1 className="text-gray-800">{senderAccount}</h1>
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