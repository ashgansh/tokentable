import { BigNumber, Contract } from "ethers";
import { REQUEST_VESTING_ABI } from "../constants";
import { getProvider } from "../provider";
import { IVestingData } from "../type";

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

const getGrants = async (contract) => {
  const newGrantEvents = await contract.queryFilter("NewGrant");
  const revokedGrantEvents = await contract.queryFilter("GrantRevoked");

  const grants = newGrantEvents.map(async (log) => {
    const {
      token: tokenAddress,
      vester: beneficiary,
      granter,
      startTime,
      endTime,
      cliffTime,
      vestedAmount: amount,
    } = log.args;
    const revokedBlock =
      revokedGrantEvents
        .filter(
          (revokedGrant) =>
            granter === revokedGrant.args?.granter &&
            beneficiary === revokedGrant.args?.vester &&
            tokenAddress === revokedGrant.args?.token
        )
        .shift()?.blockNumber || null;

    const revokedTime = revokedBlock
      ? (await contract.provider.getBlock(revokedBlock)).timestamp
      : null;

    const vestedAmount = getVestedAmount(
      startTime?.toNumber(),
      endTime?.toNumber(),
      revokedTime,
      cliffTime?.toNumber(),
      amount
    );
    const id = `${tokenAddress}-${granter}-${beneficiary}-${log.blockNumber}`;
    return {
      id,
      beneficiary,
      tokenAddress,
      amount,
      vestedAmount,
      startTime: startTime?.toNumber(),
      endTime: endTime?.toNumber(),
      cliffTime: cliffTime?.toNumber(),
      createdBlock: log.blockNumber,
      revokedBlock,
      revokedTime,
      isRevoked: !!revokedBlock,
    };
  });

  return await Promise.all(grants);
};

const getWithdrawals = async (contract) => {
  const withdrawalEvents = await contract.queryFilter("Withdraw");
  const withdrawals = withdrawalEvents.map((log) => ({
    blockNumber: log.blockNumber,
    tokenAddress: log.args?.token,
    beneficiary: log.args?.user,
    amount: log.args?.amount,
  }));
  return withdrawals;
};

const getTokensAndAdmins = async (contract, chainId) => {
  const depositEvents = await contract.queryFilter("Deposit");
  const tokenAddresses = Array.from(
    new Set(depositEvents.map((log) => log.args.token)).values()
  );
  const admins = Array.from(
    new Set(depositEvents.map((log) => log.args.granter)).values()
  );
  const tokenDetails = await Promise.all(
    tokenAddresses.map(async (tokenAddress: string) => ({
      tokenAddress,
      ...(await getTokenDetails(chainId, tokenAddress)),
    }))
  );
  const tokens = tokenDetails.reduce(
    (prev, current) => ({ ...prev, [current.tokenAddress]: current }),
    {}
  );
  return { tokens, admins };
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

const addVestingScheduleCallback = (vestingContract) => async (signer, schedule) => {
  const { startTime, endTime, amount, beneficiary, tokenAddress } = schedule;

  const grantPeriod = endTime - startTime;
  const cliffPeriod = 0;

  const tx = await vestingContract.populateTransactions.createVesting(
    tokenAddress,
    beneficiary,
    amount,
    startTime,
    grantPeriod,
    cliffPeriod
  );
  return [tx]
};

const getReleasableAmountCallback = (contract, grants) => async (id) => {
  const [tokenAddress, granter, beneficiary, createdBlockNumber] =
    id.split("-");
  const lastCreatedBlockNumber = grants
    .filter((grant) => createdBlockNumber === grant.blockNumber)
    .map((grant) => grant.createdBlockNumber)
    .sort()
    .shift();

  // Check if the createdBlockNumber from the id is lower than
  // the last created block number. If this is the case it means the addresses
  // have already been used for a grant settled previously, meaning there can't be
  // any outstanding amount anymore.k
  if (createdBlockNumber < lastCreatedBlockNumber) {
    return BigNumber.from(0);
  }

  return await contract.getVestingBalance(tokenAddress, granter, beneficiary);
};

const releaseAndWithdrawCallback = (contract) => async (signer, id) => {
  const [tokenAddress, granter] = id.split("-");
  const vestingContract = new Contract(
    contract.address,
    contract.interface,
    signer
  );
  return await vestingContract.releaseGrant(tokenAddress, granter, true);
};

const getAdminTokenAllowanceCallback =
  (contract, admins) => async (tokenAddress, account) => {
    if (!admins.includes(account)) return BigNumber.from(0);
    return await contract.getContractBalance(tokenAddress, account);
  };

export const getVestingData = async (
  chainId,
  contractAddress
): Promise<IVestingData> => {
  const provider = getProvider(chainId);
  const contract = new Contract(contractAddress, REQUEST_VESTING_ABI, provider);
  const grants = await getGrants(contract);
  const withdrawals = await getWithdrawals(contract);
  const totalWithdrawnAmounts = getTotalWithdrawnAmounts(withdrawals);
  const totalAllocatedAmounts = getTotalAllocatedAmounts(grants);
  const totalVestedAmounts = getTotalVestedAmounts(grants);
  const { tokens, admins } = await getTokensAndAdmins(contract, chainId);

  // Callbacks
  const addVestingSchedule = addVestingScheduleCallback(contract);
  const releaseAndWithdraw = releaseAndWithdrawCallback(contract);
  const getReleasableAmount = getReleasableAmountCallback(contract, grants);
  const getAdminTokenAllowance = getAdminTokenAllowanceCallback(
    contract,
    admins
  );

  // Capabilities
  const capabilities = {
    multiToken: true,
    addVestingSchedule: true,
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
    addVestingSchedule,
    getReleasableAmount,
    releaseAndWithdraw,
    getAdminTokenAllowance,
  };
};
