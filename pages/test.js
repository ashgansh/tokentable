import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Framework } from "@superfluid-finance/sdk-core";
import { useAccount, useNetwork, useSigner } from "wagmi";
import { set, useController, useForm } from "react-hook-form";
import { Interface, isAddress, parseEther } from "ethers/lib/utils";
import { Combobox } from "@headlessui/react";
import {
  ArrowsRightLeftIcon,
  BoltIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import axios from "axios";

import {
  formatAddress,
  classNames,
  formatCurrency,
  shortAddress,
} from "@/lib/utils";

import { LayoutWrapper } from "@/components/LayoutWrapper";
import {
  Modal,
  ModalBody,
  ModalTitle,
} from "@/components/Modal";
import { PrimaryButton } from "@/components/Button";
import { GelatoOpsSDK } from "@gelatonetwork/ops-sdk";
import { useHasHydrated } from "@/lib/hooks";
import {
  deleteFlowAsOperator,
  getSuperTokenContract,
  updateFlowPermissions,
} from "@/lib/superfluid/helpers";
import { ConstantFlowAgreementV1ABI, HostABI } from "@/lib/superfluid/abi";
import { Contract } from "ethers";
import Stepper, { Step } from "@/components/Stepper.tsx";

// proxy
// '0x31D5847E2b7c43b90Aee696519465a8d9F75E9EC',
// '0x3E14dC1b13c488a8d5D310918780c983bD5982E7',

const CreateGelatoTaskButton = ({
  chainId,
  contractToAutomate,
  sender,
  recipient,
  superTokenSymbol,
  onSuccess,
}) => {
  const { data: signer } = useSigner();
  const createGelatoTask = async () => {
    const superTokenContract = await getSuperTokenContract(
      superTokenSymbol,
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

    const callData = constantFlowAgreementContract.interface.encodeFunctionData(
      "deleteFlowByOperator",
      //token, sender, receiver, ctx
      [
        superTokenContract.address.toLowerCase(),
        sender.toLowerCase(),
        recipient.toLowerCase(),
        [],
      ]
    );

    const CFAV1Adress = "0x6EeE6060f715257b970700bc2656De21dEdF074C";

    try {
      const { taskId, tx } = await gelatoOps.createTask({
        execAddress: contractToAutomate,
        execSelector: constantFlowAgreementContract.interface.getSighash(
          hostInterface.getFunction("callAgreement(address,bytes,bytes)")
        ),
        execData: hostInterface.encodeFunctionData(
          "callAgreement(address,bytes,bytes)",
          //token, sender, receiver, ctx
          [CFAV1Adress, callData, "0x"]
        ),
        execAbi: hostInterface.format("json"),
        startTime: 120,
        name: `Stop vesting schedule for ${recipient}`,
        dedicatedMsgSender: true,
      });
      onSuccess(taskId, tx);
    } catch (e) {
      console.log(e);
    }
  };
  const handleGelato = () => {
    createGelatoTask();
  };
  return (
    <PrimaryButton className="max-w-fit" onClick={handleGelato}>
      Create Gelato Task
    </PrimaryButton>
  );
};

const UpdateSream = ({ chainId, operator, onSuccess }) => {
  const { data: signer } = useSigner();
  const handleFlowPermissions = async () => {
    try {
      const result = await updateFlowPermissions({
        // this is gelato OPSv1
        // sender: '0x54a275FB2aC2391890c2E8471C39d85278C23cEe',
        operator,
        chainId,
        // delete permission
        permissionType: 4,
        signer,
        superTokenSymbol: "MATICx",
      });
      console.log(result);
      onSuccess();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <PrimaryButton className="max-w-fit" onClick={handleFlowPermissions}>
      Give delete permission
    </PrimaryButton>
  );
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
      superTokenSymbol: "MATICx",
    });
    console.log(result);
  };

  return <PrimaryButton onClick={handleDelete}>delte</PrimaryButton>;
};

export const StepDescription = ({ title, children }) => {
  return (
    <div className="relative mt-1 border-t border-transparent text-left">
      <h3>
        {/* <span className="absolute inset-0 -top-px"></span> */}
        {title}
      </h3>
      <div className="mt-2  flex justify-between text-sm leading-6 text-slate-700">
        {children}
      </div>
    </div>
  );
};

const GelatoAutomation = ({ sender, recipient, superTokenSymbol }) => {
  const [step, setStep] = useState(0);
  const { chain } = useNetwork();
  const GELATO_CONTRACT_ADDRESS = "0x527a819db1eb0e34426297b03bae11F2f8B3A19E";
  const SUPERFLUID_CONTRACT_ADDRESS =
    "0x3E14dC1b13c488a8d5D310918780c983bD5982E7";

  return (
    <div className="flex gap-6">
      <Stepper>
        <Step current={step === 0}>Permissions</Step>
        <Step current={step === 1}>Automate</Step>
        <Step current={step === 2} last>
          Fund Gelato
        </Step>
      </Stepper>
      <div>
        {step === 0 && (
          <StepDescription title="Update Stream">
            <p>
              We first need to authorize the automation infrastructure to delete
              streams on your behalf.
            </p>
            <UpdateSream
              chainId={137}
              operator={GELATO_CONTRACT_ADDRESS}
              onSuccess={() => setStep(1)}
            />
          </StepDescription>
        )}
        {step === 1 && (
          <StepDescription title="Create automation">
            <p>
              Now we create a permissionless automation task that will cancel
              the vesting schedule on your behalf.
            </p>
            <CreateGelatoTaskButton
              chainId={137}
              operator={SUPERFLUID_CONTRACT_ADDRESS}
              contractToAutomate={SUPERFLUID_CONTRACT_ADDRESS}
              sender={sender}
              recipient={recipient}
              onSuccess={() => setStep(2)}
              superTokenSymbol={superTokenSymbol}
            />
          </StepDescription>
        )}
        {step === 2 && (
          <StepDescription title="Fund Gelato">
            Automation functionality is powered by Gelato Network and requires
            you to fund an account.
            <a
              target="_blank"
              rel="noreferrer"
              href="https://app.gelato.network"
            >
              Fund your account
            </a>
          </StepDescription>
        )}
      </div>
    </div>
  );
};

export const GelatoAutomationModal = ({
  sender = "",
  recipient = "",
  superTokenSymbol = "",
  children,
}) => {
  console.log({ sender, recipient, superTokenSymbol });
  const [showModal, setShowModal] = useState(false);
  const handleShowModal = () => {
    setShowModal(true);
  };
  return (
    <>
      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <ModalTitle>Automate Stream for {shortAddress(sender)}</ModalTitle>
        <ModalBody>
          <GelatoAutomation
            sender={sender}
            recipient={recipient}
            superTokenSymbol={superTokenSymbol}
          />
        </ModalBody>
      </Modal>

      <PrimaryButton onClick={handleShowModal}>{children}</PrimaryButton>
    </>
  );
};

const Test = () => {
  console.log("yo");

  const { isConnected } = useAccount();
  const hasHydrated = useHasHydrated();
  if (!hasHydrated) return <></>;
  if (!isConnected) return <></>;

  return (
    <LayoutWrapper>
      <GelatoAutomationModal show />
    </LayoutWrapper>
  );
};

export default Test;
