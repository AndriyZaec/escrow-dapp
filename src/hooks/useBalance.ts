import { useState, useEffect, useCallback } from 'react';
import { address } from '@solana/kit';
import { useWalletConnection } from '@solana/react-hooks';
import { rpc } from '@/lib/rpc';
import { fetchTokenBalances, type TokenBalance } from '@/lib/helius';

export interface Balances {
  sol: bigint;
  tokens: TokenBalance[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBalance(): Balances {
  const { connected, wallet } = useWalletConnection();
  const [sol, setSol] = useState<bigint>(0n);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!connected || !wallet) return;

    const owner = String(wallet.account.address);
    setLoading(true);
    setError(null);

    try {
      const [{ value: lamports }, tokenList] = await Promise.all([
        rpc.getBalance(address(owner)).send(),
        fetchTokenBalances(owner),
      ]);
      setSol(lamports);
      setTokens(tokenList);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  }, [connected, wallet]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { sol, tokens, loading, error, refetch: fetch };
}
