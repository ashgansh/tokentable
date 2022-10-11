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
import {
    deleteFlowAsOperator,
    getSuperTokenContract,
    updateFlowPermissions,
} from '@/lib/superfluid/helpers';
import { ConstantFlowAgreementV1ABI } from '@/lib/superfluid/abi';
import { Contract } from 'ethers';

const CreateGelatoTaskButton = ({ chainId }) => {
    const { data: signer } = useSigner();
    const createGelatoTask = async () => {
        const superTokenContract = await getSuperTokenContract(
            'MATICx',
            137,
            signer
        );
        // Call Counter.increaseCount(42) every 10 minutes
        const constantFlowAgreementContract = new Contract(
            // proxy
            // '0x6EeE6060f715257b970700bc2656De21dEdF074C',
            // '0x31D5847E2b7c43b90Aee696519465a8d9F75E9EC',
            '0x3E14dC1b13c488a8d5D310918780c983bD5982E7',
            ConstantFlowAgreementV1ABI,
            signer
        );
        const gelatoOps = new GelatoOpsSDK(chainId, signer);

        // const fragment = iface.getFunction('balanceOf');
        // iface.getSighash(fragment);
        const { taskId, tx } = await gelatoOps.createTask({
            execAddress: constantFlowAgreementContract.address,
            execSelector: constantFlowAgreementContract.interface.getSighash(
                constantFlowAgreementContract.interface.getFunction(
                    'deleteFlowByOperator'
                )
            ),
            execData:
                constantFlowAgreementContract.interface.encodeFunctionData(
                    'deleteFlowByOperator',
                    //token, sender, receiver, ctx
                    [
                        superTokenContract.address,
                        '0x54a275FB2aC2391890c2E8471C39d85278C23cEe',
                        '0x69F5Bd7021858C3270A43aD7D719c6164CA6D174',
                        [],
                    ]
                ),
            execAbi: constantFlowAgreementContract.interface.format('json'),
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

const UpdateSream = ({ chainId, operator }) => {
    const { data: signer } = useSigner();
    const handleFlowPermissions = async () => {
        const result = await updateFlowPermissions({
            // this is gelato OPSv1
            // sender: '0x54a275FB2aC2391890c2E8471C39d85278C23cEe',
            operator,
            chainId,
            // delete permission
            permissionType: 4,
            signer,
            superTokenSymbol: 'MATICx',
        });
        console.log(result);
    };

    return <button onClick={handleFlowPermissions}>update</button>;
};
// as an operator
const DeleteStream = ({ chainId, recipient, sender }) => {
    const { data: signer } = useSigner();
    const handleDelete = async () => {
        const result = await deleteFlowAsOperator({
            sender,
            recipient,
            chainId,
            signer,
            superTokenSymbol: 'MATICx',
        });
        console.log(result);
    };

    return <button onClick={handleDelete}>delte</button>;
};

const Test = () => {
    const { isConnected } = useAccount();
    const hasHydrated = useHasHydrated();
    // account 5
    const sender = '0x54a275FB2aC2391890c2E8471C39d85278C23cEe';
    // account 1
    const recipient = '0x69F5Bd7021858C3270A43aD7D719c6164CA6D174';
    // account 3
    const operator = '0x4ee04BfC70DAAA8969f86634Ce8956Cf4014A0CD';
    if (!hasHydrated) return <></>;
    if (!isConnected) return <></>;
    console.log('yo');
    return (
        <LayoutWrapper>
            <div className="flex flex-col gap-3">
                {/* <AddStreamModal show chainId={137} onClose={() => null} /> */}
                <UpdateSream chainId={137} operator={operator} />
                <DeleteStream
                    chainId={137}
                    sender={sender}
                    recipient={recipient}
                />
                <CreateGelatoTaskButton chainId={137} />
                {/* <DeleteSuperfluidStreamButton /> */}
            </div>
        </LayoutWrapper>
    );
};

export default Test;
