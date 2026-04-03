# Escrow DApp (Solana Devnet)

A Vite + React + TypeScript frontend for creating and taking escrow offers on Solana Devnet.

This app integrates wallet connection, SOL/SPL transfers, on-chain offer discovery, Supabase-backed activity/history, and a nostalgic `98.css` theme mode.

## Devnet Transactions

**Wallet:** `GypW2MpEy1LrGTtZKPGauzJ9E5qioy16fjJzWamaUFsW`

| Action | Transaction |
| --- | --- |
| `make_offer` | [2PuPD4W...gZWr](https://explorer.solana.com/tx/2PuPD4WCjiuU2HxHwjfKdUypfCasRQgvX57LgNimtyRGZWYqmCU3PBDJeNLJHSaDM7jK9UbQPu1eNsAcFY3UgZWr?cluster=devnet) |
| `take_offer` | [5KDtSp8...fS5](https://explorer.solana.com/tx/5KDtSp8RuHAr5YKzxH14MEW4y5nnUbSapB37P5rdoKLopK5rRAmzrwt2Ntq23oKEyFRBaRVqD5EaERWwgWvt7fS5?cluster=devnet) |

## Tested Wallets

- [Phantom](https://phantom.app/) (primary, all flows verified)
- [Backpack](https://backpack.app/)
- [Solflare](https://solflare.com/)

Any wallet supporting the [Wallet Standard](https://github.com/wallet-standard/wallet-standard) should work via auto-discovery.

## Features

- Wallet connection via auto-discovered connectors (Phantom, Backpack, Solflare, and others supported by wallet standard).
- SOL balance and SPL token balances after wallet connect.
- Token metadata enrichment chain for better symbols/logos:
  - Helius DAS metadata
  - Solana token list fallback
  - Metaplex metadata fallback
- Send flow for:
  - native SOL
  - SPL tokens
- Escrow flow:
  - create offer (`makeOffer`)
  - take offer (`takeOffer`)
  - explorer links for confirmed transactions
- Offers workspace UX:
  - activity filters: `All`, `My Offers`, `Taken`
  - `All platforms` toggle
  - pagination (`Load more`)
  - token symbol + decimal-aware amount display
- Optional nostalgic mode inspired by `98.css` (toggle through Clippy).

## Tech Stack

- React 19 + TypeScript + Vite
- Solana SDKs:
  - `@solana/kit`
  - `@solana/client`
  - `@solana/react-hooks`
  - `@solana-program/token`
  - `@solana-program/system`
- Codama codegen from Anchor IDL
- Supabase (`@supabase/supabase-js`) for frontend-tracked offer records
- Tailwind v4 + lightweight custom UI primitives

## Project Layout

- `src/App.tsx` - shell, header, tabs, nostalgic mode entry
- `src/components/` - wallet UI, balances, transfer, escrow panel, Clippy, UI primitives
- `src/hooks/` - balance, transfer, offers, nostalgic-mode state
- `src/lib/` - rpc client, solana client, transaction executor, helius integration, supabase
- `src/service.ts` - high-level `makeOffer` / `takeOffer` orchestration
- `src/idl/escrow.json` - source IDL
- `src/generated/` - Codama-generated client artifacts
- `scripts/codegen.mjs` - IDL -> generated client pipeline

## Prerequisites

- Node.js 20+
- npm
- A devnet wallet with test SOL
- Helius API key
- Supabase project (for tracked offer history/filtering)

## Environment Variables

Copy and fill env values:

```bash
cp .env.example .env
```

Required values:

| Variable | Purpose |
| --- | --- |
| `VITE_HELIUS_API_KEY` | Helius DAS + RPC key |
| `VITE_SOLANA_RPC_URL` | Solana RPC endpoint (devnet) |
| `VITE_SOLANA_WS_URL` | Solana WS endpoint (devnet) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase publishable key |

## Setup

Install dependencies:

```bash
npm install
```

Generate typed Solana client from IDL:

```bash
npm run codegen
```

Start dev server:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

Preview build locally:

```bash
npm run preview
```

## Supabase Schema

This app expects an `offers` table with `status` and `taker` tracking.

Use the SQL block in `src/lib/supabase.ts` and run it once in the Supabase SQL editor.

## Escrow Flow Summary

- `makeOffer`:
  - builds instruction from generated Codama client
  - sends transaction
  - derives offer PDA
  - stores a best-effort offer record in Supabase
- `takeOffer`:
  - derives offer PDA
  - builds and sends instruction
  - marks offer as taken in Supabase (best-effort)

On-chain transaction success is the source of truth. Supabase is used for app-level filtering/history UX.

## UI Notes

- Main tabs: `Offers` and `Transfer`
- Offers activity views: `All`, `My Offers`, `Taken`
- `All platforms` toggle:
  - off: frontend-tracked offers
  - on: full on-chain open offers
- Clippy in the bottom-right enables nostalgic mode.

## Troubleshooting

- `Transaction rejected by wallet`: user declined signature.
- `Insufficient balance`: wallet/token balance too low for requested amount.
- `Transaction expired — please retry`: stale blockhash; retry action.
- Empty offers list with `All platforms` off: verify Supabase schema/policies and recorded offer rows.
- Missing token symbol/logo: fallback chain may not resolve metadata for that mint.
