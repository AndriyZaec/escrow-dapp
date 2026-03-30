import { useState, useCallback } from 'react';
import { address, getBase58Codec, type Address, type Base58EncodedBytes } from '@solana/kit';
import { TOKEN_PROGRAM_ADDRESS, findAssociatedTokenPda, fetchAllMaybeToken } from '@solana-program/token';
import { rpc } from '@/lib/rpc';
import { decodeOffer, OFFER_DISCRIMINATOR } from '@generated/accounts/offer';
import { ESCROW_PROGRAM_ADDRESS } from '@generated/programs/escrow';

export interface OnChainOffer {
  pda: string;
  id: bigint;
  maker: Address;
  tokenMintA: Address;
  tokenMintB: Address;
  tokenBWantedAmount: bigint;
  tokenAOfferedAmount: bigint | null;
}

export function useOffers() {
  const [offers, setOffers] = useState<OnChainOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Encode discriminator to base58 for the memcmp filter
      const discriminatorB58 = getBase58Codec().decode(
        OFFER_DISCRIMINATOR,
      ) as Base58EncodedBytes;

      const response = await rpc
        .getProgramAccounts(address(ESCROW_PROGRAM_ADDRESS), {
          encoding: 'base64',
          filters: [
            {
              memcmp: {
                offset: 0n,
                bytes: discriminatorB58,
                encoding: 'base58',
              },
            },
          ],
        })
        .send();

      const items = response as unknown as Array<{
        pubkey: string;
        account: {
          data: [string, string];
          lamports: bigint;
          executable: boolean;
          owner: string;
        };
      }>;

      const parsed = items.flatMap(item => {
        try {
          const raw = atob(item.account.data[0]);
          const dataBytes = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) dataBytes[i] = raw.charCodeAt(i);

          const encoded = {
            exists: true as const,
            address: address(item.pubkey),
            data: dataBytes,
            executable: item.account.executable,
            lamports: item.account.lamports,
            programAddress: address(ESCROW_PROGRAM_ADDRESS),
          };
          const decoded = decodeOffer(
            encoded as Parameters<typeof decodeOffer>[0],
          );
          if (!decoded.exists) return [];
          const d = decoded.data;
          return [
            {
              pda: item.pubkey,
              id: d.id,
              maker: d.maker,
              tokenMintA: d.tokenMintA,
              tokenMintB: d.tokenMintB,
              tokenBWantedAmount: d.tokenBWantedAmount,
            },
          ];
        } catch {
          return [];
        }
      });

      // Derive vault ATAs and batch-fetch balances to get tokenAOfferedAmount
      let vaultAmounts: (bigint | null)[] = parsed.map(() => null);
      if (parsed.length > 0) {
        try {
          const vaultAddresses = await Promise.all(
            parsed.map(offer =>
              findAssociatedTokenPda({
                owner: address(offer.pda),
                tokenProgram: TOKEN_PROGRAM_ADDRESS,
                mint: offer.tokenMintA,
              }).then(([addr]) => addr),
            ),
          );
          const vaultAccounts = await fetchAllMaybeToken(rpc, vaultAddresses);
          vaultAmounts = vaultAccounts.map(acc =>
            acc.exists ? acc.data.amount : null,
          );
        } catch {
          // Vault fetch failed — leave amounts as null
        }
      }

      const offersWithAmounts: OnChainOffer[] = parsed.map((offer, i) => ({
        ...offer,
        tokenAOfferedAmount: vaultAmounts[i],
      }));

      setOffers(offersWithAmounts);
    } catch (e) {
      console.error('[useOffers] fetchOffers failed:', e);
      setError(e instanceof Error ? e.message : 'Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  }, []);

  return { offers, loading, error, fetchOffers };
}
