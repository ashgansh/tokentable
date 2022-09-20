import { getVestingData as getRequestVestingData } from "@/lib/indexer/RequestNetwork.ts";
import { getVestingData as getZoraclesVestingData } from "@/lib/indexer/Zoracles.ts";
import { getVestingData as getCurveVestingData } from "@/lib/indexer/Curve";
import { getVestingData as getTokenOpsVestingData } from "@/lib/indexer/TokenOps";

import { tokenStore } from "./tokens";

export const VESTING_CONTRACTS = [
  {
    chainId: 1,
    contractAddress: '0x45E6fF0885ebf5d616e460d14855455D92d6CC04',
    contractType: 'request',
    companyName: 'Request',
    companyLogoURL: '/logos/request.svg',
  },
  {
    chainId: 1,
    contractAddress: "0x2a7d59e327759acd5d11a8fb652bf4072d28ac04",
    contractType: "curve",
    companyName: 'Curve Finance',
    companyLogoURL: '/logos/curve.svg'
  },
  {
    chainId: 1,
    contractAddress: "0x2369921551f2417d8d5cD4C1EDb1ac7eEe156380",
    contractType: "zoracles",
    companyName: "Zoracles",
    companyLogoURL: '/logos/zoracles.svg'
  }
]

const VESTING_CONTRACT_INDEXERS = {
  request: getRequestVestingData,
  curve: getCurveVestingData,
  zoracles: getZoraclesVestingData,
  tokenops: getTokenOpsVestingData,
};

export const getVestingData = async (
  contractType,
  chainId,
  contractAddress
) => {
  const indexer = VESTING_CONTRACT_INDEXERS[contractType];

  if (!indexer) return null;

  const vestingData = await indexer(chainId, contractAddress);

  const { addToken } = tokenStore.getState();
  const tokenAddresses = Object.keys(vestingData.tokens);
  tokenAddresses.forEach((tokenAddress) => addToken(chainId, tokenAddress));

  return {
    chainId,
    contractType,
    contractAddress,
    tokenAddresses,
    ...vestingData
  }
}

export const getVestingContractDetails = (chainId, contractAddress) => {
  const meta = VESTING_CONTRACTS.find(contract => contract.chainId === chainId && contract.contractAddress === contractAddress)

  if (!meta) return {
    meta: {
      contractAddress,
      chainId
    },
    getVestingData: async () => ({})
  }

  return {
    meta,
    getVestingData: async () => await getVestingData(meta.contractType, chainId, contractAddress)
  }
}