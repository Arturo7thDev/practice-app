"use client";

import {
  useFaroStream,
  type ExchangeName,
  type ExecutedTrade,
  type Opportunity,
  type PortfolioStats,
  type Ticker,
  type WalletBalance,
} from "@/hooks/useFaroStream";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Header
          connected={connected}
          opportunitiesScanned={state?.counters.opportunitiesScanned ?? 0}
          profitableDetected={state?.counters.profitableDetected ?? 0}
          executedTrades={state?.stats.totalTrades ?? 0}
        />

        <HeroStats stats={state?.stats} />

        <Section title="Live exchange tickers">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {EXCHANGES.map((ex) => (
              <ExchangeCard
                key={ex}
                exchange={ex}
                ticker={state?.tickers.find((t) => t.exchange === ex)}
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
  opportunitiesScanned,
  profitableDetected,
  executedTrades,
}: {
  connected: boolean;
  opportunitiesScanned: number;
  profitableDetected: number;
  executedTrades: number;
}) {
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between">
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
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono tabular-nums text-zinc-500">
        <span>
          <span className="text-zinc-300">{opportunitiesScanned.toLocaleString()}</span>{" "}
          opportunities scanned
        </span>
        <span>
          <span className="text-amber-400">{profitableDetected.toLocaleString()}</span>{" "}
          profitable after fees
        </span>
        <span>
          <span className="text-emerald-400">{executedTrades.toLocaleString()}</span>{" "}
          executed
        </span>
      </div>
    </header>
  );
}

function HeroStats({ stats }: { stats: PortfolioStats | undefined }) {
  const profit = stats?.totalArbitrageProfit ?? 0;
  const retailLoss = stats?.hypotheticalRetailLoss ?? 0;

  return (
    <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatCard
        label="Faro arbitrage profit"
        value={
          stats
            ? `${profit >= 0 ? "+" : ""}$${profit.toFixed(2)}`
            : "—"
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
            ? `${stats.totalTrades} trades · institutional fees`
            : "Waiting for data…"
        }
      />
      <StatCard
        label="Same trades at retail (0.5%)"
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
          className={`mt-2 font-mono text-3xl font-semibold tabular-nums ${valueClass}`}
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

function ExchangeCard({
  exchange,
  ticker,
}: {
  exchange: ExchangeName;
  ticker: Ticker | undefined;
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
        <div className="pt-2 text-xs text-zinc-500">
          spread{" "}
          {ticker ? `$${(ticker.ask - ticker.bid).toFixed(2)}` : "—"}
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
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
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
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
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
