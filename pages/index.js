import { REQUEST_VESTING_ABI, REQUEST_VESTING_CONTRACT } from "@/lib/constants"
import { Contract, providers } from "ethers"
import { formatEther } from "ethers/lib/utils"
import { useEffect } from "react"

const provider = new providers.AlchemyProvider(1, "YEYRkmN24MyBT8cNXvEEL_LzrWHMBstJ")
const vestingContract = new Contract(REQUEST_VESTING_CONTRACT, REQUEST_VESTING_ABI, provider)


export default function Home() {
  useEffect(() => {
    const retrieveNewGrantEvents = async () => {
      const newGrants = await vestingContract.queryFilter("NewGrant")
      const revokedGrants = await vestingContract.queryFilter("GrantRevoked")
      const grants = newGrants.map(log => {
        //const blockRevoked = revokedGrants
        //  .filter(revokedGrant => )
        const grant = {
          granter: log.args?.granter,
          vester: log.args?.vester,
          tokenAddress: log.args?.token,
          amount: formatEther(log.args?.vestedAmount),
          start: log.args?.startTime?.toNumber(),
          end: log.args?.endTime?.toNumber(),
          cliff: log.args?.cliffTime?.toNumber(),
          blockCreated: log.blockNumber,
          blockRevoked: null
        }
        return grant
      })
    console.log(grants)
    console.log(revokedGrants)
    }

    retrieveNewGrantEvents()
  }, [])
  return (
    <>
    </>
  )
}
