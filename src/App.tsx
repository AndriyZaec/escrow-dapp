import { WalletButton } from '@/components/WalletButton';
import { BalanceCards } from '@/components/BalanceCards';
import { SendForm } from '@/components/SendForm';
import { EscrowPanel } from '@/components/EscrowPanel';
import { useBalance } from '@/hooks/useBalance';
import { useWalletConnection } from '@solana/react-hooks';

export default function App() {
  const { connected } = useWalletConnection();
  const balances = useBalance();

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-blue-500" />
            <span className="font-semibold text-slate-100">Escrow DApp</span>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">Devnet</span>
          </div>
          <WalletButton />
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Balances */}
        <BalanceCards balances={balances} />

        {/* Send + Escrow side by side when connected */}
        {connected && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SendForm balances={balances} />
            <EscrowPanel balances={balances} />
          </div>
        )}

        {/* Not connected state */}
        {!connected && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-slate-500 text-sm">Connect your wallet to send tokens and interact with the escrow.</p>
          </div>
        )}
      </main>
    </div>
  );
}
