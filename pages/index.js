import { useState, useEffect } from "react"
import Link from "next/link"

import { LayoutWrapper } from "@/components/LayoutWrapper"
import PortfolioCompany from "@/components/PortfolioCompany"

import { getVestingData as getRequestVestingData } from "@/lib/indexer/RequestNetwork"
import { getVestingData as getZoraclesVestingData } from "@/lib/indexer/Zoracles"
import { getVestingData as getCurveVestingData } from "@/lib/indexer/Curve"

const PortfolioItem = ({contractType, contractAddress, chainId, beneficiaryAddress}) => {
  const [vestingData, setVestingData] = useState()
  const beneficiaryGrants = vestingData?.grants?.filter(grant => grant.beneficiary === beneficiaryAddress) || []

  useEffect(() => {
    if (!contractType || !contractAddress || !chainId) return

    const retrieveVestingData = async () => {
      if (contractType === 'request') {
        const vestingData = await getRequestVestingData(chainId, contractAddress)
        setVestingData(vestingData)
        return
      }
      if (contractType === 'zoracles') {
        const vestingData = await getZoraclesVestingData(chainId, contractAddress)
        setVestingData(vestingData)
        return
      }
      if (contractType === 'curve') {
        const vestingData = await getCurveVestingData(chainId, contractAddress)
        setVestingData(vestingData)
        return
      }
    }

    retrieveVestingData()
  }, [contractType, contractAddress, chainId])

  return beneficiaryGrants.map((grant, index) => {
    console.log(grant)
    return (
        <PortfolioCompany
          key={index}
          companyLogo="https://raw.githubusercontent.com/RequestNetwork/Request/master/Hubs/Request%20Logos/OnLight/svg/Request_onlight_reg_green.svg"
          vestingStartTime={grant.startTime}
          vestingEndTime={grant.endTime}
          vestingCliffTime={grant.cliffTime}
          allocationToken="150M REQ"
          allocationUSD="$ 15M"
          marketCapCurrent="$ 500M"
          marketCapTGE="$ 100M"
          circulatingSupply="900M"
        />
    )
  })
}

const Home = () => (
  <LayoutWrapper>
    <PortfolioItem
      contractType="request"
      contractAddress="0x45E6fF0885ebf5d616e460d14855455D92d6CC04"
      chainId={1}
      beneficiaryAddress="0xF0068a27c323766B8DAF8720dF20a404Cf447727"
    />
    <hr className="py-4"/>
    <hr className="py-4"/>
    <ul>
      <li>
        <PortfolioCompany
          companyLogo="https://raw.githubusercontent.com/RequestNetwork/Request/master/Hubs/Request%20Logos/OnLight/svg/Request_onlight_reg_green.svg"
          vestingStartTime={1627768800}
          vestingEndTime={1690840800}
          vestingCliffTime={1627768800}
          allocationToken="150M REQ"
          allocationUSD="$ 15M"
          marketCapCurrent="$ 500M"
          marketCapTGE="$ 100M"
          circulatingSupply="900M"
        />
      </li>
      <li>
        <PortfolioCompany
          companyLogo="https://github.com/curvefi/curve-dao/blob/curvedao/src/assets/curve.png?raw=true"
          vestingStartTime={1627768800}
          vestingEndTime={1690840800}
          vestingCliffTime={1627768800}
          allocationToken="150M REQ"
          allocationUSD="$ 15M"
          marketCapCurrent="$ 500M"
          marketCapTGE="$ 100M"
          circulatingSupply="900M"
        />
      </li>
      <li><Link href="/vesting/request/0x45E6fF0885ebf5d616e460d14855455D92d6CC04">Request Network</Link></li>
      <li><Link href="/vesting/zoracles/0x2369921551f2417d8d5cD4C1EDb1ac7eEe156380">Zoracles</Link></li>
      <li><Link href="/vesting/curve/0x2a7d59e327759acd5d11a8fb652bf4072d28ac04">Curve</Link></li>
    </ul>
  </LayoutWrapper>
)

export default Home