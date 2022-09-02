import { BigNumber, Contract } from "ethers"
import { ZORACLES_VESTING_ABI } from "../constants"
import { getProvider } from "../provider"

const getTokenAddress = async (contract) => {
  const tokenAddress = await contract.token()
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

const getGrants = async (contract, tokenAddress) => {
  const tokenVestedEvents = await contract.queryFilter("TokenVested")
  const grants = tokenVestedEvents.map(log => {
    const { beneficary: beneficiary, vestingStartTime, vestingPeriod, cliffPeriod, amount } = log.args
    const startTime = vestingStartTime?.toNumber()
    const endTime = startTime + (vestingPeriod * 24 * 60 * 60)
    const cliffTime = startTime + (cliffPeriod * 24 * 60 * 60)
    return {
      beneficiary,
      tokenAddress,
      amount: amount,
      startTime: startTime,
      endTime: endTime,
      cliffTime: cliffTime,
      createdBlock: log.blockNumber,
      revokedBlock: null,
      revokedTime: null
    }
  })
  return grants
}

const getWithdrawals = async (contract, tokenAddress) => {
  const withdrawalEvents = await contract.queryFilter("TokenReleased")
  const withdrawals = withdrawalEvents.map(log => ({
    blockNumber: log.blockNumber,
    tokenAddress: tokenAddress,
    beneficiary: log.args?.beneficary,
    amount: log.args?.amount
  }))
  return withdrawals
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
    const isRevoked = !!grant.revokedTime
    const prevAllocatedAmount = totalAllocatedAmounts?.[grant.tokenAddress] || BigNumber.from(0)
    const allocatedAmount = !isRevoked ? grant.amount : grant.amount.mul(grant.revokedTime - grant.startTime).div(grant.endTime - grant.startTime)
    const newAllocatedAmount = prevAllocatedAmount.add(allocatedAmount)
    return {
      ...totalAllocatedAmounts,
      [grant.tokenAddress]: newAllocatedAmount
    }
  }, {})
}

const getTotalVestedAmounts = (grants) => {
  return grants.reduce((totalVestedAmounts, grant) => {
    const isRevoked = !!grant.revokedTime
    const now = Math.min(
      isRevoked ? grant.revokeTime : Math.round(Date.now() / 1000),
      grant.endTime
    )
    const prevVestedAmount = totalVestedAmounts?.[grant.tokenAddress] || BigNumber.from(0)
    const currentVestedAmount = grant.amount.mul(now - grant.startTime).div(grant.endTime - grant.startTime)
    const newVestedAmount = prevVestedAmount.add(currentVestedAmount)
    return {
      ...totalVestedAmounts,
      [grant.tokenAddress]: newVestedAmount
    }
  }, {})
}

export const getVestingData = async (chainId, contractAddress) => {
  const provider = getProvider(chainId)
  const contract = new Contract(contractAddress, ZORACLES_VESTING_ABI, provider)

  const tokenAddress = await getTokenAddress(contract)
  const tokenDetails = await getTokenDetails(chainId, tokenAddress)
  const tokens = {[tokenAddress]: tokenDetails}

  const grants = await getGrants(contract, tokenAddress)
  const withdrawals = await getWithdrawals(contract, tokenAddress)
  const totalWithdrawnAmounts = await getTotalWithdrawnAmounts(withdrawals, tokenAddress)
  const totalAllocatedAmounts = await getTotalAllocatedAmounts(grants)
  const totalVestedAmounts = await getTotalVestedAmounts(grants)

  return {
    grants,
    withdrawals,
    totalWithdrawnAmounts,
    totalAllocatedAmounts,
    totalVestedAmounts,
    tokens
  }
}