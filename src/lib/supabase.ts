import { createClient } from '@supabase/supabase-js';

// ─── SQL schema (run once in Supabase SQL editor) ──────────────────────────────
//
//  create table if not exists offers (
//    id         bigint generated always as identity primary key,
//    pda        text    not null unique,
//    maker      text    not null,
//    mint_a     text    not null,
//    mint_b     text    not null,
//    amount_a   text    not null,   -- bigint serialised as text
//    amount_b   text    not null,
//    offer_id   text    not null,
//    tx_sig     text    not null,
//    status     text    not null default 'open',
//    taker      text,                          -- wallet that took the offer
//    created_at timestamptz default now()
//  );
//
//  -- Indexes on frequently-filtered columns (query-missing-indexes)
//  create index if not exists offers_status_idx on offers (status);
//  create index if not exists offers_maker_idx  on offers (maker);
//  create index if not exists offers_taker_idx  on offers (taker);
//
//  -- RLS: this is public escrow data — anon role can read & write
//  -- (on-chain validity is enforced by the Solana program, not Supabase)
//  alter table offers enable row level security;
//
//  -- SELECT: anyone can see open offers
//  create policy offers_select on offers for select to anon using (true);
//
//  -- INSERT: anyone can record a new offer
//  create policy offers_insert on offers for insert to anon with check (true);
//
//  -- UPDATE: anyone can mark an offer as taken (on-chain tx is the real guard)
//  create policy offers_update on offers for update to anon using (true);
// ──────────────────────────────────────────────────────────────────────────────

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface OfferRecord {
  id?: number;
  pda: string;
  maker: string;
  mint_a: string;
  mint_b: string;
  amount_a: string;   // bigint serialised as string
  amount_b: string;
  offer_id: string;
  tx_sig: string;
  status: 'open' | 'taken';
  taker?: string | null;
  created_at?: string;
}

/** Upsert offer — idempotent on `pda` (data-upsert best practice). */
export async function saveOffer(
  offer: Omit<OfferRecord, 'id' | 'created_at' | 'status'>,
): Promise<void> {
  const { error } = await supabase
    .from('offers')
    .upsert({ ...offer, status: 'open' }, { onConflict: 'pda', ignoreDuplicates: true });
  if (error) throw new Error(`Failed to save offer: ${error.message}`);
}

/** Mark offer taken — stores taker address alongside status update. */
export async function markOfferTaken(pda: string, taker: string): Promise<void> {
  const { error } = await supabase
    .from('offers')
    .update({ status: 'taken', taker })
    .eq('pda', pda);
  if (error) throw new Error(`Failed to mark offer taken: ${error.message}`);
}

/** Fetch all open offers ordered newest-first — filters on indexed `status` column. */
export async function fetchOpenOffersFromDb(): Promise<OfferRecord[]> {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to fetch offers: ${error.message}`);
  return (data ?? []) as OfferRecord[];
}

/** Fetch offers created by a specific wallet. */
export async function fetchMyOffers(wallet: string): Promise<OfferRecord[]> {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('maker', wallet)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to fetch my offers: ${error.message}`);
  return (data ?? []) as OfferRecord[];
}

/** Fetch offers taken by a specific wallet. */
export async function fetchTakenByMe(wallet: string): Promise<OfferRecord[]> {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('taker', wallet)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to fetch taken offers: ${error.message}`);
  return (data ?? []) as OfferRecord[];
}
