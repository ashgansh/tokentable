import { BigNumber, Contract } from "ethers"
import { erc20ABI } from "wagmi"
import { TOKENOPS_VESTING_CONTRACT_ABI } from "../contracts/TokenOpsVesting"
import { getProvider } from "../provider"

const getTokenAddress = async (contract) => {
  const tokenAddress = await contract.getToken()
  return tokenAddress
}

const getTokenDetails = async (chainId, tokenAddress) => {
  const ERC20Abi = [
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
  ]
  const provider = getProvider(chainId)
  const tokenContract = new Contract(tokenAddress, ERC20Abi, provider)
  const [symbol, decimals] = await Promise.all([
    await tokenContract.symbol(),
    await tokenContract.decimals(),
  ])
  return { symbol, decimals }
}

const getGrantsAndWithdrawals = async (contract, tokenAddress) => {
  const schedulesCount = await contract.getVestingSchedulesCount()
  const scheduleIds = await Promise.all(
    Array.from(
      { length: schedulesCount },
      async (_, index) => await contract.getVestingIdAtIndex(index)
    )
  )

  const schedules = await Promise.all(
    scheduleIds.map(async scheduleId => ({ scheduleId, ...(await contract.getVestingSchedule(scheduleId)) }))
  )

  const grants = schedules.map(async schedule => {
    const { scheduleId, beneficiary, start, cliff, duration, amountTotal: amount, released, revoked, slicePeriodSeconds } = schedule
    const startTime = start.toNumber()
    const cliffTime = cliff.toNumber()
    const endTime = startTime + (duration.toNumber() * slicePeriodSeconds.toNumber())
    const vestedAmount = revoked ? (
      released
    ) : (
      released.add(await contract.computeReleasableAmount(scheduleId))
    )

    return {
      id: scheduleId,
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
      isRevoked: revoked
    }
  })

  const withdrawals = schedules.map(schedule => ({
    blockNumber: null,
    tokenAddress: tokenAddress,
    beneficiary: schedule.beneficiary,
    amount: schedule.released
  }))

  return {
    grants: await Promise.all(grants),
    withdrawals
  }
}

const getTotalWithdrawnAmounts = (withdrawals) => {
  return withdrawals.reduce((prev, current) => {
    const prevAmount = prev?.[current.tokenAddress] || BigNumber.from(0)
    const newAmount = prevAmount.add(current.amount)
    return {
      ...prev,
      [current.tokenAddress]: newAmount
    }
  }, {})
}

const getTotalAllocatedAmounts = (grants) => {
  return grants.reduce((totalAllocatedAmounts, grant) => {
    const prevAllocatedAmount = totalAllocatedAmounts?.[grant.tokenAddress] || BigNumber.from(0)
    const allocatedAmount = grant.isRevoked ? grant.vestedAmount : grant.amount
    const newAllocatedAmount = prevAllocatedAmount.add(allocatedAmount)
    return {
      ...totalAllocatedAmounts,
      [grant.tokenAddress]: newAllocatedAmount
    }
  }, {})
}

const getTotalVestedAmounts = (grants) => {
  return grants.reduce((totalVestedAmounts, grant) => {
    const prevVestedAmount = totalVestedAmounts?.[grant.tokenAddress] || BigNumber.from(0)
    const newVestedAmount = prevVestedAmount.add(grant.vestedAmount)
    return {
      ...totalVestedAmounts,
      [grant.tokenAddress]: newVestedAmount
    }
  }, {})
}

const getAdmins = async (contract) => {
  return [await contract.owner()]
}

const addVestingScheduleCallback = (vestingContract) => async (signer, schedule) => {
  const { startTime, endTime, amount, beneficiary } = schedule

  const cliff = 0
  const duration = endTime - startTime
  const slicePeriodSeconds = 1
  const revocable = true

  const tx = await vestingContract.populateTransaction.createVestingSchedule(
    beneficiary,
    startTime,
    cliff,
    duration,
    slicePeriodSeconds,
    revocable,
    amount
  )
  return [tx]
}

const addFundsCallback = (contractAddress, tokenAddress) => async (amount) => {
  const tokenContract = new Contract(tokenAddress, erc20ABI);
  const tx = await tokenContract.populateTransaction.transfer(contractAddress, amount);
  return tx
}

const getReleasableAmountCallback = (contract) => async (scheduleId) => {
  return await contract.computeReleasableAmount(scheduleId)
}

const releaseAndWithdrawCallback = (contract) => async (signer, scheduleId) => {
  const vestingContract = new Contract(contract.address, contract.interface, signer)
  const amount = await contract.computeReleasableAmount(scheduleId)
  return await vestingContract.release(scheduleId, amount)
}

const getAdminTokenAllowanceCallback = (contract, contractTokenAddress, admins) => async (tokenAddress, account) => {
  if (contractTokenAddress !== tokenAddress) return BigNumber.from(0)
  if (!admins.includes(account)) return BigNumber.from(0)
  return await contract.getWithdrawableAmount()
}

export const getVestingData = async (chainId, contractAddress) => {
  const provider = getProvider(chainId)
  const contract = new Contract(contractAddress, TOKENOPS_VESTING_CONTRACT_ABI, provider)
  const tokenAddress = await getTokenAddress(contract)
  const tokenDetails = await getTokenDetails(chainId, tokenAddress)
  const tokens = { [tokenAddress]: tokenDetails }

  const { grants, withdrawals } = await getGrantsAndWithdrawals(contract, tokenAddress)
  const admins = await getAdmins(contract)

  // Totals
  const totalWithdrawnAmounts = await getTotalWithdrawnAmounts(withdrawals)
  const totalAllocatedAmounts = getTotalAllocatedAmounts(grants)
  const totalVestedAmounts = getTotalVestedAmounts(grants)

  // Callbacks
  const addVestingSchedule = addVestingScheduleCallback(contract)
  const releaseAndWithdraw = releaseAndWithdrawCallback(contract)
  const addFunds = addFundsCallback(contractAddress, tokenAddress)
  const getReleasableAmount = getReleasableAmountCallback(contract, grants)
  const getAdminTokenAllowance = getAdminTokenAllowanceCallback(contract, tokenAddress, admins)

  // Capabilities
  const capabilities = {
    multiToken: false,
    addVestingSchedule: true,
    fundable: true
  }

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
    addFunds,
    getReleasableAmount,
    releaseAndWithdraw,
    getAdminTokenAllowance
  }
}