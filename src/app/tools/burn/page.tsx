'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract, usePublicClient } from 'wagmi';
import { RequireWallet } from '@/components/RequireWallet';
import { FormField } from '@/components/FormField';
import { ToastContainer, type ToastProps, type ToastData } from '@/components/Toast';
import { explorerUrl, isValidAddress } from '@/lib/utils';
import { formatUnits, parseUnits } from 'viem';

const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD' as `0x${string}`;

const burnSchema = z.object({
  tokenAddress: z.string().min(42, 'Invalid address').max(42, 'Invalid address'),
  amount: z.string().min(1, 'Amount is required').refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Amount must be a positive number'),
});

type BurnForm = z.infer<typeof burnSchema>;

// Standard ERC20 ABI
const erc20Abi = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export default function BurnPage() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<BurnForm>({
    resolver: zodResolver(burnSchema),
    defaultValues: {
      tokenAddress: '',
      amount: '',
    },
  });

  const tokenAddress = watch('tokenAddress');
  const amount = watch('amount');

  // Read token decimals
  const { data: tokenDecimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: !!tokenAddress && isValidAddress(tokenAddress) },
  });
  const decimals = Number((tokenDecimals as unknown as number) ?? 18);

  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'symbol',
    query: { enabled: !!tokenAddress && isValidAddress(tokenAddress) },
  });

  // Read token balance
  const { data: tokenBalance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!tokenAddress && isValidAddress(tokenAddress) },
  });


  const { writeContractAsync, data: hash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  });

  const lastNotifiedHashRef = useRef<string | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: ToastData) => {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 11);
    setToasts((prev) => [...prev, { ...toast, id, onClose: () => removeToast(id) }]);
  }, [removeToast]);

  // Handle transaction success/error
  useEffect(() => {
    if (isSuccess && hash && lastNotifiedHashRef.current !== hash) {
      addToast({
        type: 'success',
        title: 'Burn Successful!',
        description: `Tokens burned successfully! View on explorer: ${explorerUrl('', hash)}`,
      });
      lastNotifiedHashRef.current = hash;
      setIsLoading(false);
    }
    if (isError && hash && lastNotifiedHashRef.current !== hash) {
      addToast({
        type: 'error',
        title: 'Transaction Failed',
        description: 'Transaction failed. Please try again.',
      });
      lastNotifiedHashRef.current = hash;
      setIsLoading(false);
    }
  }, [isSuccess, isError, hash, addToast]);

  const onSubmit = async (data: BurnForm) => {
    if (!address) {
      addToast({
        type: 'error',
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first.',
      });
      return;
    }

    if (!tokenAddress || !isValidAddress(tokenAddress)) {
      addToast({
        type: 'error',
        title: 'Invalid Token Address',
        description: 'Please provide a valid token contract address.',
      });
      return;
    }

    const balance = tokenBalance as bigint | undefined;
    let amountInUnits: bigint;

    try {
      amountInUnits = parseUnits(data.amount, decimals);
    } catch {
      addToast({
        type: 'error',
        title: 'Invalid Amount',
        description: 'Amount format is invalid for this token.',
      });
      return;
    }

    if (!balance || balance < amountInUnits) {
      addToast({
        type: 'error',
        title: 'Insufficient Balance',
        description: `You don't have enough tokens. Your balance: ${balance ? formatUnits(balance, decimals) : '0'}`,
      });
      return;
    }

    setIsLoading(true);
    try {
      const symbol = tokenSymbol ? String(tokenSymbol) : 'tokens';
      let useNativeBurn = false;

      addToast({
        type: 'info',
        title: 'Burning Tokens',
        description: `Burning ${data.amount} ${symbol}...`,
      });

      if (publicClient) {
        try {
          await publicClient.simulateContract({
            address: tokenAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: 'burn',
            args: [amountInUnits],
            account: address,
          });
          useNativeBurn = true;
        } catch {
          useNativeBurn = false;
        }
      }

      if (useNativeBurn) {
        await writeContractAsync({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'burn',
          args: [amountInUnits],
        });
      } else {
        if (publicClient) {
          await publicClient.simulateContract({
            address: tokenAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: 'transfer',
            args: [BURN_ADDRESS, amountInUnits],
            account: address,
          });
        }

        await writeContractAsync({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [BURN_ADDRESS, amountInUnits],
        });
      }

      addToast({
        type: 'info',
        title: 'Transaction Submitted',
        description: useNativeBurn
          ? 'Native burn transaction submitted. Waiting for confirmation...'
          : 'Transfer to dead address submitted. Waiting for confirmation...',
      });
    } catch (error) {
      console.error('Error burning tokens:', error);
      addToast({
        type: 'error',
        title: 'Burn Failed',
        description: error instanceof Error ? error.message : 'Failed to burn tokens. Please try again.',
      });
      setIsLoading(false);
    }
  };

  const balance = tokenBalance as bigint | undefined;
  const balanceFormatted = balance ? formatUnits(balance, decimals) : '0';
  const tokenLabel = tokenSymbol ? String(tokenSymbol) : 'tokens';
  const amountPreview = (() => {
    try {
      return amount ? parseUnits(amount, decimals) : null;
    } catch {
      return null;
    }
  })();
  const balanceAfterBurn =
    balance !== undefined && amountPreview !== null && balance >= amountPreview
      ? formatUnits(balance - amountPreview, decimals)
      : '0';

  return (
    <RequireWallet>
      <div className="min-h-screen py-8 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Burn Tokens</h1>
            <p className="text-gray-300">
              Permanently burn tokens by sending them to a dead address. This action cannot be undone.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Form */}
            <div className="lg:col-span-8">
              <div className="card p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {/* Token Address */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Token Information</h3>
                    <FormField
                      label="Token Address"
                      placeholder="0x..."
                      error={errors.tokenAddress?.message}
                      {...register('tokenAddress')}
                    />
                    {tokenAddress && isValidAddress(tokenAddress) && balance !== undefined && (
                      <div className="mt-4 p-4 bg-black/70 backdrop-blur-sm border border-white/20 rounded-lg">
                        <p className="text-sm text-gray-300">Your Balance</p>
                        <p className="text-lg font-bold text-white break-all break-words overflow-wrap-anywhere">
                          {balanceFormatted} {tokenLabel}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="space-y-4">
                    <FormField
                      label="Amount to Burn"
                      placeholder="0.0"
                      error={errors.amount?.message}
                      {...register('amount')}
                    />
                    {amount && !isNaN(Number(amount)) && Number(amount) > 0 && balance && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setValue('amount', balanceFormatted);
                          }}
                          className="text-sm text-white hover:text-white underline"
                        >
                          Use Max Balance
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Warning */}
                  <div className="p-4 bg-red-900/30 border border-red-600 rounded-lg">
                    <p className="text-sm text-red-200 font-semibold mb-1">Warning</p>
                    <p className="text-sm text-red-200">
                      Burning tokens is permanent and irreversible. The tokens will be sent to a dead address and cannot be recovered.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading || isWritePending || isConfirming || !tokenAddress || !amount}
                      className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading || isWritePending || isConfirming ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          {isConfirming ? 'Confirming...' : 'Burning...'}
                        </div>
                      ) : (
                        'Burn Tokens'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right: Summary Panel */}
            <div className="lg:col-span-4">
              <div className="card p-6 lg:sticky lg:top-24 space-y-4">
                <h3 className="text-lg font-semibold text-white">Summary</h3>
                
                <div className="bg-black/70 backdrop-blur-sm border border-white/20 rounded-lg p-4 overflow-hidden">
                  <p className="text-sm text-gray-300">Token Address</p>
                  <p className="text-xs font-mono text-white break-all mt-1">
                    {tokenAddress || 'Not specified'}
                  </p>
                  {tokenAddress && isValidAddress(tokenAddress) && (
                    <>
                      <p className="text-sm text-gray-300 mt-4">Your Balance</p>
                      <p className="text-lg font-bold text-white break-words overflow-wrap-anywhere min-w-0">
                        {balanceFormatted} {tokenLabel}
                      </p>
                      <p className="text-sm text-gray-300 mt-4">Amount to Burn</p>
                      <p className="text-lg font-bold text-white break-words overflow-wrap-anywhere min-w-0">
                        {amount && !isNaN(Number(amount)) ? amount : '0'} {tokenLabel}
                      </p>
                      {amount && !isNaN(Number(amount)) && balance && (
                        <>
                          <p className="text-sm text-gray-300 mt-4">Balance After Burn</p>
                          <p className="text-lg font-bold text-white break-words overflow-wrap-anywhere min-w-0">
                            {balanceAfterBurn} {tokenLabel}
                          </p>
                        </>
                      )}
                    </>
                  )}
                </div>

                <div className="bg-black/70 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                  <p className="text-sm text-gray-300 mb-2">How it works:</p>
                  <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                    <li>Tokens are sent to a dead address (0x...dEaD)</li>
                    <li>This permanently removes them from circulation</li>
                    <li>The action cannot be undone</li>
                    <li>You&apos;ll need to pay gas fees for the transaction</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </RequireWallet>
  );
}














