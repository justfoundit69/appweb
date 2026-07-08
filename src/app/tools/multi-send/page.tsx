'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi';
import { RequireWallet } from '@/components/RequireWallet';
import { FormField } from '@/components/FormField';
import { FileDrop } from '@/components/FileDrop';
import { ToastContainer, type ToastProps, type ToastData } from '@/components/Toast';
import { explorerUrl, parseCSV, parseJSON, isValidAddress } from '@/lib/utils';
import { formatUnits, parseUnits, parseEther } from 'viem';
import multiSendAbi from '@/lib/abis/multiSend.json';
import { Plus, Trash2 } from 'lucide-react';

const multiSendSchema = z.object({
  tokenType: z.enum(['native', 'prc20']),
  tokenAddress: z.string().optional(),
  recipients: z.array(z.object({
    address: z.string().min(42, 'Invalid address').max(42, 'Invalid address'),
    amount: z.string().min(1, 'Amount is required').refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Amount must be a positive number'),
  })).min(1, 'At least one recipient is required'),
}).refine((data) => {
  if (data.tokenType === 'prc20' && !data.tokenAddress) {
    return false;
  }
  return true;
}, {
  message: 'Token address is required for tokens',
  path: ['tokenAddress'],
});

type MultiSendForm = z.infer<typeof multiSendSchema>;

interface Recipient {
  address: string;
  amount: string;
}

export default function MultiSendPage() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useSequential, setUseSequential] = useState(true); // Default to sequential for native tokens
  const { address } = useAccount();
  const isComingSoon = process.env.NEXT_PUBLIC_MULTISEND_COMING_SOON === 'true';

  // Helper function to convert decimal amount to BigInt
  const convertToBigInt = (amount: string, decimals: number = 18): bigint => {
    try {
      return parseUnits(amount, decimals);
    } catch {
      throw new Error('Invalid amount format');
    }
  };

  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  });

  const lastNotifiedHashRef = useRef<string | null>(null);

  // Read fee amount from contract
  const { data: feeAmount } = useReadContract({
    address: process.env.NEXT_PUBLIC_MULTISEND as `0x${string}`,
    abi: multiSendAbi,
    functionName: 'feeAmount',
    query: { enabled: !!process.env.NEXT_PUBLIC_MULTISEND },
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MultiSendForm>({
    resolver: zodResolver(multiSendSchema),
    defaultValues: {
      tokenType: 'native',
      tokenAddress: '',
      recipients: [{ address: '', amount: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'recipients',
  });

  const recipients = watch('recipients');
  const tokenType = watch('tokenType');
  const tokenAddress = watch('tokenAddress');

  // Read token decimals for ERC20 tokens (default to 18)
  const { data: tokenDecimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: [
      {
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'decimals',
    query: { enabled: !!tokenAddress && tokenType === 'prc20' },
  });
  const decimals = Number((tokenDecimals as unknown as number) ?? 18);

  // Read allowance for ERC20 tokens
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: [
      {
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
        ],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'allowance',
    args: address && tokenAddress && process.env.NEXT_PUBLIC_MULTISEND 
      ? [address, process.env.NEXT_PUBLIC_MULTISEND as `0x${string}`] 
      : undefined,
    query: {
      enabled: !!address && !!tokenAddress && !!process.env.NEXT_PUBLIC_MULTISEND && tokenType === 'prc20',
    },
  });

  // Calculate total token amount needed
  const totalTokenAmount = recipients.reduce((sum: bigint, recipient: { amount: string }) => {
    try {
      const amount = parseUnits(recipient.amount || '0', decimals);
      return sum + amount;
    } catch {
      return sum;
    }
  }, BigInt(0));

  const needsApproval = tokenType === 'prc20' && 
    typeof allowance === 'bigint' && 
    totalTokenAmount > BigInt(0) && 
    allowance < totalTokenAmount;

  const [isApproving, setIsApproving] = useState(false);
  const { writeContract: writeApproveContract, data: approveHash } = useWriteContract();
  const { isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
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

  // Refetch allowance after successful approval
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
      setIsApproving(false);
      addToast({
        type: 'success',
        title: 'Approval Successful',
        description: 'Token approval successful. You can now proceed with multi-send.',
      });
    }
  }, [isApproveSuccess, refetchAllowance, addToast]);

  // Handle transaction success/error
  useEffect(() => {
    if (isSuccess && hash && lastNotifiedHashRef.current !== hash) {
      addToast({
        type: 'success',
        title: 'Multi-Send Successful!',
        description: `Transaction confirmed! View on explorer: ${explorerUrl('', hash)}`,
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

  // Handle approval for ERC20 tokens
  const handleApprove = async () => {
    if (!tokenAddress || !process.env.NEXT_PUBLIC_MULTISEND || !address) {
      addToast({
        type: 'error',
        title: 'Invalid Configuration',
        description: 'Token address or multi-send contract not configured.',
      });
      return;
    }

    setIsApproving(true);
    try {
      // Approve max uint256 to avoid repeated approvals
      await writeApproveContract({
        address: tokenAddress as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
            name: 'approve',
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        functionName: 'approve',
        args: [
          process.env.NEXT_PUBLIC_MULTISEND as `0x${string}`,
          BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'), // Max uint256
        ],
      });
      addToast({
        type: 'info',
        title: 'Approval Transaction Sent',
        description: 'Please wait for approval transaction to confirm...',
      });
    } catch (error) {
      console.error('Error approving tokens:', error);
      addToast({
        type: 'error',
        title: 'Approval Failed',
        description: error instanceof Error ? error.message : 'Failed to approve tokens.',
      });
      setIsApproving(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      const text = await file.text();
      let parsedRecipients: Recipient[];

      if (file.name.endsWith('.csv')) {
        parsedRecipients = parseCSV(text);
      } else if (file.name.endsWith('.json')) {
        parsedRecipients = parseJSON(text);
      } else {
        throw new Error('Unsupported file type');
      }

      // Validate addresses
      const validRecipients = parsedRecipients.filter(recipient => {
        if (!isValidAddress(recipient.address)) {
          addToast({
            type: 'error',
            title: 'Invalid Address',
            description: `Invalid address: ${recipient.address}`,
          });
          return false;
        }
        return true;
      });

      if (validRecipients.length === 0) {
        addToast({
          type: 'error',
          title: 'No Valid Recipients',
          description: 'No valid addresses found in the file.',
        });
        return;
      }

      setValue('recipients', validRecipients);
      addToast({
        type: 'success',
        title: 'File Processed',
        description: `Loaded ${validRecipients.length} recipients from ${file.name}`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      addToast({
        type: 'error',
        title: 'File Processing Error',
        description: error instanceof Error ? error.message : 'Failed to process file',
      });
    }
  };

  const onSubmit = async (data: MultiSendForm) => {
    if (!address) {
      addToast({
        type: 'error',
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first.',
      });
      return;
    }

    const multiSendAddress = process.env.NEXT_PUBLIC_MULTISEND;
    if (!multiSendAddress) {
      addToast({
        type: 'error',
        title: 'Multi-Send Contract Not Configured',
        description: 'Multi-send contract address is not configured. Please contact support.',
      });
      return;
    }

    // Check approval for ERC20 tokens
    if (data.tokenType === 'prc20' && needsApproval) {
      addToast({
        type: 'error',
        title: 'Approval Required',
        description: 'Please approve token spending first by clicking the "Approve Tokens" button.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const addresses = data.recipients.map(r => r.address as `0x${string}`);
      
      if (data.tokenType === 'native') {
        // Native token (ETH) sending using multi-send contract
        const amounts = data.recipients.map(r => convertToBigInt(r.amount, 18));
        const totalAmount = amounts.reduce((sum, amount) => sum + amount, BigInt(0));
        const fee = (feeAmount as bigint) ?? parseEther('0.00235');

        addToast({
          type: 'info',
          title: 'Starting Multi-Send',
          description: `Sending ETH to ${addresses.length} recipients...`,
        });

        try {
          await writeContract({
            address: multiSendAddress as `0x${string}`,
            abi: multiSendAbi,
            functionName: 'multiSendNative',
            args: [addresses, amounts],
            value: totalAmount + fee,
          });

          addToast({
            type: 'info',
            title: 'Transaction Submitted',
            description: 'Waiting for confirmation...',
          });
        } catch (error: unknown) {
          console.error('Error in multi-send:', error);
          
          // Try fallback to multiSend if multiSendNative fails
          const errorMessage = error instanceof Error ? error.message : String(error);
          const shortMessage = (error as { shortMessage?: string })?.shortMessage || '';
          if (errorMessage?.includes('multiSendNative') || shortMessage?.includes('multiSendNative')) {
            try {
              await writeContract({
                address: multiSendAddress as `0x${string}`,
                abi: multiSendAbi,
                functionName: 'multiSend',
                args: [addresses, amounts],
                value: totalAmount + fee,
              });
              addToast({
                type: 'info',
                title: 'Transaction Submitted',
                description: 'Waiting for confirmation...',
              });
            } catch (fallbackError) {
              throw fallbackError;
            }
          } else {
            throw error;
          }
        }

      } else {
        // Token (PRC-20) sending using multi-send contract
        if (!data.tokenAddress) {
          addToast({
            type: 'error',
            title: 'Token Address Required',
            description: 'Please provide a valid token contract address.',
          });
          setIsLoading(false);
          return;
        }

        const amounts = data.recipients.map(r => convertToBigInt(r.amount, decimals));
        const fee = (feeAmount as bigint) ?? parseEther('0.00235');

        addToast({
          type: 'info',
          title: 'Starting Token Multi-Send',
          description: `Sending tokens to ${addresses.length} recipients...`,
        });

        try {
          await writeContract({
            address: multiSendAddress as `0x${string}`,
            abi: multiSendAbi,
            functionName: 'multiSendToken',
            args: [data.tokenAddress as `0x${string}`, addresses, amounts],
            value: fee, // Fee for token multi-send
          });

          addToast({
            type: 'info',
            title: 'Transaction Submitted',
            description: 'Waiting for confirmation...',
          });
        } catch (error) {
          console.error('Error in token multi-send:', error);
          addToast({
            type: 'error',
            title: 'Token Multi-Send Failed',
            description: error instanceof Error ? error.message : 'Failed to send token multi-send transaction.',
          });
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error sending tokens:', error);
      addToast({
        type: 'error',
        title: 'Transaction Failed',
        description: error instanceof Error ? error.message : 'Failed to send tokens. Please try again.',
      });
      setIsLoading(false);
    }
  };


  const totalAmount = recipients.reduce((sum: number, recipient: { amount: string }) => {
    const amount = parseFloat(recipient.amount || '0');
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  return (
    <RequireWallet>
      <div className="min-h-screen py-8 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Multi-Send</h1>
            <p className="text-gray-300">
              Send tokens to multiple addresses efficiently with a single transaction.
            </p>
          </div>

          {isComingSoon && (
            <>
              <div className="fixed top-16 left-0 right-0 lg:left-64 bottom-0 z-40 pointer-events-auto cursor-not-allowed select-none">
                <div className="absolute inset-0 backdrop-blur-md bg-black/80" />
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto max-w-2xl z-20 text-center px-6">
                  <div className="rounded-lg border-2 border-white bg-black backdrop-blur-sm p-4 shadow-sm">
                    <p className="font-semibold mb-1 text-white">Coming Soon</p>
                    <p className="text-sm text-gray-300">
                      Multi-Send is not available yet. Please check back later.
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
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {/* Token Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Token Selection</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Token Type
                        </label>
                        <select
                          {...register('tokenType')}
                          className="w-full h-12 px-4 rounded-md bg-[#050505] text-white border-2 border-white/25 hover:border-white/60 focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/70 focus:border-[#CCFF00] transition-colors"
                        >
                  <option value="native">Native Token (ETH)</option>
                          <option value="prc20">Token</option>
                        </select>
                      </div>
                      {watch('tokenType') === 'prc20' && (
                        <div>
                          <FormField
                            label="Token Address"
                            placeholder="0x..."
                            error={errors.tokenAddress?.message}
                            {...register('tokenAddress')}
                          />
                          {needsApproval && (
                            <div className="mt-4 p-4 bg-black/70 border border-white/30 rounded-lg">
                              <p className="text-sm text-white mb-2">
                                Approval required before multi-send.
                              </p>
                              <button
                                type="button"
                                onClick={handleApprove}
                                disabled={isApproving}
                                className="btn-secondary text-sm w-full"
                              >
                                {isApproving ? 'Approving...' : 'Approve Tokens'}
                              </button>
                            </div>
                          )}
                          {!needsApproval && tokenAddress && (
                            <div className="mt-4 p-4 bg-black/70 border border-white/30 rounded-lg">
                              <p className="text-sm text-white">
                                ✓ Token approved and ready for multi-send
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Upload Recipients</h3>
                    <FileDrop
                      onFileSelect={handleFileSelect}
                      acceptedTypes={['.csv', '.json']}
                      maxSize={5}
                    />
                    <p className="text-sm text-gray-500">
                      Upload a CSV or JSON file with address and amount columns. CSV format: address,amount
                    </p>
                  </div>

                  {/* Manual Entry Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Manual Entry</h3>
                      <button
                        type="button"
                        onClick={() => append({ address: '', amount: '' })}
                        className="btn-secondary text-sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Recipient
                      </button>
                    </div>

                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-6">
                            <FormField
                              label={`Recipient ${index + 1} Address`}
                              placeholder="0x..."
                              error={errors.recipients?.[index]?.address?.message}
                              {...register(`recipients.${index}.address`)}
                            />
                          </div>
                          <div className="md:col-span-5">
                            <FormField
                              label="Amount"
                              error={errors.recipients?.[index]?.amount?.message}
                              {...register(`recipients.${index}.amount`)}
                            />
                          </div>
                          <div className="md:col-span-1 flex items-end">
                            {fields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="p-2 text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Options</h3>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={useSequential}
                        onChange={(e) => setUseSequential(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        Use sequential sending (fallback if bulk sending fails)
                      </span>
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading || isWritePending || isConfirming || recipients.length === 0 || (tokenType === 'prc20' && needsApproval)}
                      className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading || isWritePending || isConfirming ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          {isConfirming ? 'Confirming...' : 'Preparing...'}
                        </div>
                      ) : (
                        `Send to ${recipients.length} Recipient${recipients.length !== 1 ? 's' : ''}`
                      )}
                    </button>
                  </div>
                </form>

              </div>
            </div>

            {/* Right: Summary Panel */}
            <div className={`lg:col-span-4 ${isComingSoon ? 'blur-sm select-none pointer-events-none user-select-none' : ''}`}>
              <div className="card p-6 lg:sticky lg:top-24 space-y-4">
                <h3 className="text-lg font-semibold text-white">Summary</h3>
                
                {/* Fee Information */}
                <div className="bg-black/70 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Multi-Send Fee</h4>
                  <p className="text-sm text-gray-300">
                    Fee {feeAmount ? formatUnits(feeAmount as bigint, 18) : '0.00235'} ETH will be charged for each multi-send operation.
                  </p>
                </div>

                <div className="bg-black/70 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                  <p className="text-sm text-gray-300">Token Type</p>
                  <p className="text-lg font-bold text-white">
                    {watch('tokenType') === 'native' ? 'Native (ETH)' : 'Token'}
                  </p>
                  <p className="text-sm text-gray-300 mt-4">Recipients</p>
                  <p className="text-2xl font-bold text-white">{recipients.length}</p>
                  <p className="text-sm text-gray-300 mt-4">Estimated Total</p>
                  <p className="text-2xl font-bold text-white">{totalAmount.toLocaleString()} tokens</p>
                  {watch('tokenType') === 'native' && (
                    <>
                      <p className="text-sm text-gray-300 mt-4">Total ETH Required</p>
                      <p className="text-lg font-bold text-white">
                        {(totalAmount + (feeAmount ? Number(formatUnits(feeAmount as bigint, 18)) : 0.00235)).toLocaleString()} ETH
                      </p>
                    </>
                  )}
                </div>
                <div className={`border rounded-lg p-4 ${
                  process.env.NEXT_PUBLIC_MULTISEND 
                    ? 'bg-black border-white'
                    : 'bg-black/70 backdrop-blur-sm border border-white/20'
                }`}>
                  <p className={`text-sm ${
                    process.env.NEXT_PUBLIC_MULTISEND 
                      ? 'text-white'
                      : 'text-gray-300'
                  }`}>
                    You can send tokens to multiple recipients in a single transaction.
                  </p>
                </div>
                <div className="text-sm text-gray-300">
                  Import supports CSV and JSON. Ensure amounts are in token units.
                  <br />
                  <br />
                  <strong>Note:</strong> Make sure you have enough ETH for the multi-send fee.
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













