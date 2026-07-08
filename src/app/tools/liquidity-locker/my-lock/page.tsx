'use client';

import { useEffect, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { RequireWallet } from '@/components/RequireWallet';
import { explorerUrl } from '@/lib/utils';
import { formatUnits } from 'viem';
import liquidityLockerAbi from '@/lib/abis/liquidityLocker.json';
import type { Abi } from 'viem';

type LockRow = {
  lockId: bigint;
  lpToken: `0x${string}`;
  amount: bigint;
  withdrawn: bigint;
  unlockDate: bigint;
  withdrawable: bigint;
  decimals: number;
  symbol: string;
};

export default function MyLiquidityLockPage() {
  const { address } = useAccount();
  const client = usePublicClient();
  const [rows, setRows] = useState<LockRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<bigint | null>(null);
  const [totalLocksCount, setTotalLocksCount] = useState(0);
  const [totalUnlockCount, setTotalUnlockCount] = useState(0);
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const locker = (process.env.NEXT_PUBLIC_LP_LOCKER || '') as `0x${string}`;
  const isComingSoon = process.env.NEXT_PUBLIC_LIQUIDITY_LOCKER_COMING_SOON === 'true'; // Toggle via env

  const safeFormat = (value?: bigint, decimals?: number, symbol?: string) => {
    try {
      const v = typeof value === 'bigint' ? value : BigInt(0);
      const d = typeof decimals === 'number' && Number.isFinite(decimals) ? decimals : 18;
      const s = symbol || '';
      return `${formatUnits(v, d)} ${s}`.trim();
    } catch {
      try {
        return `${String(value ?? BigInt(0))} ${symbol || ''}`.trim();
      } catch {
        return '0';
      }
    }
  };

  const fetchData = async () => {
    if (!address || !client || !locker) {
      setRows([]);
      return;
    }

    setIsLoading(true);
    try {
      const abi = liquidityLockerAbi as unknown as Abi;
      
      // Try to get locks for the user
      // Note: This is a simplified version - you may need to adjust based on your contract's actual structure
      let lockIds: bigint[] = [];
      
      try {
        // Try locksOf function if it exists
        lockIds = (await client.readContract({
          address: locker,
          abi,
          functionName: 'locksOf',
          args: [address],
        })) as bigint[];
      } catch {
        // If locksOf doesn't exist, try to get from events or other methods
        // For now, we'll use a placeholder approach
      }

      const result: LockRow[] = [];
      for (const id of lockIds) {
        try {
          type LockInfo = { lpToken: `0x${string}`; amount: bigint; withdrawn: bigint; unlockDate: bigint; owner: `0x${string}` };
          const infoRaw = (await client.readContract({
            address: locker,
            abi,
            functionName: 'locks',
            args: [id],
          })) as unknown;

          const info: LockInfo = ((): LockInfo => {
            if (infoRaw && typeof infoRaw === 'object' && !Array.isArray(infoRaw) && 'owner' in (infoRaw as Record<string, unknown>)) {
              const obj = infoRaw as Record<string, unknown>;
              return {
                lpToken: obj.lpToken as `0x${string}`,
                amount: obj.amount as bigint,
                withdrawn: obj.withdrawn as bigint,
                unlockDate: obj.unlockDate as bigint,
                owner: obj.owner as `0x${string}`,
              };
            }
            const arr = infoRaw as unknown as Array<unknown>;
            return {
              lpToken: arr?.[0] as `0x${string}`,
              amount: arr?.[1] as bigint,
              withdrawn: arr?.[2] as bigint,
              unlockDate: arr?.[3] as bigint,
              owner: arr?.[4] as `0x${string}`,
            };
          })();

          if (info.owner.toLowerCase() !== address.toLowerCase()) {
            continue;
          }

          let w: bigint = BigInt(0);
          try {
            w = (await client.readContract({
              address: locker,
              abi,
              functionName: 'withdrawable',
              args: [id],
            })) as bigint;
          } catch {
            w = BigInt(0);
          }

          let decNum = 18;
          try {
            const dec = (await client.readContract({
              address: info.lpToken,
              abi: [
                { inputs: [], name: 'decimals', outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
              ] as unknown as Abi,
              functionName: 'decimals',
            })) as number;
            decNum = Number(dec ?? 18);
          } catch {
            decNum = 18;
          }

          let symStr = '';
          try {
            const sym = (await client.readContract({
              address: info.lpToken,
              abi: [
                { inputs: [], name: 'symbol', outputs: [{ name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
              ] as unknown as Abi,
              functionName: 'symbol',
            })) as string;
            symStr = sym ?? '';
          } catch {
            symStr = '';
          }

          result.push({
            lockId: id,
            lpToken: info.lpToken,
            symbol: symStr,
            decimals: decNum,
            amount: info.amount,
            withdrawn: info.withdrawn,
            unlockDate: info.unlockDate,
            withdrawable: w,
          });
        } catch (e) {
          console.error('Error fetching lock:', e);
        }
      }

      const active = result.filter((r) => ((r.amount ?? BigInt(0)) - (r.withdrawn ?? BigInt(0))) > BigInt(0));
      setRows(active);
      setTotalLocksCount(active.length);
      setTotalUnlockCount(active.filter((r) => (r.withdrawable ?? BigInt(0)) > BigInt(0)).length);
    } catch (error) {
      console.error('Error fetching locks:', error);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, client, locker]);

  const onWithdraw = async (lockId: bigint) => {
    if (!locker) return;
    setSelected(lockId);
    await writeContract({
      address: locker,
      abi: [
        { inputs: [{ name: 'lockId', type: 'uint256' }], name: 'withdraw', outputs: [], stateMutability: 'nonpayable', type: 'function' },
      ],
      functionName: 'withdraw',
      args: [lockId],
    });
  };

  useEffect(() => {
    if (isSuccess) {
      fetchData();
      setSelected(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  return (
    <RequireWallet>
      <div className="min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#000000] mb-2">My Locks</h1>
            <p className="text-[#222222]">Manage and withdraw your unlocked LP tokens.</p>
          </div>

          {/* Blur overlay while coming soon - covers only main content area, not header/sidebar */}
          {isComingSoon && (
            <>
              <div className="fixed top-16 left-0 right-0 lg:left-64 bottom-0 z-40 pointer-events-auto cursor-not-allowed select-none">
                <div className="absolute inset-0 backdrop-blur-md bg-white/80" />
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto max-w-2xl z-20 text-center px-6">
                  <div className="rounded-lg border-2 border-[#000000] bg-white backdrop-blur-sm p-4 shadow-sm">
                    <p className="font-semibold mb-1 text-[#000000]">Coming Soon</p>
                    <p className="text-sm text-[#222222]">
                      Liquidity Locker is not available yet. For now, you can use Token Locker to lock your LP tokens.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className={`card p-6 overflow-x-auto ${isComingSoon ? 'blur-sm select-none pointer-events-none user-select-none' : ''}`}>
            {isLoading ? (
              <p className="text-[#222222]">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="text-[#222222]">No active locks available.</p>
            ) : (
              <>
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="rounded-lg border border-[#000000]/20 p-4 bg-white/70 backdrop-blur-sm">
                    <p className="text-xs text-[#666666]">Total Locks</p>
                    <p className="text-2xl font-semibold text-[#000000]">{totalLocksCount}</p>
                  </div>
                  <div className="rounded-lg border border-[#000000]/20 p-4 bg-white/70 backdrop-blur-sm">
                    <p className="text-xs text-[#666666]">Total Unlock</p>
                    <p className="text-2xl font-semibold text-[#000000]">{totalUnlockCount}</p>
                  </div>
                </div>

                <table className="min-w-full text-sm text-[#000000]">
                  <thead>
                    <tr className="text-left text-[#222222]">
                      <th className="py-2 pr-4">LP Token</th>
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Unlock Time</th>
                      <th className="py-2 pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row?.lockId ? String(row.lockId) : `row-${idx}`} className="border-t border-[#000000]/20 hover:bg-[#000000]/5">
                        <td className="py-3 pr-4 font-mono break-all">
                          {row?.lpToken || '-'}
                          <button
                            onClick={() => navigator.clipboard.writeText(row.lpToken)}
                            className="ml-2 text-xs text-[#666666] hover:text-[#000000] underline"
                          >
                            Copy
                          </button>
                        </td>
                        <td className="py-3 pr-4">{safeFormat((row.amount ?? BigInt(0)) - (row.withdrawn ?? BigInt(0)), row.decimals, row.symbol)}</td>
                        <td className="py-3 pr-4">{new Date(Number(row?.unlockDate ?? BigInt(0)) * 1000).toLocaleString()}</td>
                        <td className="py-3 pr-4">
                          <button
                            className="btn-primary px-3 py-1"
                            disabled={row.withdrawable === BigInt(0) || isPending || isConfirming}
                            onClick={() => onWithdraw(row.lockId)}
                          >
                            {selected === row.lockId && (isPending || isConfirming) ? 'Withdrawing...' : 'Withdraw'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            </div>
          </div>

          {txHash && (
            <div className="mt-6 p-4 bg-white border border-[#000000] rounded-lg">
              <a href={explorerUrl('', txHash)} target="_blank" rel="noopener noreferrer" className="text-[#000000] underline">View transaction on explorer</a>
            </div>
          )}
        </div>
    </RequireWallet>
  );
}













