export const TOKENOPS_VESTING_CREATOR_CONTRACT_ADDRESS = {
  5: "0xE9249Fe185B4C475eA06B896bC98f56a0b6738ae"
}
export const TOKENOPS_VESTING_CREATOR_CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "vestingContract",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
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