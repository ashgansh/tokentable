import { LayoutWrapper } from '@/components/LayoutWrapper';
import {
    TOKENOPS_VESTING_CREATOR_CONTRACT_ABI,
    TOKENOPS_VESTING_CREATOR_CONTRACT_ADDRESS,
} from '@/lib/contracts/TokenOpsVestingCreator';
import { getProvider } from '@wagmi/core';
import { Contract } from 'ethers';
import objectHash from 'object-hash';
import { useAccount, useContractEvent } from 'wagmi';
import { PortfolioItemList } from './portfolio';

const { useState, useEffect } = require('react');

const App = () => {
    const [vestingContracts, setVestingContracts] = useState([]);
    const { address: account } = useAccount();
    const provider = getProvider(5);
    useEffect(() => {
        if (!account) return;
        const contract = new Contract(
            TOKENOPS_VESTING_CREATOR_CONTRACT_ADDRESS,
            TOKENOPS_VESTING_CREATOR_CONTRACT_ABI,
            provider
        );
        const hello = contract.filters.VestingContractCreated(null, account);
        console.log(hello);
    }, [account, provider]);
    return (
        <LayoutWrapper>
            <div>
                {vestingContracts.map((contract) => (
                    <div key={contract}>{contract}</div>
                ))}
            </div>
        </LayoutWrapper>
    );
};

export default App;
