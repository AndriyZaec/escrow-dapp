import { ExternalLink } from 'lucide-react';

interface TxResultProps {
  sig: string;
}

export function TxResult({ sig }: TxResultProps) {
  return (
    <a
      href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-green-800 bg-green-900/30 px-3 py-2 text-xs text-green-400 hover:bg-green-900/50 transition-colors"
    >
      <ExternalLink className="h-3.5 w-3.5" />
      <span className="font-mono">{sig.slice(0, 8)}…{sig.slice(-8)}</span>
      <span className="text-green-500">View on Explorer</span>
    </a>
  );
}
