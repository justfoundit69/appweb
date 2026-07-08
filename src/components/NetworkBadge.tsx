'use client';

import { useChainId } from 'wagmi';
import { robinhoodChain } from '@/lib/chains';

export function NetworkBadge() {
  const chainId = useChainId();
  const isCorrectChain = chainId === robinhoodChain.id;

  return (
    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
      isCorrectChain
        ? 'bg-[#CCFF00] text-black border border-[#CCFF00]'
        : 'bg-red-100 text-red-800 border border-red-200'
    }`}>
      {isCorrectChain ? `${robinhoodChain.name} • ${robinhoodChain.id}` : 'Wrong Network'}
    </div>
  );
}
