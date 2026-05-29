"use client";

import { useEffect, useState } from "react";

export type ExchangeName = "binance" | "coinbase" | "kraken";

export interface Ticker {
  exchange: ExchangeName;
  symbol: string;
  bid: number;
  ask: number;
  bidQty: number;
  askQty: number;
  timestamp: number;
  stale: boolean;
  ageMs: number;
}

export interface Opportunity {
  timestamp: number;
  buyExchange: ExchangeName;
  sellExchange: ExchangeName;
  buyPrice: number;
  sellPrice: number;
  maxVolumeBTC: number;
  grossSpread: number;
  grossProfit: number;
  buyFee: number;
  sellFee: number;
  totalFees: number;
  netProfit: number;
  netSpread: number;
  profitable: boolean;
  suspicious: boolean;
  retailFees: number;
  retailNetProfit: number;
}

export interface WalletBalance {
  exchange: ExchangeName;
  usdt: number;
  btc: number;
}

export interface ExecutedTrade {
  id: string;
  timestamp: number;
  buyExchange: ExchangeName;
  sellExchange: ExchangeName;
  buyPrice: number;
  sellPrice: number;
  requestedVolumeBTC: number;
  executedVolumeBTC: number;
  partial: boolean;
  buyFee: number;
  sellFee: number;
  totalFees: number;
  grossProfit: number;
  netProfit: number;
  retailNetProfit: number;
}

export interface PortfolioStats {
  initialCapitalUSDT: number;
  initialBTC: number;
  totalArbitrageProfit: number;
  totalTrades: number;
  totalFeesPaid: number;
  currentBTCPrice: number;
  currentPortfolioValueUSDT: number;
  hypotheticalRetailLoss: number;
}

export interface ScanCounters {
  opportunitiesScanned: number;
  profitableDetected: number;
}

export interface FaroState {
  tickers: Ticker[];
  opportunities: Opportunity[];
  wallets: WalletBalance[];
  executedTrades: ExecutedTrade[];
  stats: PortfolioStats;
  counters: ScanCounters;
  timestamp: number;
}

const FARO_URL =
  process.env.NEXT_PUBLIC_FARO_URL ??
  "https://faro-production-9be0.up.railway.app";

export function useFaroStream() {
  const [state, setState] = useState<FaroState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource(`${FARO_URL}/stream`);

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      try {
        setState(JSON.parse(e.data));
      } catch (err) {
        console.error("Failed to parse SSE message", err);
      }
    };

    return () => {
      es.close();
    };
  }, []);

  return { state, connected };
}
