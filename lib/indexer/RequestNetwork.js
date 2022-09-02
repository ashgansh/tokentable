import { BigNumber, Contract } from "ethers"
import { REQUEST_VESTING_ABI } from "../constants"
import { getProvider } from "../provider"

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

const getGrants = async (contract) => {
  const newGrantEvents = await contract.queryFilter("NewGrant")
  const revokedGrantEvents = await contract.queryFilter("GrantRevoked")

  const grants = newGrantEvents.map(log => {
    const { token: tokenAddress, vester: beneficiary, granter: admin, startTime, endTime, cliffTime } = log.args
    const revokedBlock = revokedGrantEvents
      .filter(revokedGrant => (
        admin === revokedGrant.args?.granter &&
        beneficiary === revokedGrant.args?.vester &&
        tokenAddress === revokedGrant.args?.token
      ))
      .shift()
      ?.blockNumber || null
    return {
      admin,
      beneficiary,
      tokenAddress,
      amount: log.args?.vestedAmount,
      startTime: startTime?.toNumber(),
      endTime: endTime?.toNumber(),
      cliffTime: cliffTime?.toNumber(),
      createdBlock: log.blockNumber,
      revokedBlock
    }
  })

  return grants
}

const getWithdrawals = async (contract) => {
  const withdrawalEvents = await contract.queryFilter("Withdraw")
  const withdrawals = withdrawalEvents.map(log => ({
    blockNumber: log.blockNumber,
    tokenAddress: log.args?.token,
    beneficiary: log.args?.user,
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

export const getVestingData = async (chainId, contractAddress) => {
  const provider = getProvider(chainId)
  const contract = new Contract(contractAddress, REQUEST_VESTING_ABI, provider)
  const grants = await getGrants(contract)
  const withdrawals = await getWithdrawals(contract)
  const totalWithdrawnAmounts = await getTotalWithdrawnAmounts(withdrawals)

  const tokenAddresses = [... new Set(grants.map(grant => grant.tokenAddress))]
  const tokenDetails = await Promise.all(
    tokenAddresses
      .map(async (tokenAddress) => ({
        tokenAddress,
        ...(await getTokenDetails(chainId, tokenAddress))
      }))
  )
  const tokens = tokenDetails.reduce((prev, current) => ({...prev, [current.tokenAddress]: current}), {})

  return {
    grants,
    withdrawals,
    totalWithdrawnAmounts,
    tokens
  }
}