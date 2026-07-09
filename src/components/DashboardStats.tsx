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
  icon: LucideIcon;
  isLoading?: boolean;
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

function StatCardItem({ stat }: { stat: StatCard }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5 sm:p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#CCFF00]/25 bg-[#CCFF00]/10 text-[#CCFF00]">
          <stat.icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-400">{stat.label}</p>
          <p className="mt-1 flex min-h-8 items-center text-2xl font-bold text-white">
            {stat.isLoading ? (
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#CCFF00]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#CCFF00] [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#CCFF00] [animation-delay:300ms]" />
              </span>
            ) : (
              stat.value
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export function DashboardStats() {
  const tokenLocker = asAddress(process.env.NEXT_PUBLIC_TOKEN_LOCKER);
  const tokenFactory = asAddress(process.env.NEXT_PUBLIC_TOKEN_FACTORY);

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
      value: isLocksError || !tokenLocker ? '-' : formatCount(lockCount),
      icon: Lock,
      isLoading: !!tokenLocker && isLocksLoading,
    },
    {
      label: 'Total Tokens Created',
      value: isTokensError || !tokenFactory ? '-' : formatCount(deployedTokenCount),
      icon: Coins,
      isLoading: !!tokenFactory && isTokensLoading,
    },
    {
      label: 'Total Value Locked',
      value: 'Soon',
      icon: Shield,
    },
    {
      label: 'Active Vestings',
      value: 'Soon',
      icon: Calendar,
    },
  ];

  return (
    <section className="grid gap-5 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCardItem key={stat.label} stat={stat} />
      ))}
    </section>
  );
}
