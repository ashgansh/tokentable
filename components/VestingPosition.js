import { useCallback, useEffect, useState } from "react"
import { useNetwork, useSigner } from "wagmi"
import { BigNumber } from "ethers"
import toast from "react-hot-toast"
import Moment from "react-moment"

import { useTokenDetails, useTokenFormatter, useTokenPrice } from "@/lib/tokens"
import { classNames, formatCurrency, record } from "@/lib/utils"
import { PrimaryButton } from "@/components/Button"
import Spinner from "@/components/Spinner"
import SwitchChainButton from "./SwitchChainButton"

const getGrantStatus = (grant) => {
  const now = Date.now() / 1000

  if (grant.isRevoked) return "revoked"
  if (grant.endTime > now) return "vesting"

  return "vested"
}

const VestingPosition = ({ grant, chainId, releaseAndWithdraw, getReleasableAmount }) => {
  const [isClaiming, setIsClaiming] = useState(false)
  const [releasableAmount, setReleasableAmount] = useState()
  const { data: signer } = useSigner()
  const { chain } = useNetwork()
  const { id, tokenAddress, endTime, startTime } = grant
  const formatToken = useTokenFormatter(chainId, tokenAddress)
  const tokenPrice = useTokenPrice(chainId, tokenAddress)
  const { decimals: tokenDecimals } = useTokenDetails(chainId, tokenAddress)

  const getUSDValue = (amount) => {
    if (!tokenPrice) return
    if (!amount) return

    const formattedAmount = +(formatToken(amount, { symbol: null, commify: false }))
    return formatCurrency(tokenPrice * formattedAmount, 'USD', { shorten: true })
  }

  const isDust = (amount, decimals, digits) =>
    amount.lt(BigNumber.from(10).pow(decimals - digits))

  const now = Date.now() / 1000
  const nowOrVestingEnd = Math.min(now, endTime)
  const vestingPercentage = Math.round(((nowOrVestingEnd - startTime) / (endTime - startTime)) * 100)
  const vestingPercentageFormatted = `${vestingPercentage}%`
  const grantStatus = getGrantStatus(grant)

  const currentChainId = chain?.id
  const isConnectedWithCorrectChain = currentChainId === chainId

  // Don't allow claiming dust (except if the grant has ended)
  const hasAmountToRelease = releasableAmount && releasableAmount.gt(0)
  const hasGrantEnded = grant?.endTime < now || grant?.isRevoked
  const canClaim = releaseAndWithdraw && hasAmountToRelease && tokenDecimals &&
    (!isDust(releasableAmount, tokenDecimals, 2) || hasGrantEnded)

  const retrieveReleasableAmount = useCallback(() => {
    if (!id) return
    if (!getReleasableAmount) return

    const retrieveReleasableAmount = async () => {
      const releasableAmount = await getReleasableAmount(id)
      setReleasableAmount(releasableAmount)
    }

    retrieveReleasableAmount()
  }, [id, getReleasableAmount])

  const handleRefreshReleasableAmount = () => {
    setReleasableAmount(null)
    retrieveReleasableAmount()
  }

  useEffect(() => {
    retrieveReleasableAmount()
  }, [retrieveReleasableAmount])

  const ItemTitle = ({ children, className }) => (
    <h4 className={classNames("text-sm text-bold text-gray-900 py-1", className)}>
      {children}
    </h4>
  )

  const handleReleaseAndWithdraw = async () => {
    setIsClaiming(true)
    const toastId = toast.loading("Sign transaction to claim your tokens")
    try {
      const tx = await releaseAndWithdraw(signer, id)
      toast.loading(`Claiming your tokens...`, { id: toastId })
      await tx.wait()
      toast.success("Successfully claimed your tokens", { id: toastId })
      record('vestingClaimed', { message: "Some vested amount was claimed" })
      handleRefreshReleasableAmount()
    } catch (e) {
      console.error(e)

      // User didn't sign transaction
      if (e?.code === 4001 || e?.code === "ACTION_REJECTED") {
        toast.dismiss(toastId)
        setIsClaiming(false)
        return
      }

      // Display error message
      const message = e?.data?.message || e?.error?.message || e.message;
      toast.error("Something went wrong claiming your tokens", { id: toastId })
      toast.error(message)
    }
    setIsClaiming(false)
  }

  return (
    <div className="border border-gray-200 shadow rounded-lg px-4 py-4 px-6 bg-white">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <div className="flex flex-col">
            <ItemTitle>Claimable</ItemTitle>
            <span className="text-lg">{releasableAmount && formatToken(releasableAmount)}</span>
            <span className="text-sm text-gray-500">{getUSDValue(releasableAmount)}</span>
          </div>
          <div>
            {canClaim && isConnectedWithCorrectChain && (
              <PrimaryButton onClick={handleReleaseAndWithdraw} disabled={isClaiming}>
                <span className="inline-flex items-center gap-1.5">
                  {isClaiming && <Spinner className="h-4 w-4" />}
                  {isClaiming && <span>Claiming</span>}
                  {!isClaiming && <span>Claim</span>}
                </span>
              </PrimaryButton>
            )}
            {canClaim && !isConnectedWithCorrectChain && (
              <SwitchChainButton chainId={chainId} />
            )}
          </div>
        </div>
        <div>
          <ItemTitle>Status</ItemTitle>
          <span className="text-lg">
            {grantStatus === "vesting" && "Vesting"}
            {grantStatus === "revoked" && "Revoked"}
            {grantStatus === "vested" && "Fully Vested"}
          </span>
        </div>
        <div className="flex flex-col">
          <ItemTitle>Allocation</ItemTitle>
          <span className="text-lg">{grant?.amount && formatToken(grant.amount, { shorten: true })}</span>
          <span className="text-sm text-gray-500">{grant?.amount && getUSDValue(grant.amount)}</span>
        </div>
        <div className="w-48">
          <div className="flex justify-between items-center">
            <ItemTitle>Vested</ItemTitle>
            <span className="text-sm text-gray-500 py-2.5">{vestingPercentageFormatted}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: vestingPercentageFormatted }}></div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 py-1.5">
              <Moment unix format="MMM YYYY">{startTime}</Moment>
            </span>
            <span className="text-sm text-gray-500 py-1.5">
              <Moment unix format="MMM YYYY">{endTime}</Moment>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VestingPosition