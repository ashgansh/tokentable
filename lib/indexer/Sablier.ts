import { BigNumber, Contract } from "ethers";
import { SABLIER_MERIT_CONTRACT_ABI } from "@/lib/contracts/SablierMerit";
import { getProvider } from "@/lib/provider";

const getVestedAmount = (startTime, endTime, amount) => {
  const now = Math.round(Date.now() / 1000);
  const stopTime = Math.min(now, endTime);
  return amount.mul(stopTime - startTime).div(endTime - startTime);
};

const getGrantsAndWithdrawalsAndAdmins = async (contract) => {
  const createStreamEvents = await contract.queryFilter("CreateStream");
  const cancelStreamEvents = await contract.queryFilter("CancelStream");
  const withdrawFromStreamEvents = await contract.queryFilter(
    "WithdrawFromStream"
  );

  const grants = await Promise.all(
    createStreamEvents.map(async (event) => {
      const {
        streamId: streamIdBN,
        recipient,
        deposit,
        tokenAddress,
        startTime: startTimeBN,
        stopTime: stopTimeBN,
      } = event.args;

      const streamId = streamIdBN.toNumber()
      const startTime = startTimeBN.toNumber();
      const endTime = stopTimeBN.toNumber();

      const cancelationEvent = cancelStreamEvents
        .filter((event) => event.args.id === streamId)
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

  const withdrawals = withdrawFromStreamEvents.map((event) => {
    const { recipient, amount, streamId } = event.args;
    const grant = grants.find(
      (grant) => grant.id === streamId.toNumber()
    );
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

const releaseAndWithdrawCallback = (contract, grants) => async (signer, id) => {
  const grant = grants.find(grant => grant.id === id)
  const vestingContract = new Contract(
    contract.address,
    contract.interface,
    signer
  );
  const amount = await contract.balanceOf(id, grant.beneficiary);
  return await vestingContract.withdrawFromStream(id, amount);
};

const getReleasableAmountCallback = (contract, grants) => async (id) => {
  const grant = grants.find(grant => grant.id === id)
  return await contract.balanceOf(id, grant.beneficiary);
};

export const getVestingData = async (
  chainId: number,
  contractAddress: string
) => {
  const provider = getProvider(chainId);
  const contract = new Contract(
    contractAddress,
    SABLIER_MERIT_CONTRACT_ABI,
    provider
  );

  const [grants, withdrawals, admins] = await getGrantsAndWithdrawalsAndAdmins(
    contract
  );
  const tokens = await getTokens(grants);

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
