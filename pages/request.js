import { REQUEST_VESTING_CONTRACT } from "@/lib/constants"
import { getVestingData } from "@/lib/indexer/RequestNetwork"
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
    </div>
  )
}

export default RequestVestingPage