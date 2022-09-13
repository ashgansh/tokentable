import { useForm } from "react-hook-form"
import { isAddress } from "ethers/lib/utils"
import { useState, useEffect } from "react"
import Link from "next/link"
import axios from "axios"

import { formatCurrency, formatAmount } from "@/lib/utils"
import { getVestingData } from "@/lib/vesting"
import { useTokenCirculatingSupply, useTokenFormatter, useTokenPrice } from "@/lib/tokens"
import { portfolioSelector, portfolioStore } from "@/lib/portfolio"

import { PrimaryButton } from "@/components/Button"
import { Modal, ModalActionFooter, ModalBody, ModalTitle } from "@/components/Modal"
import { Input, Label } from "@/components/Input"
import { LayoutWrapper } from "@/components/LayoutWrapper"
import PortfolioCompany from "@/components/PortfolioCompany"
import Spinner from "@/components/Spinner"

const PortfolioItem = ({ companyName, companyLogo, startTime, endTime, cliffTime, amount, tokenAddress, chainId }) => {
  const formatToken = useTokenFormatter(chainId, tokenAddress)
  const tokenPrice = useTokenPrice(chainId, tokenAddress)
  const tokenCirculatingSupply = useTokenCirculatingSupply(chainId, tokenAddress)
  const tokenAllocationAmount = +(formatToken(amount, { symbol: null, commify: false }))

  const formattedTokenAllocation = formatToken(amount, { shorten: true })
  const formattedDollarAllocation = formatCurrency(tokenPrice * tokenAllocationAmount, 'USD', { shorten: true })
  const formattedCirculatingSupply = formatAmount(tokenCirculatingSupply, { digits: 0 })

  return (
    <PortfolioCompany
      companyName={companyName}
      companyLogo={companyLogo}
      vestingStartTime={startTime}
      vestingEndTime={endTime}
      vestingCliffTime={cliffTime}
      allocationToken={formattedTokenAllocation}
      allocationUSD={formattedDollarAllocation}
      circulatingSupply={formattedCirculatingSupply}
    />
  )
}

const Portfolio = () => {
  const portfolioItems = portfolioStore(portfolioSelector)
  const [portfolioVestingContracts, setPortfolioVestingContracts] = useState([])
  const portfolioVestingGrants = portfolioVestingContracts.reduce((grants, portfolioItem) => {
    const { vestingContract, meta } = portfolioItem
    const beneficiaryGrants = vestingContract.grants?.filter(grant => grant.beneficiary === meta.beneficiaryAddress) || []
    const newGrants = beneficiaryGrants.map(beneficiaryGrant => ({ meta, beneficiaryGrant, vestingContract }))
    return [...grants, ...newGrants]
  }, [])

  useEffect(() => {
    const retrieveVestingData = async () => {
      const vestingContracts = portfolioItems.map(async (portfolioItem) => ({
        meta: portfolioItem,
        vestingContract: await getVestingData(portfolioItem.contractType, portfolioItem.chainId, portfolioItem.contractAddress)
      }))
      setPortfolioVestingContracts(await Promise.all(vestingContracts))
    }
    retrieveVestingData()
  }, [portfolioItems])

  return (
    <div className="flex flex-col gap-4 py-4">
      {portfolioVestingGrants.map((portfolioItem, index) => {
        const { companyName, companyLogo, chainId, contractType, contractAddress } = portfolioItem.meta
        const { startTime, endTime, cliffTime, amount, tokenAddress } = portfolioItem.beneficiaryGrant
        return (
          <Link key={`portfolio-item-${index}`} href={`/vesting/${contractType}/${chainId}/${contractAddress}`}>
            <div className="hover:cursor-pointer hover:shadow-md rounded-lg">
              <PortfolioItem
                key={index}
                companyName={companyName}
                companyLogo={companyLogo}
                startTime={startTime}
                endTime={endTime}
                cliffTime={cliffTime}
                amount={amount}
                tokenAddress={tokenAddress}
                chainId={chainId}
              />
            </div>
          </Link>
        )
      })}
    </div>
  )
}

const AddContractModal = ({ show, onClose }) => {
  const { reset, register, handleSubmit, formState: { errors, isSubmitSuccessful, isSubmitting } } = useForm()

  const handleAddContract = async (data) => {
    await axios.post("https://formspree.io/f/xaykqkok", data)
    reset()
  }

  return (
    <Modal show={show} onClose={onClose}>
      <form onSubmit={handleSubmit(handleAddContract)}>
        <ModalTitle>Add a vesting contract to your portfolio</ModalTitle>
        {isSubmitSuccessful ? (
          <>
            <ModalBody>
              <div className="py-12 items-center flex flex-col gap-4">
                <span><Spinner className="text-tokenops-primary-700 h-8" /></span>
                <span>{"We're indexing your contract. This may take up to a 24h."}</span>
                <span>{"Please check back again later."}</span>
              </div>
            </ModalBody>
            <ModalActionFooter>
              <PrimaryButton onClick={onClose}>Close</PrimaryButton>
            </ModalActionFooter>
          </>
        ) : (
          <>
            <ModalBody>
              <div className="flex flex-col gap-2.5">
                <div>
                  <Label>Contract Address</Label>
                  <Input {...register("contractAddress", { required: true, validate: { isAddress } })} />
                  <span className="text-xs text-red-400">
                    {errors?.contractAddress && "A valid vesting contract address is required"}
                  </span>
                </div>
                <div>
                  <Label>Beneficiary Address</Label>
                  <Input {...register("beneficiaryAddress", { required: true, validate: { isAddress }  })} />
                  <span className="text-xs text-red-400">
                    {errors?.beneficiaryAddress && "An beneficiary is required"}
                  </span>
                </div>
              </div >
            </ModalBody >
            <ModalActionFooter>
              <PrimaryButton type="submit" disabled={isSubmitting}>Track Contract</PrimaryButton>
            </ModalActionFooter>
          </>
        )}
      </form >
    </Modal >
  )

}

const Home = () => {
  const [showAddContractModal, setShowAddContractModal] = useState(false)

  const handleOpensAddContractModal = () => setShowAddContractModal(true)
  const handleCloseAddContractModal = () => setShowAddContractModal(false)

  return (
    <LayoutWrapper>
      <AddContractModal show={showAddContractModal} onClose={handleCloseAddContractModal} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="flex justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Portfolio</h1>
          <PrimaryButton onClick={handleOpensAddContractModal}>Add</PrimaryButton>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <Portfolio />
      </div>
    </LayoutWrapper>
  )
}

export default Home