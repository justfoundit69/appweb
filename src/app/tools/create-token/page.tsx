'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { RequireWallet } from '@/components/RequireWallet';
import { FormField } from '@/components/FormField';
import { ToastContainer, type ToastProps, type ToastData } from '@/components/Toast';
import { explorerUrl } from '@/lib/utils';
import tokenFactoryAbi from '@/lib/abis/tokenFactory.json';
import { parseUnits, formatUnits, parseEther } from 'viem';

const createTokenSchema = z.object({
  name: z.string().min(1, 'Token name is required'),
  symbol: z.string().min(2, 'Symbol must be at least 2 characters').max(6, 'Symbol must be at most 6 characters'),
  totalSupply: z.string().min(1, 'Total supply is required').refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Total supply must be a positive number'),
  decimals: z.string().min(1, 'Decimals is required').refine((val) => {
    const num = Number(val);
    return Number.isInteger(num) && num >= 0 && num <= 18;
  }, 'Decimals must be between 0 and 18'),
  owner: z.string().min(42, 'Invalid address').max(42, 'Invalid address'),
});

type CreateTokenForm = z.infer<typeof createTokenSchema>;

export default function CreateTokenPage() {
  const { address } = useAccount();
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isComingSoon = process.env.NEXT_PUBLIC_TOKEN_CREATION_COMING_SOON === 'true';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateTokenForm>({
    resolver: zodResolver(createTokenSchema),
    defaultValues: {
      owner: address || '',
      decimals: '18',
    },
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read fee amount from contract
  const { data: feeAmount } = useReadContract({
    address: process.env.NEXT_PUBLIC_TOKEN_FACTORY as `0x${string}`,
    abi: tokenFactoryAbi,
    functionName: 'feeAmount',
    query: { enabled: !!process.env.NEXT_PUBLIC_TOKEN_FACTORY },
  });


  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: ToastData) => {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 11);
    setToasts((prev) => [...prev, { ...toast, id, onClose: () => removeToast(id) }]);
  }, [removeToast]);

  const onSubmit = async (data: CreateTokenForm) => {
    if (!process.env.NEXT_PUBLIC_TOKEN_FACTORY) {
      addToast({
        type: 'error',
        title: 'Configuration Error',
        description: 'Token factory contract address not configured',
      });
      return;
    }

    setIsLoading(true);
    try {
      const decimalsNum = Number(data.decimals);
      if (!Number.isInteger(decimalsNum) || decimalsNum < 0 || decimalsNum > 18) {
        addToast({
          type: 'error',
          title: 'Invalid Decimals',
          description: 'Decimals must be an integer between 0 and 18.',
        });
        return;
      }

      // Convert total supply to smallest units using provided decimals
      const totalSupplyWithDecimals = parseUnits(data.totalSupply, decimalsNum);

      // Validate contract address format
      const contractAddress = process.env.NEXT_PUBLIC_TOKEN_FACTORY;
      if (!contractAddress || !contractAddress.startsWith('0x') || contractAddress.length !== 42) {
        addToast({
          type: 'error',
          title: 'Invalid Contract Address',
          description: `Token factory contract address is invalid: ${contractAddress}`,
        });
        return;
      }

      // Single canonical call matching our TokenFactory
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: tokenFactoryAbi,
        functionName: 'createToken',
        args: [data.name, data.symbol, decimalsNum, totalSupplyWithDecimals, data.owner as `0x${string}`],
        value: (feeAmount as bigint) ?? parseEther('0.00235'), // ~5 USD in ETH fallback
      });

      {
        addToast({
          type: 'success',
          title: 'Token Creation Submitted',
          description: 'Transaction has been submitted to the blockchain.',
        });
      }
    } catch (error) {
      console.error('Error creating token:', error);
      addToast({
        type: 'error',
        title: 'Transaction Failed',
        description: 'Failed to create token. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update owner field when wallet connects
  useEffect(() => {
    if (address) {
      setValue('owner', address);
    }
  }, [address, setValue]);

  // Ensure we only show the success toast once per transaction hash
  const lastNotifiedHashRef = useRef<string | null>(null);
  useEffect(() => {
    if (isSuccess && hash && lastNotifiedHashRef.current !== hash) {
      addToast({
        type: 'success',
        title: 'Token Created Successfully!',
        description: 'Your token has been deployed to the blockchain.',
      });
      lastNotifiedHashRef.current = hash;
    }
  }, [isSuccess, hash, addToast]);


  return (
    <RequireWallet>
      <div className="min-h-screen py-8 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#000000] mb-2">Create Token</h1>
            <p className="text-[#222222]">
              Deploy a new ERC-20 token on Robinhood Chain with custom parameters.
            </p>
          </div>

          {isComingSoon && (
            <>
              <div className="fixed top-16 left-0 right-0 lg:left-64 bottom-0 z-40 pointer-events-auto cursor-not-allowed select-none">
                <div className="absolute inset-0 backdrop-blur-md bg-white/80" />
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto max-w-2xl z-20 text-center px-6">
                  <div className="rounded-lg border border-[#000000]/20 bg-white backdrop-blur-sm p-4 shadow-sm">
                    <p className="font-semibold mb-1 text-[#000000]">Coming Soon</p>
                    <p className="text-sm text-[#222222]">
                      Token Creation is not available yet. Please check back later.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
            {/* Left: Form */}
            <div className={`lg:col-span-8 ${isComingSoon ? 'blur-sm select-none pointer-events-none user-select-none' : ''}`}>
              <div className="card p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField
                      label="Token Name"
                      error={errors.name?.message}
                      {...register('name')}
                      required
                    />
                  </div>

                    <FormField
                    label="Token Symbol"
                    error={errors.symbol?.message}
                    helperText="2-6 characters"
                    {...register('symbol')}
                    required
                  />

                  <FormField
                    label="Decimals"
                    error={errors.decimals?.message}
                    helperText="0-18. Determines how many decimal places the token supports."
                    inputMode="numeric"
                    {...register('decimals')}
                    required
                  />

                  <FormField
                    label="Total Supply"
                    error={errors.totalSupply?.message}
                    helperText="Total number of tokens to be minted"
                    {...register('totalSupply')}
                    required
                  />

                  <div className="md:col-span-2">
                    <FormField
                      label="Owner Address"
                      placeholder="0x..."
                      error={errors.owner?.message}
                      helperText="Address that will own the token contract"
                      {...register('owner')}
                      required
                    />
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <button
                      type="submit"
                      disabled={isLoading || isPending || isConfirming}
                      className="btn-primary w-full py-3 text-lg"
                    >
                      {isLoading || isPending || isConfirming ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                          {isLoading ? 'Preparing...' : isPending ? 'Confirming...' : 'Processing...'}
                        </div>
                      ) : (
                        'Create Token'
                      )}
                    </button>
                  </div>
                </form>

                {isSuccess && hash && (
                  <div className="mt-8 p-4 bg-white border border-[#000000]/30 rounded-lg">
                    <h3 className="text-lg font-semibold text-[#000000] mb-2">Token Created Successfully!</h3>
                    <p className="text-[#000000] mb-4">
                      Your token has been deployed to the blockchain.
                    </p>
                    <a
                      href={explorerUrl('', hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-[#000000] hover:text-[#000000] font-medium"
                    >
                      View Transaction on Explorer
                      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Preview/Guide */}
            <div className={`lg:col-span-4 ${isComingSoon ? 'blur-sm select-none pointer-events-none user-select-none' : ''}`}>
              <div className="card p-6 lg:sticky lg:top-24 space-y-6">
                {/* Fee Information */}
                <div className="bg-white backdrop-blur-sm border border-[#000000]/15 rounded-lg p-4">
                  <h4 className="font-medium text-[#000000] mb-2">Token Creation Fee</h4>
                  <p className="text-sm text-[#222222]">
                    Fee {feeAmount ? formatUnits(feeAmount as bigint, 18) : '0.00235'} ETH will be charged for token creation.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#000000] mb-2">Preview</h3>
                  <div className="bg-white backdrop-blur-sm border border-[#000000]/15 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-[#222222]">Name</p>
                    <p className="font-semibold text-[#000000]">{watch('name') || '—'}</p>
                    <p className="text-sm text-[#222222] mt-3">Symbol</p>
                    <p className="font-semibold text-[#000000]">{watch('symbol') || '—'}</p>
                    <p className="text-sm text-[#222222] mt-3">Decimals</p>
                    <p className="font-semibold text-[#000000]">{watch('decimals') || '18'}</p>
                    <p className="text-sm text-[#222222] mt-3">Total Supply</p>
                    <p className="font-semibold text-[#000000]">{watch('totalSupply') || '—'}</p>
                    <p className="text-sm text-[#222222] mt-3">Owner</p>
                    <p className="font-mono text-[#000000] break-all">{watch('owner') || '—'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#000000] mb-2">Guidelines</h3>
                  <ul className="text-sm text-[#222222] list-disc pl-5 space-y-1">
                    <li>Symbol should be 2–6 characters; uppercase is recommended.</li>
                    <li>Total Supply is the initial number of tokens to mint.</li>
                    <li>Owner Address will become the token contract owner.</li>
                    <li>Make sure you have enough ETH for the creation fee.</li>
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













