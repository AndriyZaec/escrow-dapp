import { address, type TransactionSigner } from '@solana/kit';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { getMakeOfferInstructionAsync } from '@generated/instructions/makeOffer';
import { getTakeOfferInstructionAsync } from '@generated/instructions/takeOffer';
import { findOfferPda } from '@generated/pdas/offer';
import { executeTransaction } from '@/lib/execute';
import { saveOffer, markOfferTaken } from '@/lib/supabase';
import type { OnChainOffer } from '@/hooks/useOffers';

export interface MakeOfferParams {
  mintA: string;
  mintB: string;
  offerId: bigint;
  tokenAOfferedAmount: bigint;
  tokenBWantedAmount: bigint;
}

export async function makeOffer(
  params: MakeOfferParams,
  signer: TransactionSigner,
): Promise<string> {
  const { mintA, mintB, offerId, tokenAOfferedAmount, tokenBWantedAmount } = params;

  const ix = await getMakeOfferInstructionAsync({
    maker: signer,
    tokenMintA: address(mintA),
    tokenMintB: address(mintB),
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
    id: offerId,
    tokenAOfferedAmount,
    tokenBWantedAmount,
  });

  const txSig = await executeTransaction(signer, [ix]);

  // Derive the offer PDA so we can store it in Supabase
  const [offerPda] = await findOfferPda({ maker: signer.address, id: offerId });

  // Persist to Supabase (best-effort — tx is already confirmed on-chain)
  try {
    await saveOffer({
      pda: String(offerPda),
      maker: String(signer.address),
      mint_a: mintA,
      mint_b: mintB,
      amount_a: String(tokenAOfferedAmount),
      amount_b: String(tokenBWantedAmount),
      offer_id: String(offerId),
      tx_sig: txSig,
    });
  } catch (e) {
    console.warn('Supabase save failed (offer is on-chain):', e);
  }

  return txSig;
}

export async function takeOffer(
  offer: OnChainOffer,
  signer: TransactionSigner,
): Promise<string> {
  // takeOffer needs the offer PDA passed explicitly — Codama can't auto-derive
  // it because the seed uses offer.id (a cross-account field reference)
  const [offerPda] = await findOfferPda({ maker: offer.maker, id: offer.id });

  const ix = await getTakeOfferInstructionAsync({
    taker: signer,
    maker: offer.maker,
    offer: offerPda,
    tokenMintA: offer.tokenMintA,
    tokenMintB: offer.tokenMintB,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const txSig = await executeTransaction(signer, [ix]);

  // Mark taken in Supabase (best-effort)
  try {
    await markOfferTaken(offer.pda);
  } catch (e) {
    console.warn('Supabase update failed (offer is taken on-chain):', e);
  }

  return txSig;
}
