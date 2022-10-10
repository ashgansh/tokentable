import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Framework } from '@superfluid-finance/sdk-core';
import { useAccount, useNetwork, useSigner } from 'wagmi';
import { useController, useForm } from 'react-hook-form';
import { isAddress, parseEther } from 'ethers/lib/utils';
import { Combobox } from '@headlessui/react';
import {
  ArrowsRightLeftIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import axios from 'axios';

import { formatAddress, classNames, formatCurrency } from '@/lib/utils';
import { tokenStore, useTokenPrice } from '@/lib/tokens';
import { getProvider } from '@/lib/provider';

import { LayoutWrapper } from '@/components/LayoutWrapper';
import {
  Modal,
  ModalActionFooter,
  ModalBody,
  ModalTitle,
} from '@/components/Modal';
import { Label, Input, CurrencyInput } from '@/components/Input';
import { PrimaryButton } from '@/components/Button';
import Spinner from '@/components/Spinner';
import StreamsTable from '@/components/StreamsTable';
import { GelatoOpsSDK } from '@gelatonetwork/ops-sdk';
import { AddStreamModal } from './superfluid/[chainId]/[senderAccount]';
import { useHasHydrated } from '@/lib/hooks';
import { updateFlowPermissions } from '@/lib/superfluidHelpers';





const CreateGelatoTaskButton = ({ chainId }) => {
  const { data: signer } = useSigner();

  const createGelatoTask = async () => {
    // Call Counter.increaseCount(42) every 10 minutes
    const gelatoOps = new GelatoOpsSDK(chainId, signer);
    const { taskId, tx } = await gelatoOps.createTask({
      execAddress: counter.address,
      execSelector: counter.interface.getSighash('increaseCount(uint256)'),
      execData: counter.interface.encodeFunctionData('increaseCount', [42]),
      execAbi: counter.interface.format('json'),
      startTime: 120,
      name: 'Stop superfluid stream in 120 seconds',
      dedicatedMsgSender: true,
    });
  };
  const handleGelato = () => {
    createGelatoTask();
  };
  return <button onClick={handleGelato}>create gelato task</button>;
};

const UpdateSream = ({ chainId }) => {
  const { data: signer } = useSigner();
  const handleFlowPermissions = async () => {
    const result = await updateFlowPermissions({
      operator: '0x527a819db1eb0e34426297b03bae11F2f8B3A19E',
      chainId,
      permissionType: 4,
      signer,
      superTokenSymbol: 'MATICx',
    });
    console.log(result);
  };

  return <button onClick={handleFlowPermissions}>update</button>;
};

const Test = () => {
  const { isConnected } = useAccount();
  const hasHydrated = useHasHydrated();
  if (!hasHydrated) return <></>;
  if (!isConnected) return <></>;
  console.log('yo');
  return (
    <LayoutWrapper>
      <div className="flex flex-col gap-3">
        <AddStreamModal show chainId={137} onClose={() => null} />
        <UpdateSream chainId={137} />
        <CreateGelatoTaskButton chainId={137} />
        {/* <DeleteSuperfluidStreamButton /> */}
      </div>
    </LayoutWrapper>
  );
};

export default Test;
