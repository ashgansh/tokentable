import create from "zustand";
import { persist } from 'zustand/middleware'

import CurveLogo from "@/public/logos/curve.svg"
import RequestLogo from "@/public/logos/request.svg"

const COMPANY_DETAILS = {
  'request': {
    companyLogo: RequestLogo,
    companyName: 'Request'
  },
  'curve': {
    companyLogo: CurveLogo,
    companyName: 'Curve Finance'
  }
}

const PORTFOLIO = [
  {
    chainId: 1,
    contractType: "request",
    contractAddress: "0x45E6fF0885ebf5d616e460d14855455D92d6CC04",
    beneficiaryAddress: "0xF0068a27c323766B8DAF8720dF20a404Cf447727",
  },
  {
    chainId: 1,
    contractType: "curve",
    contractAddress: "0x2a7d59e327759acd5d11a8fb652bf4072d28ac04",
    beneficiaryAddress: "0x279a7DBFaE376427FFac52fcb0883147D42165FF",
  }
]

export const portfolioSelector = state => state.portfolio.map(item => ({ ...item, ...COMPANY_DETAILS?.[item.contractType] }))
export const portfolioStore = create(
  persist(
    (set, get) => ({
      portfolio: PORTFOLIO,
      addPortfolioItem: (chainId, contractType, contractAddress, beneficiaryAddress) => {
        set({...get(), portfolio: [...get().portfolio, { chainId, contractType, contractAddress, beneficiaryAddress }]})
        console.log(get().portfolio)
      },
      removePortfolioItem: (index) => set({ ...get(), portfolio: get().portfolio.filter((_, idx) => index !== idx) }),
      reset: () => set({ portfolio: PORTFOLIO }),

    }),
    {
      name: 'tokenops-portfolio',

    }
  )
)