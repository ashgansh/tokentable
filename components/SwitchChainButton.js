import { useSwitchNetwork } from "wagmi"
import { PrimaryButton } from "./Button"
import Spinner from "./Spinner"

const SwitchChainButton = ({ chainId }) => {
  const { chains, isLoading, switchNetwork } = useSwitchNetwork()
  const chain = chains.find(chain => chain.id === chainId)

  return (
    <PrimaryButton onClick={() => switchNetwork(chainId)} className="max-w-fit">
      <span className="inline-flex items-center gap-1.5">
        {isLoading && <Spinner className="h-4" />}
        <span>Switch to {chain.name}</span>
      </span>
    </PrimaryButton>
  )
}

export default SwitchChainButton