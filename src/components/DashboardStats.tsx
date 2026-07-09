'use client';

import { useEffect, useState } from 'react';
import { Calendar, Coins, Lock, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useReadContract } from 'wagmi';
import type { Abi } from 'viem';
import tokenFactoryAbi from '@/lib/abis/tokenFactory.json';
import tokenLockerAbi from '@/lib/abis/tokenLocker.json';

type StatCard = {
  label: string;
  value: string;
  numericValue?: number;
  icon: LucideIcon;
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function asAddress(value?: string): `0x${string}` | undefined {
  if (!value || value === ZERO_ADDRESS || !/^0x[a-fA-F0-9]{40}$/.test(value)) {
    return undefined;
  }

  return value as `0x${string}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Number(value));
}

function countFromNextId(nextId?: bigint): bigint | undefined {
  if (nextId === undefined) {
    return undefined;
  }

  return nextId > BigInt(0) ? nextId - BigInt(1) : BigInt(0);
}

function AnimatedCount({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const duration = 800;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    setDisplayValue(0);
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{formatNumber(displayValue)}</>;
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
            {typeof stat.numericValue === 'number' ? (
              <AnimatedCount value={stat.numericValue} />
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
      value: isLocksError || !tokenLocker ? '-' : '0',
      numericValue: lockCount === undefined || isLocksError || !tokenLocker ? undefined : Number(lockCount),
      icon: Lock,
    },
    {
      label: 'Total Tokens Created',
      value: isTokensError || !tokenFactory ? '-' : '0',
      numericValue: deployedTokenCount === undefined || isTokensError || !tokenFactory ? undefined : Number(deployedTokenCount),
      icon: Coins,
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
