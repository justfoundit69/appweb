'use client';

import Link from 'next/link';

export default function TokenLockProofPage() {

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-2">
          <Link href="/token-locker/token-lock" className="text-sm text-[#1C180D] hover:underline">
            ← Back to Token Locker
          </Link>
          <h1 className="text-3xl font-bold text-[#1C180D]">Token Lock Proof</h1>
        </div>

        <div className="card p-6">
          <div className="rounded-md border border-[#1C180D]/25 bg-white/10 p-6 text-[#1C180D]">
            <h2 className="text-lg font-semibold mb-2">Share Link Format Updated</h2>
            <p className="text-sm mb-4">
              Share links now require both token address and owner address to ensure privacy and proper lock filtering.
            </p>
            <p className="text-sm font-mono text-xs bg-white/70 p-3 rounded border border-yellow-500/30 mb-4 break-all">
              New format: /token-locker/&#123;tokenAddress&#125;/&#123;ownerAddress&#125;
            </p>
            <p className="text-sm">
              Please use the share link from <Link href="/token-locker/my-lock" className="text-[#1C180D] hover:underline font-semibold">My Locks</Link> page which includes both addresses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}













