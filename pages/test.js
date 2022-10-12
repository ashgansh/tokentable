import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Framework } from '@superfluid-finance/sdk-core';
import { useAccount, useNetwork, useSigner } from 'wagmi';
import { useController, useForm } from 'react-hook-form';
import { Interface, isAddress, parseEther } from 'ethers/lib/utils';
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
import { ConstantFlowAgreementV1ABI, HostABI } from '@/lib/superfluid/abi';
import { Contract } from 'ethers';

// proxy
// '0x31D5847E2b7c43b90Aee696519465a8d9F75E9EC',
// '0x3E14dC1b13c488a8d5D310918780c983bD5982E7',

const CreateGelatoTaskButton = ({
    chainId,
    contractToAutomate,
    sender,
    recipient,
}) => {
    const { data: signer } = useSigner();
    const createGelatoTask = async () => {
        const superTokenContract = await getSuperTokenContract(
            'MATICx',
            chainId,
            signer
        );
        const constantFlowAgreementContract = new Contract(
            contractToAutomate,
            ConstantFlowAgreementV1ABI,
            signer
        );

        const hostInterface = new Interface(HostABI);
        const gelatoOps = new GelatoOpsSDK(chainId, signer);

        const callData =
            constantFlowAgreementContract.interface.encodeFunctionData(
                'deleteFlowByOperator',
                //token, sender, receiver, ctx
                [
                    superTokenContract.address.toLowerCase(),
                    sender.toLowerCase(),
                    recipient.toLowerCase(),
                    [],
                ]
            );

        const CFAV1Adress = '0x6EeE6060f715257b970700bc2656De21dEdF074C';

        const { taskId, tx } = await gelatoOps.createTask({
            execAddress: contractToAutomate,
            execSelector: constantFlowAgreementContract.interface.getSighash(
                hostInterface.getFunction('callAgreement(address,bytes,bytes)')
            ),
            execData: hostInterface.encodeFunctionData(
                'callAgreement(address,bytes,bytes)',
                //token, sender, receiver, ctx
                [CFAV1Adress, callData, '0x']
            ),
            execAbi: hostInterface.format('json'),
            startTime: 120,
            name: 'Stop superfluid stream in 120 seconds',
            dedicatedMsgSender: true,
        });
    };
    const handleGelato = () => {
        createGelatoTask();
    };
    return (
        <PrimaryButton onClick={handleGelato}>create gelato task</PrimaryButton>
    );
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

    return <PrimaryButton onClick={handleDelete}>delte</PrimaryButton>;
};

const GelatoAutomation = ({ sender, recipient }) => {
    const GELATO_CONTRACT_ADDRESS =
        '0x527a819db1eb0e34426297b03bae11F2f8B3A19E';
    const SUPERFLUID_CONTRACT_ADDRESS =
        '0x3E14dC1b13c488a8d5D310918780c983bD5982E7';

    return (
        <div className="flex flex-col gap-3">
            <UpdateSream chainId={137} operator={GELATO_CONTRACT_ADDRESS} />
            <CreateGelatoTaskButton
                chainId={137}
                operator={SUPERFLUID_CONTRACT_ADDRESS}
                contractToAutomate={SUPERFLUID_CONTRACT_ADDRESS}
                sender={sender}
                recipient={recipient}
            />
        </div>
    );
};

const GelatoAutomationModal = ({ show, onClose, chainId }) => {
    return (
        <Modal show onClose={() => null}>
            <GelatoAutomation />
        </Modal>
    );
};

const Test = () => {
    console.log('yo');

    const { isConnected } = useAccount();
    const hasHydrated = useHasHydrated();
    if (!hasHydrated) return <></>;
    if (!isConnected) return <></>;

    return (
        <LayoutWrapper>
            <GelatoAutomationModal />
        </LayoutWrapper>
    );
};

export default Test;
