"use client";

import {
  LINEAR_PAIRS,
  useFaroStream,
  type Decision,
  type ExchangeName,
  type ExchangeStats,
  type ExecutedTrade,
  type ExecutedTriangularTrade,
  type Opportunity,
  type Pair,
  type PortfolioStats,
  type RiskMetrics,
  type ScanCounters,
  type Ticker,
  type TriangularOpportunity,
  type WalletBalance,
} from "@/hooks/useFaroStream";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const EXCHANGE_LABEL: Record<ExchangeName, string> = {
  binance: "Binance.US",
  coinbase: "Coinbase",
  kraken: "Kraken",
};

const EXCHANGES: ExchangeName[] = ["binance", "coinbase", "kraken"];

const PAIR_LABEL: Record<Pair, string> = {
  "BTC/USDT": "Bitcoin",
  "ETH/USDT": "Ethereum",
  "ETH/BTC": "ETH/BTC bridge",
};

const PAIR_ACCENT: Record<Pair, string> = {
  "BTC/USDT": "text-amber-400",
  "ETH/USDT": "text-violet-400",
  "ETH/BTC": "text-sky-400",
};

const DECISION_COLOR: Record<Decision["outcome"], string> = {
  executed: "text-emerald-400",
  cooldown: "text-amber-400",
  stale: "text-zinc-500",
  suspicious: "text-red-400",
  insufficient_capital: "text-zinc-500",
};

const DECISION_LABEL: Record<Decision["outcome"], string> = {
  executed: "EXECUTED",
  cooldown: "COOLDOWN",
  stale: "STALE",
  suspicious: "SUSPICIOUS",
  insufficient_capital: "NO CAPITAL",
};

export default function Home() {
  const { state, connected } = useFaroStream();

  return (
    <main className="min-h-screen text-zinc-50">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <Header
          connected={connected}
          counters={state?.counters}
          executedTrades={state?.stats.totalTrades ?? 0}
        />

        <DifferentiatorBanner />

        <HeroStats stats={state?.stats} counters={state?.counters} />

        <Section
          eyebrow="Intelligence"
          title="Strategy"
          subtitle="Aggregated performance metrics across all executions"
        >
          <StrategyPanel stats={state?.stats} />
        </Section>

        <Section
          eyebrow="Process"
          title="Bot decisions"
          subtitle="Every profitable opportunity classified by outcome"
        >
          <DecisionsPanel counters={state?.counters} />
        </Section>

        <Section
          eyebrow="The truth"
          title="Full cost breakdown"
          subtitle="Trading + amortized withdrawal + estimated slippage + network latency"
        >
          <CostBreakdown stats={state?.stats} />
        </Section>

        <Section
          eyebrow="Risk"
          title="Risk metrics"
          subtitle="Drawdown, exposure, wallet imbalance, circuit breaker"
        >
          <RiskPanel risk={state?.stats.risk} />
        </Section>

        <Section
          eyebrow="Real-time"
          title="Live decisions"
          subtitle="Last 15 evaluations with full reasoning"
        >
          <DecisionsFeed decisions={state?.decisions ?? []} />
        </Section>

        <Section
          eyebrow="Performance"
          title="Equity curve"
          subtitle="Cumulative net P&L across both pairs"
        >
          <EquityCurve trades={state?.executedTrades ?? []} />
        </Section>

        <Section
          eyebrow="Capital"
          title="Wallet balances"
          subtitle="Initial: $50K USDT + 0.5 BTC + 10 ETH per exchange"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {EXCHANGES.map((ex) => (
              <WalletCard
                key={ex}
                exchange={ex}
                wallet={state?.wallets.find((w) => w.exchange === ex)}
                btcPrice={state?.stats.currentBTCPrice ?? 0}
                ethPrice={state?.stats.currentETHPrice ?? 0}
              />
            ))}
          </div>
        </Section>

        {LINEAR_PAIRS.map((pair) => (
          <PairPanel
            key={pair}
            pair={pair}
            tickers={state?.tickersByPair[pair] ?? []}
            opportunities={state?.opportunitiesByPair[pair] ?? []}
            exchangeStats={state?.exchangeStats ?? []}
            profit={state?.stats.profitByPair[pair] ?? 0}
            trades={state?.stats.tradesByPair[pair] ?? 0}
          />
        ))}

        <Section
          eyebrow="Ledger"
          title="Executed trades"
          subtitle="Faro (institutional fees) vs Retail (0.5%) on every trade"
        >
          <TradesTable trades={state?.executedTrades ?? []} />
        </Section>

        <Section
          eyebrow="Advanced"
          title="Triangular arbitrage"
          subtitle="Within-exchange BTC ↔ ETH ↔ USDT cycles, both directions"
        >
          <TriangularPanel
            opps={state?.triangularOpportunities ?? []}
            trades={state?.triangularTrades ?? []}
          />
        </Section>

        <Footer />
      </div>
    </main>
  );
}

function Header({
  connected,
  counters,
  executedTrades,
}: {
  connected: boolean;
  counters: ScanCounters | undefined;
  executedTrades: number;
}) {
  return (
    <header className="mb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300 backdrop-blur">
            <span
              className={`live-dot inline-block h-1.5 w-1.5 rounded-full ${
                connected ? "bg-emerald-400" : "bg-zinc-600"
              }`}
            />
            {connected ? "live" : "connecting…"}
          </div>
          <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            <FaroLogo className="h-9 w-9 text-amber-400" />
            <span>Faro</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base font-normal text-zinc-400 sm:text-lg">
            Honest crypto arbitrage across 3 exchanges, 2 pairs, both linear
            and triangular cycles. Executes only what survives the full cost
            stack.
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs tabular-numbers text-zinc-500">
        <Stat
          n={(counters?.opportunitiesScanned ?? 0).toLocaleString()}
          label="scanned"
          tone="text-zinc-200"
        />
        <span className="text-zinc-700">·</span>
        <Stat
          n={(counters?.profitableDetected ?? 0).toLocaleString()}
          label="profitable after fees"
          tone="text-amber-400"
        />
        <span className="text-zinc-700">·</span>
        <Stat
          n={executedTrades.toLocaleString()}
          label="executed"
          tone="text-emerald-400"
        />
      </div>
    </header>
  );
}

function Stat({
  n,
  label,
  tone,
}: {
  n: string;
  label: string;
  tone: string;
}) {
  return (
    <span className="flex items-baseline gap-2">
      <span className={`font-mono text-base font-medium ${tone}`}>{n}</span>
      <span className="text-zinc-500">{label}</span>
    </span>
  );
}

function HeroStats({
  stats,
  counters,
}: {
  stats: PortfolioStats | undefined;
  counters: ScanCounters | undefined;
}) {
  const profit = stats?.totalArbitrageProfit ?? 0;
  const retailLoss = stats?.hypotheticalRetailLoss ?? 0;
  const lostOpp = counters?.lostOpportunityUSD ?? 0;

  const profitable = counters?.profitableDetected ?? 0;
  const executed = stats?.totalTrades ?? 0;
  const captureRate = profitable > 0 ? (executed / profitable) * 100 : 0;
  const safeSkipped =
    (counters?.skippedSuspicious ?? 0) + (counters?.skippedStaleData ?? 0);
  const throttled = counters?.skippedCooldown ?? 0;
  const safePct = profitable > 0 ? (safeSkipped / profitable) * 100 : 0;
  const throttlePct = profitable > 0 ? (throttled / profitable) * 100 : 0;

  return (
    <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        label="Faro profit"
        value={
          stats ? `${profit >= 0 ? "+" : ""}$${profit.toFixed(2)}` : "—"
        }
        valueClass={
          stats
            ? profit > 0
              ? "text-emerald-400"
              : profit < 0
                ? "text-red-400"
                : "text-zinc-400"
            : "text-zinc-600"
        }
        subtitle={
          stats
            ? `${stats.totalTrades} trades · BTC ${stats.tradesByPair["BTC/USDT"]} · ETH ${stats.tradesByPair["ETH/USDT"]}`
            : "Waiting for data…"
        }
      />
      <StatCard
        label="Same at retail (0.5%)"
        value={
          stats
            ? `${retailLoss >= 0 ? "+" : ""}$${retailLoss.toFixed(2)}`
            : "—"
        }
        valueClass={
          stats
            ? retailLoss < 0
              ? "text-red-400"
              : "text-zinc-400"
            : "text-zinc-600"
        }
        subtitle="What a retail bot would yield"
      />
      <StatCard
        label="Decision accuracy"
        value={counters ? `${captureRate.toFixed(0)}%` : "—"}
        valueClass="text-emerald-400"
        subtitle={
          counters
            ? `captured · ${safePct.toFixed(0)}% safety · ${throttlePct.toFixed(0)}% throttled`
            : "of profitable opps"
        }
      />
      <StatCard
        label="Lost to cooldown"
        value={counters ? `$${lostOpp.toFixed(2)}` : "—"}
        valueClass="text-amber-400"
        subtitle="Profit blocked by 3s throttle"
      />
      <StatCard
        label="Portfolio value"
        value={
          stats
            ? `$${stats.currentPortfolioValueUSDT.toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}`
            : "—"
        }
        valueClass="text-zinc-50"
        subtitle={
          stats
            ? `$${stats.initialCapitalUSDT.toLocaleString()} + ${stats.initialBTC} BTC + ${stats.initialETH} ETH`
            : ""
        }
      />
    </section>
  );
}

function DifferentiatorBanner() {
  return (
    <div className="glass mb-10 rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <span className="shrink-0 self-start rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
          4-stack cost model
        </span>
        <p className="text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
          Faro discounts{" "}
          <span className="text-zinc-200">trading fees</span> +{" "}
          <span className="text-zinc-200">amortized withdrawal</span> +{" "}
          <span className="text-zinc-200">estimated slippage</span> +{" "}
          <span className="text-zinc-200">network latency</span> from every
          opportunity. Most arbitrage bots only count trading fees — that&apos;s
          why their &ldquo;profit&rdquo; vanishes in reality.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass,
  subtitle,
}: {
  label: string;
  value: string;
  valueClass: string;
  subtitle?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 transition-colors hover:bg-white/[0.04]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </div>
      <div
        className={`mt-3 font-mono text-3xl font-semibold tabular-numbers leading-none ${valueClass}`}
      >
        {value}
      </div>
      {subtitle ? (
        <div className="mt-2 text-xs text-zinc-500">{subtitle}</div>
      ) : null}
    </div>
  );
}

function Section({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14 sm:mb-16">
      <div className="mb-5">
        {eyebrow ? (
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-400/80">
            {eyebrow}
          </div>
        ) : null}
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function PairPanel({
  pair,
  tickers,
  opportunities,
  exchangeStats,
  profit,
  trades,
}: {
  pair: Pair;
  tickers: Ticker[];
  opportunities: Opportunity[];
  exchangeStats: ExchangeStats[];
  profit: number;
  trades: number;
}) {
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          {PAIR_LABEL[pair]} · {pair}
        </h2>
        <div className="font-mono text-xs tabular-numbers text-zinc-500">
          <span className={profit >= 0 ? "text-emerald-400" : "text-red-400"}>
            {profit >= 0 ? "+" : ""}${profit.toFixed(2)}
          </span>{" "}
          · {trades} trades
        </div>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {EXCHANGES.map((ex) => (
          <ExchangeCard
            key={ex}
            exchange={ex}
            pair={pair}
            ticker={tickers.find((t) => t.exchange === ex)}
            exchangeStats={exchangeStats.find((s) => s.exchange === ex)}
          />
        ))}
      </div>
      <OpportunitiesTable opps={opportunities} />
    </section>
  );
}

function StrategyPanel({ stats }: { stats: PortfolioStats | undefined }) {
  if (!stats) {
    return (
      <div className="glass rounded-2xl p-6 text-sm text-zinc-500">
        Computing strategy metrics…
      </div>
    );
  }
  const successPct = (stats.successRate * 100).toFixed(2);
  const avgNet = stats.avgNetPerTrade;
  const best = stats.bestRoute;
  const latency = stats.avgEvalLatencyMs;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricBox
        label="Success rate"
        value={`${successPct}%`}
        subtitle="profitable / scanned"
        valueClass="text-emerald-400"
      />
      <MetricBox
        label="Avg net / trade"
        value={
          stats.totalTrades > 0
            ? `${avgNet >= 0 ? "+" : ""}$${avgNet.toFixed(4)}`
            : "—"
        }
        subtitle={`${stats.totalTrades} executed`}
        valueClass={avgNet >= 0 ? "text-emerald-400" : "text-red-400"}
      />
      <MetricBox
        label="Best route"
        value={best ? `+$${best.totalProfit.toFixed(2)}` : "—"}
        subtitle={best ? `${best.route} · ${best.count} trades` : "no data"}
        valueClass="text-emerald-400"
      />
      <MetricBox
        label="Eval latency"
        value={`${latency.toFixed(2)} ms`}
        subtitle="avg per ticker processed"
        valueClass="text-zinc-100"
      />
    </div>
  );
}

function MetricBox({
  label,
  value,
  subtitle,
  valueClass,
}: {
  label: string;
  value: string;
  subtitle: string;
  valueClass: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </div>
      <div
        className={`mt-2.5 font-mono text-2xl font-semibold tabular-numbers leading-none ${valueClass}`}
      >
        {value}
      </div>
      <div className="mt-2 text-xs text-zinc-500">{subtitle}</div>
    </div>
  );
}

function DecisionsPanel({ counters }: { counters: ScanCounters | undefined }) {
  if (!counters) {
    return (
      <div className="glass rounded-2xl p-6 text-sm text-zinc-500">
        —
      </div>
    );
  }
  const totalSkipped =
    counters.skippedSuspicious +
    counters.skippedStaleData +
    counters.skippedCooldown +
    counters.skippedInsufficientCapital;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <SkipBox
        label="Cooldown"
        value={counters.skippedCooldown}
        color="text-amber-400"
        subtitle="5s per pair throttle"
      />
      <SkipBox
        label="Suspicious"
        value={counters.skippedSuspicious}
        color="text-red-400"
        subtitle="spread > 2% (circuit breaker)"
      />
      <SkipBox
        label="Stale data"
        value={counters.skippedStaleData}
        color="text-zinc-400"
        subtitle="ticker > 10s old"
      />
      <SkipBox
        label="No capital"
        value={counters.skippedInsufficientCapital}
        color="text-zinc-400"
        subtitle="wallet exhausted"
      />
      <div className="col-span-2 glass rounded-2xl p-4 lg:col-span-4">
        <div className="flex items-baseline justify-between">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Total profitable opps skipped
          </div>
          <div className="font-mono text-xs text-zinc-400 tabular-numbers">
            {totalSkipped.toLocaleString()} decisions
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskPanel({ risk }: { risk: RiskMetrics | undefined }) {
  if (!risk) {
    return (
      <div className="glass rounded-2xl p-6 text-sm text-zinc-500">
        Risk metrics initializing…
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricBox
          label="Max drawdown"
          value={`$${risk.maxDrawdownUSD.toFixed(2)}`}
          subtitle={`${(risk.maxDrawdownPercent * 100).toFixed(1)}% from peak`}
          valueClass={risk.maxDrawdownUSD > 0 ? "text-red-400" : "text-emerald-400"}
        />
        <MetricBox
          label="Wallet imbalance"
          value={`${(risk.walletImbalance * 100).toFixed(1)}%`}
          subtitle="std dev / mean of USD/exchange"
          valueClass={risk.walletImbalance > 0.2 ? "text-amber-400" : "text-emerald-400"}
        />
        <MetricBox
          label="Capital deployed"
          value={`${(risk.capitalDeployedPercent * 100).toFixed(1)}%`}
          subtitle="trade vol / initial USDT"
          valueClass="text-zinc-100"
        />
        <MetricBox
          label="Circuit breaker"
          value="ACTIVE"
          subtitle="rejects spreads > 2%"
          valueClass="text-emerald-400"
        />
      </div>
      <div className="glass rounded-2xl p-4">
        <div className="mb-3 text-xs uppercase tracking-wide text-zinc-500">
          Exposure per exchange
        </div>
        <div className="space-y-2">
          {risk.exposureByExchange.map((e) => (
            <div key={e.exchange} className="flex items-center gap-3">
              <span className="w-24 text-xs uppercase text-zinc-400">
                {EXCHANGE_LABEL[e.exchange]}
              </span>
              <div className="flex-1 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-2 bg-emerald-500/70"
                  style={{ width: `${e.pctOfPortfolio * 100}%` }}
                />
              </div>
              <span className="w-20 text-right font-mono text-xs tabular-numbers text-zinc-300">
                {(e.pctOfPortfolio * 100).toFixed(1)}%
              </span>
              <span className="w-28 text-right font-mono text-xs tabular-numbers text-zinc-500">
                $
                {e.usdValue.toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </span>
              <span className="w-24 text-right font-mono text-[10px] tabular-numbers text-zinc-600">
                {(e.usdtPct * 100).toFixed(0)}% USDT
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DecisionsFeed({ decisions }: { decisions: Decision[] }) {
  if (decisions.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center text-sm text-zinc-500">
        Decisions will appear here as the bot evaluates opportunities…
      </div>
    );
  }
  return (
    <div className="overflow-x-auto glass rounded-2xl">
      <div className="min-w-[640px] divide-y divide-zinc-800">
        {decisions.map((d, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-2 font-mono text-xs"
          >
            <span className="w-16 text-zinc-500 tabular-numbers">
              {new Date(d.timestamp).toLocaleTimeString("en-US", {
                hour12: false,
              })}
            </span>
            <span
              className={`w-24 font-semibold ${DECISION_COLOR[d.outcome]}`}
            >
              {DECISION_LABEL[d.outcome]}
            </span>
            <span className={`w-8 ${PAIR_ACCENT[d.pair]}`}>
              {d.pair.split("/")[0]}
            </span>
            <span className="w-32 text-zinc-300">{d.route}</span>
            <span
              className={`w-20 text-right tabular-numbers ${d.outcome === "executed" ? "text-emerald-400" : "text-zinc-500"}`}
            >
              {d.netProfit >= 0 ? "+" : ""}${d.netProfit.toFixed(3)}
            </span>
            <span className="flex-1 truncate text-zinc-500">{d.reason}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CostBreakdown({ stats }: { stats: PortfolioStats | undefined }) {
  if (!stats || stats.totalTrades === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-sm text-zinc-500">
        Cost breakdown appears after the first executed trade.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <CostBox
        label="Trading fees"
        value={stats.totalTradingFees}
        color="text-red-400"
        sub="taker × 2 sides"
      />
      <CostBox
        label="Withdrawal (amortized)"
        value={stats.totalAmortizedWithdrawal}
        color="text-amber-400"
        sub="÷ 100 trades/rebalance"
      />
      <CostBox
        label="Estimated slippage"
        value={stats.totalEstimatedSlippage}
        color="text-amber-400"
        sub="0.002% × trade value"
      />
      <CostBox
        label="Latency cost"
        value={stats.totalLatencyCost}
        color="text-amber-400"
        sub="0.001% × trade value"
      />
      <CostBox
        label="Total all-in cost"
        value={stats.totalCosts}
        color="text-zinc-100"
        sub="what survives = NET"
      />
    </div>
  );
}

function CostBox({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: number;
  color: string;
  sub: string;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </div>
      <div
        className={`mt-2 font-mono text-xl font-semibold tabular-numbers leading-none ${color}`}
      >
        ${value.toFixed(2)}
      </div>
      <div className="mt-1.5 text-[10px] text-zinc-600">{sub}</div>
    </div>
  );
}

function SkipBox({
  label,
  value,
  color,
  subtitle,
}: {
  label: string;
  value: number;
  color: string;
  subtitle: string;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </div>
      <div
        className={`mt-2 font-mono text-xl font-semibold tabular-numbers leading-none ${color}`}
      >
        {value.toLocaleString()}
      </div>
      <div className="mt-1.5 text-[10px] text-zinc-600">{subtitle}</div>
    </div>
  );
}

function ExchangeCard({
  exchange,
  pair,
  ticker,
  exchangeStats,
}: {
  exchange: ExchangeName;
  pair: Pair;
  ticker: Ticker | undefined;
  exchangeStats: ExchangeStats | undefined;
}) {
  const isStale = ticker?.stale ?? false;
  return (
    <Card
      className={`glass !rounded-2xl text-zinc-50 ${isStale ? "opacity-50" : ""}`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium uppercase tracking-wide text-zinc-400">
          <span>{EXCHANGE_LABEL[exchange]}</span>
          {isStale ? (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium normal-case text-amber-400">
              stale · {ticker ? `${(ticker.ageMs / 1000).toFixed(0)}s ago` : ""}
            </span>
          ) : (
            <span
              className={`text-[10px] normal-case ${PAIR_ACCENT[pair]}`}
            >
              {pair.split("/")[0]}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 font-mono tabular-numbers">
        <PriceRow
          label="bid"
          value={ticker?.bid}
          colorOnFresh={isStale ? "text-zinc-500" : "text-emerald-400"}
        />
        <PriceRow
          label="ask"
          value={ticker?.ask}
          colorOnFresh={isStale ? "text-zinc-500" : "text-red-400"}
        />
        <div className="flex flex-wrap justify-between gap-2 pt-2 text-xs text-zinc-500">
          <span>
            spread{" "}
            {ticker ? `$${(ticker.ask - ticker.bid).toFixed(2)}` : "—"}
          </span>
          {exchangeStats ? (
            <span className="flex items-center gap-2">
              <span title="WebSocket message rate">
                <span className="text-zinc-300">
                  {exchangeStats.ticksPerSecond.toFixed(1)}
                </span>{" "}
                msg/s
              </span>
              {exchangeStats.networkLatencyMs > 0 ? (
                <span
                  title="Measured network RTT via REST ping every 30s"
                  className="border-l border-zinc-700 pl-2"
                >
                  <span className="text-zinc-300">
                    {exchangeStats.networkLatencyMs.toFixed(0)}
                  </span>{" "}
                  ms RTT
                </span>
              ) : null}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function PriceRow({
  label,
  value,
  colorOnFresh,
}: {
  label: string;
  value: number | undefined;
  colorOnFresh: string;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs uppercase text-zinc-500">{label}</span>
      <span
        className={`text-xl font-semibold ${value ? colorOnFresh : "text-zinc-600"} lg:text-2xl`}
      >
        {value
          ? `$${value.toLocaleString("en-US", {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2,
            })}`
          : "—"}
      </span>
    </div>
  );
}

function WalletCard({
  exchange,
  wallet,
  btcPrice,
  ethPrice,
}: {
  exchange: ExchangeName;
  wallet: WalletBalance | undefined;
  btcPrice: number;
  ethPrice: number;
}) {
  const totalUsd = wallet
    ? wallet.usdt + wallet.btc * btcPrice + wallet.eth * ethPrice
    : 0;
  return (
    <Card className="glass !rounded-2xl text-zinc-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium uppercase tracking-wide text-zinc-400">
          <span>{EXCHANGE_LABEL[exchange]}</span>
          <span className="font-mono text-xs tabular-numbers text-zinc-500 normal-case">
            ≈ $
            {totalUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 font-mono tabular-numbers">
        <BalanceRow
          label="USDT"
          value={wallet?.usdt}
          color="text-zinc-100"
          decimals={2}
        />
        <BalanceRow
          label="BTC"
          value={wallet?.btc}
          color="text-amber-400"
          decimals={6}
        />
        <BalanceRow
          label="ETH"
          value={wallet?.eth}
          color="text-violet-400"
          decimals={4}
        />
      </CardContent>
    </Card>
  );
}

function BalanceRow({
  label,
  value,
  color,
  decimals,
}: {
  label: string;
  value: number | undefined;
  color: string;
  decimals: number;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs uppercase text-zinc-500">{label}</span>
      <span className={`text-lg font-semibold ${color}`}>
        {value !== undefined
          ? value.toLocaleString("en-US", {
              maximumFractionDigits: decimals,
              minimumFractionDigits: decimals,
            })
          : "—"}
      </span>
    </div>
  );
}

function EquityCurve({ trades }: { trades: ExecutedTrade[] }) {
  const data = [...trades]
    .reverse()
    .reduce<{ time: string; pnl: number; ts: number }[]>((acc, t) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].pnl : 0;
      acc.push({
        time: new Date(t.timestamp).toLocaleTimeString("en-US", {
          hour12: false,
        }),
        pnl: prev + t.netProfit,
        ts: t.timestamp,
      });
      return acc;
    }, []);

  if (data.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-sm text-zinc-500">
        Equity curve will appear after the first executed trade.
      </div>
    );
  }

  const finalPnL = data[data.length - 1].pnl;
  const isPositive = finalPnL >= 0;
  const lineColor = isPositive ? "#34d399" : "#f87171";

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          Cumulative net P&amp;L · {data.length} trades
        </span>
        <span
          className={`font-mono tabular-numbers text-lg font-semibold ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}${finalPnL.toFixed(2)}
        </span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickLine={{ stroke: "#3f3f46" }}
              axisLine={{ stroke: "#3f3f46" }}
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickLine={{ stroke: "#3f3f46" }}
              axisLine={{ stroke: "#3f3f46" }}
              tickFormatter={(v: number) => `$${v.toFixed(2)}`}
            />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#a1a1aa" }}
              formatter={(value) => [
                `$${Number(value).toFixed(2)}`,
                "Cumulative P&L",
              ]}
            />
            <ReferenceLine y={0} stroke="#52525b" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="pnl"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TradesTable({ trades }: { trades: ExecutedTrade[] }) {
  if (trades.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-sm text-zinc-500">
        No trades executed yet. Faro is watching — only profitable opportunities
        AFTER fees get executed. Most candidates are mirages.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto glass rounded-2xl">
      <table className="w-full text-sm">
        <thead className="bg-white/[0.02] text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Time</th>
            <th className="px-4 py-3 text-left font-medium">Pair</th>
            <th className="px-4 py-3 text-left font-medium">Route</th>
            <th className="px-4 py-3 text-right font-medium">Vol</th>
            <th className="px-4 py-3 text-right font-medium">Gross</th>
            <th className="px-4 py-3 text-right font-medium">All-in cost</th>
            <th className="px-4 py-3 text-right font-medium">
              Faro net (inst)
            </th>
            <th className="px-4 py-3 text-right font-medium">
              Net at retail
            </th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-numbers">
          {trades.slice(0, 20).map((t) => {
            const asset = t.pair.split("/")[0];
            const costTooltip = `trading $${t.tradingFees.toFixed(3)} · withdrawal $${t.amortizedWithdrawal.toFixed(3)} · slippage $${t.estimatedSlippage.toFixed(3)} · latency $${t.latencyCost.toFixed(3)}`;
            return (
              <tr key={t.id} className="border-t border-white/[0.04]">
                <td className="px-4 py-2 text-zinc-500">
                  {new Date(t.timestamp).toLocaleTimeString("en-US", {
                    hour12: false,
                  })}
                </td>
                <td className={`px-4 py-2 ${PAIR_ACCENT[t.pair]}`}>{asset}</td>
                <td className="px-4 py-2 text-zinc-300">
                  {t.buyExchange} → {t.sellExchange}
                  {t.partial ? (
                    <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                      partial
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2 text-right text-zinc-400">
                  {t.executedVolume.toFixed(6)}
                </td>
                <td className="px-4 py-2 text-right text-zinc-400">
                  ${t.grossProfit.toFixed(2)}
                </td>
                <td
                  className="cursor-help px-4 py-2 text-right text-zinc-500 underline decoration-dotted underline-offset-2"
                  title={costTooltip}
                >
                  ${t.totalCosts.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right font-semibold text-emerald-400">
                  +${t.netProfit.toFixed(2)}
                </td>
                <td
                  className={`px-4 py-2 text-right font-semibold ${
                    t.retailNetProfit < 0 ? "text-red-400" : "text-zinc-400"
                  }`}
                >
                  {t.retailNetProfit >= 0 ? "+" : ""}$
                  {t.retailNetProfit.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OpportunitiesTable({ opps }: { opps: Opportunity[] }) {
  if (opps.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center text-xs text-zinc-500">
        Waiting for opportunities on this pair…
      </div>
    );
  }

  return (
    <div className="overflow-x-auto glass rounded-2xl">
      <table className="w-full text-sm">
        <thead className="bg-white/[0.02] text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Time</th>
            <th className="px-4 py-3 text-left font-medium">Route</th>
            <th className="px-4 py-3 text-right font-medium">Gross</th>
            <th className="px-4 py-3 text-right font-medium">Net (inst)</th>
            <th className="px-4 py-3 text-right font-medium">Net (retail)</th>
            <th className="px-4 py-3 text-right font-medium">Verdict</th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-numbers">
          {opps.slice(0, 8).map((o, i) => (
            <tr key={i} className="border-t border-white/[0.04]">
              <td className="px-4 py-2 text-zinc-500">
                {new Date(o.timestamp).toLocaleTimeString("en-US", {
                  hour12: false,
                })}
              </td>
              <td className="px-4 py-2 text-zinc-300">
                {o.buyExchange} → {o.sellExchange}
              </td>
              <td className="px-4 py-2 text-right text-zinc-400">
                ${o.grossProfit.toFixed(2)}
              </td>
              <td
                className={`px-4 py-2 text-right font-semibold ${o.profitable ? "text-emerald-400" : "text-red-400"}`}
              >
                {o.netProfit >= 0 ? "+" : ""}${o.netProfit.toFixed(2)}
              </td>
              <td
                className={`px-4 py-2 text-right ${o.retailNetProfit < 0 ? "text-red-400" : "text-zinc-400"}`}
              >
                {o.retailNetProfit >= 0 ? "+" : ""}$
                {o.retailNetProfit.toFixed(2)}
              </td>
              <td className="px-4 py-2 text-right">
                {o.suspicious ? (
                  <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400">
                    SUSPICIOUS
                  </span>
                ) : o.profitable ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
                    RENTABLE
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-500">
                    DESCARTADA
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TriangularPanel({
  opps,
  trades,
}: {
  opps: TriangularOpportunity[];
  trades: ExecutedTriangularTrade[];
}) {
  const scanned = opps.length;
  const profitable = opps.filter((o) => o.profitable).length;
  const triProfit = trades.reduce((s, t) => s + t.netProfit, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricBox
          label="Triangular cycles tracked"
          value={scanned.toString()}
          subtitle="last 12 evaluated"
          valueClass="text-zinc-100"
        />
        <MetricBox
          label="Profitable detected"
          value={profitable.toString()}
          subtitle={`${scanned > 0 ? ((profitable / scanned) * 100).toFixed(0) : 0}% hit rate`}
          valueClass={profitable > 0 ? "text-emerald-400" : "text-zinc-400"}
        />
        <MetricBox
          label="Triangular trades executed"
          value={trades.length.toString()}
          subtitle="within single exchange"
          valueClass={trades.length > 0 ? "text-emerald-400" : "text-zinc-400"}
        />
        <MetricBox
          label="Triangular P&L"
          value={`${triProfit >= 0 ? "+" : ""}$${triProfit.toFixed(2)}`}
          subtitle={`on $1,000 notional/cycle`}
          valueClass={
            triProfit > 0
              ? "text-emerald-400"
              : triProfit < 0
                ? "text-red-400"
                : "text-zinc-400"
          }
        />
      </div>

      {opps.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-center text-sm text-zinc-500">
          Waiting for full triangle (BTC/USDT + ETH/USDT + ETH/BTC) on at
          least one exchange…
        </div>
      ) : (
        <div className="overflow-x-auto glass rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Time</th>
                <th className="px-4 py-3 text-left font-medium">Exchange</th>
                <th className="px-4 py-3 text-left font-medium">Cycle</th>
                <th className="px-4 py-3 text-right font-medium">Start</th>
                <th className="px-4 py-3 text-right font-medium">Final</th>
                <th className="px-4 py-3 text-right font-medium">Net</th>
                <th className="px-4 py-3 text-right font-medium">%</th>
                <th className="px-4 py-3 text-right font-medium">Verdict</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-numbers">
              {opps.slice(0, 12).map((o, i) => (
                <tr key={i} className="border-t border-white/[0.04]">
                  <td className="px-4 py-2 text-zinc-500">
                    {new Date(o.timestamp).toLocaleTimeString("en-US", {
                      hour12: false,
                    })}
                  </td>
                  <td className="px-4 py-2 text-zinc-300">
                    {EXCHANGE_LABEL[o.exchange]}
                  </td>
                  <td className="px-4 py-2 text-zinc-300">{o.direction}</td>
                  <td className="px-4 py-2 text-right text-zinc-500">
                    ${o.startUSDT.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right text-zinc-400">
                    ${o.finalUSDT.toFixed(2)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-semibold ${
                      o.profitable ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {o.netProfit >= 0 ? "+" : ""}${o.netProfit.toFixed(4)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right ${
                      o.profitable ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {(o.netPercent * 100).toFixed(4)}%
                  </td>
                  <td className="px-4 py-2 text-right">
                    {o.profitable ? (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
                        RENTABLE
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-500">
                        DESCARTADA
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {trades.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.03]">
          <div className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-emerald-400">
            Executed triangular trades
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Time</th>
                <th className="px-4 py-2 text-left font-medium">Exchange</th>
                <th className="px-4 py-2 text-left font-medium">Cycle</th>
                <th className="px-4 py-2 text-right font-medium">Net P&amp;L</th>
                <th className="px-4 py-2 text-right font-medium">Fees</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-numbers">
              {trades.slice(0, 10).map((t) => (
                <tr key={t.id} className="border-t border-white/[0.04]">
                  <td className="px-4 py-2 text-zinc-500">
                    {new Date(t.timestamp).toLocaleTimeString("en-US", {
                      hour12: false,
                    })}
                  </td>
                  <td className="px-4 py-2 text-zinc-300">
                    {EXCHANGE_LABEL[t.exchange]}
                  </td>
                  <td className="px-4 py-2 text-zinc-300">{t.direction}</td>
                  <td className="px-4 py-2 text-right font-semibold text-emerald-400">
                    +${t.netProfit.toFixed(4)}
                  </td>
                  <td className="px-4 py-2 text-right text-zinc-500">
                    ${t.totalFeesUSD.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-12 space-y-2 border-t border-white/[0.04] pt-6 text-xs text-zinc-500">
      <p>
        Faro models market-maker tier (taker{" "}
        <span className="font-mono">0.02–0.04%</span>, accessible to operators
        with $4B+ monthly volume — Binance VIP 9, Coinbase top tier). At retail
        fees (<span className="font-mono">0.5%</span>), every profitable
        opportunity above would become a loss.
      </p>
      <p>
        Withdrawal fees (~0.0001 BTC, ~$1 USDT per exchange) are amortized
        across rebalancing cycles — negligible per trade at this volume tier.
        Real arbitrage operators batch transfers nightly to keep this cost
        below 0.001% of daily volume.
      </p>
    </footer>
  );
}

function FaroLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 12L4 8M16 12L28 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <circle cx="16" cy="12" r="2.5" fill="currentColor" />
      <rect x="11" y="14" width="10" height="1.5" fill="#34d399" />
      <path d="M12 16h8l1 10H11z" fill="#34d399" />
      <rect x="9" y="26" width="14" height="1.5" fill="#34d399" />
    </svg>
  );
}
