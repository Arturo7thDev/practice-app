"use client";

import {
  LINEAR_PAIRS,
  useFaroStream,
  type Decision,
  type ExchangeName,
  type ExchangeStats,
  type ExecutedTrade,
  type ExecutedTriangularTrade,
  type FintechMetrics,
  type NaiveState,
  type NaiveTrade,
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
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  Brain,
  BookOpen,
  Coins,
  Gauge,
  LineChart as LineChartIcon,
  Network,
  Radio,
  ShieldCheck,
  Skull,
  Sparkles,
  Swords,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";
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
  executed: "EJECUTADO",
  cooldown: "COOLDOWN",
  stale: "DATA VIEJA",
  suspicious: "SOSPECHOSO",
  insufficient_capital: "SIN CAPITAL",
};

export default function Home() {
  const { state, connected } = useFaroStream();

  return (
    <main className="min-h-screen text-zinc-50">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <Hero
          connected={connected}
          counters={state?.counters}
          executedTrades={state?.stats.totalTrades ?? 0}
          btcPrice={state?.stats.currentBTCPrice ?? 0}
          ethPrice={state?.stats.currentETHPrice ?? 0}
        />

        <DifferentiatorBanner />

        <HeroStats
          stats={state?.stats}
          counters={state?.counters}
          naive={state?.naive.stats}
        />

        <Section
          icon={Swords}
          eyebrow="Comparativa en vivo"
          title="Faro vs Bot retail naive"
          subtitle="Mismo data, mismas oportunidades, mismo capital inicial. Filtros distintos: Faro corta por NET, Naive ejecuta cualquier gross > 0 a fees retail (0.5%)."
        >
          <NaiveComparison
            faro={state?.stats}
            naive={state?.naive.stats}
          />
        </Section>

        <Section
          icon={Brain}
          eyebrow="Inteligencia"
          title="Estrategia"
          subtitle="Métricas agregadas de performance en todas las ejecuciones"
        >
          <StrategyPanel stats={state?.stats} />
        </Section>

        <Section
          icon={Zap}
          eyebrow="HFT-grade"
          title="Métricas fintech profesionales"
          subtitle="Sharpe, Sortino, Profit Factor, latencias de procesamiento y alpha decay — el idioma estándar de la industria"
        >
          <FintechPanel fintech={state?.stats.fintech} />
        </Section>

        <Section
          icon={Gauge}
          eyebrow="Proceso"
          title="Decisiones del bot"
          subtitle="Cada oportunidad rentable clasificada por veredicto"
        >
          <DecisionsPanel counters={state?.counters} />
        </Section>

        <Section
          icon={ShieldCheck}
          eyebrow="La verdad"
          title="Desglose completo de costos"
          subtitle="Trading + retiro amortizado + slippage estimado + latencia de red"
        >
          <CostBreakdown stats={state?.stats} />
        </Section>

        <Section
          icon={AlertTriangle}
          eyebrow="Riesgo"
          title="Métricas de riesgo"
          subtitle="Drawdown, exposición, desbalance de wallet, circuit breaker"
        >
          <RiskPanel risk={state?.stats.risk} />
        </Section>

        <Section
          icon={Radio}
          eyebrow="Tiempo real"
          title="Decisiones en vivo"
          subtitle="Últimas 15 evaluaciones con razonamiento completo"
        >
          <DecisionsFeed decisions={state?.decisions ?? []} />
        </Section>

        <Section
          icon={TrendingUp}
          eyebrow="Performance"
          title="Curva de equity · Faro vs Naive"
          subtitle="P&L neto acumulado de ambos bots sobre los mismos datos en tiempo real"
        >
          <EquityCurve
            faroTrades={state?.executedTrades ?? []}
            naiveTrades={state?.naive.recentTrades ?? []}
          />
        </Section>

        <Section
          icon={Coins}
          eyebrow="Capital"
          title="Balances de wallets"
          subtitle="Inicial: $50K USDT + 0.5 BTC + 10 ETH por exchange"
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
          icon={BookOpen}
          eyebrow="Libro mayor"
          title="Trades ejecutados"
          subtitle="Faro (fees institucionales) vs Retail (0.5%) en cada trade"
        >
          <TradesTable trades={state?.executedTrades ?? []} />
        </Section>

        <Section
          icon={Sparkles}
          eyebrow="Avanzado"
          title="Arbitraje triangular"
          subtitle="Ciclos intra-exchange BTC ↔ ETH ↔ USDT, ambas direcciones"
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

function Hero({
  connected,
  counters,
  executedTrades,
  btcPrice,
  ethPrice,
}: {
  connected: boolean;
  counters: ScanCounters | undefined;
  executedTrades: number;
  btcPrice: number;
  ethPrice: number;
}) {
  return (
    <header className="relative mb-16 pt-4 sm:pt-8">
      <FloatingNetwork className="pointer-events-none absolute inset-0 -z-10 opacity-50" />
      <div className="relative">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur">
          <span
            className={`live-dot inline-block h-1.5 w-1.5 rounded-full ${
              connected ? "bg-emerald-400" : "bg-zinc-600"
            }`}
          />
          {connected ? "en vivo" : "conectando…"}
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
          <div className="flex-1">
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Arbitraje cripto<br />
              <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                honesto.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              Arbitraje en tiempo real, lineal y triangular, entre{" "}
              <span className="text-zinc-200">3 exchanges</span> y{" "}
              <span className="text-zinc-200">2 pares</span>. Solo ejecuta lo
              que sobrevive el costo completo — fees, slippage, retiros y
              latencia. Hecho para operadores que sí miran lo que de verdad
              termina en su wallet.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-zinc-500">
              <Stat
                n={(counters?.opportunitiesScanned ?? 0).toLocaleString()}
                label="oportunidades escaneadas"
                tone="text-zinc-200"
              />
              <span className="text-zinc-700">·</span>
              <Stat
                n={(counters?.profitableDetected ?? 0).toLocaleString()}
                label="rentables tras fees"
                tone="text-amber-400"
              />
              <span className="text-zinc-700">·</span>
              <Stat
                n={executedTrades.toLocaleString()}
                label="trades ejecutados"
                tone="text-emerald-400"
              />
            </div>
          </div>

          <div className="lg:w-[340px]">
            <LiveTicker btcPrice={btcPrice} ethPrice={ethPrice} />
          </div>
        </div>
      </div>
    </header>
  );
}

function LiveTicker({
  btcPrice,
  ethPrice,
}: {
  btcPrice: number;
  ethPrice: number;
}) {
  return (
    <div className="glass-strong rounded-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Precios mid en vivo
        </span>
        <Network className="h-4 w-4 text-emerald-400" />
      </div>
      <div className="space-y-5">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium uppercase tracking-widest text-amber-400/80">
              Bitcoin
            </span>
            <span className="text-[10px] text-zinc-500">BTC/USDT</span>
          </div>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-numbers leading-none text-white">
            {btcPrice > 0
              ? `$${btcPrice.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`
              : "—"}
          </div>
        </div>
        <div className="h-px bg-white/[0.06]" />
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium uppercase tracking-widest text-violet-400/80">
              Ethereum
            </span>
            <span className="text-[10px] text-zinc-500">ETH/USDT</span>
          </div>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-numbers leading-none text-white">
            {ethPrice > 0
              ? `$${ethPrice.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`
              : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingNetwork({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 400"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="line-grad-2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Connecting lines suggesting cross-exchange flow */}
      <path
        d="M 80 100 Q 280 60 520 140"
        stroke="url(#line-grad)"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M 80 280 Q 320 380 540 300"
        stroke="url(#line-grad-2)"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M 120 200 Q 300 240 480 200"
        stroke="url(#line-grad)"
        strokeWidth="0.5"
        fill="none"
      />
      {/* Node glows */}
      <circle cx="80" cy="100" r="20" fill="url(#node-glow)" />
      <circle cx="80" cy="100" r="3" fill="#34d399" />
      <circle cx="520" cy="140" r="20" fill="url(#node-glow)" />
      <circle cx="520" cy="140" r="3" fill="#34d399" />
      <circle cx="80" cy="280" r="18" fill="url(#node-glow)" opacity="0.7" />
      <circle cx="80" cy="280" r="2.5" fill="#a78bfa" />
      <circle cx="540" cy="300" r="18" fill="url(#node-glow)" opacity="0.7" />
      <circle cx="540" cy="300" r="2.5" fill="#a78bfa" />
    </svg>
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
  naive,
}: {
  stats: PortfolioStats | undefined;
  counters: ScanCounters | undefined;
  naive: { cumulativeNet: number; totalTrades: number } | undefined;
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

  // Vs Naive bot — la diferencia real entre Faro y "el bot promedio"
  const naiveLoss = naive?.cumulativeNet ?? 0;
  const naiveTrades = naive?.totalTrades ?? 0;
  const advantage = profit - naiveLoss;

  return (
    <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
      <StatCard
        label="Ganancia Faro"
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
            : "Esperando datos…"
        }
      />
      <StatCard
        label="Mismas trades en retail (0.5%)"
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
        subtitle="Lo que daría un bot retail"
      />
      <StatCard
        label="Precisión de decisión"
        value={counters ? `${captureRate.toFixed(0)}%` : "—"}
        valueClass="text-emerald-400"
        subtitle={
          counters
            ? `capturadas · ${safePct.toFixed(0)}% seguridad · ${throttlePct.toFixed(0)}% throttle`
            : "de oportunidades rentables"
        }
      />
      <StatCard
        label="Ventaja sobre bot Naive"
        value={
          naive
            ? `${advantage >= 0 ? "+" : ""}$${advantage.toFixed(2)}`
            : "—"
        }
        valueClass={advantage > 0 ? "text-emerald-400" : "text-zinc-400"}
        subtitle={
          naive
            ? `Naive ejecutó ${naiveTrades} trades · perdió $${Math.abs(naiveLoss).toFixed(2)}`
            : "Misma data, fees retail (0.5%)"
        }
      />
      <StatCard
        label="Perdido por cooldown"
        value={counters ? `$${lostOpp.toFixed(2)}` : "—"}
        valueClass="text-amber-400"
        subtitle="Ganancia bloqueada por throttle de 3s"
      />
      <StatCard
        label="Valor del portfolio"
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
            ? `Inicial: $${stats.initialCapitalUSDT.toLocaleString()} + ${stats.initialBTC} BTC + ${stats.initialETH} ETH`
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
          Modelo de costos 4-stack
        </span>
        <p className="text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
          Faro descuenta{" "}
          <span className="text-zinc-200">fees de trading</span> +{" "}
          <span className="text-zinc-200">retiro amortizado</span> +{" "}
          <span className="text-zinc-200">slippage estimado</span> +{" "}
          <span className="text-zinc-200">latencia de red</span> en cada
          oportunidad. La mayoría de bots solo cuentan fees de trading — por
          eso sus &ldquo;ganancias&rdquo; se desvanecen en la realidad.
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
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14 sm:mb-16">
      <div className="mb-6 flex items-start gap-4">
        {Icon ? (
          <div className="glass mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
            <Icon className="h-5 w-5 text-emerald-400" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
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
        Calculando métricas de estrategia…
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
        label="Tasa de éxito"
        value={`${successPct}%`}
        subtitle="rentables / escaneadas"
        valueClass="text-emerald-400"
      />
      <MetricBox
        label="Neto promedio / trade"
        value={
          stats.totalTrades > 0
            ? `${avgNet >= 0 ? "+" : ""}$${avgNet.toFixed(4)}`
            : "—"
        }
        subtitle={`${stats.totalTrades} ejecutadas`}
        valueClass={avgNet >= 0 ? "text-emerald-400" : "text-red-400"}
      />
      <MetricBox
        label="Mejor ruta"
        value={best ? `+$${best.totalProfit.toFixed(2)}` : "—"}
        subtitle={best ? `${best.route} · ${best.count} trades` : "sin datos"}
        valueClass="text-emerald-400"
      />
      <MetricBox
        label="Latencia eval"
        value={`${latency.toFixed(2)} ms`}
        subtitle="promedio por ticker procesado"
        valueClass="text-zinc-100"
      />
    </div>
  );
}

function FintechPanel({ fintech }: { fintech: FintechMetrics | undefined }) {
  if (!fintech) {
    return (
      <div className="glass rounded-2xl p-6 text-sm text-zinc-500">
        Computando métricas fintech…
      </div>
    );
  }

  // Sharpe: > 1 bueno, > 2 muy bueno, > 3 excelente
  const sharpeColor =
    fintech.sharpeRatio > 2
      ? "text-emerald-400"
      : fintech.sharpeRatio > 1
        ? "text-emerald-400"
        : fintech.sharpeRatio > 0
          ? "text-amber-400"
          : "text-zinc-400";

  // Profit factor: > 1 ganador, > 2 muy bueno, > 3 excelente
  const pfColor =
    !Number.isFinite(fintech.profitFactor) || fintech.profitFactor > 2
      ? "text-emerald-400"
      : fintech.profitFactor > 1
        ? "text-emerald-400"
        : fintech.profitFactor > 0
          ? "text-amber-400"
          : "text-zinc-400";

  // Latencia: < 1ms excelente, < 5ms bueno, > 10ms alarma
  const p99Color =
    fintech.evalLatencyP99 < 1
      ? "text-emerald-400"
      : fintech.evalLatencyP99 < 5
        ? "text-emerald-400"
        : fintech.evalLatencyP99 < 10
          ? "text-amber-400"
          : "text-red-400";

  const fmtRatio = (n: number) =>
    Number.isFinite(n) ? n.toFixed(2) : "∞";

  return (
    <div className="space-y-4">
      {/* Risk-adjusted returns */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricBox
          label="Sharpe ratio"
          value={fmtRatio(fintech.sharpeRatio)}
          subtitle="risk-adjusted return per trade"
          valueClass={sharpeColor}
        />
        <MetricBox
          label="Sortino ratio"
          value={fmtRatio(fintech.sortinoRatio)}
          subtitle="penaliza solo downside"
          valueClass={
            Number.isFinite(fintech.sortinoRatio) &&
            fintech.sortinoRatio > 0
              ? "text-emerald-400"
              : "text-zinc-400"
          }
        />
        <MetricBox
          label="Profit factor"
          value={fmtRatio(fintech.profitFactor)}
          subtitle="gross profit / gross loss"
          valueClass={pfColor}
        />
        <MetricBox
          label="Win rate"
          value={`${(fintech.winRate * 100).toFixed(0)}%`}
          subtitle="% trades con net > 0"
          valueClass={
            fintech.winRate > 0.7
              ? "text-emerald-400"
              : fintech.winRate > 0.5
                ? "text-amber-400"
                : "text-zinc-400"
          }
        />
      </div>

      {/* Latency percentiles */}
      <div className="glass rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
          <Timer className="h-3.5 w-3.5" />
          Eval latency · percentiles
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">
              p50
            </div>
            <div className="mt-1 font-mono text-xl font-semibold tabular-numbers text-zinc-100">
              {fintech.evalLatencyP50.toFixed(3)} ms
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">
              p95
            </div>
            <div
              className={`mt-1 font-mono text-xl font-semibold tabular-numbers ${
                fintech.evalLatencyP95 < 5 ? "text-zinc-100" : "text-amber-400"
              }`}
            >
              {fintech.evalLatencyP95.toFixed(3)} ms
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">
              p99
            </div>
            <div
              className={`mt-1 font-mono text-xl font-semibold tabular-numbers ${p99Color}`}
            >
              {fintech.evalLatencyP99.toFixed(3)} ms
            </div>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-zinc-600">
          Tiempo desde llegada del tick hasta decisión completa · ring buffer de
          últimas 1000 muestras
        </div>
      </div>

      {/* Alpha decay */}
      <div className="glass rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
          <Activity className="h-3.5 w-3.5" />
          Alpha decay · vida útil de oportunidades
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">
              avg lifetime
            </div>
            <div className="mt-1 font-mono text-xl font-semibold tabular-numbers text-zinc-100">
              {fintech.avgOpportunityLifetimeMs > 1000
                ? `${(fintech.avgOpportunityLifetimeMs / 1000).toFixed(2)}s`
                : `${fintech.avgOpportunityLifetimeMs.toFixed(0)}ms`}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">
              p95 lifetime
            </div>
            <div className="mt-1 font-mono text-xl font-semibold tabular-numbers text-zinc-100">
              {fintech.p95OpportunityLifetimeMs > 1000
                ? `${(fintech.p95OpportunityLifetimeMs / 1000).toFixed(2)}s`
                : `${fintech.p95OpportunityLifetimeMs.toFixed(0)}ms`}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">
              samples
            </div>
            <div className="mt-1 font-mono text-xl font-semibold tabular-numbers text-zinc-400">
              {fintech.totalOpportunityDeaths.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-zinc-600">
          Tiempo entre la primera aparición rentable de una ruta y su cierre ·
          señal de eficiencia del mercado
        </div>
      </div>
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
        subtitle="throttle 3s por par"
      />
      <SkipBox
        label="Sospechosa"
        value={counters.skippedSuspicious}
        color="text-red-400"
        subtitle="spread > 2% (circuit breaker)"
      />
      <SkipBox
        label="Data vieja"
        value={counters.skippedStaleData}
        color="text-zinc-400"
        subtitle="ticker > 60s viejo"
      />
      <SkipBox
        label="Sin capital"
        value={counters.skippedInsufficientCapital}
        color="text-zinc-400"
        subtitle="wallet agotado"
      />
      <div className="col-span-2 glass rounded-2xl p-4 lg:col-span-4">
        <div className="flex items-baseline justify-between">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Total de rentables descartadas
          </div>
          <div className="font-mono text-xs text-zinc-400 tabular-numbers">
            {totalSkipped.toLocaleString()} decisiones
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
        Inicializando métricas de riesgo…
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricBox
          label="Drawdown máximo"
          value={`$${risk.maxDrawdownUSD.toFixed(2)}`}
          subtitle={`${(risk.maxDrawdownPercent * 100).toFixed(1)}% desde el peak`}
          valueClass={risk.maxDrawdownUSD > 0 ? "text-red-400" : "text-emerald-400"}
        />
        <MetricBox
          label="Desbalance de wallet"
          value={`${(risk.walletImbalance * 100).toFixed(1)}%`}
          subtitle="desv std / media de USD/exchange"
          valueClass={risk.walletImbalance > 0.2 ? "text-amber-400" : "text-emerald-400"}
        />
        <MetricBox
          label="Capital desplegado"
          value={`${(risk.capitalDeployedPercent * 100).toFixed(1)}%`}
          subtitle="vol trade / USDT inicial"
          valueClass="text-zinc-100"
        />
        <MetricBox
          label="Circuit breaker"
          value="ACTIVO"
          subtitle="rechaza spreads > 2%"
          valueClass="text-emerald-400"
        />
      </div>
      <div className="glass rounded-2xl p-4">
        <div className="mb-3 text-xs uppercase tracking-wide text-zinc-500">
          Exposición por exchange
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
              <span className="w-28 text-right font-mono text-[10px] tabular-numbers text-zinc-600">
                {(e.usdtPct * 100).toFixed(0)}% en USDT
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DecisionsFeed({ decisions }: { decisions: Decision[] }) {
  const now = Date.now();
  const newest = decisions[0];
  const newestAgeSec = newest ? (now - newest.timestamp) / 1000 : null;
  return (
    <div className="space-y-3">
      <div className="glass rounded-2xl px-5 py-3 text-xs">
        <span className="text-zinc-400">
          {newestAgeSec === null
            ? "Esperando primera decisión rentable…"
            : newestAgeSec < 60
              ? `Última decisión hace ${newestAgeSec.toFixed(0)}s · el bot sigue escaneando ~5,000 oportunidades/min en background.`
              : `Última decisión hace ${(newestAgeSec / 60).toFixed(1)} min. El mercado está quieto pero el bot sigue escaneando miles de oportunidades por minuto — solo registra decisiones cuando aparece una rentable.`}
        </span>
      </div>
      {decisions.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-center text-sm text-zinc-500">
          Las decisiones van a aparecer acá a medida que el bot evalúe oportunidades rentables…
        </div>
      ) : (
        <div className="overflow-x-auto glass rounded-2xl">
          <div className="min-w-[680px] divide-y divide-white/[0.04]">
            {decisions.map((d, i) => {
              const ageSec = (now - d.timestamp) / 1000;
              const ageLabel =
                ageSec < 60
                  ? `${ageSec.toFixed(0)}s`
                  : ageSec < 3600
                    ? `${(ageSec / 60).toFixed(0)}m`
                    : `${(ageSec / 3600).toFixed(1)}h`;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-2 font-mono text-xs"
                >
                  <span className="w-16 text-right text-zinc-600 tabular-numbers">
                    hace {ageLabel}
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
                  <span className="flex-1 truncate text-zinc-500">
                    {d.reason}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
        label="Fees de trading"
        value={stats.totalTradingFees}
        color="text-red-400"
        sub="taker × 2 lados"
      />
      <CostBox
        label="Retiro (amortizado)"
        value={stats.totalAmortizedWithdrawal}
        color="text-amber-400"
        sub="÷ 100 trades/rebalance"
      />
      <CostBox
        label="Slippage estimado"
        value={stats.totalEstimatedSlippage}
        color="text-amber-400"
        sub="0.002% × valor del trade"
      />
      <CostBox
        label="Costo de latencia"
        value={stats.totalLatencyCost}
        color="text-amber-400"
        sub="0.001% × valor del trade"
      />
      <CostBox
        label="Costo total all-in"
        value={stats.totalCosts}
        color="text-zinc-100"
        sub="lo que sobrevive = NETO"
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
              data vieja · {ticker ? `hace ${(ticker.ageMs / 1000).toFixed(0)}s` : ""}
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
              <span title="Tasa de mensajes WebSocket">
                <span className="text-zinc-300">
                  {exchangeStats.ticksPerSecond.toFixed(1)}
                </span>{" "}
                msg/s
              </span>
              {exchangeStats.networkLatencyMs > 0 ? (
                <span
                  title="RTT real medido vía REST ping cada 30s"
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

function EquityCurve({
  faroTrades,
  naiveTrades,
}: {
  faroTrades: ExecutedTrade[];
  naiveTrades: NaiveTrade[];
}) {
  // Mergear timeline: unimos los timestamps de ambos bots, calculamos cumulativo
  // para cada uno en cada punto en el tiempo.
  const faroChrono = [...faroTrades].reverse();
  const naiveChrono = [...naiveTrades].reverse();

  type Point = { time: string; ts: number; faro: number; naive: number };
  const allTimestamps = new Set<number>();
  for (const t of faroChrono) allTimestamps.add(t.timestamp);
  for (const t of naiveChrono) allTimestamps.add(t.timestamp);
  const sortedTs = Array.from(allTimestamps).sort((a, b) => a - b);

  const data: Point[] = [];
  let faroCum = 0;
  let naiveCum = 0;
  let faroIdx = 0;
  let naiveIdx = 0;
  for (const ts of sortedTs) {
    while (faroIdx < faroChrono.length && faroChrono[faroIdx].timestamp <= ts) {
      faroCum += faroChrono[faroIdx].netProfit;
      faroIdx++;
    }
    while (
      naiveIdx < naiveChrono.length &&
      naiveChrono[naiveIdx].timestamp <= ts
    ) {
      naiveCum += naiveChrono[naiveIdx].netResult;
      naiveIdx++;
    }
    data.push({
      time: new Date(ts).toLocaleTimeString("en-US", { hour12: false }),
      ts,
      faro: faroCum,
      naive: naiveCum,
    });
  }

  if (data.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-sm text-zinc-500">
        La curva de equity aparecerá cuando alguno de los bots ejecute su
        primer trade.
      </div>
    );
  }

  const finalFaro = data[data.length - 1].faro;
  const finalNaive = data[data.length - 1].naive;
  const gap = finalFaro - finalNaive;

  return (
    <div className="glass rounded-2xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-center gap-5 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-4 rounded bg-emerald-400" />
            <span className="text-zinc-300 font-medium">Faro</span>
            <span
              className={`font-mono tabular-numbers ${finalFaro >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {finalFaro >= 0 ? "+" : ""}${finalFaro.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-4 rounded bg-red-400" />
            <span className="text-zinc-300 font-medium">Naive</span>
            <span
              className={`font-mono tabular-numbers ${finalNaive >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {finalNaive >= 0 ? "+" : ""}${finalNaive.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="font-mono text-sm tabular-numbers text-emerald-300">
          gap +${gap.toFixed(2)}
        </div>
      </div>
      <div className="h-72 w-full">
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
                background: "#09090b",
                border: "1px solid #27272a",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "#a1a1aa" }}
              formatter={(value, name) => [
                `$${Number(value).toFixed(2)}`,
                name === "faro" ? "Faro (inst)" : "Naive (retail)",
              ]}
            />
            <ReferenceLine y={0} stroke="#52525b" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="naive"
              stroke="#f87171"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="faro"
              stroke="#34d399"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function NaiveComparison({
  faro,
  naive,
}: {
  faro: PortfolioStats | undefined;
  naive: { cumulativeNet: number; totalTrades: number; delta: number; deltaPercent: number } | undefined;
}) {
  if (!faro || !naive) {
    return (
      <div className="glass rounded-2xl p-6 text-sm text-zinc-500">
        Inicializando comparativa…
      </div>
    );
  }
  const faroNet = faro.totalArbitrageProfit;
  const advantage = faroNet - naive.cumulativeNet;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
          <Sparkles className="h-3.5 w-3.5" />
          Faro (institucional)
        </div>
        <div
          className={`mt-2.5 font-mono text-3xl font-semibold tabular-numbers ${faroNet >= 0 ? "text-emerald-400" : "text-red-400"}`}
        >
          {faroNet >= 0 ? "+" : ""}${faroNet.toFixed(2)}
        </div>
        <div className="mt-2 text-xs text-zinc-500">
          {faro.totalTrades} trades · filtro por NET tras 4-stack cost model
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400">
          <Skull className="h-3.5 w-3.5" />
          Naive (retail 0.5%)
        </div>
        <div
          className={`mt-2.5 font-mono text-3xl font-semibold tabular-numbers ${naive.cumulativeNet >= 0 ? "text-emerald-400" : "text-red-400"}`}
        >
          {naive.cumulativeNet >= 0 ? "+" : ""}${naive.cumulativeNet.toFixed(2)}
        </div>
        <div className="mt-2 text-xs text-zinc-500">
          {naive.totalTrades} trades · filtro solo por GROSS positivo
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-400/10 to-transparent p-5 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
          <Swords className="h-3.5 w-3.5" />
          Ventaja Faro
        </div>
        <div className="mt-2.5 font-mono text-3xl font-semibold tabular-numbers text-emerald-300">
          {advantage >= 0 ? "+" : ""}${advantage.toFixed(2)}
        </div>
        <div className="mt-2 text-xs text-emerald-200/70">
          Diferencia neta sobre el bot retail · mismos datos, mismos exchanges
        </div>
      </div>
    </div>
  );
}

function TradesTable({ trades }: { trades: ExecutedTrade[] }) {
  if (trades.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-sm text-zinc-500">
        Aún no se ejecutan trades. Faro observa — solo ejecuta oportunidades
        rentables DESPUÉS de fees. La mayoría son espejismos.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto glass rounded-2xl">
      <table className="w-full text-sm">
        <thead className="bg-white/[0.02] text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Hora</th>
            <th className="px-4 py-3 text-left font-medium">Par</th>
            <th className="px-4 py-3 text-left font-medium">Ruta</th>
            <th className="px-4 py-3 text-right font-medium">Vol</th>
            <th className="px-4 py-3 text-right font-medium">Bruto</th>
            <th className="px-4 py-3 text-right font-medium">Costo all-in</th>
            <th className="px-4 py-3 text-right font-medium">
              Neto Faro (inst)
            </th>
            <th className="px-4 py-3 text-right font-medium">
              Neto en retail
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
        Esperando oportunidades en este par…
      </div>
    );
  }

  return (
    <div className="overflow-x-auto glass rounded-2xl">
      <table className="w-full text-sm">
        <thead className="bg-white/[0.02] text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Hora</th>
            <th className="px-4 py-3 text-left font-medium">Ruta</th>
            <th className="px-4 py-3 text-right font-medium">Bruto</th>
            <th className="px-4 py-3 text-right font-medium">Neto (inst)</th>
            <th className="px-4 py-3 text-right font-medium">Neto (retail)</th>
            <th className="px-4 py-3 text-right font-medium">Veredicto</th>
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
                    SOSPECHOSA
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
          label="Ciclos triangulares evaluados"
          value={scanned.toString()}
          subtitle="últimos 12 evaluados"
          valueClass="text-zinc-100"
        />
        <MetricBox
          label="Rentables detectadas"
          value={profitable.toString()}
          subtitle={`${scanned > 0 ? ((profitable / scanned) * 100).toFixed(0) : 0}% hit rate`}
          valueClass={profitable > 0 ? "text-emerald-400" : "text-zinc-400"}
        />
        <MetricBox
          label="Trades triangulares ejecutados"
          value={trades.length.toString()}
          subtitle="dentro de un solo exchange"
          valueClass={trades.length > 0 ? "text-emerald-400" : "text-zinc-400"}
        />
        <MetricBox
          label="P&L triangular"
          value={`${triProfit >= 0 ? "+" : ""}$${triProfit.toFixed(2)}`}
          subtitle={`sobre $1,000 notional/ciclo`}
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
          Esperando los 3 pares (BTC/USDT + ETH/USDT + ETH/BTC) en al menos
          un exchange…
        </div>
      ) : (
        <div className="overflow-x-auto glass rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Hora</th>
                <th className="px-4 py-3 text-left font-medium">Exchange</th>
                <th className="px-4 py-3 text-left font-medium">Ciclo</th>
                <th className="px-4 py-3 text-right font-medium">Inicio</th>
                <th className="px-4 py-3 text-right font-medium">Final</th>
                <th className="px-4 py-3 text-right font-medium">Neto</th>
                <th className="px-4 py-3 text-right font-medium">%</th>
                <th className="px-4 py-3 text-right font-medium">Veredicto</th>
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
            Trades triangulares ejecutados
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Hora</th>
                <th className="px-4 py-2 text-left font-medium">Exchange</th>
                <th className="px-4 py-2 text-left font-medium">Ciclo</th>
                <th className="px-4 py-2 text-right font-medium">Neto</th>
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
