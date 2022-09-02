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
  return []
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

export const getVestingData = async (chainId, contractAddress) => {
  const provider = getProvider(chainId)
  const contract = new Contract(contractAddress, ZORACLES_VESTING_ABI, provider)

  const tokenAddress = await getTokenAddress(contract)
  const tokenDetails = await getTokenDetails(chainId, tokenAddress)
  const tokens = {[tokenAddress]: tokenDetails}

  const grants = await getGrants(contract, tokenAddress)
  const withdrawals = await getWithdrawals(contract, tokenAddress)
  const totalWithdrawnAmounts = await getTotalWithdrawnAmounts(withdrawals)


  return {
    grants,
    withdrawals,
    totalWithdrawnAmounts,
    tokens
  }
}