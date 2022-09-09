import { useTokenFormatter } from "@/lib/tokens"
import { classNames } from "@/lib/utils"
import { formatEther } from "ethers/lib/utils"
import Image from "next/future/image"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import Moment from "react-moment"
import { useSigner } from "wagmi"
import { PrimaryButton } from "./Button"
import Spinner from "./Spinner"

const VestingPosition = ({ grant, chainId, releaseAndWithdraw, getReleasableAmount }) => {
  const [isClaiming, setIsClaiming] = useState(false)
  const [releasableAmount, setReleasableAmount] = useState()
  const { data: signer } = useSigner()
  const { scheduleId, tokenAddress, endTime, startTime } = grant
  const formatToken = useTokenFormatter(chainId, tokenAddress)

  useEffect(() => {
    if (!scheduleId) return
    if (!getReleasableAmount) return

    const retrieveReleasableAmount = async () => {
      const releasableAmount = await getReleasableAmount(scheduleId)
      setReleasableAmount(releasableAmount)
    }

    retrieveReleasableAmount()
  }, [scheduleId, getReleasableAmount])

  const ItemTitle = ({ children, className }) => (
    <h4 className={classNames("text-sm text-bold text-gray-900 py-1", className)}>
      {children}
    </h4>
  )

  const now = Date.now() / 1000
  const nowOrVestingEnd = Math.min(now, endTime)
  const vestingPercentage = Math.round(((nowOrVestingEnd - startTime) / (endTime - startTime)) * 100)
  const vestingPercentageFormatted = `${vestingPercentage}%`

  const handleReleaseAndWithdraw = async () => {
    setIsClaiming(true)
    const toastId = toast.loading("Sign transaction to claim your tokens")
    try {
      const tx = await releaseAndWithdraw(signer, scheduleId)
      toast.loading(`Claiming your tokens...`, { id: toastId })
      await tx.wait()
      toast.success("Successfully claimed your tokens", { id: toastId })
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
    <div className="border border-gray-200 shadow rounded-lg px-4 py-4 px-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <div className="flex flex-col">
            <ItemTitle>Claimable</ItemTitle>
            <div className="flex gap-4">
              <span className="text-lg">{releasableAmount && formatToken(releasableAmount)}</span>
              {releasableAmount && releasableAmount.gt(0) && releaseAndWithdraw && (
                <PrimaryButton className="text-xs py-1.5 px-2" onClick={handleReleaseAndWithdraw} disabled={isClaiming}>
                  <span className="inline-flex items-center gap-1.5">
                    {isClaiming && <Spinner className="h-4 w-4" />}
                    {isClaiming && <span>Claiming</span>}
                    {!isClaiming && <span>Claim</span>}
                  </span>
                </PrimaryButton>
              )}
            </div>
          </div>
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
    </div >
  )
}

export default VestingPosition