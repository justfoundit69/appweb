'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
  return (
    <header className="fixed right-4 top-3 z-50 hidden lg:block">
      <ConnectButton.Custom>
        {({ account, chain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
          const ready = mounted;
          const connected = ready && account && chain;

          return (
            <div>
              {!connected ? (
                <button
                  type="button"
                  onClick={ready ? openConnectModal : undefined}
                  className="rounded-lg border border-[#CCFF00]/70 bg-[#CCFF00] px-5 py-3 text-sm font-bold text-black shadow-[0_0_22px_rgba(204,255,0,0.18)] transition-colors hover:bg-white"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openChainModal}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white hover:border-[#CCFF00]/50 hover:text-[#CCFF00]"
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
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white hover:border-[#CCFF00]/50 hover:text-[#CCFF00]"
                  >
                    {account.displayName}
                  </button>
                </div>
              )}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </header>
  );
}
