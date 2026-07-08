'use client';

import { Calendar, Coins, Lock, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useReadContract } from 'wagmi';
import type { Abi } from 'viem';
import tokenFactoryAbi from '@/lib/abis/tokenFactory.json';
import tokenLockerAbi from '@/lib/abis/tokenLocker.json';

type StatCard = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  isLive?: boolean;
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function asAddress(value?: string): `0x${string}` | undefined {
  if (!value || value === ZERO_ADDRESS || !/^0x[a-fA-F0-9]{40}$/.test(value)) {
    return undefined;
  }

  return value as `0x${string}`;
}

function formatCount(value?: bigint): string {
  if (value === undefined) {
    return '-';
  }

  return new Intl.NumberFormat('en-US').format(Number(value));
}

function countFromNextId(nextId?: bigint): bigint | undefined {
  if (nextId === undefined) {
    return undefined;
  }

  return nextId > BigInt(0) ? nextId - BigInt(1) : BigInt(0);
}

function helperText(isLoading: boolean, isError: boolean, enabled: boolean, liveText: string, emptyText: string) {
  if (!enabled) return emptyText;
  if (isLoading) return 'Loading on-chain data';
  if (isError) return 'Unable to read contract';
  return liveText;
}

function StatCardItem({ stat }: { stat: StatCard }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#CCFF00]/25 bg-[#CCFF00]/10 text-[#CCFF00] shadow-[0_0_18px_rgba(204,255,0,0.16)]">
          <stat.icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-400">{stat.label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
          <p className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            {stat.isLive && <span className="h-1.5 w-1.5 rounded-full bg-[#CCFF00]" />}
            <span>{stat.helper}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function DashboardStats() {
  const tokenLocker = asAddress(process.env.NEXT_PUBLIC_TOKEN_LOCKER);
  const tokenFactory = asAddress(process.env.NEXT_PUBLIC_TOKEN_FACTORY);
  const vestingFactory = asAddress(process.env.NEXT_PUBLIC_VESTING_FACTORY);

  const {
    data: nextLockId,
    isLoading: isLocksLoading,
    isError: isLocksError,
  } = useReadContract({
    address: tokenLocker,
    abi: tokenLockerAbi as Abi,
    functionName: 'nextLockId',
    query: {
      enabled: !!tokenLocker,
      refetchInterval: 10000,
    },
  });

  const {
    data: tokenCount,
    isLoading: isTokensLoading,
    isError: isTokensError,
  } = useReadContract({
    address: tokenFactory,
    abi: tokenFactoryAbi as Abi,
    functionName: 'getDeployedTokensCount',
    query: {
      enabled: !!tokenFactory,
      refetchInterval: 10000,
    },
  });

  const lockCount = countFromNextId(typeof nextLockId === 'bigint' ? nextLockId : undefined);
  const deployedTokenCount = typeof tokenCount === 'bigint' ? tokenCount : undefined;

  const stats: StatCard[] = [
    {
      label: 'Total Locks',
      value: formatCount(lockCount),
      helper: helperText(isLocksLoading, isLocksError, !!tokenLocker, 'Live from token locker', 'Set NEXT_PUBLIC_TOKEN_LOCKER'),
      icon: Lock,
      isLive: !!tokenLocker && !isLocksLoading && !isLocksError,
    },
    {
      label: 'Total Tokens Created',
      value: formatCount(deployedTokenCount),
      helper: helperText(isTokensLoading, isTokensError, !!tokenFactory, 'Live from token factory', 'Set NEXT_PUBLIC_TOKEN_FACTORY'),
      icon: Coins,
      isLive: !!tokenFactory && !isTokensLoading && !isTokensError,
    },
    {
      label: 'Total Value Locked',
      value: 'Unavailable',
      helper: 'Needs token indexer and price source',
      icon: Shield,
    },
    {
      label: 'Active Vestings',
      value: 'Unavailable',
      helper: vestingFactory ? 'Vesting ABI has no public counter' : 'Set NEXT_PUBLIC_VESTING_FACTORY',
      icon: Calendar,
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCardItem key={stat.label} stat={stat} />
      ))}
    </section>
  );
}
