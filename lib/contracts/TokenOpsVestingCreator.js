export const TOKENOPS_VESTING_CREATOR_CONTRACT_ADDRESS = {
  5: "0x3Da274c95823Aaa0717cc572FE2C9604Ec8bF4BD"
}
export const TOKENOPS_VESTING_CREATOR_CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "vestingContract",
        "type": "address"
      }
    ],
    "name": "VestingContractCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      }
    ],
    "name": "createVestingContract",
    "outputs": [
      {
        "internalType": "contract TokenVesting",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]