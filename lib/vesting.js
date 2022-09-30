import axios from "axios";
import objectHash from "object-hash";
import { getAddress } from "@ethersproject/address";

import { getVestingData as getRequestVestingData } from "@/lib/indexer/RequestNetwork.ts";
import { getVestingData as getZoraclesVestingData } from "@/lib/indexer/Zoracles.ts";
import { getVestingData as getCurveVestingData } from "@/lib/indexer/Curve.js";
import { getVestingData as getTokenOpsVestingData } from "@/lib/indexer/TokenOps.js";
import { getVestingData as getDopexVestingData } from "@/lib/indexer/Dopex.ts";
import { getVestingData as getDssVestVestingData } from "@/lib/indexer/DssVest.ts";
import { getVestingData as getSablierVestingData } from "@/lib/indexer/Sablier.ts";
import { getVestingData as getSuperfluidVestingData } from "@/lib/indexer/Superfluid.ts";
import { getVestingData as getIndexCoopVestingData } from "@/lib/indexer/IndexCoop.ts";

import { tokenStore } from "./tokens";
import {
  ALPHA_VESTING_ABI,
  REQUEST_VESTING_ABI,
  ZORACLES_VESTING_ABI,
} from "./constants";

import { TOKENOPS_VESTING_CONTRACT_ABI } from "./contracts/TokenOpsVesting";
import { DOPEX_VESTING_CONTRACT_ABI } from "./contracts/DopexVesting";
import { DSS_VEST_CONTRACT_ABI } from "./contracts/DssVest";
import { SABLIER_MERIT_CONTRACT_ABI } from "./contracts/SablierMerit";
import { SABLIER_CONTRACT_ABI } from "./contracts/Sablier";
import { INDEX_COOP_CONTRACT_ABI } from "./contracts/IndexCoop";

export const VESTING_CONTRACTS = [
  {
    chainId: 1,
    contractAddress: "0x45E6fF0885ebf5d616e460d14855455D92d6CC04",
    contractType: "request",
    companyName: "Request",
    companyLogoURL: "/logos/request.svg",
  },
  {
    chainId: 1,
    contractAddress: "0x2A7d59E327759acd5d11A8fb652Bf4072d28AC04",
    contractType: "curve",
    companyName: "Curve Finance",
    companyLogoURL: "/logos/curve.svg",
  },
  {
    chainId: 1,
    contractAddress: "0x2369921551f2417d8d5cD4C1EDb1ac7eEe156380",
    contractType: "zoracles",
    companyName: "Zoracles",
    companyLogoURL: "/logos/zoracles.svg",
  },
  {
    chainId: 1,
    contractAddress: "0x38569f73190d6D2f3927C0551526451E3af4d8d6",
    contractType: "dopex",
    companyName: "Dopex",
    companyLogoURL: "/logos/dopex.svg",
  },
  {
    chainId: 1,
    contractAddress: "0x6017dd61f4d0C8123f160F99058Adc5671dF6447",
    contractType: "dssvest",
    companyName: "Morpho",
    companyLogoURL: "/logos/morpho.svg",
  },
  {
    chainId: 1,
    contractAddress: "0xbaFFeb35357316c8256e0cF534c9258C2a55A130",
    contractType: "sablier",
    companyName: "Merit Circle",
    companyLogoURL: "/logos/meritcircle.svg"
  },
  {
    chainId: 1,
    contractAddress: "0x66a7d781828B03Ee1Ae678Cd3Fe2D595ba3B6000",
    contractType: "indexcoop",
    companyName: "Index Coop",
    companyLogoURL: "/logos/indexcoop.png"
  }
];

const VESTING_CONTRACT_INDEXERS = {
  request: getRequestVestingData,
  curve: getCurveVestingData,
  zoracles: getZoraclesVestingData,
  tokenops: getTokenOpsVestingData,
  dopex: getDopexVestingData,
  dssvest: getDssVestVestingData,
  sablier: getSablierVestingData,
  superfluid: getSuperfluidVestingData,
  indexcoop: getIndexCoopVestingData,
};

const VESTING_CONTRACT_ABIS = {
  [objectHash(REQUEST_VESTING_ABI)]: "request",
  [objectHash(ZORACLES_VESTING_ABI)]: "zoracles",
  [objectHash(ALPHA_VESTING_ABI)]: "curve",
  [objectHash(TOKENOPS_VESTING_CONTRACT_ABI)]: "tokenops",
  [objectHash(DOPEX_VESTING_CONTRACT_ABI)]: "dopex",
  [objectHash(DSS_VEST_CONTRACT_ABI)]: "dssvest",
  [objectHash(SABLIER_MERIT_CONTRACT_ABI)]: "sablier",
  [objectHash(SABLIER_CONTRACT_ABI)]: "sablier",
  [objectHash(INDEX_COOP_CONTRACT_ABI)]: "indexcoop",
};

const ETHERSCAN_API_DOMAINS = {
  1: "api.etherscan.io",
  5: "api-goerli.etherscan.io",
};

const LOOKUP_CONTACT_SUPPORTED_CHAINS = Object.keys(ETHERSCAN_API_DOMAINS)

export const getContractAbi = async (chainId, contractAddress) => {
  const etherscanApiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
  const etherscanApiDomain = ETHERSCAN_API_DOMAINS?.[chainId];

  if (!etherscanApiDomain) return [];

  const url = `https://${etherscanApiDomain}/api?module=contract&action=getabi&address=${contractAddress}&apikey=${etherscanApiKey}`;
  const result = await axios.get(url);

  if (result.data.message === "NOTOK") return [];

  return JSON.parse(result.data.result);
};

const getContractType = (abi) => {
  return VESTING_CONTRACT_ABIS?.[objectHash(abi)];
};

export const getVestingData = async (
  contractType,
  chainId,
  contractAddress,
  filters
) => {
  const indexer = VESTING_CONTRACT_INDEXERS[contractType];

  if (!indexer) return null;

  const vestingData = await indexer(chainId, contractAddress, filters);

  const { addToken } = tokenStore.getState();
  const tokenAddresses = Object.keys(vestingData.tokens);
  tokenAddresses.forEach((tokenAddress) => addToken(chainId, tokenAddress));

  return {
    chainId,
    contractType,
    contractAddress,
    tokenAddresses,
    ...vestingData,
  };
};

export const findVestingContractChainId = async (contractAddress) => {
  const chainIds = await Promise.all(
    LOOKUP_CONTACT_SUPPORTED_CHAINS.map(async chainIdString => {
      const chainId = Number(chainIdString)
      const details = await getVestingContractDetails(chainId, contractAddress)
      return [chainId, !!details.meta.contractType]
    })
  )
  const chainId = chainIds.find(([_, result]) => result)
  if (!chainId) return null
  return chainId[0]
}

export const getVestingContractDetails = async (chainId, contractAddress) => {
  const formattedContractAddress = getAddress(contractAddress);
  const meta = VESTING_CONTRACTS.find(
    (contract) =>
      contract.chainId === chainId &&
      contract.contractAddress === formattedContractAddress
  );

  if (meta) {
    return {
      meta,
      getVestingData: async () =>
        await getVestingData(meta.contractType, chainId, contractAddress),
    };
  }

  const abi = await getContractAbi(chainId, contractAddress);
  const contractType = getContractType(abi);

  if (contractType) {
    return {
      meta: {
        contractAddress,
        chainId,
        contractType
      },
      getVestingData: async (filters) =>
        await getVestingData(contractType, chainId, contractAddress, filters),
    };
  }

  return {
    meta: {
      contractAddress,
      chainId,
    },
    getVestingData: async () => ({}),
  };
};
