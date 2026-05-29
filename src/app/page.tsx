"use client";

import { useFaroStream, type Opportunity, type Ticker } from "@/hooks/useFaroStream";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EXCHANGE_LABEL: Record<Ticker["exchange"], string> = {
  binance: "Binance.US",
  coinbase: "Coinbase",
  kraken: "Kraken",
};

export default function Home() {
  const { state, connected } = useFaroStream();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Faro <span className="text-zinc-500 font-normal">·</span>{" "}
              <span className="text-zinc-400 font-normal">
                Honest BTC arbitrage
              </span>
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Real-time arbitrage detection across 3 exchanges. Shows only what
              survives the net calculation.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                connected ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"
              }`}
            />
            <span className="text-zinc-400">
              {connected ? "live" : "connecting…"}
            </span>
          </div>
        </header>

        <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {(["binance", "coinbase", "kraken"] as const).map((ex) => {
            const t = state?.tickers.find((x) => x.exchange === ex);
            return <ExchangeCard key={ex} exchange={ex} ticker={t} />;
          })}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
            Recent opportunities evaluated
          </h2>
          <OpportunitiesTable opps={state?.opportunities ?? []} />
        </section>
      </div>
    </main>
  );
}

function ExchangeCard({
  exchange,
  ticker,
}: {
  exchange: Ticker["exchange"];
  ticker: Ticker | undefined;
}) {
  return (
    <Card className="border-zinc-800 bg-zinc-900 text-zinc-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium uppercase tracking-wide text-zinc-400">
          {EXCHANGE_LABEL[exchange]}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 font-mono tabular-nums">
        <Row label="bid" value={ticker?.bid} colorOnFresh="text-emerald-400" />
        <Row label="ask" value={ticker?.ask} colorOnFresh="text-red-400" />
        <div className="pt-2 text-xs text-zinc-500">
          spread{" "}
          {ticker
            ? `$${(ticker.ask - ticker.bid).toFixed(2)}`
            : "—"}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({
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
      <span className={`text-2xl font-semibold ${value ? colorOnFresh : "text-zinc-600"}`}>
        {value ? `$${value.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}` : "—"}
      </span>
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
            <th className="px-4 py-3 text-right font-medium">Vol (BTC)</th>
            <th className="px-4 py-3 text-right font-medium">Gross</th>
            <th className="px-4 py-3 text-right font-medium">Fees</th>
            <th className="px-4 py-3 text-right font-medium">Net</th>
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
                {o.maxVolumeBTC.toFixed(6)}
              </td>
              <td className="px-4 py-2 text-right text-zinc-400">
                ${o.grossProfit.toFixed(2)}
              </td>
              <td className="px-4 py-2 text-right text-zinc-500">
                ${o.totalFees.toFixed(2)}
              </td>
              <td
                className={`px-4 py-2 text-right font-semibold ${o.profitable ? "text-emerald-400" : "text-red-400"}`}
              >
                {o.netProfit >= 0 ? "+" : ""}${o.netProfit.toFixed(2)}
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
  );
}
