'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { darkTheme, getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { createConfig, http, injected, WagmiProvider } from 'wagmi';
import { robinhoodChain } from '@/lib/chains';
import '@rainbow-me/rainbowkit/styles.css';

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
const hasWalletConnectProjectId = !!walletConnectProjectId && walletConnectProjectId !== 'your-project-id';

const config = hasWalletConnectProjectId
  ? getDefaultConfig({
      appName: 'ChestFi',
      projectId: walletConnectProjectId,
      chains: [robinhoodChain],
      ssr: false,
    })
  : createConfig({
      chains: [robinhoodChain],
      connectors: [injected({ shimDisconnect: true })],
      transports: {
        [robinhoodChain.id]: http(robinhoodChain.rpcUrls.default.http[0]),
      },
      ssr: false,
    });

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#CCFF00',
            accentColorForeground: '#000000',
            borderRadius: 'medium',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}












