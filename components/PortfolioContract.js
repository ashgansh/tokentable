import { classNames, shortAddress } from "@/lib/utils"
import Moment from "react-moment"

const PortfolioContract = ({ companyName, companyLogoURL, totalAllocatedAmount, totalVestedAmount, totalVestedPercentage, contractAddress, stakeholderCount }) => {
  const ItemTitle = ({ children, className }) => (
    <h4 className={classNames("text-sm text-bold text-gray-900 py-1.5", className)}>
      {children}
    </h4>
  )

  return (
    <div className="border border-gray-200 shadow rounded-lg px-4 py-4 px-6 overflow-scroll">
      <div className="grid grid-rows-1 grid-cols-[repeat(2,minmax(180px,1fr))_repeat(3,minmax(0,1fr))_60px] grid-flow-col gap-x-20 gap-y-4">
        <div className="">
          <ItemTitle>{companyName ? 'Company' : 'Contract'}</ItemTitle>
          <div className="flex justify-between">
            <span className="text-xl">{companyName || shortAddress(contractAddress, 8)}</span>
            { /* eslint-disable-next-line @next/next/no-img-element */}
            {companyLogoURL && <img src={companyLogoURL} alt="Company Logo" className="h-8 w-max" />}
          </div>
        </div>
        <div className="">
          {companyName && (
            <>
              <ItemTitle>Contract Address</ItemTitle>
              <div className="text-bold">{shortAddress(contractAddress, 8)}</div>
            </>
          )}
        </div>
        <div className="text-right">
          <ItemTitle>Total Allocated</ItemTitle>
          <div className="text-bold">{totalAllocatedAmount}</div>
        </div>
        <div className="">
          <ItemTitle>Total Vested</ItemTitle>
          <div className="text-bold">{totalVestedAmount}</div>
          <div className="text-gray-500 text-xs">{totalVestedPercentage}</div>
        </div>
        <div className="">
          <ItemTitle>Stakeholders</ItemTitle>
          <div className="text-bold">{stakeholderCount}</div>
        </div>
        <div>
          <ItemTitle>Chain</ItemTitle>
          <svg className="w-8 h-8 text-[#626890]" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="ethereum" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"></path></svg>
        </div>
      </div>
    </div>
  )
}

export default PortfolioContract