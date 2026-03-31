import { address, getProgramDerivedAddress, getAddressEncoder, getUtf8Encoder } from '@solana/kit';
import { rpc } from '@/lib/rpc';

const HELIUS_RPC = `https://devnet.helius-rpc.com/?api-key=${import.meta.env.VITE_HELIUS_API_KEY as string}`;
const METADATA_PROGRAM = address('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const NATIVE_SOL_MINT = 'So11111111111111111111111111111111111111112';
const TOKEN_LIST_URL = 'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json';

export interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  logoURI: string | null;
  rawBalance: bigint;
  decimals: number;
}

// Cached token list (fetched once per session)
let tokenListCache: Map<string, { symbol: string; name: string; logoURI: string }> | null = null;

export async function getTokenList(): Promise<Map<string, { symbol: string; name: string; logoURI: string }>> {
  if (tokenListCache) return tokenListCache;
  try {
    const resp = await fetch(TOKEN_LIST_URL);
    const json = await resp.json() as {
      tokens: Array<{ address: string; symbol: string; name: string; logoURI?: string; chainId: number }>;
    };
    tokenListCache = new Map();
    // Include both devnet (103) and mainnet (101) — devnet tokens often share mainnet logos
    for (const t of json.tokens) {
      if (t.chainId === 103 || t.chainId === 101) {
        tokenListCache.set(t.address, { symbol: t.symbol, name: t.name, logoURI: t.logoURI ?? '' });
      }
    }
  } catch {
    tokenListCache = new Map();
  }
  return tokenListCache;
}

export async function fetchTokenBalances(owner: string): Promise<TokenBalance[]> {
  const resp = await fetch(HELIUS_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'tokens',
      method: 'getAssetsByOwner',
      params: {
        ownerAddress: owner,
        page: 1,
        limit: 100,
        displayOptions: { showFungible: true, showNativeBalance: false },
      },
    }),
  });

  // Parse raw text with regex replacement to preserve large integer precision.
  // Helius returns balance as a JSON number (e.g. 1000000000000) which JS parses
  // as float64, losing precision beyond 2^53. We convert balance values to strings
  // before JSON.parse sees them.
  const text = await resp.text();
  const safeText = text.replace(/"balance"\s*:\s*(\d+)/g, '"balance":"$1"');
  const json = JSON.parse(safeText) as {
    result?: {
      items?: Array<{
        id: string;
        content?: { metadata?: { symbol?: string; name?: string }; links?: { image?: string } };
        token_info?: { balance?: string; decimals?: number };
      }>;
    };
  };

  const items = json.result?.items ?? [];

  const tokens = items
    .filter(item => {
      const b = item.token_info?.balance;
      return b !== undefined && b !== '0' && b !== '';
    })
    .map(item => {
      const decimals = item.token_info?.decimals ?? 0;
      const rawBalance = BigInt(item.token_info?.balance ?? '0');
      return {
        mint: item.id,
        symbol: item.content?.metadata?.symbol || '',
        name: item.content?.metadata?.name || '',
        logoURI: item.content?.links?.image ?? null,
        rawBalance,
        decimals,
      };
    });

  // Fill missing metadata from token list + Metaplex (in parallel)
  const missing = tokens.filter(t => !t.symbol || !t.name);
  if (missing.length > 0) {
    const [tokenList, metaplexMap] = await Promise.all([
      getTokenList(),
      fetchMetaplexMetadata(missing.map(t => t.mint)),
    ]);

    for (const token of missing) {
      // 1st: Solana Token List (same source as Phantom)
      const listed = tokenList.get(token.mint);
      if (listed) {
        if (!token.symbol) token.symbol = listed.symbol;
        if (!token.name) token.name = listed.name;
        if (!token.logoURI && listed.logoURI) token.logoURI = listed.logoURI;
        continue;
      }
      // 2nd: Metaplex on-chain metadata
      const meta = metaplexMap.get(token.mint);
      if (!meta) continue;
      if (!token.symbol) token.symbol = meta.symbol;
      if (!token.name) token.name = meta.name;
      if (!token.logoURI && meta.uri) {
        try {
          const offchain = await fetch(meta.uri).then(r => r.json()) as { image?: string };
          if (offchain.image) token.logoURI = offchain.image;
        } catch { /* ignore */ }
      }
    }
  }

  // Final fallback + wSOL rename
  for (const t of tokens) {
    if (t.mint === NATIVE_SOL_MINT) {
      t.symbol = 'wSOL';
      t.name = 'Wrapped SOL';
    } else if (!t.symbol) {
      t.symbol = t.mint.slice(0, 6);
    }
    if (!t.name) t.name = 'Unknown Token';
  }

  return tokens;
}

/** Derive Metaplex metadata PDAs and batch-fetch on-chain metadata accounts. */
async function fetchMetaplexMetadata(mints: string[]): Promise<Map<string, { name: string; symbol: string; uri: string }>> {
  const result = new Map<string, { name: string; symbol: string; uri: string }>();
  try {
    const addressEncoder = getAddressEncoder();
    const utf8Encoder = getUtf8Encoder();
    const metadataPrefix = utf8Encoder.encode('metadata');

    const pdas = await Promise.all(
      mints.map(mint =>
        getProgramDerivedAddress({
          programAddress: METADATA_PROGRAM,
          seeds: [metadataPrefix, addressEncoder.encode(METADATA_PROGRAM), addressEncoder.encode(address(mint))],
        }).then(([pda]) => pda),
      ),
    );

    const accounts = await rpc.getMultipleAccounts(pdas, { encoding: 'base64' }).send();
    const accs = accounts.value as Array<{ data: [string, string] } | null>;

    for (let i = 0; i < mints.length; i++) {
      const acc = accs[i];
      if (!acc) continue;
      try {
        const raw = atob(acc.data[0]);
        const bytes = new Uint8Array(raw.length);
        for (let j = 0; j < raw.length; j++) bytes[j] = raw.charCodeAt(j);
        const meta = parseMetaplexMetadata(bytes);
        if (meta) result.set(mints[i], meta);
      } catch { /* skip unparseable */ }
    }
  } catch (e) {
    console.error('[helius] Metaplex metadata fetch failed:', e);
  }
  return result;
}

/** Parse name, symbol, uri from a Metaplex Metadata account's raw bytes. */
function parseMetaplexMetadata(data: Uint8Array): { name: string; symbol: string; uri: string } | null {
  // Layout: 1 (key) + 32 (update authority) + 32 (mint) = offset 65
  if (data.length < 65 + 4) return null;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 65;

  function readString(): string {
    const len = view.getUint32(offset, true);
    offset += 4;
    const str = new TextDecoder().decode(data.slice(offset, offset + len));
    offset += len;
    return str.replace(/\0+$/, '').trim();
  }

  const name = readString();
  const symbol = readString();
  const uri = readString();
  return { name, symbol, uri };
}
