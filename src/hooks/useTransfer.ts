import { useState } from 'react';
import { address, lamports as toLamports } from '@solana/kit';
import { useWalletConnection } from '@solana/react-hooks';
import { createWalletTransactionSigner } from '@solana/client';
import { getTransferSolInstruction } from '@solana-program/system';
import {
  findAssociatedTokenPda,
  getTransferCheckedInstruction,
  getCreateAssociatedTokenIdempotentInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import { executeTransaction, classifyError } from '@/lib/execute';

export interface TransferState {
  pending: boolean;
  txSig: string | null;
  error: string | null;
}

export function useTransfer() {
  const { wallet } = useWalletConnection();
  const [state, setState] = useState<TransferState>({
    pending: false,
    txSig: null,
    error: null,
  });

  function reset() {
    setState({ pending: false, txSig: null, error: null });
  }

  async function sendSol(recipient: string, solAmount: number): Promise<string | null> {
    if (!wallet) return null;
    setState({ pending: true, txSig: null, error: null });

    try {
      const { signer } = createWalletTransactionSigner(wallet);
      const ix = getTransferSolInstruction({
        source: signer,
        destination: address(recipient),
        amount: toLamports(BigInt(Math.round(solAmount * 1e9))),
      });
      const sig = await executeTransaction(signer, [ix]);
      setState({ pending: false, txSig: sig, error: null });
      return sig;
    } catch (e) {
      const error = classifyError(e);
      setState({ pending: false, txSig: null, error });
      return null;
    }
  }

  async function sendToken(
    mint: string,
    recipient: string,
    amount: number,
    decimals: number,
  ): Promise<string | null> {
    if (!wallet) return null;
    setState({ pending: true, txSig: null, error: null });

    try {
      const { signer } = createWalletTransactionSigner(wallet);
      const mintAddr = address(mint);
      const recipientAddr = address(recipient);
      const signerAddr = signer.address;

      const [[sourceAta], [destAta]] = await Promise.all([
        findAssociatedTokenPda({ owner: signerAddr, mint: mintAddr, tokenProgram: TOKEN_PROGRAM_ADDRESS }),
        findAssociatedTokenPda({ owner: recipientAddr, mint: mintAddr, tokenProgram: TOKEN_PROGRAM_ADDRESS }),
      ]);

      const rawAmount = BigInt(Math.round(amount * 10 ** decimals));

      const instructions = [
        // create dest ATA if it doesn't exist (idempotent — no-op if already exists)
        getCreateAssociatedTokenIdempotentInstruction({
          payer: signer,
          ata: destAta,
          owner: recipientAddr,
          mint: mintAddr,
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
        }),
        getTransferCheckedInstruction({
          source: sourceAta,
          mint: mintAddr,
          destination: destAta,
          authority: signer,
          amount: rawAmount,
          decimals,
        }),
      ];

      const sig = await executeTransaction(signer, instructions);
      setState({ pending: false, txSig: sig, error: null });
      return sig;
    } catch (e) {
      const error = classifyError(e);
      setState({ pending: false, txSig: null, error });
      return null;
    }
  }

  return { ...state, sendSol, sendToken, reset };
}
