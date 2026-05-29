# Faro · Dashboard

Frontend (Next.js + Tailwind + shadcn + recharts) for **Faro**, the honest BTC arbitrage bot built for [Coding Challenge Mexico 2026](https://www.coding-challenge-mexico.com).

This repo contains the dashboard only. The full project documentation, architecture, and technical decisions live in the main repo:

👉 **[github.com/Arturo7thDev/faro](https://github.com/Arturo7thDev/faro)**

## What this app does

Consumes the SSE stream from the Faro bot backend (deployed on Railway) and renders:

- Live BTC bid/ask tickers from 3 exchanges (Binance.US, Coinbase, Kraken)
- Wallet balances per exchange (USDT + BTC)
- Executed trades with side-by-side Faro net (institutional) vs retail (0.5%) comparison
- Cumulative P&L equity curve growing in real time
- Opportunities evaluated with verdict (RENTABLE / DESCARTADA / SUSPICIOUS)
- Stale data and circuit breaker indicators

## Run locally

Requires Node 22 and pnpm.

```bash
pnpm install
pnpm dev      # http://localhost:3000
```

To point at a local backend instead of the deployed Railway one:

```bash
NEXT_PUBLIC_FARO_URL=http://localhost:3001 pnpm dev
```

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui · recharts · native `EventSource` for SSE.

Deployed on Vercel with auto-deploy from `main`.
