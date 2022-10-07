export const ERC20_REQ = "0x8f8221aFbB33998d8584A2B05749bA73c37a938a"
export const ERC20_SYMBOLS = {
  [ERC20_REQ]: "REQ"
}


// Chain ID 1
export const REQUEST_VESTING_CONTRACT = "0x45e6ff0885ebf5d616e460d14855455d92d6cc04"
export const REQUEST_VESTING_ABI = [
  {
    "constant": false,
    "inputs": [
      {
        "name": "_token",
        "type": "address"
      },
      {
        "name": "_vester",
        "type": "address"
      },
      {
        "name": "_vestedAmount",
        "type": "uint256"
      },
      {
        "name": "_startTime",
        "type": "uint64"
      },
      {
        "name": "_grantPeriod",
        "type": "uint64"
      },
      {
        "name": "_cliffPeriod",
        "type": "uint64"
      }
    ],
    "name": "createVesting",
    "outputs": [

    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_token",
        "type": "address"
      },
      {
        "name": "_granter",
        "type": "address"
      },
      {
        "name": "_vester",
        "type": "address"
      }
    ],
    "name": "getVestingBalance",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "address"
      },
      {
        "name": "",
        "type": "address"
      },
      {
        "name": "",
        "type": "address"
      }
    ],
    "name": "grantPerTokenGranterVester",
    "outputs": [
      {
        "name": "vestedAmount",
        "type": "uint256"
      },
      {
        "name": "startTime",
        "type": "uint64"
      },
      {
        "name": "cliffTime",
        "type": "uint64"
      },
      {
        "name": "endTime",
        "type": "uint64"
      },
      {
        "name": "withdrawnAmount",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_token",
        "type": "address"
      },
      {
        "name": "_vester",
        "type": "address"
      }
    ],
    "name": "revokeVesting",
    "outputs": [

    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_token",
        "type": "address"
      },
      {
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "deposit",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_token",
        "type": "address"
      }
    ],
    "name": "withdraw",
    "outputs": [

    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_token",
        "type": "address"
      },
      {
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getContractBalance",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_token",
        "type": "address"
      },
      {
        "name": "_granter",
        "type": "address"
      },
      {
        "name": "_doWithdraw",
        "type": "bool"
      }
    ],
    "name": "releaseGrant",
    "outputs": [

    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "granter",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "vester",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "vestedAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "startTime",
        "type": "uint64"
      },
      {
        "indexed": false,
        "name": "cliffTime",
        "type": "uint64"
      },
      {
        "indexed": false,
        "name": "endTime",
        "type": "uint64"
      }
    ],
    "name": "NewGrant",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "granter",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "vester",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "token",
        "type": "address"
      }
    ],
    "name": "GrantRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "granter",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "name": "balance",
        "type": "uint256"
      }
    ],
    "name": "Deposit",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "granter",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "vester",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "TokenReleased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Withdraw",
    "type": "event"
  }
]

// Chain ID 1
export const ZORACLES_VESTING_CONTRACT = "0x2369921551f2417d8d5cD4C1EDb1ac7eEe156380"
export const ZORACLES_VESTING_ABI = [
  {
    "inputs": [
      {
        "internalType": "contract IERC20",
        "name": "token_",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "beneficary",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "TokenReleased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "beneficary",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "cliffPeriod",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "vestingPeriod",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "vestingStartTime",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "withdrawalPerDay",
        "type": "uint256"
      }
    ],
    "name": "TokenVested",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "addressInfo",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "vestedTokens",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "cliffPeriod",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "vestingPeriod",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "vestingStartTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "withdrawalPerDay",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "beneficiary",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "cliffPeriod",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "vestingPeriod",
        "type": "uint256"
      }
    ],
    "name": "deposit",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "beneficiary",
        "type": "address"
      }
    ],
    "name": "getAvailableTokens",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [

    ],
    "name": "token",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "tokensAlreadyWithdrawn",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [

    ],
    "name": "totalTokensVested",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [

    ],
    "name": "withdraw",
    "outputs": [

    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

// Chain ID 1
export const ALPHA_VESTING_ABI = [
  {
    "name": "Fund",
    "inputs": [
      {
        "type": "address",
        "name": "recipient",
        "indexed": true
      },
      {
        "type": "uint256",
        "name": "amount",
        "indexed": false
      }
    ],
    "anonymous": false,
    "type": "event"
  },
  {
    "name": "Claim",
    "inputs": [
      {
        "type": "address",
        "name": "recipient",
        "indexed": true
      },
      {
        "type": "uint256",
        "name": "claimed",
        "indexed": false
      }
    ],
    "anonymous": false,
    "type": "event"
  },
  {
    "name": "ToggleDisable",
    "inputs": [
      {
        "type": "address",
        "name": "recipient",
        "indexed": false
      },
      {
        "type": "bool",
        "name": "disabled",
        "indexed": false
      }
    ],
    "anonymous": false,
    "type": "event"
  },
  {
    "name": "CommitOwnership",
    "inputs": [
      {
        "type": "address",
        "name": "admin",
        "indexed": false
      }
    ],
    "anonymous": false,
    "type": "event"
  },
  {
    "name": "ApplyOwnership",
    "inputs": [
      {
        "type": "address",
        "name": "admin",
        "indexed": false
      }
    ],
    "anonymous": false,
    "type": "event"
  },
  {
    "outputs": [

    ],
    "inputs": [
      {
        "type": "address",
        "name": "_token"
      },
      {
        "type": "uint256",
        "name": "_start_time"
      },
      {
        "type": "uint256",
        "name": "_end_time"
      },
      {
        "type": "bool",
        "name": "_can_disable"
      },
      {
        "type": "address[4]",
        "name": "_fund_admins"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "name": "add_tokens",
    "outputs": [

    ],
    "inputs": [
      {
        "type": "uint256",
        "name": "_amount"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function",
    "gas": 39108
  },
  {
    "name": "fund",
    "outputs": [

    ],
    "inputs": [
      {
        "type": "address[100]",
        "name": "_recipients"
      },
      {
        "type": "uint256[100]",
        "name": "_amounts"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function",
    "gas": 3962646
  },
  {
    "name": "toggle_disable",
    "outputs": [

    ],
    "inputs": [
      {
        "type": "address",
        "name": "_recipient"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function",
    "gas": 40280
  },
  {
    "name": "disable_can_disable",
    "outputs": [

    ],
    "inputs": [

    ],
    "stateMutability": "nonpayable",
    "type": "function",
    "gas": 21295
  },
  {
    "name": "disable_fund_admins",
    "outputs": [

    ],
    "inputs": [

    ],
    "stateMutability": "nonpayable",
    "type": "function",
    "gas": 21325
  },
  {
    "name": "vestedSupply",
    "outputs": [
      {
        "type": "uint256",
        "name": ""
      }
    ],
    "inputs": [

    ],
    "stateMutability": "view",
    "type": "function",
    "gas": 4468
  },
  {
    "name": "lockedSupply",
    "outputs": [
      {
        "type": "uint256",
        "name": ""
      }
    ],
    "inputs": [

    ],
    "stateMutability": "view",
    "type": "function",
    "gas": 5465
  },
  {
    "name": "vestedOf",
    "outputs": [
      {
        "type": "uint256",
        "name": ""
      }
    ],
    "inputs": [
      {
        "type": "address",
        "name": "_recipient"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "gas": 5163
  },
  {
    "name": "balanceOf",
    "outputs": [
      {
        "type": "uint256",
        "name": ""
      }
    ],
    "inputs": [
      {
        "type": "address",
        "name": "_recipient"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "gas": 6275
  },
  {
    "name": "lockedOf",
    "outputs": [
      {
        "type": "uint256",
        "name": ""
      }
    ],
    "inputs": [
      {
        "type": "address",
        "name": "_recipient"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "gas": 6305
  },
  {
    "name": "claim",
    "outputs": [

    ],
    "inputs": [

    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "name": "claim",
    "outputs": [

    ],
    "inputs": [
      {
        "type": "address",
        "name": "addr"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "name": "commit_transfer_ownership",
    "outputs": [
      {
        "type": "bool",
        "name": ""
      }
    ],
    "inputs": [
      {
        "type": "address",
        "name": "addr"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function",
    "gas": 38032
  },
  {
    "name": "apply_transfer_ownership",
    "outputs": [
      {
        "type": "bool",
        "name": ""
      }
    ],
    "inputs": [

    ],
    "stateMutability": "nonpayable",
    "type": "function",
    "gas": 38932
  },
  {
    "name": "token",
    "outputs": [
      {
        "type": "address",
        "name": ""
      }
    ],
    "inputs": [

    ],
    "stateMutability": "view",
    "type": "function",
    "gas": 1601
  },
  {
    "name": "start_time",
    "outputs": [
      {
        "type": "uint256",
        "name": ""
      }
    ],
    "inputs": [

    ],
    "stateMutability": "view",
    "type": "function",
    "gas": 1631
  },
  {
    "name": "end_time",
    "outputs": [
      {
        "type": "uint256",
        "name": ""
      }
    ],
    "inputs": [

    ],
    "stateMutability": "view",
    "type": "function",
    "gas": 1661
  },
  {
    "name": "initial_locked",
    "outputs": [
      {
        "type": "uint256",
        "name": ""
      }
    ],
    "inputs": [
      {
        "type": "address",
        "name": "arg0"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "gas": 1845
  },
  {
    "name": "total_claimed",
    "outputs": [
      {
        "type": "uint256",
        "name": ""
      }
    ],
    "inputs": [
      {
        "type": "address",
        "name": "arg0"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "gas": 1875
  },
  {
    "name": "initial_locked_supply",
    "outputs": [
      {
        "type": "uint256",
        "name": ""
      }
    ],
    "inputs": [

    ],
    "stateMutability": "view",
    "type": "function",
    "gas": 1751
  },
  {
    "name": "unallocated_supply",
    "outputs": [
      {
        "type": "uint256",
        "name": ""
      }
    ],
    "inputs": [

    ],
    "stateMutability": "view",
    "type": "function",
    "gas": 1781
  },
  {
    "name": "can_disable",
    "outputs": [
      {
        "type": "bool",
        "name": ""
      }
    ],
    "inputs": [

    ],
    "stateMutability": "view",
    "type": "function",
    "gas": 1811
  },
  {
    "name": "disabled_at",
    "outputs": [
      {
        "type": "uint256",
        "name": ""
      }
    ],
    "inputs": [
      {
        "type": "address",
        "name": "arg0"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "gas": 1995
  },
  {
    "name": "admin",
    "outputs": [
      {
        "type": "address",
        "name": ""
      }
    ],
    "inputs": [

    ],
    "stateMutability": "view",
    "type": "function",
    "gas": 1871
  },
  {
    "name": "future_admin",
    "outputs": [
      {
        "type": "address",
        "name": ""
      }
    ],
    "inputs": [

    ],
    "stateMutability": "view",
    "type": "function",
    "gas": 1901
  },
  {
    "name": "fund_admins_enabled",
    "outputs": [
      {
        "type": "bool",
        "name": ""
      }
    ],
    "inputs": [

    ],
    "stateMutability": "view",
    "type": "function",
    "gas": 1931
  },
  {
    "name": "fund_admins",
    "outputs": [
      {
        "type": "bool",
        "name": ""
      }
    ],
    "inputs": [
      {
        "type": "address",
        "name": "arg0"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "gas": 2115
  }
]