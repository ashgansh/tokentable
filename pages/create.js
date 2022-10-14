import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { erc20ABI, useAccount, useNetwork, useSigner } from "wagmi";
import { Contract } from "ethers";
import { Interface, isAddress, parseUnits } from "ethers/lib/utils";
import toast from "react-hot-toast";
import create from "zustand";

import { CheckIcon } from "@heroicons/react/20/solid";

import {
  TOKENOPS_VESTING_CREATOR_CONTRACT_ABI,
  TOKENOPS_VESTING_CREATOR_CONTRACT_ADDRESS,
} from "@/lib/contracts/TokenOpsVestingCreator";
import {
  getTokenBalance,
  getTokenDetails,
  tokenStore,
  useTokenPrice,
} from "@/lib/tokens";
import { classNames, formatCurrency, formatToken } from "@/lib/utils";

import { PrimaryButton, SecondaryButton } from "@/components/Button";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { Card } from "pages/sablier/[chainId]/claim/[grantId]";
import ProtocolRadio from "@/components/Radio";
import Link from "next/link";
import { StepDescription } from "pages/test";
import { SUPERFLUID_WRAP_URL } from "pages/superfluid/[chainId]/[senderAccount]";
import { LinkIcon } from "@heroicons/react/24/outline";

const useVestingContractStore = create((set) => ({
  step: 0,
  vestingContractAddress: null,
  tokenAddress: null,
  goToStep1: (vestingContractAddress, tokenAddress) =>
    set({ step: 1, vestingContractAddress, tokenAddress }),
  goToStep2: () => set({ step: 2 }),
}));

const getVestingContractAddressFromTxReceipt = (txReceipt) => {
  const vestingCreatorInterface = new Interface(
    TOKENOPS_VESTING_CREATOR_CONTRACT_ABI
  );
  return (
    txReceipt.logs
      // Parse log events
      .map((log) => {
        try {
          const event = vestingCreatorInterface.parseLog(log);
          return event;
        } catch (e) {
          return undefined;
        }
      })
      // Get rid of the unknown events
      .filter((event) => event !== undefined)
      // Keep only VestingContractCreated events
      .filter((event) => event.name === "VestingContractCreated")
      // Take the first argument which is the new contract address
      .map((event) => event.args[0].toString())
      // Take the first address (there should only be one)
      .shift()
  );
};


const useTokenAddressResolver = (chain) =>
  useCallback(
    async (values) => {
      const { tokenAddress } = values;

      const data = (errorMessage) => {
        if (!errorMessage) {
          return {
            values,
            errors: {},
          };
        }

        return {
          values,
          errors: {
            tokenAddress: {
              type: "validation",
              message: errorMessage,
            },
          },
        };
      };

      if (!chain || chain.unsupported) {
        return data(
          "Unsupported token chain. Please switch to a supported chain."
        );
      }

      if (!isAddress(tokenAddress)) {
        return data("Invalid token address");
      }

      try {
        await getTokenDetails(chain.id, tokenAddress);
      } catch (e) {
        return data("This address is not a valid ERC20 token");
      }

      return data();
    },
    [chain]
  );

const ChooseProtocol = ({ goToNextStep }) => {
  return (
    <div className="flex flex-col justify-between gap-4 h-full">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Select a protocol
        </h3>
        <ProtocolRadio></ProtocolRadio>
        <div className="mt-3 w-full sm:max-w-md">
        </div>
      </div>
      <div>
        <PrimaryButton onClick={goToNextStep}>
          <span>Choose Protocol</span>
        </PrimaryButton>
      </div>
    </div>
  );
};

const CreateVestingContractProgressBar = ({ currentStep }) => {
  const status = (currentStep, position) => {
    if (currentStep < position) return "upcoming";
    if (currentStep === position) return "current";
    if (currentStep > position) return "complete";
  };
  const steps = [
    { name: "Create vesting contract", status: status(currentStep, 0) },
    { name: "Get Super Tokens", status: status(currentStep, 1) },
    { name: "Add the first stakeholder", status: status(currentStep, 2) },
  ];

  return (
    <nav aria-label="Progress " className="min-w-max">
      <ol role="list" className="overflow-hidden">
        {steps.map((step, stepIdx) => (
          <li
            key={step.name}
            className={classNames(
              stepIdx !== steps.length - 1 ? "pb-10" : "",
              "relative uppercase"
            )}
          >
            {step.status === "complete" ? (
              <>
                {stepIdx !== steps.length - 1 ? (
                  <div
                    className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-tokenops-primary-600"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="group relative flex items-center">
                  <span className="flex h-9 items-center">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-tokenops-primary-600">
                      <CheckIcon
                        className="h-5 w-5 text-white"
                        aria-hidden="true"
                      />
                    </span>
                  </span>
                  <span className="ml-4 flex min-w-0 flex-col">
                    <span className="text-sm font-medium">{step.name}</span>
                  </span>
                </div>
              </>
            ) : step.status === "current" ? (
              <>
                {stepIdx !== steps.length - 1 ? (
                  <div
                    className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300"
                    aria-hidden="true"
                  />
                ) : null}
                <div
                  className="group relative flex items-center"
                  aria-current="step"
                >
                  <span className="flex h-9 items-center" aria-hidden="true">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-tokenops-primary-600 bg-white">
                      <span className="h-2.5 w-2.5 rounded-full bg-tokenops-primary-600" />
                    </span>
                  </span>
                  <span className="ml-4 flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-tokenops-primary-700">
                      {step.name}
                    </span>
                  </span>
                </div>
              </>
            ) : (
              <>
                {stepIdx !== steps.length - 1 ? (
                  <div
                    className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300"
                    aria-hidden="true"
                  />
                ) : null}
                <a
                  href={step.href}
                  className="group relative flex items-center"
                >
                  <span className="flex h-9 items-center" aria-hidden="true">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white" />
                  </span>
                  <span className="ml-4 flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-gray-500">
                      {step.name}
                    </span>
                  </span>
                </a>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

const Contracts = () => {
  const { step, goToStep1, goToStep2 } =
    useVestingContractStore();
  return (
    <LayoutWrapper>
      <div className="mx-auto mt-8">
        <div>
          <div className="flex gap-8">
            <CreateVestingContractProgressBar currentStep={step} />
            <div className="flex-grow flex gap-6 flex-col">
              <Card
                className={classNames(
                  step === 0 ? "opacity-100" : "opacity-50 pointer-events-none",
                  "transition-opacity transition ease-in-out"
                )}
              >
                <ChooseProtocol goToNextStep={goToStep1} />
              </Card>
              <Card
                className={classNames(
                  step === 1 ? "opacity-100" : "opacity-50 pointer-events-none",
                  "transition-opacity transition ease-in-out"
                )}
              >
                <StepDescription title="Get Super Tokens">
                  <div className="flex flex-col gap-3">
                    <div className="flex leading-5 text-sm">Superfluid requires you to have Super Tokens. Super Tokens are wrapped ERC20s. You can get SuperTokens <a
                      className="ml-1 flex underline"
                      target="_blank"
                      rel="noreferrer"
                      href={SUPERFLUID_WRAP_URL}
                    >
                      {" here"}
                      <LinkIcon className="h-5 w-5" />
                    </a>
                    </div>

                    <div>
                      {`If you can't find your token please `}
                      <a className="underline inline" href="mailto: fabio@tokenops.xyz">reach out to us</a>
                    </div>
                    <Link href="/superfluid">
                      <a>
                        <PrimaryButton >
                          <span>Create</span>
                        </PrimaryButton>

                      </a>
                    </Link>
                  </div>

                </StepDescription>


              </Card>


            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default Contracts;
