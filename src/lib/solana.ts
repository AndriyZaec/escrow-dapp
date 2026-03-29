import { createClient, autoDiscover } from '@solana/client';

const endpoint =
  (import.meta.env.VITE_SOLANA_RPC_URL as string) ??
  'https://api.devnet.solana.com';

const websocketEndpoint =
  (import.meta.env.VITE_SOLANA_WS_URL as string) ??
  endpoint.replace('https://', 'wss://').replace('http://', 'ws://');

export const solanaClient = createClient({
  endpoint,
  websocketEndpoint,
  walletConnectors: autoDiscover(),
});
