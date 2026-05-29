"use client";

import {
  useFaroStream,
  type ExchangeName,
  type ExchangeStats,
  type ExecutedTrade,
  type Opportunity,
  type PortfolioStats,
  type ScanCounters,
  type Ticker,
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

export default function Home() {
  const { state, connected } = useFaroStream();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Header
          connected={connected}
          counters={state?.counters}
          executedTrades={state?.stats.totalTrades ?? 0}
        />

        <HeroStats stats={state?.stats} counters={state?.counters} />

        <Section title="Strategy intelligence">
          <StrategyPanel stats={state?.stats} />
        </Section>

        <Section title="Bot decisions · skip breakdown">
          <DecisionsPanel counters={state?.counters} />
        </Section>

        <Section title="P&L equity curve">
          <EquityCurve trades={state?.executedTrades ?? []} />
        </Section>

        <Section title="Live exchange tickers">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {EXCHANGES.map((ex) => (
              <ExchangeCard
                key={ex}
                exchange={ex}
                ticker={state?.tickers.find((t) => t.exchange === ex)}
                exchangeStats={state?.exchangeStats.find(
                  (s) => s.exchange === ex,
                )}
              />
            ))}
          </div>
        </Section>

        <Section title="Wallet balances (initial: $50K USDT + 0.5 BTC each)">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {EXCHANGES.map((ex) => (
              <WalletCard
                key={ex}
                exchange={ex}
                wallet={state?.wallets.find((w) => w.exchange === ex)}
              />
            ))}
          </div>
        </Section>

        <Section title="Executed trades · Faro (institutional) vs Retail (0.5%)">
          <TradesTable trades={state?.executedTrades ?? []} />
        </Section>

        <Section title="Opportunities evaluated (real-time)">
          <OpportunitiesTable opps={state?.opportunities ?? []} />
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
    <header className="mb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Faro <span className="font-normal text-zinc-500">·</span>{" "}
            <span className="font-normal text-zinc-400">
              Honest BTC arbitrage
            </span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Real-time detection across 3 exchanges. Executes only what survives
            fees + slippage. Modeled at market-maker tier (
            <span className="font-mono">0.02–0.04%</span>).
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              connected ? "animate-pulse bg-emerald-500" : "bg-zinc-600"
            }`}
          />
          <span className="text-zinc-400">
            {connected ? "live" : "connecting…"}
          </span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs tabular-nums text-zinc-500">
        <span>
          <span className="text-zinc-300">
            {(counters?.opportunitiesScanned ?? 0).toLocaleString()}
          </span>{" "}
          scanned
        </span>
        <span>
          <span className="text-amber-400">
            {(counters?.profitableDetected ?? 0).toLocaleString()}
          </span>{" "}
          profitable
        </span>
        <span>
          <span className="text-emerald-400">
            {executedTrades.toLocaleString()}
          </span>{" "}
          executed
        </span>
      </div>
    </header>
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

  return (
    <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            ? `${stats.totalTrades} trades · inst. fees`
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
        label="Lost to cooldown"
        value={counters ? `$${lostOpp.toFixed(2)}` : "—"}
        valueClass="text-amber-400"
        subtitle="Profitable opps blocked by 5s throttle"
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
            ? `Initial: $${stats.initialCapitalUSDT.toLocaleString()} + ${stats.initialBTC} BTC`
            : ""
        }
      />
    </section>
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
    <Card className="border-zinc-800 bg-zinc-900 text-zinc-50">
      <CardContent className="pt-6">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </div>
        <div
          className={`mt-2 font-mono text-2xl font-semibold tabular-nums lg:text-3xl ${valueClass}`}
        >
          {value}
        </div>
        {subtitle ? (
          <div className="mt-1 text-xs text-zinc-500">{subtitle}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StrategyPanel({ stats }: { stats: PortfolioStats | undefined }) {
  if (!stats) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-sm text-zinc-500">
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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div
        className={`mt-1 font-mono text-xl font-semibold tabular-nums ${valueClass}`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-zinc-500">{subtitle}</div>
    </div>
  );
}

function DecisionsPanel({ counters }: { counters: ScanCounters | undefined }) {
  if (!counters) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-sm text-zinc-500">
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
      <div className="col-span-2 rounded-lg border border-zinc-800 bg-zinc-900 p-4 lg:col-span-4">
        <div className="flex items-baseline justify-between">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Total profitable opps skipped
          </div>
          <div className="font-mono text-xs text-zinc-400 tabular-nums">
            {totalSkipped.toLocaleString()} decisions
          </div>
        </div>
      </div>
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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div
        className={`mt-1 font-mono text-lg font-semibold tabular-nums ${color}`}
      >
        {value.toLocaleString()}
      </div>
      <div className="mt-0.5 text-[10px] text-zinc-600">{subtitle}</div>
    </div>
  );
}

function ExchangeCard({
  exchange,
  ticker,
  exchangeStats,
}: {
  exchange: ExchangeName;
  ticker: Ticker | undefined;
  exchangeStats: ExchangeStats | undefined;
}) {
  const isStale = ticker?.stale ?? false;
  return (
    <Card
      className={`border-zinc-800 bg-zinc-900 text-zinc-50 ${isStale ? "opacity-50" : ""}`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium uppercase tracking-wide text-zinc-400">
          <span>{EXCHANGE_LABEL[exchange]}</span>
          {isStale ? (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium normal-case text-amber-400">
              stale · {ticker ? `${(ticker.ageMs / 1000).toFixed(0)}s ago` : ""}
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 font-mono tabular-nums">
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
        <div className="flex justify-between pt-2 text-xs text-zinc-500">
          <span>
            spread{" "}
            {ticker ? `$${(ticker.ask - ticker.bid).toFixed(2)}` : "—"}
          </span>
          {exchangeStats ? (
            <span>
              {exchangeStats.ticksPerSecond.toFixed(1)} t/s ·{" "}
              {exchangeStats.ticksReceived.toLocaleString()} total
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
        className={`text-2xl font-semibold ${value ? colorOnFresh : "text-zinc-600"}`}
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
}: {
  exchange: ExchangeName;
  wallet: WalletBalance | undefined;
}) {
  return (
    <Card className="border-zinc-800 bg-zinc-900 text-zinc-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium uppercase tracking-wide text-zinc-400">
          {EXCHANGE_LABEL[exchange]} wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 font-mono tabular-nums">
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase text-zinc-500">USDT</span>
          <span className="text-xl font-semibold text-zinc-100">
            {wallet
              ? wallet.usdt.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })
              : "—"}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase text-zinc-500">BTC</span>
          <span className="text-xl font-semibold text-amber-400">
            {wallet ? wallet.btc.toFixed(6) : "—"}
          </span>
        </div>
      </CardContent>
    </Card>
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
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
        Equity curve will appear after the first executed trade.
      </div>
    );
  }

  const finalPnL = data[data.length - 1].pnl;
  const isPositive = finalPnL >= 0;
  const lineColor = isPositive ? "#34d399" : "#f87171";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          Cumulative net P&amp;L · {data.length} trades
        </span>
        <span
          className={`font-mono tabular-nums text-lg font-semibold ${
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
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
        No trades executed yet. Faro is watching — only profitable opportunities
        AFTER fees get executed. Most candidates are mirages.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900/80 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Time</th>
            <th className="px-4 py-3 text-left font-medium">Route</th>
            <th className="px-4 py-3 text-right font-medium">Vol (BTC)</th>
            <th className="px-4 py-3 text-right font-medium">Gross</th>
            <th className="px-4 py-3 text-right font-medium">
              Faro net (inst)
            </th>
            <th className="px-4 py-3 text-right font-medium">
              Net at retail
            </th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {trades.slice(0, 15).map((t) => (
            <tr key={t.id} className="border-t border-zinc-800">
              <td className="px-4 py-2 text-zinc-500">
                {new Date(t.timestamp).toLocaleTimeString("en-US", {
                  hour12: false,
                })}
              </td>
              <td className="px-4 py-2 text-zinc-300">
                {t.buyExchange} → {t.sellExchange}
                {t.partial ? (
                  <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                    partial
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-2 text-right text-zinc-400">
                {t.executedVolumeBTC.toFixed(6)}
              </td>
              <td className="px-4 py-2 text-right text-zinc-400">
                ${t.grossProfit.toFixed(2)}
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OpportunitiesTable({ opps }: { opps: Opportunity[] }) {
  if (opps.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
        Waiting for opportunities…
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900/80 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Time</th>
            <th className="px-4 py-3 text-left font-medium">Route</th>
            <th className="px-4 py-3 text-right font-medium">Gross</th>
            <th className="px-4 py-3 text-right font-medium">Net (inst)</th>
            <th className="px-4 py-3 text-right font-medium">Net (retail)</th>
            <th className="px-4 py-3 text-right font-medium">Verdict</th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {opps.slice(0, 12).map((o, i) => (
            <tr key={i} className="border-t border-zinc-800">
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

function Footer() {
  return (
    <footer className="mt-12 border-t border-zinc-800 pt-6 text-xs text-zinc-500">
      Faro models market-maker tier (taker 0.02–0.04%, accessible to operators
      with $4B+ monthly volume — Binance VIP 9, Coinbase top tier). At retail
      fees (0.5%), every single profitable opportunity above would become a
      loss. That&apos;s the gap most arbitrage promises ignore.
    </footer>
  );
}
