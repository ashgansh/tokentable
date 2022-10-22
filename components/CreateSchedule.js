import { useEffect, useState } from 'react';
import { useController, useForm } from 'react-hook-form';
import { useAccount, useSigner } from 'wagmi';
import { isAddress, parseUnits } from 'ethers/lib/utils';

import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

import { classNames, formatCurrency, record } from '@/lib/utils';
import {
  tokenStore,
  useMultipleTokenDetails,
  useTokenDetails,
  useTokenFormatter,
  useTokenPrice,
} from '@/lib/tokens';

import {
  Modal,
  ModalActionFooter,
  ModalBody,
  ModalTitle,
} from '@/components/Modal';
import { CurrencyInput, Input, Label } from '@/components/Input';
import { PrimaryButton, SecondaryButton } from '@/components/Button';
import Spinner from '@/components/Spinner';
import toast from 'react-hot-toast';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { useLogin } from '@/lib/auth';
import axios from 'axios';

const ENABLE_DRAFTS = false;

const TokenCombobox = ({
  chainId,
  tokenAddresses,
  disabled = false,
  ...args
}) => {
  const [query, setQuery] = useState('');
  const {
    field: { value, onChange },
  } = useController(args);
  const addToken = tokenStore((state) => state.addToken);

  const allTokenDetails = useMultipleTokenDetails(chainId, [
    ...tokenAddresses,
    query,
  ]);
  const allTokenAddresses = Object.keys(allTokenDetails);

  const filteredTokenAddresses =
    query === ''
      ? allTokenAddresses
      : Object.entries(allTokenDetails)
          .filter(
            ([address, details]) =>
              address.toLowerCase().includes(query.toLowerCase()) ||
              details.symbol.toLowerCase().includes(query.toLowerCase())
          )
          .map(([address]) => address);

  useEffect(() => {
    if (!chainId) return;
    if (!isAddress(query)) return;

    addToken(chainId, query);
  }, [query, chainId, addToken]);

  const tokenDetails = (tokenAddress) => allTokenDetails?.[tokenAddress];
  const displayValue = (tokenAddress) => {
    const details = tokenDetails(tokenAddress);
    return details ? `${details.symbol} (${tokenAddress})` : tokenAddress;
  };

  return (
    <Combobox as="div" value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <Combobox.Input
          className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          onChange={(event) => setQuery(event.target.value)}
          displayValue={displayValue}
        />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
          <ChevronUpDownIcon
            className="h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
        </Combobox.Button>
        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {filteredTokenAddresses.map((tokenAddress) => (
            <Combobox.Option
              key={tokenAddress}
              value={tokenAddress}
              className={({ active }) =>
                classNames(
                  'relative cursor-default select-none py-2 pl-3 pr-9',
                  active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                )
              }
            >
              {({ active, selected }) => (
                <>
                  <span
                    className={classNames(
                      'block truncate',
                      selected && 'font-semibold'
                    )}
                  >
                    {displayValue(tokenAddress)}
                  </span>
                  {selected && (
                    <span
                      className={classNames(
                        'absolute inset-y-0 right-0 flex items-center pr-4',
                        active ? 'text-white' : 'text-indigo-600'
                      )}
                    >
                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  )}
                </>
              )}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </div>
    </Combobox>
  );
};

const AddScheduleModal = ({
  show,
  onClose,
  onSuccess,
  chainId,
  contractAddress,
  tokenAddresses,
  addVestingSchedule,
  getAdminTokenAllowance,
  isMultiToken,
}) => {
  const {
    handleSubmit,
    register,
    reset,
    getValues,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm()  
  const { address: account } = useAccount();
  const [tokenAllowance, setTokenAllowance] = useState(null);
  const { data: signer } = useSigner();
  const login = useLogin();

  const amount = watch('amount');
  const tokenAddress = watch('tokenAddress');
  const { symbol: tokenSymbol, decimals: tokenDecimals } = useTokenDetails(
    chainId,
    tokenAddress
  );
  const tokenPrice = useTokenPrice(chainId, tokenAddress);
  const formatToken = useTokenFormatter(chainId, tokenAddress);

  useEffect(() => {
    if (!account) return;
    if (!tokenAddress) return;
    if (!getAdminTokenAllowance) return;

    const retrieveTokenAllowance = async () => {
      const allowance = await getAdminTokenAllowance(tokenAddress, account);
      setTokenAllowance(allowance);
    };

    retrieveTokenAllowance();
  }, [getAdminTokenAllowance, account, tokenAddress]);

  const withinTokenAllowance = (amount) => {
    if (!tokenAllowance) return true;

    try {
      return tokenAllowance.gte(parseUnits(amount, tokenDecimals));
    } catch (e) {
      return true;
    }
  };

  const getUSDValue = (amount) => {
    if (!tokenPrice) return;
    if (!amount) return;
    return formatCurrency(tokenPrice * amount, 'USD');
  };

  const startIsInFuture = (start) => {
    const now = Date.now();
    const startTime = new Date(start).getTime();
    return now < startTime;
  };

  const endIsAfterStart = (end) => {
    const start = getValues('start');
    const startTime = Math.round(new Date(start).getTime() / 1000);
    const endTime = Math.round(new Date(end).getTime() / 1000);
    return endTime > startTime;
  };

  const executeTransactions = async (signer, transactions) => {
    const receipts = [];

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      const toastId = toast.loading('Sign transaction');
      try {
        const txResponse = await signer.sendTransaction(tx);
        toast.loading('Waiting for transaction...', { id: toastId });
        const txReceipt = await txResponse.wait();
        receipts.push(txReceipt);
        toast.success('Success', { id: toastId });
      } catch (e) {
        console.error(e);

        // User didn't sign transaction
        if (e?.code === 4001 || e?.code === 'ACTION_REJECTED') {
          toast.dismiss(toastId);
          break;
        }

        // Display error message
        const message = e?.data?.message || e?.error?.message || e.message;
        toast.error('Something went wrong...', { id: toastId });
        toast.error(message);
      }
    }

    return transactions.length === receipts.length;
  };

  const handleQueueVestingSchedule = async ({
    start,
    end,
    amount,
    beneficiary,
    tokenAddress,
  }) => {
    const schedule = {
      startTime: Math.round(new Date(start).getTime() / 1000),
      endTime: Math.round(new Date(end).getTime() / 1000),
      amount,
      beneficiary,
      tokenAddress,
      contractAddress,
      chainId,
    };

    await axios.post('/api/drafts', schedule);

    onClose();
    onSuccess();
    reset();
  };

  const handleAddVestingSchedule = async ({
    start,
    end,
    amount,
    beneficiary,
    tokenAddress,
  }) => {
    const schedule = {
      startTime: Math.round(new Date(start).getTime() / 1000),
      endTime: Math.round(new Date(end).getTime() / 1000),
      amount: parseUnits(amount, tokenDecimals),
      beneficiary,
      tokenAddress,
    };
    const transactions = await addVestingSchedule(signer, schedule);
    const success = await executeTransactions(signer, transactions);

    if (!success) return;

    record('createVesting_standard', {message: 'A vesting schedule was added'});
    onClose();
    onSuccess();
    reset();
  };

  return (
    <Modal show={show} onClose={onClose}>
      <form onSubmit={handleSubmit(handleAddVestingSchedule)}>
        <ModalTitle>Add a vesting schedule</ModalTitle>
        <ModalBody>
          <div className="flex flex-col gap-2.5">
            <div>
              <Label>Stakeholder Address</Label>
              <Input
                placeholder="0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe"
                {...register('beneficiary', {
                  required: true,
                  validate: { isAddress },
                })}
              />
              <span className="text-xs text-red-400">
                {errors?.beneficiary?.type === 'required' &&
                  'A valid address is required'}
                {errors?.beneficiary?.type === 'isAddress' && 'Invalid address'}
              </span>
            </div>
            <div>
              <Label>Start</Label>
              <Input
                type="datetime-local"
                {...register('start', {
                  required: true,
                  validate: { startIsInFuture },
                })}
              />
              <span className="text-xs text-red-400">
                {errors?.start?.type === 'startIsInFuture' &&
                  'Vesting has to start in the future'}
                {errors?.start?.type === 'required' &&
                  'A vesting start is required'}
              </span>
            </div>
            <div>
              <Label>End</Label>
              <Input
                type="datetime-local"
                {...register('end', {
                  required: true,
                  validate: { endIsAfterStart },
                })}
              />
              <span className="text-xs text-red-400">
                {errors?.end?.type === 'endIsAfterStart' &&
                  'Vesting cannot end before it has started'}
                {errors?.end?.type === 'required' &&
                  'A vesting end is required'}
              </span>
            </div>
            <div>
              <Label>Token</Label>
              <TokenCombobox
                tokenAddresses={tokenAddresses}
                chainId={chainId}
                disabled={!isMultiToken}
                control={control}
                rules={{ required: true }}
                name="tokenAddress"
              />
            </div>
            <div>
              <Label>Vesting Amount</Label>
              <CurrencyInput
                symbol={tokenSymbol}
                placeholder="0.00"
                {...register('amount', {
                  required: true,
                  min: 0,
                  validate: { withinTokenAllowance },
                })}
              />
              {tokenPrice && amount && (
                <span className="flex gap-1 py-2 text-xs text-gray-500">
                  <ArrowsRightLeftIcon className="h-4 w-4" />
                  {getUSDValue(amount)}
                </span>
              )}
              <span className="text-xs text-red-400">
                {errors?.amount?.type === 'withinTokenAllowance' &&
                  'Vesting contract does not have enough tokens available'}
                {errors?.amount?.type === 'min' &&
                  'The vesting amount cannot be negative'}
                {errors?.amount?.type === 'required' &&
                  'A vesting amount is required'}
              </span>
            </div>
          </div>
        </ModalBody>
        <ModalActionFooter>
          <div className="flex w-full items-center justify-between">
            <p className="text text-sm text-gray-500">
              {tokenAllowance && (
                <>Available tokens to allocate: {formatToken(tokenAllowance)}</>
              )}
            </p>
            <div className="flex items-center gap-2">
              {isSubmitting && <Spinner className="h-4 w-4" />}
              <PrimaryButton type="submit" disabled={isSubmitting}>
                Add schedule
              </PrimaryButton>
              {ENABLE_DRAFTS && (
                <SecondaryButton
                  onClick={handleSubmit(handleQueueVestingSchedule)}
                  disabled={isSubmitting}
                >
                  Save for later
                </SecondaryButton>
              )}
            </div>
          </div>
        </ModalActionFooter>
      </form>
    </Modal>
  );
};

export default AddScheduleModal;
