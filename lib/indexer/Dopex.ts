import { BigNumber, Contract } from "ethers";

import { DOPEX_VESTING_CONTRACT_ABI } from "@/lib/contracts/DopexVesting";
import { getProvider } from "@/lib/provider";

const getTokenAddress = async (contract: Contract) => await contract.dpx();
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

const getAdmins = async (contract: Contract) => [await contract.owner()];

const getGrants = async (contract: Contract, tokenAddress: string) => {
  const bootstrapped = await contract.bootstrapped();

  if (!bootstrapped) return [];

  const startTime = (await contract.startTime()).toNumber();
  const duration = (await contract.duration()).toNumber();
  const endTime = startTime + duration;
  const cliffTime = startTime;

  const addBeneficiaryEvents = await contract.queryFilter("AddBeneficiary");
  const updateBeneficiaryEvents = await contract.queryFilter(
    "UpdateBeneficiary"
  );
  const removeBeneficiaryEvents = await contract.queryFilter(
    "RemoveBeneficiary"
  );
  const terminateBeneficiaryEvents = await contract.queryFilter(
    "TerminateBeneficiary"
  );

  const isRemoved = (beneficiary) =>
    removeBeneficiaryEvents.filter(
      (log) => log.args.beneficiary === beneficiary
    ).length > 0;

  const getRevokedBlock = (beneficiary) =>
    terminateBeneficiaryEvents
      .filter((log) => beneficiary === log.args.beneficiary)
      .shift()?.blockNumber || null;

  const getUpdatedAmount = (beneficiary) =>
    updateBeneficiaryEvents
      .filter((log) => beneficiary === log.args.beneficiary)
      .pop()?.args.amount;

  const grants = await Promise.all(
    addBeneficiaryEvents
      .filter((event) => !isRemoved(event.args.beneficiary))
      .map(async (log) => {
        const { beneficiary, amount: creationAmount } = log.args;
        const revokedBlock = getRevokedBlock(beneficiary);
        const revokedTime = revokedBlock
          ? (await contract.provider.getBlock(revokedBlock)).timestamp
          : null;
        const amount = getUpdatedAmount(beneficiary) || creationAmount;

        return {
          id: beneficiary,
          beneficiary,
          amount,
          vestedAmount: await contract.vestedAmount(beneficiary),
          tokenAddress,
          startTime,
          endTime,
          cliffTime,
          createdBlock: log.blockNumber,
          revokedBlock,
          revokedTime,
          isRevoked: !!revokedBlock,
        };
      })
  );

  return grants;
};

const getWithdrawals = async (contract: Contract, tokenAddress: string) => {
  const tokensReleased = await contract.queryFilter("TokensReleased");
  return tokensReleased.map((log) => ({
    blockNumber: log.blockNumber,
    tokenAddress,
    amount: log.args.amount,
    beneficiary: log.args.beneficiary,
  }));
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


const getReleasableAmountCallback = (contract) => async (grantId) => {
  return await contract.releasableAmount(grantId)
}

const releaseAndWithdrawCallback = (contract) => async (signer, grantId) => {
  const vestingContract = new Contract(contract.address, contract.interface, signer)
  const amount = await contract.computeReleasableAmount(grantId)
  return await vestingContract.release(grantId, amount)
}

export const getVestingData = async (
  chainId: number,
  contractAddress: string
) => {
  const provider = getProvider(chainId);
  const contract = new Contract(
    contractAddress,
    DOPEX_VESTING_CONTRACT_ABI,
    provider
  );

  const tokenAddress = await getTokenAddress(contract);
  const tokenDetails = await getTokenDetails(chainId, tokenAddress);
  const tokens = { [tokenAddress]: tokenDetails };

  const grants = await getGrants(contract, tokenAddress);
  const withdrawals = await getWithdrawals(contract, tokenAddress);
  const admins = await getAdmins(contract);

  // Totals
  const totalWithdrawnAmounts = getTotalWithdrawnAmounts(withdrawals);
  const totalAllocatedAmounts = getTotalAllocatedAmounts(grants);
  const totalVestedAmounts = getTotalVestedAmounts(grants);

  // Callbacks
  const releaseAndWithdraw = releaseAndWithdrawCallback(contract);
  const getReleasableAmount = getReleasableAmountCallback(contract);

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
