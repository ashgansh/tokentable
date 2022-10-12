import Banner from "@/components/Alert";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { useHasHydrated } from "@/lib/hooks";
import { LinkIcon } from "@heroicons/react/24/outline";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const { useAccount, useNetwork } = require("wagmi");
const {
  Superfluid,
  SUPERFLUID_WRAP_URL,
} = require("./[chainId]/[senderAccount]");

const SuperfluidDynamic = () => {
  const { address: account } = useAccount();
  const { chain } = useNetwork();
  const hasHydrated = useHasHydrated();
  const isSupportedChain = chain?.id === 137;

  if (!hasHydrated) return;
  return (
    <LayoutWrapper>
      <Banner color="bg-transparent text-tokenops-primary-600 ml-5 ">
        Get wrapped tokens
        <a
          className="ml-1 flex underline"
          target="_blank"
          rel="noreferrer"
          href={SUPERFLUID_WRAP_URL}
        >
          {" here"}
          <LinkIcon className="h-5 w-5" />
        </a>
      </Banner>

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
