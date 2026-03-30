import { useState } from 'react';
import { useWalletConnection } from '@solana/react-hooks';
import { createWalletTransactionSigner } from '@solana/client';
import { Loader2, Send } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TxResult } from '@/components/TxResult';
import { useTransfer } from '@/hooks/useTransfer';
import type { Balances } from '@/hooks/useBalance';

interface SendFormProps {
  balances: Balances;
}

export function SendForm({ balances }: SendFormProps) {
  const { connected, wallet } = useWalletConnection();
  const { pending, txSig, error, sendSol, sendToken, reset } = useTransfer();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedMint, setSelectedMint] = useState('SOL');

  const tokenOptions = [
    { mint: 'SOL', symbol: 'SOL', decimals: 9 },
    ...balances.tokens.map(t => ({ mint: t.mint, symbol: t.symbol, decimals: t.decimals })),
  ];

  async function handleSend() {
    if (!wallet || !recipient || !amount) return;
    reset();

    const { signer } = createWalletTransactionSigner(wallet);
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    if (selectedMint === 'SOL') {
      await sendSol(recipient, parsed);
    } else {
      const token = balances.tokens.find(t => t.mint === selectedMint);
      if (!token) return;
      await sendToken(selectedMint, recipient, parsed, token.decimals);
    }

    balances.refetch();
  }

  if (!connected) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Token selector */}
        <div className="mb-3">
          <label className="mb-1 block text-xs text-slate-500">Token</label>
          <select
            value={selectedMint}
            onChange={e => { setSelectedMint(e.target.value); reset(); }}
            className="h-9 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
          >
            {tokenOptions.map(t => (
              <option key={t.mint} value={t.mint}>{t.symbol}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-xs text-slate-500">Recipient address</label>
          <Input
            placeholder="Wallet address"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs text-slate-500">Amount</label>
          <Input
            type="number"
            placeholder="0.00"
            min="0"
            step="any"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>

        <Button
          className="w-full"
          onClick={handleSend}
          disabled={pending || !recipient || !amount}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {pending ? 'Sending…' : 'Send'}
        </Button>

        {txSig && <div className="mt-3"><TxResult sig={txSig} /></div>}
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </CardContent>
    </Card>
  );
}
