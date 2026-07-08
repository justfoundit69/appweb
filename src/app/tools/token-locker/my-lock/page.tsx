'use client';

import { useEffect, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { RequireWallet } from '@/components/RequireWallet';
import { explorerUrl } from '@/lib/utils';
import { formatUnits } from 'viem';
import { useMyLocks } from './useMyLocks';

type LockRow = {
  lockId: bigint;
  token: `0x${string}`;
  amount: bigint;
  withdrawn: bigint;
  lockUntil: bigint;
  withdrawable: bigint;
  decimals: number;
  symbol: string;
  owner: `0x${string}`;
};

export default function MyLockPage() {
  const [rows, setRows] = useState<LockRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<bigint | null>(null);
  const [copiedLockId, setCopiedLockId] = useState<bigint | null>(null);
  const [totalLocksCount, setTotalLocksCount] = useState(0);
  const [totalUnlockCount, setTotalUnlockCount] = useState(0);
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const lockerEnv = process.env.NEXT_PUBLIC_TOKEN_LOCKER;
  const locker = lockerEnv ? (lockerEnv as `0x${string}`) : undefined;
  const { locks, refresh } = useMyLocks(locker);

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
    setIsLoading(true);
    try {
      const allResults: LockRow[] = (locks || []).map((l) => ({
        lockId: l.lockId,
        token: l.token,
        amount: l.amount,
        withdrawn: l.withdrawn,
        lockUntil: l.unlockAt,
        withdrawable: l.withdrawable,
        decimals: l.decimals,
        symbol: l.symbol,
        owner: l.owner,
      }));
      const active = allResults.filter((r) => ((r.amount ?? BigInt(0)) - (r.withdrawn ?? BigInt(0))) > BigInt(0));
      setRows(active);
      setTotalLocksCount(active.length);
      setTotalUnlockCount(active.filter((r) => (r.withdrawable ?? BigInt(0)) > BigInt(0)).length);
    } finally {
      setIsLoading(false);
    }
  };

  const getShareBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_APP_BASE_URL ?? 'https://app.chestfi.com';
  };

  const handleShare = async (token: `0x${string}`, owner: `0x${string}`, lockId: bigint) => {
    const base = getShareBaseUrl();
    const url = `${base}/token-locker/${token}/${owner}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopiedLockId(lockId);
        setTimeout(() => setCopiedLockId(null), 1500);
      } catch {
        setCopiedLockId(null);
      }
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locks]);

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
      refresh(); // Refresh locks from contract
      setSelected(null);
    }
  }, [isSuccess, refresh]);

  return (
    <RequireWallet>
      <div className="min-h-screen py-8">
        {!locker && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <div className="p-4 rounded-md bg-red-500/10 border border-red-500/40 text-red-100 text-sm">
              Token locker contract belum dikonfigurasi. Setel <code className="font-mono">NEXT_PUBLIC_TOKEN_LOCKER</code> di environment untuk mengakses halaman ini.
            </div>
          </div>
        )}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#000000] mb-2">My Locks</h1>
            <p className="text-[#222222]">Manage and withdraw your unlocked tokens.</p>
          </div>

          <div className="card p-6 overflow-x-auto">
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
                      <th className="py-2 pr-4">Token</th>
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Unlock Time</th>
                      <th className="py-2 pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row?.lockId ? String(row.lockId) : `row-${idx}`} className="border-t border-[#000000]/20 hover:bg-[#000000]/5">
                        <td className="py-3 pr-4 font-mono break-all">
                          {row?.token || '-'}
                          <button
                            onClick={() => navigator.clipboard.writeText(row.token)}
                            className="ml-2 text-xs text-[#666666] hover:text-[#000000] underline"
                          >
                            Copy
                          </button>
                        </td>
                        <td className="py-3 pr-4">{safeFormat((row.amount ?? BigInt(0)) - (row.withdrawn ?? BigInt(0)), row.decimals, row.symbol)}</td>
                        <td className="py-3 pr-4">{new Date(Number(row?.lockUntil ?? BigInt(0)) * 1000).toLocaleString()}</td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="px-3 py-1 rounded-md border border-[#000000] text-[#000000] hover:bg-[#000000]/5 transition"
                              onClick={() => handleShare(row.token, row.owner, row.lockId)}
                            >
                              {copiedLockId === row.lockId ? 'Link Copied' : 'Share'}
                            </button>
                            <button
                              className="btn-primary px-3 py-1"
                              disabled={row.withdrawable === BigInt(0) || isPending || isConfirming}
                              onClick={() => onWithdraw(row.lockId)}
                            >
                              {selected === row.lockId && (isPending || isConfirming) ? 'Withdrawing...' : 'Withdraw'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {txHash && (
            <div className="mt-6 p-4 bg-white border border-[#000000] rounded-lg">
              <a href={explorerUrl('', txHash)} target="_blank" rel="noopener noreferrer" className="text-[#000000] underline">View transaction on explorer</a>
            </div>
          )}
        </div>
      </div>
    </RequireWallet>
  );
}















