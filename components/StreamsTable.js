import Moment from 'react-moment';

import {
  BoltIcon,
  ClipboardIcon,
  LinkIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { useTokenFormatter } from '@/lib/tokens';
import { shortAddress } from '@/lib/utils';
import { getAddressBlockExplorerLink } from '@/lib/provider';
import { BigNumber } from 'ethers';
import { useEffect, useMemo, useState } from 'react';
import { SecondaryButton } from './Button';
import { GelatoAutomationModal } from 'pages/test';
import EmptyVestingState from './EmptyVestingSate';

const SECONDS_IN_MONTH = 30 * 24 * 60 * 60;
const GELATO_AUTOMATION_ENABLED = false

const StreamedAmount = ({
  chainId,
  tokenAddress,
  flowRate,
  balance,
  balanceTimestamp,
}) => {
  const [streamedAmount, setStreamedAmount] = useState(balance);
  const formatToken = useTokenFormatter(chainId, tokenAddress);

  const balanceTimestampMs = useMemo(
    () => BigNumber.from(balanceTimestamp).mul(1000),
    [balanceTimestamp]
  );

  useEffect(() => {
    if (flowRate.isZero()) return;

    let stopAnimation = false;
    let lastAnimationTimestamp = 0;

    const animationStep = (currentAnimationTimestamp) => {
      if (stopAnimation) return;

      if (currentAnimationTimestamp - lastAnimationTimestamp > 80) {
        const now = BigNumber.from(Math.round(new Date().valueOf()));
        const streamedBalanceSinceTimestamp = now
          .sub(balanceTimestampMs)
          .mul(flowRate)
          .div(1000);
        const streamedAmount = balance.add(streamedBalanceSinceTimestamp);
        setStreamedAmount(streamedAmount);
        lastAnimationTimestamp = currentAnimationTimestamp;
      }
      window.requestAnimationFrame(animationStep);
    };
    window.requestAnimationFrame(animationStep);
    return () => {
      stopAnimation = true;
    };
  }, [balance, balanceTimestampMs, flowRate]);

  return <>{formatToken(streamedAmount, { digits: 6, symbol: 'prepend' })}</>;
};

const StreamRow = ({ stream, chainId, onCancelStream }) => {
  const beneficiaryLink = getAddressBlockExplorerLink(chainId, stream.receiver);
  const copyBeneficiaryToClipboard = () =>
    navigator.clipboard.writeText(stream.receiver);
  const formatToken = useTokenFormatter(chainId, stream.token.id);
  const balance = BigNumber.from(stream.streamedUntilUpdatedAt);
  const balanceTimestamp = Math.max(
    Number(stream.createdAtTimestamp),
    Number(stream.updatedAtTimestamp)
  );
  const flowRate = BigNumber.from(stream.currentFlowRate);

  const handleCancelStream = () => {
    onCancelStream(stream.receiver, stream.token.id);
  };

  return (
    <tr className="border-t">
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        <div className="group flex gap-1">
          {shortAddress(stream.receiver)}
          <a
            className="invisible text-gray-500 hover:cursor-pointer hover:text-gray-900 group-hover:visible"
            href={beneficiaryLink}
            alt="Block Explorer Link"
            target="_blank"
            rel="noreferrer"
          >
            <LinkIcon className="h-4" />
          </a>
          <span
            className="invisible text-gray-500 hover:cursor-pointer hover:text-gray-900 group-hover:visible"
            onClick={copyBeneficiaryToClipboard}
          >
            <ClipboardIcon className="h-4" />
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {formatToken(flowRate.mul(SECONDS_IN_MONTH), { symbol: 'prepend' })}
      </td>
      <td className="w-1/4 whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
        <StreamedAmount
          chainId={chainId}
          tokenAddress={stream.token.id}
          balance={balance}
          balanceTimestamp={balanceTimestamp}
          flowRate={flowRate}
        />
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <Moment format="YYYY-MM-DD" unix date={stream.createdAtTimestamp} />
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <Moment format="YYYY-MM-DD" unix date={stream.updatedAtTimestamp} />
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {onCancelStream && !flowRate.isZero() && (
          <SecondaryButton onClick={handleCancelStream}>
            <XMarkIcon className="h-4 w-4" />
            Cancel
          </SecondaryButton>
        )}
      </td>
      {GELATO_AUTOMATION_ENABLED && (
        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
          <GelatoAutomationModal
            sender={stream.sender}
            recipient={stream.receiver}
            superTokenSymbol={stream.token.symbol}
          >
            <BoltIcon className="w-4 text-white" />
            Automate
          </GelatoAutomationModal>
        </td>
      )}
    </tr>
  );
};

const LoadingGrantRow = () => (
  <tr className="border-t">
    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
      <div className="w-32 animate-pulse rounded-md bg-gray-300 text-sm">
        &nbsp;
      </div>
    </td>
    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
      <div className="w-16 animate-pulse rounded-md bg-gray-300 text-sm">
        &nbsp;
      </div>
    </td>
    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
      <div className="w-16 animate-pulse rounded-md bg-gray-300 text-sm">
        &nbsp;
      </div>
    </td>
    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
      <div className="w-16 animate-pulse rounded-md bg-gray-300 text-sm">
        &nbsp;
      </div>
    </td>
    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
      <div className="w-16 animate-pulse rounded-md bg-gray-300 text-sm">
        &nbsp;
      </div>
    </td>
    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"></td>
  </tr>
);

const VestingTable = ({ streams, chainId, isLoading, onCancelStream }) => {
  return (
    <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full">
            <thead className="bg-white">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                >
                  Stakeholder
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Amount / Month
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Vested Amount
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Start
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Updated
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                ></th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {streams.map((stream, idx) => (
                <StreamRow
                  key={idx}
                  stream={stream}
                  chainId={chainId}
                  onCancelStream={onCancelStream}
                />
              ))}
              {isLoading && <LoadingGrantRow />}
            </tbody>
          </table>
          {streams.length === 0 && !isLoading && (
            <EmptyVestingState className="bg-white py-4">
              {/* <PrimaryButton>
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                New vesting
              </PrimaryButton> */}
            </EmptyVestingState>
          )}
        </div>
      </div>
    </div>
  );
};

export default VestingTable;
