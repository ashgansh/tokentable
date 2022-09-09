import { getVestingData as getRequestVestingData } from "@/lib/indexer/RequestNetwork"
import { getVestingData as getZoraclesVestingData } from "@/lib/indexer/Zoracles"
import { getVestingData as getCurveVestingData } from "@/lib/indexer/Curve"
import { getVestingData as getTokenOpsVestingData } from "@/lib/indexer/TokenOps"

import { tokenStore } from "./tokens"

const VESTING_CONTRACT_INDEXERS = {
  request: getRequestVestingData,
  curve: getCurveVestingData,
  zoracles: getZoraclesVestingData,
  tokenops: getTokenOpsVestingData,
}

export const getVestingData = async (contractType, chainId, contractAddress) => {
  const indexer = VESTING_CONTRACT_INDEXERS[contractType]

  if (!indexer) return null

  const vestingData = await indexer(chainId, contractAddress)

  const { addToken } = tokenStore.getState()
  const tokenAddresses = Object.keys(vestingData.tokens)
  tokenAddresses.forEach(tokenAddress => addToken(chainId, tokenAddress))

  return {
    chainId,
    contractType,
    contractAddress,
    tokenAddresses,
    ...vestingData
  }
}