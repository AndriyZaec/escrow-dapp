import { useState, useCallback } from 'react';
import { address, getBase58Codec, type Address, type Base58EncodedBytes } from '@solana/kit';
import { TOKEN_PROGRAM_ADDRESS, findAssociatedTokenPda, fetchAllMaybeToken, fetchAllMaybeMint } from '@solana-program/token';
import { rpc } from '@/lib/rpc';
import { fetchOpenOffersFromDb } from '@/lib/supabase';
import { getTokenList } from '@/lib/helius';
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
  decimalsA: number | null;
  decimalsB: number | null;
  symbolA: string | null;
  symbolB: string | null;
}

export function useOffers() {
  const [offers, setOffers] = useState<OnChainOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allPlatforms, setAllPlatforms] = useState(false);

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

      // Batch-fetch vault balances + mint decimals + token symbols
      let vaultAmounts: (bigint | null)[] = parsed.map(() => null);
      const mintDecimals = new Map<string, number>();
      let tokenList = new Map<string, { symbol: string; name: string; logoURI: string }>();

      if (parsed.length > 0) {
        // Collect unique mints
        const uniqueMints = [...new Set(parsed.flatMap(o => [String(o.tokenMintA), String(o.tokenMintB)]))];

        // Fetch vault balances + mint decimals + token list in parallel
        const [, mintResults, fetchedTokenList] = await Promise.all([
          // Vault balances
          (async () => {
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
          })(),
          // Mint decimals
          fetchAllMaybeMint(rpc, uniqueMints.map(m => address(m))).catch(() => null),
          // Token list for symbols
          getTokenList(),
        ]);

        tokenList = fetchedTokenList;
        if (mintResults) {
          uniqueMints.forEach((mint, i) => {
            const acc = mintResults[i];
            if (acc.exists) mintDecimals.set(mint, acc.data.decimals);
          });
        }
      }

      let offersWithAmounts: OnChainOffer[] = parsed.map((offer, i) => ({
        ...offer,
        tokenAOfferedAmount: vaultAmounts[i],
        decimalsA: mintDecimals.get(String(offer.tokenMintA)) ?? null,
        decimalsB: mintDecimals.get(String(offer.tokenMintB)) ?? null,
        symbolA: tokenList.get(String(offer.tokenMintA))?.symbol ?? null,
        symbolB: tokenList.get(String(offer.tokenMintB))?.symbol ?? null,
      }));

      // Filter to only offers created through this frontend (tracked in Supabase)
      if (!allPlatforms) {
        try {
          const dbOffers = await fetchOpenOffersFromDb();
          const knownPdas = new Set(dbOffers.map(o => o.pda));
          offersWithAmounts = offersWithAmounts.filter(o => knownPdas.has(o.pda));
        } catch (e) {
          console.error('[useOffers] Supabase filter failed, showing all:', e);
        }
      }

      setOffers(offersWithAmounts);
    } catch (e) {
      console.error('[useOffers] fetchOffers failed:', e);
      setError(e instanceof Error ? e.message : 'Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  }, [allPlatforms]);

  return { offers, loading, error, fetchOffers, allPlatforms, setAllPlatforms };
}
