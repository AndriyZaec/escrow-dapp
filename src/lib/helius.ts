const HELIUS_RPC = `https://devnet.helius-rpc.com/?api-key=${import.meta.env.VITE_HELIUS_API_KEY as string}`;

export interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  logoURI: string | null;
  rawBalance: bigint;
  decimals: number;
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

  return items
    .filter(item => {
      const b = item.token_info?.balance;
      return b !== undefined && b !== '0' && b !== '';
    })
    .map(item => {
      const decimals = item.token_info?.decimals ?? 0;
      const rawBalance = BigInt(item.token_info?.balance ?? '0');
      return {
        mint: item.id,
        symbol: item.content?.metadata?.symbol ?? item.id.slice(0, 6),
        name: item.content?.metadata?.name ?? 'Unknown Token',
        logoURI: item.content?.links?.image ?? null,
        rawBalance,
        decimals,
      };
    });
}
