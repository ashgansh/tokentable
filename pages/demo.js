import { LayoutWrapper } from "@/components/LayoutWrapper"
import { PortfolioItemList } from "pages/portfolio"


const PORTFOLIO_ITEMS = [
  {
    chainId: 1,
    contractAddress: "0x45E6fF0885ebf5d616e460d14855455D92d6CC04",
  },
  {
    chainId: 1,
    contractAddress: "0x2A7d59E327759acd5d11A8fb652Bf4072d28AC04",
  },
]

const BENEFICIARY_ADDRESSES = [
  "0xF0068a27c323766B8DAF8720dF20a404Cf447727",
  "0x279a7DBFaE376427FFac52fcb0883147D42165FF",
]


const Home = () => {
  return (
    <LayoutWrapper>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <PortfolioItemList portfolioItems={PORTFOLIO_ITEMS} beneficiaryAddresses={BENEFICIARY_ADDRESSES} />
      </div>
    </LayoutWrapper>
  )
}

export default Home