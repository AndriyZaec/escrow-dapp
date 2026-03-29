import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  sendAndConfirmTransactionFactory,
  devnet,
} from '@solana/kit';

const RPC_URL =
  (import.meta.env.VITE_SOLANA_RPC_URL as string) ??
  'https://api.devnet.solana.com';
const WS_URL =
  (import.meta.env.VITE_SOLANA_WS_URL as string) ??
  'wss://api.devnet.solana.com';

export const rpc = createSolanaRpc(devnet(RPC_URL));
export const rpcSubscriptions = createSolanaRpcSubscriptions(devnet(WS_URL));
export const sendAndConfirm = sendAndConfirmTransactionFactory({
  rpc,
  rpcSubscriptions,
});
