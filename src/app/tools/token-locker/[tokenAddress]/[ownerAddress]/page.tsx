'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { formatAddress, explorerUrl, isValidAddress } from '@/lib/utils';
import { useTokenLocksByToken } from '../../useTokenLocksByToken';

type PageProps = {
  params: {
    tokenAddress: string;
    ownerAddress: string;
  };
};

const SHARE_BASE_FALLBACK = process.env.NEXT_PUBLIC_APP_BASE_URL ?? 'https://app.chestfi.com';

const statusLabel = (lockUntil: bigint, remaining: bigint) => {
  if (remaining <= BigInt(0)) {
    return 'Withdrawn';
  }
  const unlockTimeMs = Number(lockUntil) * 1000;
  return unlockTimeMs <= Date.now() ? 'Unlocked' : 'Locked';
};

const statusColor = (label: string) => {
  switch (label) {
    case 'Unlocked':
      return 'bg-white/10 text-[#1C180D] border border-[#1C180D]/25';
    case 'Withdrawn':
      return 'bg-gray-500/10 text-[#3f3a2b] border border-gray-500/40';
    default:
      return 'bg-white/10 text-[#3f3a2b] border border-[#1C180D]/25';
  }
};

const buildShareUrl = (token: string, owner: string) => {
  if (!token || !owner) return '';
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/token-locker/${token}/${owner}`;
  }
  return `${SHARE_BASE_FALLBACK}/token-locker/${token}/${owner}`;
};

export default function TokenLockProofPage({ params }: PageProps) {
  const rawTokenParam = decodeURIComponent(params.tokenAddress ?? '');
  const rawOwnerParam = decodeURIComponent(params.ownerAddress ?? '');
  const normalizedToken = rawTokenParam.startsWith('0x') ? rawTokenParam : `0x${rawTokenParam}`;
  const normalizedOwner = rawOwnerParam.startsWith('0x') ? rawOwnerParam : `0x${rawOwnerParam}`;
  const isValidToken = isValidAddress(normalizedToken);
  const isValidOwner = isValidAddress(normalizedOwner);
  const [copied, setCopied] = useState(false);

  const { locks, symbol, decimals, isLoading, error, totals, refreshedAt } = useTokenLocksByToken(
    isValidToken ? (normalizedToken as `0x${string}`) : undefined,
    isValidOwner ? (normalizedOwner as `0x${string}`) : undefined
  );

  const shareUrl = useMemo(
    () => (isValidToken && isValidOwner ? buildShareUrl(normalizedToken, normalizedOwner) : ''),
    [isValidToken, isValidOwner, normalizedToken, normalizedOwner]
  );

  const formatAmount = (value: bigint) => {
    try {
      return formatUnits(value, decimals || 18);
    } catch {
      return value.toString();
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        setCopied(false);
      }
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-2">
          <Link href="/token-locker/token-lock" className="text-sm text-[#1C180D] hover:underline">
            ← Back to Token Locker
          </Link>
          <h1 className="text-3xl font-bold text-[#1C180D]">Token Lock Proof</h1>
          <p className="text-[#3f3a2b]">
            Share this read-only view so anyone can verify the locks for your token directly from the smart contract.
          </p>
          {isValidToken && isValidOwner && (
            <div className="space-y-1">
              <p className="text-[#6b6657] font-mono text-sm break-all">
                Token: {normalizedToken}{' '}
                <a
                  href={explorerUrl(normalizedToken)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1C180D] hover:underline ml-1"
                >
                  (View on explorer)
                </a>
              </p>
              <p className="text-[#6b6657] font-mono text-sm break-all">
                Owner: {formatAddress(normalizedOwner)}{' '}
                <a
                  href={explorerUrl(normalizedOwner)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1C180D] hover:underline ml-1"
                >
                  (View on explorer)
                </a>
              </p>
            </div>
          )}
        </div>

        <div className="card p-6 space-y-4">
          <div>
            <p className="text-sm text-[#3f3a2b] mb-2">Shareable Link</p>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                readOnly
                value={shareUrl || 'Invalid token or owner address'}
                className="flex-1 bg-white/70 border border-[#1C180D]/40 rounded-md px-4 py-3 text-[#1C180D] font-mono text-sm"
              />
              <button
                type="button"
                onClick={handleCopy}
                disabled={!shareUrl}
                className="btn-primary px-6 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {(!isValidToken || !isValidOwner) && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-red-200">
              {!isValidToken && !isValidOwner
                ? 'Token address and owner address are invalid. Please ensure the URL contains valid 0x-prefixed addresses.'
                : !isValidToken
                ? 'Token address is invalid. Please ensure the URL contains a valid 0x-prefixed address.'
                : 'Owner address is invalid. Please ensure the URL contains a valid 0x-prefixed address.'}
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-red-200">
              Failed to load lock data: {error}
            </div>
          )}
        </div>

        {isValidToken && isValidOwner && (
          <div className="card p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border border-[#1C180D]/20 p-4 bg-white/70">
                <p className="text-xs text-[#6b6657] uppercase tracking-wide">Total Locked</p>
                <p className="text-2xl font-semibold text-[#1C180D] mt-1">
                  {formatAmount(totals.locked)} {symbol || ''}
                </p>
              </div>
              <div className="rounded-lg border border-[#1C180D]/20 p-4 bg-white/70">
                <p className="text-xs text-[#6b6657] uppercase tracking-wide">Remaining Locked</p>
                <p className="text-2xl font-semibold text-[#1C180D] mt-1">
                  {formatAmount(totals.remaining)} {symbol || ''}
                </p>
              </div>
              <div className="rounded-lg border border-[#1C180D]/20 p-4 bg-white/70">
                <p className="text-xs text-[#6b6657] uppercase tracking-wide">Already Withdrawn</p>
                <p className="text-2xl font-semibold text-[#1C180D] mt-1">
                  {formatAmount(totals.withdrawn)} {symbol || ''}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-[#6b6657]">
              <span>Last updated: {refreshedAt ? new Date(refreshedAt).toLocaleString() : '—'}</span>
              <span>{isLoading ? 'Refreshing…' : `${locks.length} lock${locks.length === 1 ? '' : 's'} found`}</span>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <p className="text-[#3f3a2b]">Loading lock data…</p>
              ) : locks.length === 0 ? (
                <p className="text-[#3f3a2b]">No locks found for this wallet and token combination.</p>
              ) : (
                <table className="min-w-full text-sm text-[#1C180D]">
                  <thead>
                    <tr className="text-left text-[#3f3a2b]">
                      <th className="py-2 pr-4">Owner</th>
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Unlock Time</th>
                      <th className="py-2 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locks.map((lock) => {
                      const remaining = lock.amount - lock.withdrawn;
                      const label = statusLabel(lock.lockUntil, remaining);
                      return (
                        <tr key={String(lock.lockId)} className="border-t border-[#1C180D]/20">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{formatAddress(lock.owner)}</span>
                              <button
                                type="button"
                                className="text-xs text-[#6b6657] hover:text-[#1C180D] underline"
                                onClick={() => {
                                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                    navigator.clipboard.writeText(lock.owner);
                                  }
                                }}
                              >
                                Copy
                              </button>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <div>
                              <p>{formatAmount(lock.amount)} {symbol || ''}</p>
                              <p className="text-xs text-[#6b6657]">
                                Withdrawn: {formatAmount(lock.withdrawn)}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            {new Date(Number(lock.lockUntil) * 1000).toLocaleString()}
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex ${statusColor(label)}`}>
                              {label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}












