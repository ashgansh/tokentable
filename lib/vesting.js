import { getVestingData as getRequestVestingData } from "@/lib/indexer/RequestNetwork"
import { getVestingData as getZoraclesVestingData } from "@/lib/indexer/Zoracles"
import { getVestingData as getCurveVestingData } from "@/lib/indexer/Curve"

import { tokenStore } from "./tokens"

const VESTING_CONTRACT_INDEXERS = {
  request: getRequestVestingData,
  curve: getCurveVestingData,
  zoracles: getZoraclesVestingData,
}

export const getVestingData = async (contractType, chainId, contractAddress) => {
  const indexer = VESTING_CONTRACT_INDEXERS[contractType]
  const vestingData = await indexer(chainId, contractAddress)

  const { addToken } = tokenStore.getState()
  Object.keys(vestingData.tokens).forEach(tokenAddress => addToken(chainId, tokenAddress))

  return {
    contractType,
    chainId,
    contractAddress,
    ...vestingData
  }
}