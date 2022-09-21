import axios from "axios";
import objectHash from "object-hash";

import { getVestingData as getRequestVestingData } from "@/lib/indexer/RequestNetwork";
import { getVestingData as getZoraclesVestingData } from "@/lib/indexer/Zoracles";
import { getVestingData as getCurveVestingData } from "@/lib/indexer/Curve";
import { getVestingData as getTokenOpsVestingData } from "@/lib/indexer/TokenOps";
import { getVestingData as getDopexVestingData } from "@/lib/indexer/Dopex";

import { tokenStore } from "./tokens";

import { ALPHA_VESTING_ABI, REQUEST_VESTING_ABI, ZORACLES_VESTING_ABI } from "./constants";
import { TOKENOPS_VESTING_CONTRACT_ABI } from "./contracts/TokenOpsVesting";
import { DOPEX_VESTING_CONTRACT_ABI } from "./contracts/DopexVesting";

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
  },
  {
    chainId: 1,
    contractAddress: "0x38569f73190d6d2f3927c0551526451e3af4d8d6",
    contractType: "dopex",
    companyName: "Dopex",
    companyLogoURL: '/logos/dopex.svg'
  }
]

const VESTING_CONTRACT_INDEXERS = {
  request: getRequestVestingData,
  curve: getCurveVestingData,
  zoracles: getZoraclesVestingData,
  tokenops: getTokenOpsVestingData,
  dopex: getDopexVestingData
};

const VESTING_CONTRACT_ABIS = {
  [objectHash(REQUEST_VESTING_ABI)]: 'request',
  [objectHash(ZORACLES_VESTING_ABI)]: 'zoracles',
  [objectHash(ALPHA_VESTING_ABI)]: 'curve',
  [objectHash(TOKENOPS_VESTING_CONTRACT_ABI)]: 'tokenops',
  [objectHash(DOPEX_VESTING_CONTRACT_ABI)]: 'dopex'
}

const ETHERSCAN_API_DOMAINS = {
  1: 'api.etherscan.io',
  5: 'api-goerli.etherscan.io'
}

export const getContractAbi = async (chainId, contractAddress) => {
  const etherscanApiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY
  const etherscanApiDomain = ETHERSCAN_API_DOMAINS?.[chainId]

  if (!etherscanApiDomain) return []

  const url = `https://${etherscanApiDomain}/api?module=contract&action=getabi&address=${contractAddress}&apikey=${etherscanApiKey}`

  const result = await axios.get(url)
  const abi = JSON.parse(result.data.result)
  return abi
}

const getContractType = (abi) => {
  return VESTING_CONTRACT_ABIS?.[objectHash(abi)]
}

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

export const getVestingContractDetails = async (chainId, contractAddress) => {
  const meta = VESTING_CONTRACTS.find(contract => contract.chainId === chainId && contract.contractAddress === contractAddress)

  if (meta) {
    return {
      meta,
      getVestingData: async () => await getVestingData(meta.contractType, chainId, contractAddress)
    }
  }

  const abi = await getContractAbi(chainId, contractAddress)
  const contractType = getContractType(abi)

  if (contractType) {
    return {
      meta: {
        contractAddress,
        chainId
      },
      getVestingData: async () => await getVestingData(contractType, chainId, contractAddress)
    }
  }

  return {
    meta: {
      contractAddress,
      chainId
    },
    getVestingData: async () => ({})
  }
}