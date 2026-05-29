"use client";

import { useEffect, useState } from "react";

export type ExchangeName = "binance" | "coinbase" | "kraken";
export type Pair = "BTC/USDT" | "ETH/USDT" | "ETH/BTC";

// Solo pares directos (USD-anchor) son los que mostramos en linear arb sections
export const LINEAR_PAIRS: Pair[] = ["BTC/USDT", "ETH/USDT"];

export interface Ticker {
  exchange: ExchangeName;
  pair: Pair;
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
  pair: Pair;
  buyExchange: ExchangeName;
  sellExchange: ExchangeName;
  buyPrice: number;
  sellPrice: number;
  maxVolume: number;
  grossSpread: number;
  grossProfit: number;
  buyFee: number;
  sellFee: number;
  tradingFees: number;
  amortizedWithdrawal: number;
  estimatedSlippage: number;
  latencyCost: number;
  totalCosts: number;
  netProfit: number;
  netSpread: number;
  profitable: boolean;
  suspicious: boolean;
  retailTradingFees: number;
  retailNetProfit: number;
}

export interface WalletBalance {
  exchange: ExchangeName;
  usdt: number;
  btc: number;
  eth: number;
}

export interface ExecutedTrade {
  id: string;
  timestamp: number;
  pair: Pair;
  buyExchange: ExchangeName;
  sellExchange: ExchangeName;
  buyPrice: number;
  sellPrice: number;
  requestedVolume: number;
  executedVolume: number;
  partial: boolean;
  tradingFees: number;
  amortizedWithdrawal: number;
  estimatedSlippage: number;
  latencyCost: number;
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  retailNetProfit: number;
}

export interface ScanCounters {
  opportunitiesScanned: number;
  profitableDetected: number;
  skippedSuspicious: number;
  skippedStaleData: number;
  skippedCooldown: number;
  skippedInsufficientCapital: number;
  lostOpportunityUSD: number;
}

export interface RoutePerformance {
  route: string;
  count: number;
  totalProfit: number;
  avgProfit: number;
}

export interface ExchangeStats {
  exchange: ExchangeName;
  ticksReceived: number;
  ticksPerSecond: number;
  avgIntervalMs: number;
  uptimeSeconds: number;
  networkLatencyMs: number;
  networkLatencyAt: number;
}

export interface ExchangeExposure {
  exchange: ExchangeName;
  usdValue: number;
  pctOfPortfolio: number;
  usdtPct: number;
}

export interface RiskMetrics {
  maxDrawdownUSD: number;
  maxDrawdownPercent: number;
  walletImbalance: number;
  capitalDeployedPercent: number;
  exposureByExchange: ExchangeExposure[];
}

export interface PortfolioStats {
  initialCapitalUSDT: number;
  initialBTC: number;
  initialETH: number;
  totalArbitrageProfit: number;
  totalTrades: number;
  totalTradingFees: number;
  totalAmortizedWithdrawal: number;
  totalEstimatedSlippage: number;
  totalLatencyCost: number;
  totalCosts: number;
  currentBTCPrice: number;
  currentETHPrice: number;
  currentPortfolioValueUSDT: number;
  hypotheticalRetailLoss: number;
  successRate: number;
  avgNetPerTrade: number;
  bestRoute: RoutePerformance | null;
  worstRoute: RoutePerformance | null;
  avgEvalLatencyMs: number;
  profitByPair: Record<Pair, number>;
  tradesByPair: Record<Pair, number>;
  risk: RiskMetrics;
}

export interface Decision {
  timestamp: number;
  pair: Pair;
  route: string;
  outcome:
    | "executed"
    | "stale"
    | "cooldown"
    | "suspicious"
    | "insufficient_capital";
  netProfit: number;
  reason: string;
}

export interface TriangularLeg {
  pair: Pair;
  side: "buy" | "sell";
  price: number;
  amountIn: number;
  amountInAsset: "USDT" | "BTC" | "ETH";
  amountOut: number;
  amountOutAsset: "USDT" | "BTC" | "ETH";
  feeUSDValue: number;
}

export interface TriangularOpportunity {
  timestamp: number;
  exchange: ExchangeName;
  direction: string;
  startUSDT: number;
  finalUSDT: number;
  netProfit: number;
  netPercent: number;
  legs: TriangularLeg[];
  profitable: boolean;
}

export interface ExecutedTriangularTrade {
  id: string;
  timestamp: number;
  exchange: ExchangeName;
  direction: string;
  startUSDT: number;
  finalUSDT: number;
  netProfit: number;
  netPercent: number;
  totalFeesUSD: number;
}

export interface FaroState {
  tickersByPair: Record<Pair, Ticker[]>;
  opportunitiesByPair: Record<Pair, Opportunity[]>;
  wallets: WalletBalance[];
  executedTrades: ExecutedTrade[];
  stats: PortfolioStats;
  counters: ScanCounters;
  exchangeStats: ExchangeStats[];
  decisions: Decision[];
  triangularOpportunities: TriangularOpportunity[];
  triangularTrades: ExecutedTriangularTrade[];
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
