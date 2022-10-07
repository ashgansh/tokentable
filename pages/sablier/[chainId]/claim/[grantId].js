import { PrimaryButton } from "@/components/Button";
import Spinner from "@/components/Spinner";
import SwitchChainButton from "@/components/SwitchChainButton";
import { classNames } from "@/lib/utils";
import Moment from "react-moment";

export const Card = ({ children, className }) => (
  <div
    className={classNames(
      "border border-gray-200 shadow rounded-lg px-4 py-4 px-6 bg-white",
      className
    )}
  >
    {children}
  </div>
);

const SablierClaim = () => {
  const ItemTitle = ({ children, className }) => (
    <h4 className="text-sm text-bold text-gray-900 py-1">{children}</h4>
  );
  const handleReleaseAndWithdraw = async () => {};
  const canClaim = true;
  const isConnectedWithCorrectChain = true;
  const isClaiming = false;

  const startTime = 0;
  const endTime = 2;

  return (
    <Card>
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <div className="flex flex-col">
            <ItemTitle>Claimable</ItemTitle>
            <span className="text-lg"></span>
          </div>
          <div>
            {canClaim && isConnectedWithCorrectChain && (
              <PrimaryButton
                onClick={handleReleaseAndWithdraw}
                disabled={isClaiming}
              >
                <span className="inline-flex items-center gap-1.5">
                  {isClaiming && <Spinner className="h-4 w-4" />}
                  {isClaiming && <span>Claiming</span>}
                  {!isClaiming && <span>Claim</span>}
                </span>
              </PrimaryButton>
            )}
            {canClaim && !isConnectedWithCorrectChain && (
              <SwitchChainButton chainId={chainId} />
            )}
          </div>
        </div>
        <div>
          <ItemTitle>Status</ItemTitle>
          <span className="text-lg">Vesting</span>
        </div>
        <div>
          <ItemTitle>Allocation</ItemTitle>
          <span className="text-lg"></span>
        </div>
        <div className="w-48">
          <div className="flex justify-between items-center">
            <ItemTitle>Vested</ItemTitle>
            <span className="text-sm text-gray-500 py-2.5"></span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: "90%" }}
            ></div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 py-1.5">
              <Moment unix format="MMM YYYY">
                {startTime}
              </Moment>
            </span>
            <span className="text-sm text-gray-500 py-1.5">
              <Moment unix format="MMM YYYY">
                {endTime}
              </Moment>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SablierClaim;
