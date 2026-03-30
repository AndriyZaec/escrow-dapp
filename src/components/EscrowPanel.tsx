import { useState, useEffect } from 'react';
import { useWalletConnection } from '@solana/react-hooks';
import { createWalletTransactionSigner } from '@solana/client';
import { Loader2, Plus, ArrowLeftRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TxResult } from '@/components/TxResult';
import { makeOffer, takeOffer } from '@/service';
import { useOffers, type OnChainOffer } from '@/hooks/useOffers';
import { classifyError } from '@/lib/execute';
import { fetchMintDecimals } from '@/lib/rpc';
import { truncateAddress } from '@/lib/utils';
import type { Balances } from '@/hooks/useBalance';

interface EscrowPanelProps {
  balances: Balances;
}

export function EscrowPanel({ balances }: EscrowPanelProps) {
  const { connected, wallet } = useWalletConnection();
  const { offers, loading: offersLoading, error: offersError, fetchOffers } = useOffers();

  useEffect(() => {
    void fetchOffers();
  }, [fetchOffers]);

  if (!connected) return null;

  return (
    <div className="space-y-4">
      <MakeOfferForm balances={balances} onSuccess={fetchOffers} wallet={wallet} />
      <OpenOffersList
        offers={offers}
        loading={offersLoading}
        error={offersError}
        onRefresh={fetchOffers}
        wallet={wallet}
        onTakeSuccess={fetchOffers}
      />
    </div>
  );
}

// ── Make Offer ────────────────────────────────────────────────────────────────

function MakeOfferForm({
  balances,
  onSuccess,
  wallet,
}: {
  balances: Balances;
  onSuccess: () => void;
  wallet: ReturnType<typeof useWalletConnection>['wallet'];
}) {
  const [mintA, setMintA] = useState('');
  const [amountA, setAmountA] = useState('');
  const [mintB, setMintB] = useState('');
  const [amountB, setAmountB] = useState('');
  const [mintBDecimals, setMintBDecimals] = useState<number | null>(null);
  const [mintBLoading, setMintBLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMintBDecimals(null);
    if (!mintB || mintB.length < 32) return;
    const timer = setTimeout(async () => {
      setMintBLoading(true);
      const decimals = await fetchMintDecimals(mintB);
      setMintBDecimals(decimals);
      setMintBLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [mintB]);

  async function handleMake() {
    if (!wallet || !mintA || !amountA || !mintB || !amountB || mintBDecimals === null) return;
    setPending(true);
    setTxSig(null);
    setError(null);

    try {
      const { signer } = createWalletTransactionSigner(wallet);
      const tokenA = balances.tokens.find(t => t.mint === mintA);
      const decimalsA = tokenA?.decimals ?? 0;

      const sig = await makeOffer(
        {
          mintA,
          mintB,
          offerId: BigInt(Date.now()),
          tokenAOfferedAmount: BigInt(Math.round(parseFloat(amountA) * 10 ** decimalsA)),
          tokenBWantedAmount: BigInt(Math.round(parseFloat(amountB) * 10 ** (mintBDecimals ?? 6))),
        },
        signer,
      );
      setTxSig(sig);
      setMintA(''); setAmountA(''); setMintB(''); setAmountB('');
      balances.refetch();
      onSuccess();
    } catch (e) {
      setError(classifyError(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Make Offer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Token A mint</label>
            <select
              value={mintA}
              onChange={e => setMintA(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select token</option>
              {balances.tokens.map(t => (
                <option key={t.mint} value={t.mint}>{t.symbol}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Amount to offer</label>
            <Input type="number" placeholder="0.00" min="0" step="any" value={amountA} onChange={e => setAmountA(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Token B mint address</label>
            <Input placeholder="Mint address" value={mintB} onChange={e => setMintB(e.target.value)} />
            {mintBLoading && <span className="text-xs text-slate-500 mt-0.5 block">Fetching mint info…</span>}
            {!mintBLoading && mintBDecimals !== null && <span className="text-xs text-slate-400 mt-0.5 block">{mintBDecimals} decimals</span>}
            {!mintBLoading && mintB.length >= 32 && mintBDecimals === null && <span className="text-xs text-red-400 mt-0.5 block">Invalid or unknown mint</span>}
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Amount wanted</label>
            <Input type="number" placeholder="0.00" min="0" step="any" value={amountB} onChange={e => setAmountB(e.target.value)} />
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleMake}
          disabled={pending || !mintA || !amountA || !mintB || !amountB || mintBDecimals === null}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
          {pending ? 'Creating offer…' : 'Create Offer'}
        </Button>

        {txSig && <div className="mt-3"><TxResult sig={txSig} /></div>}
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </CardContent>
    </Card>
  );
}

// ── Open Offers List ──────────────────────────────────────────────────────────

function OpenOffersList({
  offers,
  loading,
  error,
  onRefresh,
  wallet,
  onTakeSuccess,
}: {
  offers: OnChainOffer[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  wallet: ReturnType<typeof useWalletConnection>['wallet'];
  onTakeSuccess: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Open Offers</CardTitle>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent>
        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

        {!loading && offers.length === 0 && (
          <p className="text-xs text-slate-600 py-4 text-center">No open offers found</p>
        )}

        <div className="space-y-2">
          {offers.map(offer => (
            <OfferCard
              key={offer.pda}
              offer={offer}
              wallet={wallet}
              onTakeSuccess={onTakeSuccess}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OfferCard({
  offer,
  wallet,
  onTakeSuccess,
}: {
  offer: OnChainOffer;
  wallet: ReturnType<typeof useWalletConnection>['wallet'];
  onTakeSuccess: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTake() {
    if (!wallet) return;
    setPending(true);
    setError(null);

    try {
      const { signer } = createWalletTransactionSigner(wallet);
      const sig = await takeOffer(offer, signer);
      setTxSig(sig);
      onTakeSuccess();
    } catch (e) {
      setError(classifyError(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge>Maker</Badge>
            <span className="font-mono text-xs text-slate-400">{truncateAddress(String(offer.maker))}</span>
          </div>
          <div className="text-xs text-slate-500 space-y-0.5">
            <p>Offers: {offer.tokenAOfferedAmount !== null && <span className="text-slate-200">{offer.tokenAOfferedAmount.toString()} </span>}<span className="font-mono text-slate-300">{truncateAddress(String(offer.tokenMintA))}</span></p>
            <p>Wants: <span className="text-slate-200">{offer.tokenBWantedAmount.toString()} </span><span className="font-mono text-slate-300">{truncateAddress(String(offer.tokenMintB))}</span></p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleTake}
          disabled={pending}
          className="shrink-0"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Take'}
        </Button>
      </div>

      {txSig && <TxResult sig={txSig} />}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
