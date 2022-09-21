import create from "zustand";
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import produce from "immer";
import objectHash from "object-hash";

import CurveLogo from "@/public/logos/curve.svg"
import RequestLogo from "@/public/logos/request.svg"


export const portfolioStore = create(
  immer(persist(
    (set, get) => ({
      portfolio: {},
      addPortfolioItem: (portfolioItem) => set(produce(draft => {
        const key = objectHash(portfolioItem)
        draft.portfolio[key] = portfolioItem
      })),
      isInPortfolio: (portfolioItem) => {
        const key = objectHash(portfolioItem)
        return get().portfolio.hasOwnProperty(key)
      },
      removePortfolioItem: (portfolioItem) => set(produce(draft => {
        const key = objectHash(portfolioItem)
        delete draft.portfolio[key]
      })),
      reset: () => set({ portfolio: {} }),
    }),
    {
      name: 'tokenops-portfolio',
    }
  ))
)

export const usePortfolioItems = () => portfolioStore(state => state.portfolio)