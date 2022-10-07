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
import Spinner from "@/components/Spinner";
import { TOKENOPS_VESTING_CONTRACT_ABI } from "@/lib/contracts/TokenOpsVesting";
import { useRouter } from "next/router";
import { Card } from "pages/sablier/[chainId]/claim/[grantId]";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import Radio from "@/components/Radio";
import { Input, Label } from "@/components/Input";

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

const AddFirstStakeholderStep = ({
  vestingContractAddress,
  tokenAddress,
  goToNextStep,
}) => {
  const {
    handleSubmit,
    register,
    getValues,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm();
  const { data: signer } = useSigner();
  const { chain } = useNetwork();
  const [tokenBalanceData, setTokenBalanceData] = useState({});
  const { decimals, symbol, tokenBalance } = tokenBalanceData;
  const amount = watch("tokenAmount");
  const tokenPrice = useTokenPrice(chain?.id, tokenAddress);
  const addToken = tokenStore((state) => state.addToken);

  useEffect(() => {
    setTokenBalanceData({});

    if (!chain) return;
    if (!tokenAddress) return;
    if (!isAddress(tokenAddress)) return;

    const retrieveTokenBalance = async () => {
      try {
        const [tokenBalance, tokenDetails] = await Promise.all([
          // TODO: replace this with .getWithdrawableAmount()
          await getTokenBalance(
            chain?.id,
            tokenAddress,
            vestingContractAddress
          ),
          await getTokenDetails(chain?.id, tokenAddress),
        ]);
        setTokenBalanceData({ tokenBalance, ...tokenDetails });
      } catch (e) {}
    };

    retrieveTokenBalance();
    addToken(chain.id, tokenAddress);
  }, [tokenAddress, chain, vestingContractAddress, addToken]);

  const getUSDValue = (amount) => {
    if (!tokenPrice) return;
    if (!amount) return;
    return formatCurrency(tokenPrice * amount, "USD");
  };

  const withinBalance = (tokenAmount) => {
    try {
      return tokenBalance.gte(parseUnits(tokenAmount));
    } catch (e) {}
  };

  const endIsAfterStart = (end) => {
    const start = getValues("start");
    const startTime = Math.round(new Date(start).getTime() / 1000);
    const endTime = Math.round(new Date(end).getTime() / 1000);
    return endTime > startTime;
  };

  const handleAddSchedule = async ({
    tokenAmount,
    start,
    end,
    beneficiary,
  }) => {
    const startTime = Math.round(new Date(start).getTime() / 1000);
    const endTime = Math.round(new Date(end).getTime() / 1000);
    const cliff = 0;
    const duration = endTime - startTime;
    const slicePeriodSeconds = 1;
    const revocable = true;
    const amount = parseUnits(tokenAmount, decimals);

    const toastId = toast.loading("Sign transaction to add a stakeholder");

    try {
      const vestingContract = new Contract(
        vestingContractAddress,
        TOKENOPS_VESTING_CONTRACT_ABI,
        signer
      );
      const tx = await vestingContract.createVestingSchedule(
        beneficiary,
        startTime,
        cliff,
        duration,
        slicePeriodSeconds,
        revocable,
        amount
      );
      toast.loading(`Adding a stakeholder...`, { id: toastId });
      await tx.wait();
      toast.success(
        "Successfully added a stakeholder to your vesting contract",
        { id: toastId }
      );
      goToNextStep();
    } catch (e) {
      console.error(e);

      // User didn't sign transaction
      if (e?.code === 4001 || e?.code === "ACTION_REJECTED") {
        toast.dismiss(toastId);
        return;
      }

      // Display error message
      const message = e?.data?.message || e?.error?.message || e.message;
      toast.error(
        "Something went wrong adding a stakeholder to your vesting contract",
        { id: toastId }
      );
      toast.error(message);
    }
  };

  return (
    <form className="h-full" onSubmit={handleSubmit(handleAddSchedule)}>
      <div className="flex flex-col justify-between gap-4 h-full">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            First stakeholder
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Create a vesting schedule for your first stakeholder.</p>
          </div>
          <div className="mt-1">
            <div className="text-sm text-gray-500">
              Vesting contract address: {vestingContractAddress}
              {tokenBalance && (
                <> (balance: {formatToken(tokenBalance, decimals, symbol)})</>
              )}
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <div>
              <label
                htmlFor="beneficiary"
                className="block text-sm font-medium text-gray-700"
              >
                Stakeholder address
                <span className="text-sm text-red-500 pl-1">
                  {errors?.beneficiary?.type === "required" &&
                    "A valid address is required"}
                  {errors?.beneficiary?.type === "isAddress" &&
                    "Invalid address"}
                </span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="beneficiary"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-tokenops-primary-500 focus:ring-tokenops-primary-500 sm:text-sm"
                  placeholder="0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe"
                  {...register("beneficiary", {
                    required: true,
                    validate: { isAddress },
                  })}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="start"
                className="block text-sm font-medium text-gray-700"
              >
                Start
                <span className="text-sm text-red-500 pl-1">
                  {errors?.start?.type === "required" &&
                    "A vesting start is required"}
                </span>
              </label>
              <div className="mt-1">
                <input
                  type="datetime-local"
                  id="start"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-tokenops-primary-500 focus:ring-tokenops-primary-500 sm:text-sm"
                  {...register("start", { required: true })}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="end"
                className="block text-sm font-medium text-gray-700"
              >
                End
                <span className="text-sm text-red-500 pl-1">
                  {errors?.end?.type === "endIsAfterStart" &&
                    "Vesting cannot end before it has started"}
                  {errors?.end?.type === "required" &&
                    "A vesting end is required"}
                </span>
              </label>
              <div className="mt-1">
                <input
                  type="datetime-local"
                  id="end"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-tokenops-primary-500 focus:ring-tokenops-primary-500 sm:text-sm"
                  {...register("end", {
                    required: true,
                    validate: { endIsAfterStart },
                  })}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="tokenAmount"
                className="block text-sm font-medium text-gray-700"
              >
                Vesting amount
                <span className="text-sm text-red-500 pl-1">
                  {errors?.tokenAmount?.type === "withinBalance" &&
                    "Balance is too low"}
                  {errors?.tokenAmount?.type === "min" &&
                    "The amount cannot be negative"}
                  {errors?.tokenAmount?.type === "required" &&
                    "A vesting amount is required"}
                </span>
              </label>
              <div className="relative mt-1 rounded-md shadow-sm w-48">
                <input
                  type="number"
                  id="tokenAmount"
                  className="block w-full rounded-md border-gray-300 pr-12 focus:border-tokenops-primary-500 focus:ring-tokenops-primary-500 sm:text-sm"
                  placeholder="0.00"
                  {...register("tokenAmount", {
                    required: true,
                    min: 0,
                    validate: { withinBalance },
                  })}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 sm:text-sm">{symbol}</span>
                </div>
              </div>
              {tokenPrice && amount && (
                <span className="text-xs text-gray-500 flex gap-1 py-2">
                  <ArrowsRightLeftIcon className="h-4 w-4" />
                  {getUSDValue(amount)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div>
          <PrimaryButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="inline-flex items-center gap-1.5">
                <Spinner className="h-4 w-4" />
                <span>Adding first stakeholder</span>
              </span>
            ) : (
              <span>Add first stakeholder</span>
            )}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
};

const FundVestingContractStep = ({
  vestingContractAddress,
  tokenAddress,
  goToNextStep,
}) => {
  const {
    handleSubmit,
    register,
    formState: { errors, isValid, isSubmitting },
  } = useForm({ mode: "onChange" });
  const { address: account } = useAccount();
  const { data: signer } = useSigner();
  const { chain } = useNetwork();
  const [tokenBalanceData, setTokenBalanceData] = useState({});
  const { decimals, symbol, tokenBalance } = tokenBalanceData;

  useEffect(() => {
    setTokenBalanceData({});

    if (!chain) return;
    if (!tokenAddress) return;
    if (!isAddress(tokenAddress)) return;

    const retrieveTokenBalance = async () => {
      try {
        const [tokenBalance, tokenDetails] = await Promise.all([
          await getTokenBalance(chain?.id, tokenAddress, account),
          await getTokenDetails(chain?.id, tokenAddress),
        ]);
        setTokenBalanceData({ tokenBalance, ...tokenDetails });
      } catch (e) {}
    };

    retrieveTokenBalance();
  }, [tokenAddress, chain, account]);

  const withinBalance = (tokenAmount) => {
    try {
      return tokenBalance.gte(parseUnits(tokenAmount, decimals));
    } catch (e) {}
  };

  const handleFundVestingContract = async ({ tokenAmount }) => {
    const toastId = toast.loading(
      "Sign transaction to fund your vesting contract"
    );
    try {
      const amount = parseUnits(tokenAmount, decimals);
      const tokenContract = new Contract(tokenAddress, erc20ABI, signer);
      const tx = await tokenContract.transfer(vestingContractAddress, amount);
      toast.loading(`Funding your vesting contract...`, { id: toastId });
      await tx.wait();
      toast.success("Successfully funded your vesting contract", {
        id: toastId,
      });
      goToNextStep();
    } catch (e) {
      console.error(e);

      // User didn't sign transaction
      if (e?.code === 4001 || e?.code === "ACTION_REJECTED") {
        toast.dismiss(toastId);
        return;
      }

      // Display error message
      const message = e?.data?.message || e?.error?.message || e.message;
      toast.error("Something went wrong funding your vesting contract", {
        id: toastId,
      });
      toast.error(message);
    }
  };

  return (
    <form className="h-full" onSubmit={handleSubmit(handleFundVestingContract)}>
      <div className="flex flex-col justify-between gap-4 h-full">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Fund</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Fund your vesting contract. You can always do this later.</p>
          </div>
          <div className="mt-1">
            <div className="relative mt-1 rounded-md shadow-sm w-48">
              <input
                type="number"
                id="tokenAmount"
                className="block w-full rounded-md border-gray-300 pr-12 focus:border-tokenops-primary-500 focus:ring-tokenops-primary-500 sm:text-sm"
                placeholder="0.00"
                {...register("tokenAmount", {
                  required: true,
                  min: 0,
                  validate: { withinBalance },
                })}
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 sm:text-sm">{symbol}</span>
              </div>
            </div>
            {tokenBalance && (
              <div className="text-sm text-gray-500">
                Your balance: {formatToken(tokenBalance, decimals, symbol)}
              </div>
            )}
            {errors?.tokenAmount?.type === "withinBalance" && (
              <div className="text-sm text-gray-500">Balance is too low</div>
            )}
            {errors?.tokenAmount?.type === "min" && (
              <div className="text-sm text-gray-500">
                The transfer amount cannot be negative
              </div>
            )}
          </div>
          <span className="text-sm text-gray-500"></span>
        </div>
        <div className="flex justify-between">
          <PrimaryButton type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <span className="inline-flex items-center gap-1.5">
                <Spinner className="h-4 w-4" />
                <span>Funding</span>
              </span>
            ) : (
              <span>Fund</span>
            )}
          </PrimaryButton>
          <SecondaryButton type="submit" disabled={isSubmitting}>
            <span>Skip</span>
          </SecondaryButton>
        </div>
      </div>
    </form>
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

const CreateVestingContractStep = ({ goToNextStep }) => {
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const { address: account } = useAccount();
  const resolver = useTokenAddressResolver(chain);

  const {
    handleSubmit,
    register,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm({ mode: "onChange", resolver });
  const tokenAddress = watch("tokenAddress");

  const [tokenBalance, setTokenBalance] = useState();

  useEffect(() => {
    setTokenBalance("");

    if (!chain) return;
    if (!tokenAddress) return;
    if (!isAddress(tokenAddress)) return;

    const retrieveTokenBalance = async () => {
      try {
        const [tokenBalance, tokenDetails] = await Promise.all([
          await getTokenBalance(chain?.id, tokenAddress, account),
          await getTokenDetails(chain?.id, tokenAddress),
        ]);
        const formattedBalance = formatToken(
          tokenBalance,
          tokenDetails.decimals,
          tokenDetails.symbol
        );
        setTokenBalance(formattedBalance);
      } catch (e) {}
    };

    retrieveTokenBalance();
  }, [tokenAddress, chain, account]);

  const handleCreateVestingContract = async ({ tokenAddress }) => {
    const toastId = toast.loading(
      "Sign transaction in your wallet to create your vesting contract"
    );
    try {
      const tokenVestingCreator = new Contract(
        TOKENOPS_VESTING_CREATOR_CONTRACT_ADDRESS[5],
        TOKENOPS_VESTING_CREATOR_CONTRACT_ABI,
        signer
      );
      const tx = await tokenVestingCreator.createVestingContract(tokenAddress);
      toast.loading(`Creating your vesting contract...`, { id: toastId });
      const receipt = await tx.wait();
      const vestingContractAddress =
        getVestingContractAddressFromTxReceipt(receipt);
      toast.success("Successfully created your vesting contract", {
        id: toastId,
      });
      goToNextStep(vestingContractAddress, tokenAddress);
    } catch (e) {
      console.error(e);

      // User didn't sign transaction
      if (e?.code === 4001 || e?.code === "ACTION_REJECTED") {
        toast.dismiss(toastId);
        return;
      }

      // Display error message
      const message = e?.data?.message || e?.error?.message || e.message;
      toast.error("Something went wrong creating your vesting contract", {
        id: toastId,
      });
      toast.error(message);
    }
  };

  return (
    <form
      className="h-full"
      onSubmit={handleSubmit(handleCreateVestingContract)}
    >
      <div className="flex flex-col justify-between gap-4 h-full">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Select a protocol
          </h3>
          <Radio></Radio>
          <div className="mt-3 w-full sm:max-w-md">
            <Label>Choose a token</Label>
            <Input
              type="text"
              name="tokenAddress"
              id="tokenAddress"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-tokenops-primary-500 focus:ring-tokenops-primary-500 sm:text-sm"
              placeholder="0x6B175474E89094C44Da98b954EedeAC495271d0F"
              {...register("tokenAddress", { required: true })}
            />
          </div>
          <span className="text-sm text-gray-500">
            {errors.tokenAddress && <>{errors.tokenAddress.message}</>}
            {!errors?.tokenAddress && tokenBalance && (
              <>Your balance: {tokenBalance}</>
            )}
          </span>
        </div>
        <div>
          <PrimaryButton type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <span className="inline-flex items-center gap-1.5">
                <Spinner className="h-4 w-4" />
                <span>Creating</span>
              </span>
            ) : (
              <span>Create</span>
            )}
          </PrimaryButton>
        </div>
      </div>
    </form>
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
    { name: "Fund the vesting contract", status: status(currentStep, 1) },
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
  const { push } = useRouter();
  const { step, tokenAddress, vestingContractAddress, goToStep1, goToStep2 } =
    useVestingContractStore();
  const goToVestingPage = () => push(`/vesting/5/${vestingContractAddress}`);
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
                <CreateVestingContractStep goToNextStep={goToStep1} />
              </Card>
              <Card
                className={classNames(
                  step === 1 ? "opacity-100" : "opacity-50 pointer-events-none",
                  "transition-opacity transition ease-in-out"
                )}
              >
                <FundVestingContractStep
                  vestingContractAddress={vestingContractAddress}
                  tokenAddress={tokenAddress}
                  goToNextStep={goToStep2}
                />
              </Card>
              <Card
                className={classNames(
                  step === 2 ? "opacity-100" : "opacity-50 pointer-events-none",
                  "transition-opacity transition ease-in-out"
                )}
              >
                <AddFirstStakeholderStep
                  vestingContractAddress={vestingContractAddress}
                  tokenAddress={step === 2 ? tokenAddress : null}
                  goToNextStep={goToVestingPage}
                />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default Contracts;
