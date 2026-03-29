const HELIUS_RPC = `https://devnet.helius-rpc.com/?api-key=${import.meta.env.VITE_HELIUS_API_KEY as string}`;

export interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  logoURI: string | null;
  balance: number;
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

  const json = await resp.json() as {
    result?: {
      items?: Array<{
        id: string;
        content?: { metadata?: { symbol?: string; name?: string }; links?: { image?: string } };
        token_info?: { balance?: number; decimals?: number };
      }>;
    };
  };

  const items = json.result?.items ?? [];

  return items
    .filter(item => (item.token_info?.balance ?? 0) > 0)
    .map(item => {
      const decimals = item.token_info?.decimals ?? 0;
      const rawBalance = BigInt(Math.round(item.token_info?.balance ?? 0));
      return {
        mint: item.id,
        symbol: item.content?.metadata?.symbol ?? item.id.slice(0, 6),
        name: item.content?.metadata?.name ?? 'Unknown Token',
        logoURI: item.content?.links?.image ?? null,
        balance: Number(rawBalance) / 10 ** decimals,
        rawBalance,
        decimals,
      };
    });
}
