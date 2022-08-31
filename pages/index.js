import { REQUEST_VESTING_ABI, REQUEST_VESTING_CONTRACT } from "@/lib/constants"
import { Contract, providers } from "ethers"
import { formatEther } from "ethers/lib/utils"
import { useEffect, useState } from "react"

const provider = new providers.AlchemyProvider(1, "YEYRkmN24MyBT8cNXvEEL_LzrWHMBstJ")
const vestingContract = new Contract(REQUEST_VESTING_CONTRACT, REQUEST_VESTING_ABI, provider)


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

    </>
  )
}
