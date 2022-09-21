import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useDisconnect } from 'wagmi';

const AccountButton = () => {
  const { disconnect } = useDisconnect()

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');
        return (() => {
          if (!connected) {
            return (
              <button className="w-full text-center text-sm text-gray-500 p-4" onClick={openConnectModal} type="button">
                Connect
              </button>
            );
          }
          if (chain.unsupported) {
            return (
              <button className="w-full text-center text-sm text-gray-500 p-4" onClick={openChainModal} type="button">
                Switch chain
              </button>
            );
          }
          return (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <button onClick={openAccountModal} type="button" className="text-left grow p-4">
                {account.displayName}
              </button>
              <button onClick={disconnect} type="button" className="p-4">
                <ArrowRightOnRectangleIcon className="h-4" />
              </button>
            </div>
          );
        })()
          ;
      }}
    </ConnectButton.Custom>
  );
};

export default AccountButton