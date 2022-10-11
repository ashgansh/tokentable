import { LayoutWrapper } from '@/components/LayoutWrapper';
import { useHasHydrated } from '@/lib/hooks';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const { useAccount, useNetwork } = require('wagmi');
const { Superfluid } = require('./[chainId]/[senderAccount]');

const SuperfluidDynamic = () => {
    const { address: account } = useAccount();
    const { chain } = useNetwork();
    const hasHydrated = useHasHydrated();
    const isSupportedChain = chain?.id === 137;

    if (!account) return;
    if (!hasHydrated) return;
    return (
        <LayoutWrapper>
            {isSupportedChain && (
                <Superfluid
                    isLockedChain={false}
                    chainId={chain?.id}
                    senderAccount={account}
                />
            )}
            {!isSupportedChain && (
                <div className="flex justify-center">
                    We currently only support Superfluid on polygon
                </div>
            )}
        </LayoutWrapper>
    );
};

export default SuperfluidDynamic;
