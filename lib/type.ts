import { BigNumber } from "ethers";

export interface IVestingData {
  grants?: IGrants[] | null;
  withdrawals?: IWithdrawals[] | null;
  totalWithdrawnAmounts: { [key: string]: BigNumber };
  totalAllocatedAmounts: { [key: string]: BigNumber };
  totalVestedAmounts: { [key: string]: BigNumber };
  tokens: { [key: string]: IToken };
  capabilities?: ICapabilities;
  admins?: any; // FIXME
  addVestingSchedule?: (signer: string, schedule: any) => Promise<any>;
  getReleasableAmount?: (id: string) => Promise<any>;
  releaseAndWithdraw?: (signer: any, id: any) => Promise<any>;
  getAdminTokenAllowance?: (tokenAddress: any, account: any) => Promise<any>;
}

export interface IGrants {
  id: string;
  beneficiary: string;
  tokenAddress: string;
  amount: BigNumber;
  vestedAmount: BigNumber;
  startTime: number;
  endTime: number;
  cliffTime: number;
  createdBlock: number;
  revokedBlock?: number | null;
  revokedTime?: null;
  isRevoked: boolean;
}

export interface IWithdrawals {
  blockNumber: number;
  tokenAddress: string;
  beneficiary: string;
  amount: string;
}
export interface IToken {
  tokenAddress: string;
  symbol: string;
  decimals: number;
}
export interface ICapabilities {
  multiToken: boolean;
  addVestingSchedule: boolean;
}
// copy paste the abi
// implement getVestingData
