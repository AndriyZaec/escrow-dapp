import { Coins, RefreshCw } from 'lucide-react';
import { useWalletConnection } from '@solana/react-hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatSol, formatTokenAmount } from '@/lib/utils';
import type { Balances } from '@/hooks/useBalance';

interface BalanceCardsProps {
  balances: Balances;
}

export function BalanceCards({ balances }: BalanceCardsProps) {
  const { connected } = useWalletConnection();
  const { sol, tokens, loading, error, refetch } = balances;

  if (!connected) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-700 py-10 text-sm text-slate-500">
        Connect a wallet to see balances
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Balances</h2>
        <Button variant="ghost" size="icon" onClick={refetch} disabled={loading} title="Refresh">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <div className="flex gap-3 overflow-x-auto pb-1">
        {/* SOL card */}
        <Card className="min-w-[120px] flex-shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <img
              src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
              className="h-6 w-6 rounded-full"
              alt="SOL"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-xs font-medium text-slate-400">SOL</span>
          </div>
          <p className="text-lg font-semibold text-slate-100">
            {loading ? '…' : formatSol(sol)}
          </p>
        </Card>

        {/* SPL token cards */}
        {tokens.map(token => (
          <Card key={token.mint} className="min-w-[120px] flex-shrink-0">
            <div className="flex items-center gap-2 mb-1">
              {token.logoURI ? (
                <img
                  src={token.logoURI}
                  className="h-6 w-6 rounded-full"
                  alt={token.symbol}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <Coins className="h-6 w-6 text-slate-500" />
              )}
              <span className="text-xs font-medium text-slate-400">{token.symbol}</span>
            </div>
            <p className="text-lg font-semibold text-slate-100">
              {formatTokenAmount(token.rawBalance, token.decimals)}
            </p>
          </Card>
        ))}

        {/* Empty state */}
        {!loading && tokens.length === 0 && (
          <p className="self-center text-xs text-slate-600">No SPL tokens found</p>
        )}
      </div>
    </div>
  );
}
