import { defineChain } from 'viem';

const ROBINHOOD_CHAIN_ID = 4663;
const ROBINHOOD_RPC_URL = 'https://rpc.mainnet.chain.robinhood.com';
const ROBINHOOD_EXPLORER_URL = 'https://robinhoodchain.blockscout.com';

export const robinhoodMainnetExample = defineChain({
  id: ROBINHOOD_CHAIN_ID,
  name: 'Robinhood Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: [ROBINHOOD_RPC_URL] },
    public: { http: [ROBINHOOD_RPC_URL] },
  },
  blockExplorers: {
    default: {
      name: 'Robinhood Chain Explorer',
      url: ROBINHOOD_EXPLORER_URL,
    },
  },
});

export const robinhoodTestnetExample = defineChain({
  id: 46630,
  name: 'Robinhood Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.chain.robinhood.com/rpc'] },
    public: { http: ['https://rpc.testnet.chain.robinhood.com/rpc'] },
  },
  blockExplorers: {
    default: {
      name: 'Robinhood Chain Testnet Explorer',
      url: 'https://explorer.testnet.chain.robinhood.com',
    },
  },
});
