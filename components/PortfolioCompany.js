import Image from "next/future/image"
import Moment from "react-moment"

const PortfolioCompany = ({ companyName, companyLogo, vestingStartTime, vestingEndTime, vestingCliffTime, allocationUSD, allocationToken, marketCapCurrent, marketCapTGE, circulatingSupply }) => {
  const ItemTitle = ({ children }) => <h4 className="text-sm text-bold text-gray-900 py-2.5">{children}</h4>

  const now = Date.now() / 1000
  const nowOrVestingEnd = Math.min(now, vestingEndTime)
  const vestingPercentage = Math.round(((nowOrVestingEnd - vestingStartTime) / (vestingEndTime - vestingStartTime)) * 100)
  const vestingPercentageFormatted = `${vestingPercentage}%`

  return (
    <div className="border border-gray-200 shadow rounded-lg px-4 py-4 px-6">
      <div className="grid grid-rows-2 grid-cols-[200px_repeat(3,minmax(0,1fr))] grid-flow-col gap-x-20 gap-y-4">
        <div className="">
          <ItemTitle>Company</ItemTitle>
          <div className="flex justify-between">
            <span className="text-xl">{companyName}</span>
            <Image src={companyLogo} alt="Company Logo" className="h-8 w-max" />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center">
            <ItemTitle>Vested</ItemTitle>
            <span className="text-sm text-gray-500 py-2.5">{vestingPercentageFormatted}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: vestingPercentageFormatted }}></div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 py-1.5">
              <Moment unix format="MMM YYYY">{vestingStartTime}</Moment>
            </span>
            <span className="text-sm text-gray-500 py-1.5">
              <Moment unix format="MMM YYYY">{vestingEndTime}</Moment>
            </span>
          </div>
        </div>
        <div>
          <ItemTitle>Chain</ItemTitle>
          <svg className="w-8 h-8 text-[#626890]" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="ethereum" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"></path></svg>
        </div>
        <div>
          <ItemTitle>Allocation</ItemTitle>
          <div className="text-bold text-xl">{allocationUSD}</div>
          <div className="text-sm text-gray-500">{allocationToken}</div>
        </div>
        <div>
          <ItemTitle>Market Cap (current)</ItemTitle>
          <span className="text-bold text-xl block h-8">{marketCapCurrent}</span>
        </div>
        <div>
          <ItemTitle>Market Cap (TGE)</ItemTitle>
          <span className="text-bold text-xl block">{marketCapTGE}</span>
        </div>
        <div>
          <ItemTitle>Circulating Supply</ItemTitle>
          <span className="text-bold text-xl block">{circulatingSupply}</span>
        </div>
        <div>
          <ItemTitle>Cliff</ItemTitle>
          <span className="text-bold text-xl block">
            {vestingCliffTime && vestingCliffTime !== vestingStartTime ? (
              <Moment unix format="YYYY-MM-DD">{vestingCliffTime}</Moment>
            ) : (
              <>None</>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

export default PortfolioCompany