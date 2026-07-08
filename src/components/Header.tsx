'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';

export function Header() {
  const { address } = useAccount();
  const { data: balance } = useBalance({
    address,
    chainId: 4663,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });

  const balanceLabel = balance ? `${Number(balance.formatted).toFixed(4)} ${balance.symbol}` : '0.0000 ETH';

  return (
    <header className="fixed left-16 right-0 top-0 z-50 bg-black pb-3 pl-0 pr-4 pt-3 lg:left-60">
      <div className="flex h-16 items-center justify-end rounded-lg border border-white/10 bg-[#060706] px-4">
        <ConnectButton.Custom>
          {({ account, chain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <div className="flex items-center gap-2">
                {connected && (
                  <div className="hidden rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white sm:block">
                    {balanceLabel}
                  </div>
                )}

                {!connected ? (
                  <button
                    type="button"
                    onClick={ready ? openConnectModal : undefined}
                    className="rounded-lg border border-[#CCFF00] bg-[#CCFF00] px-5 py-3 text-sm font-bold text-black transition-colors hover:bg-white"
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={openChainModal}
                      className="hidden rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white hover:border-[#CCFF00]/50 hover:text-[#CCFF00] md:block"
                    >
                      {chain.hasIcon && chain.iconUrl ? (
                        <span
                          className="mr-2 inline-block h-3 w-3 rounded-full align-middle"
                          style={{ background: chain.iconBackground }}
                        />
                      ) : (
                        <span className="mr-2 inline-block h-3 w-3 rounded-full bg-[#CCFF00] align-middle" />
                      )}
                      {chain.name}
                    </button>
                    <button
                      type="button"
                      onClick={openAccountModal}
                      className="rounded-lg border border-[#CCFF00] bg-[#CCFF00] px-4 py-3 text-sm font-bold text-black transition-colors hover:bg-white"
                    >
                      {account.displayName}
                    </button>
                  </div>
                )}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}
