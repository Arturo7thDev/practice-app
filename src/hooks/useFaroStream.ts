"use client";

import { useEffect, useState } from "react";

export interface Ticker {
  exchange: "binance" | "coinbase" | "kraken";
  symbol: string;
  bid: number;
  ask: number;
  bidQty: number;
  askQty: number;
  timestamp: number;
}

export interface Opportunity {
  timestamp: number;
  buyExchange: Ticker["exchange"];
  sellExchange: Ticker["exchange"];
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
}

export interface FaroState {
  tickers: Ticker[];
  opportunities: Opportunity[];
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
