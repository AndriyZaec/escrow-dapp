import {
  createTransactionMessage,
  appendTransactionMessageInstructions,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  getBase58Codec,
  type TransactionSigner,
  type Instruction,
} from '@solana/kit';
import { rpc, sendAndConfirm } from '@/lib/rpc';

export async function executeTransaction(
  signer: TransactionSigner,
  instructions: Instruction[],
): Promise<string> {
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const message = setTransactionMessageFeePayerSigner(
    signer,
    setTransactionMessageLifetimeUsingBlockhash(
      latestBlockhash,
      appendTransactionMessageInstructions(
        instructions,
        createTransactionMessage({ version: 0 }),
      ),
    ),
  );

  const signed = await signTransactionMessageWithSigners(message);
  await sendAndConfirm(
    signed as Parameters<typeof sendAndConfirm>[0],
    { commitment: 'confirmed' },
  );

  const [firstSig] = Object.values(signed.signatures);
  return getBase58Codec().decode(firstSig as Uint8Array);
}

export function classifyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('User rejected') || msg.includes('4001'))
    return 'Transaction rejected by wallet';
  if (msg.includes('insufficient') || msg.includes('0x1'))
    return 'Insufficient balance';
  if (
    msg.includes('Blockhash not found') ||
    msg.includes('block height exceeded')
  )
    return 'Transaction expired — please retry';
  return msg;
}
