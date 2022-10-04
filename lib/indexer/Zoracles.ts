import { BigNumber, Contract } from "ethers";
import { ZORACLES_VESTING_ABI } from "../constants";
import { getProvider } from "../provider";
import { IVestingData } from "../type";

const getTokenAddress = async (contract) => {
  const tokenAddress = await contract.token();
  return tokenAddress;
};

const getTokenDetails = async (chainId, tokenAddress) => {
  const ERC20Abi = [
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
  ];
  const provider = getProvider(chainId);
  const tokenContract = new Contract(tokenAddress, ERC20Abi, provider);
  const [symbol, decimals] = await Promise.all([
    await tokenContract.symbol(),
    await tokenContract.decimals(),
  ]);
  return { symbol, decimals };
};

const getGrants = async (contract, tokenAddress) => {
  const tokenVestedEvents = await contract.queryFilter("TokenVested");
  const grants = tokenVestedEvents.map((log) => {
    const {
      beneficary: beneficiary,
      vestingStartTime,
      vestingPeriod,
      cliffPeriod,
      amount,
    } = log.args;
    const startTime = vestingStartTime?.toNumber();
    const endTime = startTime + vestingPeriod * 24 * 60 * 60;
    const cliffTime = startTime + cliffPeriod * 24 * 60 * 60;
    const vestedAmount = getVestedAmount(
      startTime,
      endTime,
      null,
      cliffTime,
      amount
    );
    return {
      beneficiary,
      tokenAddress,
      amount,
      vestedAmount,
      startTime,
      endTime,
      cliffTime,
      createdBlock: log.blockNumber,
      revokedBlock: null,
      revokedTime: null,
      isRevoked: false,
    };
  });
  return grants;
};

const getWithdrawals = async (contract, tokenAddress) => {
  const withdrawalEvents = await contract.queryFilter("TokenReleased");
  const withdrawals = withdrawalEvents.map((log) => ({
    blockNumber: log.blockNumber,
    tokenAddress: tokenAddress,
    beneficiary: log.args?.beneficary,
    amount: log.args?.amount,
  }));
  return withdrawals;
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

const getVestedAmount = (
  startTime,
  endTime,
  revokedTime,
  cliffTime,
  amount
) => {
  const now = Math.round(Date.now() / 1000);

  if (now < cliffTime) return BigNumber.from(0);

  const isRevoked = !!revokedTime;
  const endOrRevokedTime = isRevoked ? revokedTime : endTime;
  const stopTime = Math.min(now, endOrRevokedTime);
  const elapsed = Math.max(0, stopTime - startTime)
  const duration = endTime - startTime
  return amount.mul(elapsed).div(duration);
};

const getTotalVestedAmounts = (grants) => {
  return grants.reduce((totalVestedAmounts, grant) => {
    const prevVestedAmount =
      totalVestedAmounts?.[grant.tokenAddress] || BigNumber.from(0);
    const currentVestedAmount = getVestedAmount(
      grant.startTime,
      grant.endTime,
      grant.revokedTime,
      grant.cliffTime,
      grant.amount
    );
    const newVestedAmount = prevVestedAmount.add(currentVestedAmount);
    return {
      ...totalVestedAmounts,
      [grant.tokenAddress]: newVestedAmount,
    };
  }, {});
};

export const getVestingData = async (
  chainId,
  contractAddress
): Promise<IVestingData> => {
  const provider = getProvider(chainId);
  const contract = new Contract(
    contractAddress,
    ZORACLES_VESTING_ABI,
    provider
  );

  const tokenAddress: string = await getTokenAddress(contract);
  const tokenDetails = await getTokenDetails(chainId, tokenAddress);

  const tokens = {
    [tokenAddress]: {
      symbol: tokenDetails.symbol,
      decimals: tokenDetails.decimals,
      tokenAddress: tokenAddress,
    },
  };

  const grants = await getGrants(contract, tokenAddress);
  const withdrawals = await getWithdrawals(contract, tokenAddress);

  const totalWithdrawnAmounts = getTotalWithdrawnAmounts(withdrawals);
  const totalAllocatedAmounts = getTotalAllocatedAmounts(grants);
  const totalVestedAmounts = getTotalVestedAmounts(grants);

  return {
    grants,
    withdrawals,
    totalWithdrawnAmounts,
    totalAllocatedAmounts,
    totalVestedAmounts,
    tokens,
  };
};
