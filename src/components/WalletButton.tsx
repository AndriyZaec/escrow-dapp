import { useRef, useState, useEffect } from 'react';
import { useWalletConnection } from '@solana/react-hooks';
import { Wallet, LogOut, Copy, Check, ChevronDown, X } from 'lucide-react';
import { cn, truncateAddress } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function WalletButton() {
  const { connected, connectors, connect, disconnect, wallet } = useWalletConnection();
  const [showPicker, setShowPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowPicker(false);
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function copyAddress() {
    if (!wallet) return;
    await navigator.clipboard.writeText(String(wallet.account.address));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Connected ────────────────────────────────────────────────────────────────
  if (connected && wallet) {
    const addr = String(wallet.account.address);
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setShowMenu(v => !v)}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 hover:bg-slate-700 transition-colors"
        >
          {wallet.connector?.icon
            ? <img src={wallet.connector.icon} className="h-5 w-5 rounded-full" alt="" />
            : <Wallet className="h-4 w-4 text-slate-400" />}
          <span className="font-mono">{truncateAddress(addr)}</span>
          <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', showMenu && 'rotate-180')} />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-1 w-52 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl z-50 p-1">
            <button
              onClick={copyAddress}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-800 transition-colors text-slate-300"
            >
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy address'}
            </button>
            <button
              onClick={() => { disconnect(); setShowMenu(false); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-800 transition-colors text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Single wallet ─────────────────────────────────────────────────────────────
  if (connectors.length === 1) {
    return (
      <Button onClick={() => connect(connectors[0].id)}>
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  // ── Multiple wallets — modal picker ──────────────────────────────────────────
  return (
    <div className="relative" ref={ref}>
      <Button onClick={() => setShowPicker(v => !v)}>
        <Wallet className="h-4 w-4" />
        Connect Wallet
        <ChevronDown className="h-4 w-4" />
      </Button>

      {showPicker && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl z-50">
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
            <span className="text-sm font-semibold text-slate-200">Select Wallet</span>
            <button onClick={() => setShowPicker(false)} className="text-slate-500 hover:text-slate-300">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-1">
            {connectors.map(c => (
              <button
                key={c.id}
                onClick={() => { connect(c.id); setShowPicker(false); }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-slate-800 transition-colors text-slate-200"
              >
                {c.icon
                  ? <img src={c.icon} className="h-6 w-6 rounded-full" alt="" />
                  : <Wallet className="h-6 w-6 text-slate-500" />}
                {String(c.name)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
