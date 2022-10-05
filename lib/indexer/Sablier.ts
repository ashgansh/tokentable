import { BigNumber, Contract } from "ethers";
import { SABLIER_MERIT_CONTRACT_ABI } from "@/lib/contracts/SablierMerit";
import { getProvider } from "@/lib/provider";
import { getTokenAllowance, getTokenBalance } from "@/lib/tokens";
import { erc20ABI } from "wagmi";
import { isAddress } from "ethers/lib/utils";

const getVestedAmount = (startTime, endTime, amount) => {
  const now = Math.round(Date.now() / 1000);
  const stopTime = Math.min(now, endTime);
  const elapsed = Math.max(0, stopTime - startTime)
  const duration = endTime - startTime
  return amount.mul(elapsed).div(duration);
};

const getGrantsAndWithdrawalsAndAdmins = async (contract, filters) => {
  const { admin } = filters || {};

  const createStreamFilter = contract.filters.CreateStream(null, admin || null);
  const cancelStreamFilter = contract.filters.CancelStream(null, admin || null);

  const createStreamEvents = await contract.queryFilter(createStreamFilter);
  const cancelStreamEvents = await contract.queryFilter(cancelStreamFilter);

  const grants = await Promise.all(
    createStreamEvents.map(async (event) => {
      const {
        streamId: streamIdBN,
        recipient,
        deposit,
        tokenAddress,
        sender,
        startTime: startTimeBN,
        stopTime: stopTimeBN,
      } = event.args;

      const streamId = streamIdBN.toNumber();
      const startTime = startTimeBN.toNumber();
      const endTime = stopTimeBN.toNumber();

      const cancelationEvent = cancelStreamEvents
        .filter((event) => event.args.streamId.eq(streamId))
        .shift();

      const revokedBlock = cancelationEvent?.blockNumber || null;
      const revokedTime = revokedBlock
        ? (await contract.provider.getBlock(revokedBlock)).timestamp
        : null;

      const vestedAmount =
        cancelationEvent?.args.recipientBalance ||
        getVestedAmount(startTime, endTime, deposit);

      return {
        id: streamId,
        beneficiary: recipient,
        admin: sender,
        tokenAddress,
        amount: deposit,
        vestedAmount: vestedAmount,
        startTime: startTime,
        endTime: endTime,
        cliffTime: startTime,
        createdBlock: event.blockNumber,
        revokedBlock,
        revokedTime,
        isRevoked: !!revokedBlock,
      };
    })
  );

  const streamIds = grants.map((grant) => grant.id);
  const withdrawFromStreamFilter =
    contract.filters.WithdrawFromStream(streamIds);
  const withdrawFromStreamEvents = await contract.queryFilter(
    withdrawFromStreamFilter
  );

  const withdrawals = withdrawFromStreamEvents.map((event) => {
    const { recipient, amount, streamId } = event.args;
    const grant = grants.find((grant) => grant.id === streamId.toNumber());
    const tokenAddress = grant?.tokenAddress;
    return {
      blockNumber: event.blockNumber,
      tokenAddress,
      beneficiary: recipient,
      amount: amount,
    };
  });

  const admins = Array.from(
    new Set(createStreamEvents.map((event) => event.args.sender))
  );

  if (admin && isAddress(admin)) admins.push(admin)

  return [grants, withdrawals, admins];
};

const getTokens = async (grants) => {
  const tokenAddresses = grants.map((grant) => grant.tokenAddress);
  return tokenAddresses.reduce(
    (tokens, tokenAddress) => ({ ...tokens, [tokenAddress]: {} }),
    {}
  );
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

const addVestingScheduleCallback =
  (vestingContract, chainId) => async (signer, schedule) => {
    const { startTime, endTime, amount, beneficiary, tokenAddress } = schedule;
    const transactions = [];

    const totalSeconds = endTime - startTime
    const safeAmount = amount.sub(amount.mod(totalSeconds))

    const ownerAddress = await signer.getAddress();
    const spenderAddress = vestingContract.address;

    const allowance = await getTokenAllowance(
      chainId,
      tokenAddress,
      ownerAddress,
      spenderAddress
    );

    if (allowance.lt(amount)) {
      const tokenContract = new Contract(tokenAddress, erc20ABI, vestingContract.provider);
      const approveTx = await tokenContract.populateTransaction.approve(spenderAddress, amount);
      transactions.push(approveTx);
    }

    const createStreamTx = await vestingContract.populateTransaction.createStream(
      beneficiary,
      safeAmount,
      tokenAddress,
      startTime,
      endTime
    )
    transactions.push(createStreamTx)
    return transactions
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
  try {
    const grant = grants.find((grant) => grant.id === id);
    return await contract.balanceOf(id, grant.beneficiary);
  } catch (_) {
    return BigNumber.from(0);
  }
};

const getAdminTokenAllowanceCallback =
  (chainId) => async (tokenAddress, account) => {
    return await getTokenBalance(chainId, tokenAddress, account);
  };

export const getVestingData = async (
  chainId: number,
  contractAddress: string,
  filters
) => {
  const provider = getProvider(chainId);
  const contract = new Contract(
    contractAddress,
    SABLIER_MERIT_CONTRACT_ABI,
    provider
  );

  const [grants, withdrawals, admins] = await getGrantsAndWithdrawalsAndAdmins(
    contract,
    filters
  );
  const tokens = await getTokens(grants);

  // Totals
  const totalWithdrawnAmounts = getTotalWithdrawnAmounts(withdrawals);
  const totalAllocatedAmounts = getTotalAllocatedAmounts(grants);
  const totalVestedAmounts = getTotalVestedAmounts(grants);

  // Callbacks
  const releaseAndWithdraw = releaseAndWithdrawCallback(contract, grants);
  const getReleasableAmount = getReleasableAmountCallback(contract, grants);
  const addVestingSchedule = addVestingScheduleCallback(contract, chainId);
  const getAdminTokenAllowance = getAdminTokenAllowanceCallback(chainId);

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
    admins,
    capabilities,
    getReleasableAmount,
    releaseAndWithdraw,
    addVestingSchedule,
    getAdminTokenAllowance,
  };
};
