'use client';

import { useMemo, useState } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract } from 'wagmi';
import vestingAbi from '@/lib/abis/vestingFactory.json';
import { formatUnits, type Abi } from 'viem';
import { RequireWallet } from '@/components/RequireWallet';
import ComingSoonOverlay from '@/components/ComingSoonOverlay';

const vestingFactoryAbi = vestingAbi as Abi;
const erc20DecimalsAbi = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const satisfies Abi;

type Schedule = {
  token: `0x${string}`;
  beneficiary: `0x${string}`;
  totalAmount: bigint;
  released: bigint;
  start: bigint;
  cliffMonths: bigint; // legacy in ABI, ignored for display
  durationMonths: bigint; // legacy in ABI, ignored for display
  mode?: number;
  isActive: boolean;
};

export default function MyVestingsPage() {
  const isComingSoon = process.env.NEXT_PUBLIC_VESTING_COMING_SOON === 'true';

  // All hooks must be called before any conditional returns
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);

  const { data: ids } = useReadContract({
    address: process.env.NEXT_PUBLIC_VESTING_FACTORY as `0x${string}`,
    abi: vestingFactoryAbi,
    functionName: 'getUserSchedules',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!process.env.NEXT_PUBLIC_VESTING_FACTORY && !isComingSoon },
  });

  const scheduleIds = useMemo(() => (ids as unknown as bigint[]) ?? [], [ids]);

  const { data: schedulesData, isLoading: schedulesLoading } = useReadContracts({
    contracts: scheduleIds.map((id) => ({
      address: process.env.NEXT_PUBLIC_VESTING_FACTORY as `0x${string}`,
      abi: vestingFactoryAbi,
      functionName: 'schedules',
      args: [id],
    })),
    query: {
      enabled: scheduleIds.length > 0 && !!process.env.NEXT_PUBLIC_VESTING_FACTORY && !isComingSoon,
    },
  });

  const schedules = useMemo(() => {
    if (!schedulesData || schedulesData.length === 0) return [] as Array<{ id: bigint; s: Schedule }>;
    return schedulesData
      .map((entry, idx) => {
        const schedule = (entry?.result ?? null) as Schedule | null;
        if (!schedule) return null;
        return { id: scheduleIds[idx], s: schedule };
      })
      .filter((item): item is { id: bigint; s: Schedule } => !!item);
  }, [scheduleIds, schedulesData]);

  const uniqueTokens = useMemo(() => {
    const set = new Set<`0x${string}`>();
    schedules.forEach(({ s }) => {
      set.add(s.token.toLowerCase() as `0x${string}`);
    });
    return Array.from(set);
  }, [schedules]);

  const { data: decimalsData } = useReadContracts({
    contracts: uniqueTokens.map((token) => ({
      address: token,
      abi: erc20DecimalsAbi,
      functionName: 'decimals',
    })),
    query: {
      enabled: uniqueTokens.length > 0 && !isComingSoon,
    },
  });

  const decimalsMap = useMemo(() => {
    if (!decimalsData) return {} as Record<string, number>;
    const map: Record<string, number> = {};
    uniqueTokens.forEach((token, idx) => {
      const value = decimalsData[idx]?.result as number | undefined;
      map[token] = value ?? 18;
    });
    return map;
  }, [decimalsData, uniqueTokens]);

  const claim = async (id: bigint) => {
    try {
      setIsLoading(true);
      await writeContract({
        address: process.env.NEXT_PUBLIC_VESTING_FACTORY as `0x${string}`,
        abi: vestingFactoryAbi,
        functionName: 'claim',
        args: [id],
      });
    } catch (error) {
      console.error('Claim failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RequireWallet>
      <div className="min-h-screen py-8 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">My Vestings</h1>
            <p className="text-gray-300">Manage and claim your vesting schedules.</p>
          </div>

          {isComingSoon && (
            <ComingSoonOverlay toolName="Token Vesting" />
          )}

          <div className={`card p-6 overflow-x-auto ${isComingSoon ? 'blur-sm select-none pointer-events-none user-select-none' : ''}`}>
            {schedulesLoading ? (
              <p className="text-gray-300">Loading vesting schedules...</p>
            ) : schedules.length === 0 ? (
              <p className="text-gray-300">No vesting schedules found.</p>
            ) : (
              <div className="space-y-3">
                {schedules.map(({ id, s }) => {
                  const dec = decimalsMap[s.token.toLowerCase()] ?? 18;
                  const total = formatUnits((s.totalAmount ?? (0 as unknown as bigint)), dec);
                  const released = formatUnits((s.released ?? (0 as unknown as bigint)), dec);
                  return (
                    <div key={id.toString()} className="border rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-300">#{id.toString()}</div>
                        <div className="font-medium">Token: {s.token}</div>
                        <div className="text-sm">Total: {total}</div>
                        <div className="text-sm">Released: {released}</div>
                      </div>
                      <button 
                        className="btn-primary" 
                        onClick={() => claim(id)}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Claiming...' : 'Claim'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </RequireWallet>
  );
}















