import { Contract, BigNumber } from "ethers";

import { DSS_VEST_CONTRACT_ABI } from "@/lib/contracts/DssVest";
import { getProvider } from "@/lib/provider";

const getTokenAddress = async (contract: Contract) => await contract.gem();
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

const getAdmins = async (contract: Contract) => {
  const relyFilter = contract.filters.Rely();
  const denyFilter = contract.filters.Deny();
  const topics = [[...relyFilter.topics, ...denyFilter.topics]];
  const events = await contract.queryFilter({ topics: topics });

  const admins = events.reduce((admins, log) => {
    const event = contract.interface.parseLog(log);
    const {
      name,
      args: { usr },
    } = event;
    if (name === "Rely") return [...admins, usr];
    if (name === "Deny") return admins.filter((admin) => admin !== usr);
    return admins;
  }, []);

  return admins;
};

const getGrantsAndWithdrawals = async (contract: Contract, tokenAddress: string) => {
  const grantIds = Array.from({ length: 10 }, (_, i) => i + 1);

  const grants = await Promise.all(
    grantIds.map(async (id) => {
      const { usr, bgn, clf, fin, tot } = await contract.awards(id);
      const yankEvents = await contract.queryFilter(contract.filters.Yank(id));
      const revokedBlock = yankEvents.shift()?.blockNumber || null;
      const revokedTime = revokedBlock
        ? (await contract.provider.getBlock(revokedBlock)).timestamp
        : null;

      return {
        id,
        beneficiary: usr,
        tokenAddress,
        amount: tot,
        vestedAmount: await contract.accrued(id),
        startTime: bgn,
        endTime: fin,
        cliffTime: clf,
        createdBlock: null,
        revokedBlock: revokedBlock,
        revokedTime: revokedTime,
        isRevoked: !!revokedBlock,
      };
    })
  );

  const withdrawalEvents = await contract.queryFilter("Vest");
  const withdrawals = withdrawalEvents.map((event) => ({
    blockNumber: event.blockNumber,
    tokenAddress: tokenAddress,
    beneficiary: grants.find((grant) => grant.id === event.args?.id)
      ?.beneficiary,
    amount: event.args?.amt,
  }));
  return [grants, withdrawals];
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

const releaseAndWithdrawCallback = (contract) => async (signer, id) => {
  const vestingContract = new Contract(
    contract.address,
    contract.interface,
    signer
  );
  return await vestingContract.vest(id);
};

const getReleasableAmountCallback = (contract) => async (id) => {
  return await contract.unpaid(id);
};

export const getVestingData = async (
  chainId: number,
  contractAddress: string
) => {
  const provider = getProvider(chainId);
  const contract = new Contract(
    contractAddress,
    DSS_VEST_CONTRACT_ABI,
    provider
  );

  const tokenAddress = await getTokenAddress(contract);
  const tokenDetails = await getTokenDetails(chainId, tokenAddress);
  const tokens = { [tokenAddress]: tokenDetails };

  const [grants, withdrawals] = await getGrantsAndWithdrawals(contract, tokenAddress);
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
