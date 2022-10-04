import { BigNumber, Contract } from "ethers";
import { getProvider } from "@/lib/provider";
import { INDEX_COOP_CONTRACT_ABI } from "../contracts/IndexCoop";

const getTokenAddress = async (contract) => {
  const tokenAddress = await contract.index();
  return tokenAddress;
};

const getVestedAmount = (startTime, endTime, cliffTime, amount) => {
  const now = Math.round(Date.now() / 1000);

  if (now < cliffTime) return BigNumber.from(0);

  const stopTime = Math.min(now, endTime);
  const elapsed = Math.max(0, stopTime - startTime)
  const duration = endTime - startTime
  return amount.mul(elapsed).div(duration);
};

const getGrants = async (contract, tokenAddress) => {
  const beneficiary = await contract.recipient();
  const startTime = (await contract.vestingBegin()).toNumber();
  const endTime = (await contract.vestingEnd()).toNumber();
  const cliffTime = (await contract.vestingCliff()).toNumber();

  const amount = await contract.vestingAmount();
  const vestedAmount = getVestedAmount(startTime, endTime, cliffTime, amount);

  return [
    {
      id: "",
      beneficiary,
      tokenAddress,
      amount,
      vestedAmount,
      startTime,
      endTime,
      cliffTime,
      createdBlock: null,
      revokedBlock: null,
      revokedTime: null,
      isRevoked: false,
    },
  ];
};

const getWithdrawals = async (contract, tokenAddress) => {
  const beneficiary = await contract.recipient()

  const startTime = (await contract.vestingBegin()).toNumber();
  const lastWithdrawal = (await contract.lastUpdate()).toNumber()
  const cliffTime = (await contract.vestingCliff()).toNumber();
  const allocatedAmount = await contract.vestingAmount()
  const amount = getVestedAmount(startTime, lastWithdrawal, cliffTime, allocatedAmount)

  return [
    {
      blockNumber: null,
      tokenAddress: tokenAddress,
      beneficiary,
      amount,
    },
  ];
};

const getTotalWithdrawnAmounts = (withdrawals) => {
  return withdrawals.reduce((prev, current) => {
    const prevAmount = prev?.[current.tokenAddress] || BigNumber.from(0);
    const newAmount = prevAmount.add(current.amount);
    return {
      ...prev,
      [current.tokenAddress]: newAmount,
    };
  }, {});
};

const getTotalAllocatedAmounts = (grants) => {
  return grants.reduce((totalAllocatedAmounts, grant) => {
    const prevAllocatedAmount =
      totalAllocatedAmounts?.[grant.tokenAddress] || BigNumber.from(0);
    const allocatedAmount = grant.isRevoked ? grant.vestedAmount : grant.amount;
    const newAllocatedAmount = prevAllocatedAmount.add(allocatedAmount);
    return {
      ...totalAllocatedAmounts,
      [grant.tokenAddress]: newAllocatedAmount,
    };
  }, {});
};

const getTotalVestedAmounts = (grants) => {
  return grants.reduce((totalVestedAmounts, grant) => {
    const prevVestedAmount =
      totalVestedAmounts?.[grant.tokenAddress] || BigNumber.from(0);
    const newVestedAmount = prevVestedAmount.add(grant.vestedAmount);
    return {
      ...totalVestedAmounts,
      [grant.tokenAddress]: newVestedAmount,
    };
  }, {});
};

const releaseAndWithdrawCallback = (contract, grants) => async (signer, id) => {
  const grant = grants.find((grant) => grant.id === id);
  const vestingContract = new Contract(
    contract.address,
    contract.interface,
    signer
  );
  const amount = await contract.balanceOf(id, grant.beneficiary);
  return await vestingContract.withdrawFromStream(id, amount);
};

const getReleasableAmountCallback = (contract, grants) => async (id) => {
  const grant = grants.find((grant) => grant.id === id);
  return await contract.balanceOf(id, grant.beneficiary);
};

export const getVestingData = async (
  chainId: number,
  contractAddress: string
) => {
  const provider = getProvider(chainId);
  const contract = new Contract(
    contractAddress,
    INDEX_COOP_CONTRACT_ABI,
    provider
  );
  const tokenAddress = await getTokenAddress(contract);
  const tokenDetails = {};
  const tokens = { [tokenAddress]: tokenDetails };
  const grants = await getGrants(contract, tokenAddress);
  const withdrawals = await getWithdrawals(contract, tokenAddress);
  const admins = []

  // Totals
  const totalWithdrawnAmounts = getTotalWithdrawnAmounts(withdrawals);
  const totalAllocatedAmounts = getTotalAllocatedAmounts(grants);
  const totalVestedAmounts = getTotalVestedAmounts(grants);

  // Callbacks
  const releaseAndWithdraw = releaseAndWithdrawCallback(contract, grants);
  const getReleasableAmount = getReleasableAmountCallback(contract, grants);

  // Capabilities
  const capabilities = {
    multiToken: false,
    addVestingSchedule: false,
  };

  return {
    grants,
    withdrawals,
    totalWithdrawnAmounts,
    totalAllocatedAmounts,
    totalVestedAmounts,
    tokens,
    capabilities,
    admins,
    getReleasableAmount,
    releaseAndWithdraw,
  };
};
