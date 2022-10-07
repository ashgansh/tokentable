export const TOKENOPS_VESTING_CREATOR_CONTRACT_ADDRESS = {
  5: "0xD8b336e1160c4Ee1DcB37EC5aEdDA92c899510B5"
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
      },
      {
        "indexed": false,
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