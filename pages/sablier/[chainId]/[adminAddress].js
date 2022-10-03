import { SABLIER_CONTRACT_ADDRESSES } from "@/lib/contracts/Sablier"
import { useRouter } from "next/router"
import { Vesting } from "pages/vesting/[chainId]/[contractAddress]"

const VestingPage = () => {
  const { query } = useRouter()
  const { adminAddress, chainId } = query

  const contractAddress = SABLIER_CONTRACT_ADDRESSES[chainId]

  return <Vesting contractAddress={contractAddress} chainId={chainId} filters={{ admin: adminAddress }} />
}

export default VestingPage