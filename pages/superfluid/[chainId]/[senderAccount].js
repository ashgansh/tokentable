import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Framework } from "@superfluid-finance/sdk-core";
import { useAccount, useNetwork, useSigner } from "wagmi";
import { useController, useForm } from "react-hook-form";
import { isAddress, parseEther } from "ethers/lib/utils";
import { Combobox } from "@headlessui/react";
import {
  CalendarDaysIcon,
  ChevronUpDownIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import axios from "axios";

import {
  formatAddress,
  classNames,
  formatToken,
  shortAddress,
  record,
} from "@/lib/utils";
import { tokenStore, useTokenPrice } from "@/lib/tokens";
import { getAddressBlockExplorerLink, getProvider } from "@/lib/provider";

import { LayoutWrapper } from "@/components/LayoutWrapper";
import {
  Modal,
  ModalActionFooter,
  ModalBody,
  ModalSubtitle,
  ModalTitle,
} from "@/components/Modal";
import { Label, Input, TokenAmountInput } from "@/components/Input";
import { PrimaryButton, SecondaryButton } from "@/components/Button";
import Spinner from "@/components/Spinner";
import StreamsTable from "@/components/StreamsTable";
import { atcb_action } from "add-to-calendar-button";

import "add-to-calendar-button/assets/css/atcb.css";
import Banner from "@/components/Alert";
import { TableTitle } from "pages/vesting/[chainId]/[contractAddress]";
import { BigNumber } from "ethers";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const SUPERFLUID_ASSETS_BASE_PATH =
  "https://raw.githubusercontent.com/superfluid-finance/assets/master/public";
const DEFAULT_TOKEN_ICON = "/icons/default-token.png";

export const SUPERFLUID_WRAP_URL =
  "https://app.superfluid.finance/wrap?upgrade";

const VestingDashboard = ({ vestingData, isLoading, onCancelStream }) => {
  return (
    <div className="flex flex-col gap-4 py-4">
      <div>
        <h2 className="py-2 text-lg">Vestings</h2>
        <StreamsTable
          streams={vestingData?.streams || []}
          chainId={vestingData?.chainId}
          isLoading={isLoading}
          onCancelStream={onCancelStream}
        />
      </div>
    </div>
  );
};

const TokenCombobox = ({ chainId, tokens, ...args }) => {
  const { address: account } = useAccount();
  const [query, setQuery] = useState("");
  const [tokenIcons, setTokenIcons] = useState([]);
  const [tokenBalances, setTokenTokenBalances] = useState([]);
  const {
    field: { value, onChange },
  } = useController(args);

  const tokenDetails = useMemo(() => {
    return tokens.reduce((tokenDetails, token) => {
      const tokenIcon = tokenIcons.find(
        (tokenIcon) => tokenIcon.id === token.id
      );
      const tokenBalance = tokenBalances.find(
        (tokenBalance) => tokenBalance.id === token.id
      );
      return {
        ...tokenDetails,
        [token.id]: {
          ...token,
          iconUrl: tokenIcon?.iconUrl,
          balance: tokenBalance?.balance,
        },
      };
    }, {});
  }, [tokens, tokenIcons, tokenBalances]);

  useEffect(() => {
    const retreiveTokenManifests = async () => {
      const tokenManifests = await Promise.all(
        tokens.map(async (token) => {
          try {
            const manifestURL = `${SUPERFLUID_ASSETS_BASE_PATH}/tokens/${token.symbol.toLowerCase()}/manifest.json`;
            const manifestResponse = await axios.get(manifestURL);
            const manifest = manifestResponse.data;
            return { id: token.id, iconUrl: manifest.svgIconPath };
          } catch (_) {
            return { id: token.id };
          }
        })
      );
      setTokenIcons(tokenManifests);
    };

    retreiveTokenManifests();
  }, [tokens]);

  useEffect(() => {
    if (!chainId) return;
    if (!account) return;
    const retrieveTokenBalances = async () => {
      const provider = getProvider(chainId);
      const superfluid = await Framework.create({ chainId, provider });
      const tokenBalances = await Promise.all(
        tokens.map(async ({ id: tokenAddress }) => {
          try {
            const token = await superfluid.loadSuperToken(tokenAddress);
            const balance = await token.balanceOf({
              account,
              providerOrSigner: provider,
            });
            return { id: tokenAddress, balance: BigNumber.from(balance) };
          } catch (_) {
            return { id: tokenAddress, balance: null };
          }
        })
      );
      setTokenTokenBalances(tokenBalances);
    };
    retrieveTokenBalances();
  }, [tokens, chainId, account]);

  const filteredTokens =
    query === ""
      ? tokens
      : tokens.filter(
        (token) =>
          token.name.toLowerCase().includes(query.toLowerCase()) ||
          token.symbol.toLowerCase().includes(query.toLowerCase())
      );

  const selectedToken = tokenDetails?.[value];
  const selectedTokenIconURL =
    selectedToken?.iconUrl &&
    `${SUPERFLUID_ASSETS_BASE_PATH}${selectedToken?.iconUrl}`;

  return (
    <Combobox as="div" value={value} onChange={onChange}>
      {({ open }) => (
        <div className="relative">
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  !open && selectedToken && selectedTokenIconURL
                    ? selectedTokenIconURL
                    : DEFAULT_TOKEN_ICON
                }
                className="h-6 w-6"
                alt="Token Icon"
              />
            </div>
            <Combobox.Input
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-12 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              onChange={(event) => setQuery(event.target.value)}
              displayValue={(tokenAddress) =>
                tokenDetails?.[tokenAddress]?.name
                  .replace("Super", "")
                  .replace("Token", "")
              }
            />
            <span className="absolute inset-y-0 right-10 py-3 text-xs text-gray-500">
              {!open &&
                selectedToken &&
                selectedToken.balance &&
                formatToken(
                  selectedToken.balance,
                  selectedToken.decimals,
                  selectedToken.symbol,
                  {
                    symbol: "prepend",
                  }
                )}
            </span>
          </div>
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </Combobox.Button>
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredTokens.map((filteredToken) => {
              const token = tokenDetails?.[filteredToken.id];
              const tokenIconUrl = token?.iconUrl
                ? `${SUPERFLUID_ASSETS_BASE_PATH}${token.iconUrl}`
                : DEFAULT_TOKEN_ICON;
              return (
                <Combobox.Option
                  key={token.id}
                  value={token.id}
                  className={({ active }) =>
                    classNames(
                      "relative cursor-default select-none py-2 pl-3 pr-9",
                      active ? "bg-indigo-600 text-white" : "text-gray-900"
                    )
                  }
                >
                  {({ selected }) => (
                    <div className="flex flex-shrink-0 items-center gap-3 rounded-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={tokenIconUrl}
                        className="h-6 w-6"
                        alt={token.name}
                      />
                      <span
                        className={classNames(
                          "block grow truncate",
                          selected && "font-semibold"
                        )}
                      ></span>
                      <span>
                        {token.balance
                          ? formatToken(
                            token.balance,
                            token.decimals,
                            token.symbol,
                            { symbol: "prepend" }
                          )
                          : token.symbol}
                      </span>
                    </div>
                  )}
                </Combobox.Option>
              );
            })}
          </Combobox.Options>
        </div>
      )}
    </Combobox>
  );
};

const AddStreamModal = ({ show, onClose, chainId }) => {
  const [superTokens, setSuperTokens] = useState([]);
  const {
    handleSubmit,
    register,
    control,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm();
  const { address: account } = useAccount();
  const { data: signer } = useSigner();
  const addToken = tokenStore((state) => state.addToken);

  const tokenAddress = watch("tokenAddress");
  const beneficiary = watch("beneficiary");
  const endDateTime = watch("endDateTime");

  const isInFuture = (dateTime) => {
    const now = Date.now();
    const startTime = new Date(dateTime).getTime();
    return now < startTime;
  };

  const cannotBeOwnAccount = (beneficiary) =>
    beneficiary.toLowerCase() !== account.toLowerCase();

  const canAddToCalendar = useMemo(
    () => isAddress(beneficiary) && isInFuture(endDateTime),
    [beneficiary, endDateTime]
  );

  const tokenDetails = useMemo(
    () => superTokens.find((token) => token.id === tokenAddress),
    [superTokens, tokenAddress]
  );
  const tokenPrice = useTokenPrice(chainId, tokenDetails?.underlyingAddress);

  useEffect(() => {
    if (!chainId) return;
    if (!tokenDetails) return;
    addToken(chainId, tokenDetails?.underlyingAddress);
  }, [chainId, tokenDetails, addToken]);

  useEffect(() => {
    if (!chainId) return;

    const retrieveSuperTokens = async () => {
      const provider = getProvider(chainId);
      const superfluid = await Framework.create({
        chainId,
        provider,
      });
      const { data: tokens } = await superfluid.query.listAllSuperTokens({
        isListed: true,
      });
      setSuperTokens(tokens);
    };

    retrieveSuperTokens();
  }, [chainId]);

  const handleAddToCalendar = () => {
    const endDateTime = getValues("endDateTime");
    const beneficiary = getValues("beneficiary");
    const description = `[url]${window.location}[/url]`;
    const event = {
      startDate: endDateTime,
      endDate: endDateTime,
      name: `Cancel stream to ${beneficiary}`,
      description,
      options: [
        "Apple",
        "Google",
        "iCal",
        "Microsoft365",
        "Outlook.com",
        "Yahoo",
      ],
      iCalFileName: "Reminder-Event",
    };
    atcb_action(event);
  };

  const handleAddStream = async ({
    monthlyFlowRate,
    beneficiary,
    tokenAddress,
  }) => {
    const flowRate = parseEther(monthlyFlowRate.toString()).div(
      30 * 24 * 60 * 60
    );
    const provider = getProvider(chainId);
    const superfluid = await Framework.create({
      chainId,
      provider,
    });

    const toastId = toast.loading("Sign transaction to create stream");
    try {
      const createFlowOperation = superfluid.cfaV1.createFlow({
        sender: account,
        receiver: beneficiary,
        superToken: tokenAddress,
        flowRate,
      });
      const createFlowTx =
        await createFlowOperation.getPopulatedTransactionRequest(signer);
      delete createFlowTx["maxFeePerGas"];
      delete createFlowTx["maxPriorityFeePerGas"];
      const txResponse = await signer.sendTransaction(createFlowTx);
      toast.loading("Creating new stream...", { id: toastId });
      await txResponse.wait();

      record('createVesting_superfluid', { message: "A superfluid stream was created" })
      toast.success("Success", { id: toastId });
      onClose();
    } catch (e) {
      console.error(e);

      // User didn't sign transaction
      if (e?.code === 4001 || e?.code === "ACTION_REJECTED") {
        toast.dismiss(toastId);
        return;
      }

      // Display error message
      const message = e?.data?.message || e?.error?.message || e.message;
      toast.error("Something went wrong...", { id: toastId });
      toast.error(message);
    }
  };
  return (
    <Modal show={show} onClose={onClose}>
      <form onSubmit={handleSubmit(handleAddStream)}>
        <ModalTitle>Add a vesting schedule</ModalTitle>
        <ModalSubtitle>
          Create a new vesting schedule powered by Superfluid
        </ModalSubtitle>
        <ModalBody>
          <div className="flex flex-col gap-2.5">
            <div>
              <Label>Recipient</Label>
              <Input
                placeholder="0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe"
                {...register("beneficiary", {
                  required: true,
                  validate: { isAddress, cannotBeOwnAccount },
                })}
              />
              <span className="text-xs text-red-400">
                {errors?.beneficiary?.type === "required" &&
                  "A valid address is required"}
                {errors?.beneficiary?.type === "isAddress" && "Invalid address"}
                {errors?.beneficiary?.type === "cannotBeOwnAccount" &&
                  "You cannot stream tokens to yourself"}
              </span>
            </div>
            <div className="flex justify-between">
              <div>
                <Label>Select Currency</Label>
                <TokenCombobox
                  type="text"
                  tokens={superTokens}
                  chainId={chainId}
                  control={control}
                  rules={{ required: true }}
                  name="tokenAddress"
                />
                <span className="text-xs text-red-400">
                  {errors?.tokenAddress?.type === "required" &&
                    "A valid address is required"}
                  {errors?.tokenAddress?.type === "isAddress" &&
                    "Invalid address"}
                </span>
              </div>
              <div className="">
                <Label>Tokens per month</Label>
                <TokenAmountInput
                  tokenPrice={tokenPrice}
                  {...register("monthlyFlowRate", {
                    required: true,
                    min: 0,
                  })}
                />
              </div>
            </div>
            <div className="flex items-end justify-between gap-2.5">
              <div className="grow">
                <Label optional>Set a reminder to end this stream</Label>
                <Input type="datetime-local" {...register("endDateTime")} />
              </div>
              <SecondaryButton
                className="mb-1"
                onClick={handleAddToCalendar}
                disabled={!canAddToCalendar}
              >
                Add to calendar
              </SecondaryButton>
            </div>
          </div>
        </ModalBody>
        <ModalActionFooter>
          <PrimaryButton type="submit" disabled={isSubmitting} className="mb-1">
            <span className="inline-flex items-center gap-1.5">
              {isSubmitting && <Spinner className="h-4 w-4" />}
              {isSubmitting && <span>Adding schedule</span>}
              {!isSubmitting && <span>Add schedule</span>}
            </span>
          </PrimaryButton>
        </ModalActionFooter>
      </form>
    </Modal>
  );
};

export const Superfluid = ({ senderAccount, isLockedChain, chainId }) => {
  const [showAddStreamModal, setShowAddStreamModal] = useState(false);
  const [vestingData, setVestingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const addToken = tokenStore((state) => state.addToken);
  const { address: account, isConnected } = useAccount();
  const { data: signer } = useSigner();
  const { chain } = useNetwork();

  const handleOpenAddStreamModal = () => setShowAddStreamModal(true);
  const handleCloseAddStreamModal = () => setShowAddStreamModal(false);

  const contractChainId = chainId;
  const currentChainId = chain?.id;
  // used to display h1s
  const senderStreamLink = `https://console.superfluid.finance/matic/accounts/${senderAccount}?tab=streams`;

  const canAddStream = account === senderAccount;
  const canCancelStream = account === senderAccount;
  const isConnectedWithCorrectChain = isLockedChain
    ? currentChainId === contractChainId
    : true;

  const retrieveVestingData = useCallback(() => {
    if (!senderAccount || isNaN(contractChainId)) return;

    const retrieveVestingData = async () => {
      setIsLoading(true);
      const provider = getProvider(contractChainId);
      const superfluid = await Framework.create({
        chainId: contractChainId,
        provider,
      });

      const { data: streams } = await superfluid.query.listStreams({
        sender: senderAccount,
      });
      const tokenAddresses = Array.from(
        new Set(streams.map((stream) => stream.token.id))
      );
      tokenAddresses.forEach((tokenAddress) =>
        addToken(contractChainId, tokenAddress)
      );
      const vestingData = {
        streams,
        chainId: contractChainId,
        tokenAddresses,
      };
      setVestingData(vestingData);
      setIsLoading(false);
    };

    retrieveVestingData();
  }, [senderAccount, contractChainId, addToken]);

  useEffect(() => {
    retrieveVestingData();
  }, [retrieveVestingData]);

  useEffect(() => {
    if (!senderAccount || isNaN(contractChainId)) return;

    const listenToEvents = async () => {
      const provider = getProvider(contractChainId);
      const superfluid = await Framework.create({
        chainId: contractChainId,
        provider,
      });
      superfluid.query.on(retrieveVestingData, 2000, senderAccount);
    };
    listenToEvents();
  }, [retrieveVestingData, contractChainId, senderAccount]);

  const handleCancelStream = async (beneficiary, tokenAddress) => {
    const provider = getProvider(contractChainId);
    const superfluid = await Framework.create({
      chainId: contractChainId,
      provider,
    });

    const toastId = toast.loading("Sign transaction to cancel stream");
    try {
      const deleteFlowOperation = superfluid.cfaV1.deleteFlow({
        sender: account,
        receiver: beneficiary,
        superToken: tokenAddress,
      });
      const txResponse = await deleteFlowOperation.exec(signer);
      toast.loading("Canceling stream...", { id: toastId });
      await txResponse.wait();

      record('vestingCancelled_superfluid', { message: "A superfluid stream was manually canceled" });
      toast.success("Success", { id: toastId });
    } catch (e) {
      console.error(e);

      // User didn't sign transaction
      if (e?.code === 4001 || e?.code === "ACTION_REJECTED") {
        toast.dismiss(toastId);
        return;
      }

      // Display error message
      const message = e?.data?.message || e?.error?.message || e.message;
      toast.error("Something went wrong...", { id: toastId });
      toast.error(message);
    }
  };

  return (
    <>
      <AddStreamModal
        show={showAddStreamModal}
        onClose={handleCloseAddStreamModal}
        chainId={contractChainId}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between">
          {senderAccount && (
            <a href={senderStreamLink}>
              <TableTitle>{shortAddress(senderAccount)}</TableTitle>
            </a>
          )}
          <div className="flex gap-2">
            {canAddStream && isConnectedWithCorrectChain && (
              <PrimaryButton onClick={handleOpenAddStreamModal}>
                <CalendarDaysIcon className="mr-1 h-5 w-5" /> Add Vesting
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <VestingDashboard
          vestingData={vestingData}
          isLoading={isLoading}
          onCancelStream={
            canCancelStream && isConnectedWithCorrectChain && handleCancelStream
          }
        />
      </div>
    </>
  );
};
const SuperfluidRouter = () => {
  const { query } = useRouter();
  const {
    senderAccount: senderAccountUnformatted,
    chainId: contractChainIdString,
  } = query;

  const senderAccount = formatAddress(senderAccountUnformatted);
  const contractChainId = Number(contractChainIdString);

  return (
    <LayoutWrapper>
      <Superfluid
        senderAccount={senderAccount}
        isLockedChain
        chainId={contractChainId}
      />
    </LayoutWrapper>
  );
};

export default SuperfluidRouter;
