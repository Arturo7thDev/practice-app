"use client";

import { useEffect, useRef, useState } from "react";
import {
  LINEAR_PAIRS,
  useFaroStream,
  type Decision,
  type ExchangeName,
  type ExchangeStats,
  type ExecutedTrade,
  type ExecutedTriangularTrade,
  type BayesianSlippageMetrics,
  type FintechMetrics,
  type KellyMetrics,
  type NaiveState,
  type NaiveTrade,
  type Opportunity,
  type Pair,
  type PortfolioStats,
  type RiskMetrics,
  type ScanCounters,
  type TobiCalibration,
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
  Telescope,
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
  "BTC/USDT": "text-[var(--beacon)]",
  "ETH/USDT": "text-[var(--beacon-warm)]",
  "ETH/BTC": "text-[var(--beacon-warm)]",
};

const DECISION_COLOR: Record<Decision["outcome"], string> = {
  executed: "text-[var(--signal-up)]",
  cooldown: "text-[var(--beacon)]",
  stale: "text-[var(--type-mute)]",
  suspicious: "text-[var(--signal-down)]",
  insufficient_capital: "text-[var(--type-mute)]",
  low_survival: "text-[var(--beacon-warm)]",
};

const DECISION_LABEL: Record<Decision["outcome"], string> = {
  executed: "EJECUTADO",
  cooldown: "COOLDOWN",
  stale: "DATA VIEJA",
  suspicious: "SOSPECHOSO",
  insufficient_capital: "SIN CAPITAL",
  low_survival: "BAJO TOBI",
};

export default function Home() {
  const { state, connected } = useFaroStream();

  return (
    <main className="min-h-screen text-[var(--type-ink)]">
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
          icon={Network}
          eyebrow="Señal propia"
          title="TOBI · Top of Book Imbalance"
          subtitle="Filtro predictivo derivado del orderbook L1. El bot no persigue oportunidades que el modelo predice que van a morir antes de capturarse"
        >
          <TobiPanel
            tobi={state?.stats.tobi}
            skippedLowSurvival={state?.counters.skippedLowSurvival ?? 0}
          />
        </Section>

        <Section
          icon={Sparkles}
          eyebrow="Sizing científico"
          title="Kelly Criterion · position sizing"
          subtitle="El bot ajusta el tamaño de cada trade en función de la edge observada. Fractional Kelly (25%) con cap absoluto del 20% del bankroll"
        >
          <KellyPanel kelly={state?.stats.kelly} />
        </Section>

        <Section
          icon={Telescope}
          eyebrow="Online learning"
          title="Bayesian slippage learning"
          subtitle="Posterior por exchange actualizado en vivo con Normal-Normal conjugate update — converge al slippage real a medida que se observan trades"
        >
          <BayesianPanel bayesian={state?.stats.bayesian} />
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

        <Section
          icon={Radio}
          eyebrow="Mercado en vivo"
          title="Escaneando 3 exchanges"
          subtitle="Cada tick activa el pipeline completo de evaluación. Las oportunidades aparecen cuando el barrido detecta divergencias de precio entre libros."
        >
          <RadarScanner
            scansPerSec={
              state?.counters?.opportunitiesScanned !== undefined
                ? state.counters.opportunitiesScanned
                : undefined
            }
            profitableCount={state?.counters?.profitableDetected ?? 0}
          />
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
        </Section>

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
  const scansPerSec = useThroughput(counters?.opportunitiesScanned);
  return (
    <header className="relative mb-16 overflow-hidden pt-4 sm:pt-8">
      {/* Haz del faro — barre el hero entero por detrás del contenido */}
      <Lighthouse className="pointer-events-none absolute -right-20 -top-10 h-[520px] w-[520px] opacity-90 sm:-right-10" />

      <div className="relative">
        {/* Coordenadas náuticas en la esquina superior izquierda */}
        <div className="caption-nav mb-5 flex items-center gap-3">
          <span>19°25′N · 99°08′W</span>
          <span className="text-[var(--foam)]">·</span>
          <span>{new Date().toISOString().slice(0, 10)}</span>
        </div>

        <div className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-sm border border-[var(--foam)] bg-[var(--abyss)]/60 px-3 py-1.5 text-xs font-medium text-[var(--type-mute)] backdrop-blur">
          <span
            className={`live-dot inline-block h-1.5 w-1.5 rounded-full ${
              connected ? "" : "bg-[var(--mist)]"
            }`}
          />
          <span className="uppercase tracking-[0.18em] text-[10px]">
            {connected ? "transmitiendo" : "conectando…"}
          </span>
          {connected && (
            <>
              <span className="text-[var(--foam)]">·</span>
              <span className="font-mono tabular-numbers text-[var(--type-ink)]">
                {scansPerSec.toFixed(1)}
                <span className="ml-0.5 text-[var(--type-faint)]">scans/s</span>
              </span>
            </>
          )}
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
          <div className="flex-1">
            <h1 className="font-display text-5xl font-medium leading-[1.02] tracking-[-0.025em] text-[var(--type-ink)] sm:text-6xl lg:text-[5.5rem]">
              Arbitraje cripto
              <br />
              <span
                className="italic"
                style={{
                  color: "var(--beacon)",
                  fontVariationSettings: '"SOFT" 100',
                }}
              >
                honesto
              </span>
              <span className="text-[var(--beacon)]">.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-[var(--type-mute)] sm:text-lg">
              Bot de arbitraje BTC y ETH entre{" "}
              <span className="text-[var(--type-ink)]">3 exchanges</span>,
              lineal y triangular. Solo ejecuta lo que sobrevive al modelo
              completo de costos — fees, retiros, slippage y latencia.{" "}
              <span className="text-[var(--type-ink)]">
                Sin la mentira que infla los demos.
              </span>
            </p>
            <div className="mt-9 flex flex-wrap items-baseline gap-x-8 gap-y-3 text-sm text-[var(--type-faint)]">
              <Stat
                n={(counters?.opportunitiesScanned ?? 0).toLocaleString()}
                label="oportunidades escaneadas"
                tone="text-[var(--type-ink)]"
              />
              <span className="text-[var(--foam)]">·</span>
              <Stat
                n={(counters?.profitableDetected ?? 0).toLocaleString()}
                label="rentables tras costos"
                tone="text-[var(--beacon)]"
              />
              <span className="text-[var(--foam)]">·</span>
              <Stat
                n={executedTrades.toLocaleString()}
                label="trades ejecutados"
                tone="text-[var(--signal-up)]"
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

/* Lighthouse SVG — el faro físico con su haz rotando.
   El haz (.beacon-sweep) gira lento (14s) sobre el orb. El glow del orb
   pulsa por separado. Diseño funcional al concepto, no decorativo. */
function Lighthouse({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 600"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        {/* Haz de luz — cono cálido que decae con la distancia */}
        <linearGradient id="beam-grad" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#f7931a" stopOpacity="0.55" />
          <stop offset="40%" stopColor="#ffb04a" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#f7931a" stopOpacity="0" />
        </linearGradient>
        {/* Glow del orb del faro */}
        <radialGradient id="orb-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff8e0" stopOpacity="1" />
          <stop offset="20%" stopColor="#ffb04a" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#f7931a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#f7931a" stopOpacity="0" />
        </radialGradient>
        {/* Niebla sutil del mar nocturno detrás del faro */}
        <radialGradient id="mist" cx="50%" cy="100%" r="80%">
          <stop offset="0%" stopColor="#1b2d4f" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#04081a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Niebla detrás */}
      <ellipse cx="300" cy="450" rx="280" ry="90" fill="url(#mist)" />

      {/* Haz rotando — pivot en el centro del orb (300, 195) */}
      <g
        className="beacon-sweep"
        style={{ transformOrigin: "300px 195px", transformBox: "fill-box" }}
      >
        <path
          d="M 300 195 L 600 95 L 600 295 Z"
          fill="url(#beam-grad)"
        />
        {/* Segundo haz opuesto, más débil — el faro tiene 360° de barrido */}
        <path
          d="M 300 195 L 0 145 L 0 245 Z"
          fill="url(#beam-grad)"
          opacity="0.4"
        />
      </g>

      {/* Glow del orb (pulsando) */}
      <circle cx="300" cy="195" r="40" fill="url(#orb-glow)">
        <animate
          attributeName="r"
          values="38;48;38"
          dur="3.2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.85;1;0.85"
          dur="3.2s"
          repeatCount="indefinite"
        />
      </circle>
      {/* Núcleo brillante */}
      <circle cx="300" cy="195" r="10" fill="#fff8e0" />

      {/* Techo cónico */}
      <path
        d="M 282 173 L 300 145 L 318 173 Z"
        fill="#0f1d3a"
        stroke="#2a3f64"
        strokeWidth="1"
      />
      {/* Pequeña antena */}
      <line x1="300" y1="145" x2="300" y2="132" stroke="#2a3f64" strokeWidth="1.5" />
      <circle cx="300" cy="130" r="2" fill="#f7931a" />

      {/* Cuarto de lámpara — vidriado, deja pasar el glow */}
      <rect
        x="282"
        y="174"
        width="36"
        height="42"
        fill="rgba(247,147,26,0.08)"
        stroke="#f7931a"
        strokeWidth="0.5"
        opacity="0.7"
      />
      {/* Soportes verticales del cuarto */}
      <line x1="290" y1="174" x2="290" y2="216" stroke="#2a3f64" strokeWidth="0.5" />
      <line x1="310" y1="174" x2="310" y2="216" stroke="#2a3f64" strokeWidth="0.5" />

      {/* Plataforma superior (galería) */}
      <rect x="274" y="216" width="52" height="6" fill="#0f1d3a" stroke="#2a3f64" />
      {/* Barandilla */}
      <line x1="274" y1="216" x2="326" y2="216" stroke="#2a3f64" strokeWidth="0.5" />

      {/* Torre — trapezoide con bandas */}
      <path
        d="M 280 222 L 320 222 L 328 380 L 272 380 Z"
        fill="#0a1429"
        stroke="#2a3f64"
        strokeWidth="1"
      />
      {/* Bandas cálidas — referencia al haz */}
      <path
        d="M 278 252 L 322 252 L 323 268 L 277 268 Z"
        fill="#f7931a"
        opacity="0.18"
      />
      <path
        d="M 276 300 L 324 300 L 325 316 L 275 316 Z"
        fill="#f7931a"
        opacity="0.18"
      />
      <path
        d="M 274 348 L 326 348 L 327 364 L 273 364 Z"
        fill="#f7931a"
        opacity="0.18"
      />

      {/* Ventana superior */}
      <rect x="294" y="240" width="12" height="14" fill="#04081a" stroke="#2a3f64" strokeWidth="0.5" />
      {/* Ventana media */}
      <rect x="293" y="288" width="14" height="14" fill="#04081a" stroke="#2a3f64" strokeWidth="0.5" />
      {/* Puerta */}
      <rect x="291" y="345" width="18" height="35" fill="#04081a" stroke="#2a3f64" strokeWidth="0.5" />

      {/* Base ancha */}
      <path
        d="M 260 380 L 340 380 L 350 410 L 250 410 Z"
        fill="#04081a"
        stroke="#1b2d4f"
        strokeWidth="1"
      />

      {/* Peñasco/isla */}
      <path
        d="M 180 410 L 420 410 L 440 440 L 460 460 L 140 460 L 160 440 Z"
        fill="#04081a"
      />
      {/* Texturas sutiles del peñasco */}
      <path
        d="M 200 425 L 230 432 L 260 425 L 280 430 L 310 425"
        stroke="#1b2d4f"
        strokeWidth="0.7"
        fill="none"
      />
      <path
        d="M 320 432 L 350 427 L 380 432 L 410 428"
        stroke="#1b2d4f"
        strokeWidth="0.7"
        fill="none"
      />

      {/* Reflejo del haz sobre el mar abajo */}
      <ellipse
        cx="300"
        cy="500"
        rx="180"
        ry="8"
        fill="#f7931a"
        opacity="0.08"
      />
    </svg>
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
    <div
      className="instrument-frame glass-strong p-6"
      style={{ borderRadius: "2px" }}
    >
      <div className="mb-5 flex items-center justify-between">
        <span className="caption-nav">Mid de mercado · en vivo</span>
        <div className="flex items-center gap-1.5">
          <span
            className="live-dot inline-block h-1 w-1 rounded-full"
            aria-hidden
          />
          <Radio className="h-3 w-3 text-[var(--beacon)]" />
        </div>
      </div>
      <div className="space-y-5">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-lg font-medium text-[var(--beacon)]">
              Bitcoin
            </span>
            <span
              className="text-[10px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--type-faint)",
              }}
            >
              BTC/USDT
            </span>
          </div>
          <div className="font-display mt-2 text-3xl font-medium tabular-numbers leading-none text-[var(--type-ink)]">
            {btcPrice > 0
              ? `$${btcPrice.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`
              : "—"}
          </div>
        </div>
        <div
          className="h-px"
          style={{ background: "var(--foam)" }}
        />
        <div>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-lg font-medium text-[var(--beacon-warm)]">
              Ethereum
            </span>
            <span
              className="text-[10px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--type-faint)",
              }}
            >
              ETH/USDT
            </span>
          </div>
          <div className="font-display mt-2 text-3xl font-medium tabular-numbers leading-none text-[var(--type-ink)]">
            {ethPrice > 0
              ? `$${ethPrice.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`
              : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Detecta cambios en `value` y devuelve true por 600ms. Sirve para gatillar
 *  un highlight visual cuando una métrica cambia. */
function usePulseOnChange<T>(value: T): boolean {
  const [pulsing, setPulsing] = useState(false);
  const previousRef = useRef<T>(value);
  useEffect(() => {
    if (previousRef.current !== value) {
      previousRef.current = value;
      setPulsing(true);
      const id = setTimeout(() => setPulsing(false), 600);
      return () => clearTimeout(id);
    }
  }, [value]);
  return pulsing;
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
  const pulse = usePulseOnChange(n);
  return (
    <span className="flex items-baseline gap-2">
      <span
        className={`font-mono text-base font-medium ${tone} ${pulse ? "value-flash" : ""}`}
      >
        {n}
      </span>
      <span className="text-[var(--type-mute)]">{label}</span>
    </span>
  );
}

/** Calcula scans/seg basado en el delta de `opportunitiesScanned` sobre una
 *  ventana móvil de los últimos N snapshots SSE. */
function useThroughput(opportunitiesScanned: number | undefined): number {
  const samplesRef = useRef<Array<{ ts: number; scans: number }>>([]);
  const [rate, setRate] = useState(0);
  useEffect(() => {
    if (opportunitiesScanned === undefined) return;
    const now = Date.now();
    const samples = samplesRef.current;
    samples.push({ ts: now, scans: opportunitiesScanned });
    // Mantener ventana de los últimos 5s
    const cutoff = now - 5000;
    while (samples.length > 0 && samples[0].ts < cutoff) samples.shift();
    if (samples.length >= 2) {
      const first = samples[0];
      const last = samples[samples.length - 1];
      const elapsedSec = (last.ts - first.ts) / 1000;
      const deltaScans = last.scans - first.scans;
      setRate(elapsedSec > 0 ? deltaScans / elapsedSec : 0);
    }
  }, [opportunitiesScanned]);
  return rate;
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
              ? "text-[var(--signal-up)]"
              : profit < 0
                ? "text-[var(--signal-down)]"
                : "text-[var(--type-mute)]"
            : "text-[var(--type-faint)]"
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
              ? "text-[var(--signal-down)]"
              : "text-[var(--type-mute)]"
            : "text-[var(--type-faint)]"
        }
        subtitle="Lo que daría un bot retail"
      />
      <StatCard
        label="Precisión de decisión"
        value={counters ? `${captureRate.toFixed(0)}%` : "—"}
        valueClass="text-[var(--signal-up)]"
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
        valueClass={advantage > 0 ? "text-[var(--signal-up)]" : "text-[var(--type-mute)]"}
        subtitle={
          naive
            ? `Naive ejecutó ${naiveTrades} trades · perdió $${Math.abs(naiveLoss).toFixed(2)}`
            : "Misma data, fees retail (0.5%)"
        }
      />
      <StatCard
        label="Perdido por cooldown"
        value={counters ? `$${lostOpp.toFixed(2)}` : "—"}
        valueClass="text-[var(--beacon)]"
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
        valueClass="text-[var(--type-ink)]"
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
        <span className="shrink-0 self-start rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--signal-up)]">
          Modelo de costos 4-stack
        </span>
        <p className="text-sm leading-relaxed text-[var(--type-mute)] sm:text-[15px]">
          Faro descuenta{" "}
          <span className="text-[var(--type-ink)]">fees de trading</span> +{" "}
          <span className="text-[var(--type-ink)]">retiro amortizado</span> +{" "}
          <span className="text-[var(--type-ink)]">slippage estimado</span> +{" "}
          <span className="text-[var(--type-ink)]">latencia de red</span> en cada
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
    <div
      className="instrument-frame glass p-5 transition-colors hover:bg-[var(--tide)]/70"
      style={{ borderRadius: "2px" }}
    >
      <div className="caption-nav">{label}</div>
      <div
        className={`font-display mt-4 text-3xl font-medium tabular-numbers leading-none ${valueClass}`}
      >
        {value}
      </div>
      {subtitle ? (
        <div
          className="mt-3 text-xs"
          style={{ color: "var(--type-faint)", fontFamily: "var(--font-mono)" }}
        >
          {subtitle}
        </div>
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
          <div
            className="instrument-frame mt-1 flex h-10 w-10 shrink-0 items-center justify-center border"
            style={{
              borderColor: "var(--foam)",
              background: "var(--abyss)",
              color: "var(--beacon)",
            }}
          >
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <div
              className="caption-nav mb-2"
              style={{ color: "var(--beacon-warm)" }}
            >
              {eyebrow}
            </div>
          ) : null}
          <h2
            className="font-display text-2xl font-medium tracking-tight sm:text-3xl"
            style={{ color: "var(--type-ink)" }}
          >
            {title}
          </h2>
          {subtitle ? (
            <p
              className="mt-1 text-sm leading-relaxed"
              style={{ color: "var(--type-mute)" }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

/* RadarScanner — visualización tipo sonar/radar marino que comunica la idea
   de "escanear oportunidades en el mar de precios". El sweep gira en 4s; cada
   exchange es un nodo fijo en los anillos; cuando aparecen oportunidades
   profitables nuevas, los pings pulsan más intensamente. */
function RadarScanner({
  scansPerSec,
  profitableCount,
}: {
  scansPerSec: number | undefined;
  profitableCount: number;
}) {
  const throughput = useThroughput(scansPerSec);
  return (
    <div
      className="instrument-frame mb-6 flex flex-col items-stretch gap-6 p-5 sm:flex-row sm:items-center"
      style={{
        borderRadius: "2px",
        background:
          "linear-gradient(180deg, rgba(15,29,58,0.6) 0%, rgba(10,20,41,0.7) 100%)",
        border: "1px solid var(--foam)",
      }}
    >
      {/* Radar SVG */}
      <div className="relative h-[180px] w-[180px] shrink-0 self-center">
        <svg
          viewBox="0 0 200 200"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f7931a" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#f7931a" stopOpacity="0" />
            </radialGradient>
            <linearGradient
              id="sweep-grad"
              x1="0%"
              y1="50%"
              x2="100%"
              y2="50%"
            >
              <stop offset="0%" stopColor="#f7931a" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f7931a" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Glow del centro */}
          <circle cx="100" cy="100" r="95" fill="url(#radar-glow)" />
          {/* Anillos concéntricos */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="var(--foam)"
            strokeWidth="0.6"
          />
          <circle
            cx="100"
            cy="100"
            r="65"
            fill="none"
            stroke="var(--foam)"
            strokeWidth="0.5"
            strokeDasharray="2 3"
          />
          <circle
            cx="100"
            cy="100"
            r="40"
            fill="none"
            stroke="var(--foam)"
            strokeWidth="0.5"
            strokeDasharray="2 3"
          />
          <circle
            cx="100"
            cy="100"
            r="15"
            fill="none"
            stroke="var(--mist)"
            strokeWidth="0.5"
          />
          {/* Cruz de coordenadas */}
          <line
            x1="100"
            y1="10"
            x2="100"
            y2="190"
            stroke="var(--foam)"
            strokeWidth="0.4"
          />
          <line
            x1="10"
            y1="100"
            x2="190"
            y2="100"
            stroke="var(--foam)"
            strokeWidth="0.4"
          />
          {/* Nodos fijos: los 3 exchanges en posiciones cardinales */}
          <g>
            {/* Binance — arriba derecha */}
            <circle cx="155" cy="55" r="3" fill="var(--beacon)" />
            <text
              x="160"
              y="50"
              fontSize="7"
              fill="var(--type-mute)"
              fontFamily="var(--font-mono)"
            >
              BIN
            </text>
            {/* Coinbase — abajo derecha */}
            <circle cx="150" cy="150" r="3" fill="var(--beacon)" />
            <text
              x="155"
              y="148"
              fontSize="7"
              fill="var(--type-mute)"
              fontFamily="var(--font-mono)"
            >
              CB
            </text>
            {/* Kraken — izquierda */}
            <circle cx="40" cy="100" r="3" fill="var(--beacon)" />
            <text
              x="14"
              y="98"
              fontSize="7"
              fill="var(--type-mute)"
              fontFamily="var(--font-mono)"
            >
              KRK
            </text>
          </g>
          {/* Sonar ping del centro */}
          <circle
            cx="100"
            cy="100"
            r="20"
            fill="none"
            stroke="var(--beacon)"
            strokeWidth="1"
            opacity="0"
            className="sonar-ping"
            style={{ transformOrigin: "100px 100px" }}
          />
          {/* Sweep rotando — cono de radar */}
          <g
            className="radar-sweep"
            style={{ transformOrigin: "100px 100px", transformBox: "fill-box" }}
          >
            <path
              d="M 100 100 L 195 75 A 95 95 0 0 1 195 125 Z"
              fill="url(#sweep-grad)"
            />
            <line
              x1="100"
              y1="100"
              x2="195"
              y2="100"
              stroke="var(--beacon)"
              strokeWidth="1"
              opacity="0.6"
            />
          </g>
          {/* Centro */}
          <circle cx="100" cy="100" r="2" fill="var(--beacon-warm)" />
        </svg>
      </div>

      {/* Lecturas del instrumento */}
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:gap-8">
        <div>
          <div className="caption-nav">Throughput</div>
          <div
            className="font-display mt-2 text-3xl font-medium tabular-numbers leading-none"
            style={{ color: "var(--type-ink)" }}
          >
            {throughput.toFixed(1)}
            <span
              className="ml-1 text-base"
              style={{ color: "var(--type-faint)" }}
            >
              scans/s
            </span>
          </div>
          <div
            className="mt-2 text-[10px]"
            style={{ color: "var(--type-faint)", fontFamily: "var(--font-mono)" }}
          >
            ventana móvil de 5s
          </div>
        </div>
        <div>
          <div className="caption-nav">Detecciones rentables</div>
          <div
            className="font-display mt-2 text-3xl font-medium tabular-numbers leading-none"
            style={{ color: "var(--beacon)" }}
          >
            {profitableCount.toLocaleString()}
          </div>
          <div
            className="mt-2 text-[10px]"
            style={{ color: "var(--type-faint)", fontFamily: "var(--font-mono)" }}
          >
            netas tras el modelo de costos
          </div>
        </div>
        <div className="hidden flex-1 sm:block">
          <div className="caption-nav">Estado del barrido</div>
          <div
            className="font-display mt-2 text-xl italic leading-tight"
            style={{ color: "var(--type-mute)" }}
          >
            “El faro escanea sin descanso.<br />
            Lo que ilumina es lo que sobrevive.”
          </div>
        </div>
      </div>
    </div>
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
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--type-mute)]">
          {PAIR_LABEL[pair]} · {pair}
        </h2>
        <div className="font-mono text-xs tabular-numbers text-[var(--type-mute)]">
          <span className={profit >= 0 ? "text-[var(--signal-up)]" : "text-[var(--signal-down)]"}>
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
      <div className="glass rounded-2xl p-6 text-sm text-[var(--type-mute)]">
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
        valueClass="text-[var(--signal-up)]"
      />
      <MetricBox
        label="Neto promedio / trade"
        value={
          stats.totalTrades > 0
            ? `${avgNet >= 0 ? "+" : ""}$${avgNet.toFixed(4)}`
            : "—"
        }
        subtitle={`${stats.totalTrades} ejecutadas`}
        valueClass={avgNet >= 0 ? "text-[var(--signal-up)]" : "text-[var(--signal-down)]"}
      />
      <MetricBox
        label="Mejor ruta"
        value={best ? `+$${best.totalProfit.toFixed(2)}` : "—"}
        subtitle={best ? `${best.route} · ${best.count} trades` : "sin datos"}
        valueClass="text-[var(--signal-up)]"
      />
      <MetricBox
        label="Latencia eval"
        value={`${latency.toFixed(2)} ms`}
        subtitle="promedio por ticker procesado"
        valueClass="text-[var(--type-ink)]"
      />
    </div>
  );
}

function FintechPanel({ fintech }: { fintech: FintechMetrics | undefined }) {
  if (!fintech) {
    return (
      <div className="glass rounded-2xl p-6 text-sm text-[var(--type-mute)]">
        Computando métricas fintech…
      </div>
    );
  }

  // Sharpe: > 1 bueno, > 2 muy bueno, > 3 excelente
  const sharpeColor =
    fintech.sharpeRatio > 2
      ? "text-[var(--signal-up)]"
      : fintech.sharpeRatio > 1
        ? "text-[var(--signal-up)]"
        : fintech.sharpeRatio > 0
          ? "text-[var(--beacon)]"
          : "text-[var(--type-mute)]";

  // Profit factor: > 1 ganador, > 2 muy bueno, > 3 excelente
  const pfColor =
    !Number.isFinite(fintech.profitFactor) || fintech.profitFactor > 2
      ? "text-[var(--signal-up)]"
      : fintech.profitFactor > 1
        ? "text-[var(--signal-up)]"
        : fintech.profitFactor > 0
          ? "text-[var(--beacon)]"
          : "text-[var(--type-mute)]";

  // Latencia: < 1ms excelente, < 5ms bueno, > 10ms alarma
  const p99Color =
    fintech.evalLatencyP99 < 1
      ? "text-[var(--signal-up)]"
      : fintech.evalLatencyP99 < 5
        ? "text-[var(--signal-up)]"
        : fintech.evalLatencyP99 < 10
          ? "text-[var(--beacon)]"
          : "text-[var(--signal-down)]";

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
              ? "text-[var(--signal-up)]"
              : "text-[var(--type-mute)]"
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
              ? "text-[var(--signal-up)]"
              : fintech.winRate > 0.5
                ? "text-[var(--beacon)]"
                : "text-[var(--type-mute)]"
          }
        />
      </div>

      {/* Latency percentiles */}
      <div className="glass rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--signal-up)]">
          <Timer className="h-3.5 w-3.5" />
          Eval latency · percentiles
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--type-mute)]">
              p50
            </div>
            <div className="mt-1 font-mono text-xl font-semibold tabular-numbers text-[var(--type-ink)]">
              {fintech.evalLatencyP50.toFixed(3)} ms
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--type-mute)]">
              p95
            </div>
            <div
              className={`mt-1 font-mono text-xl font-semibold tabular-numbers ${
                fintech.evalLatencyP95 < 5 ? "text-[var(--type-ink)]" : "text-[var(--beacon)]"
              }`}
            >
              {fintech.evalLatencyP95.toFixed(3)} ms
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--type-mute)]">
              p99
            </div>
            <div
              className={`mt-1 font-mono text-xl font-semibold tabular-numbers ${p99Color}`}
            >
              {fintech.evalLatencyP99.toFixed(3)} ms
            </div>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-[var(--type-faint)]">
          Tiempo desde llegada del tick hasta decisión completa · ring buffer de
          últimas 1000 muestras
        </div>
      </div>

      {/* Alpha decay */}
      <div className="glass rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--signal-up)]">
          <Activity className="h-3.5 w-3.5" />
          Alpha decay · vida útil de oportunidades
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--type-mute)]">
              avg lifetime
            </div>
            <div className="mt-1 font-mono text-xl font-semibold tabular-numbers text-[var(--type-ink)]">
              {fintech.avgOpportunityLifetimeMs > 1000
                ? `${(fintech.avgOpportunityLifetimeMs / 1000).toFixed(2)}s`
                : `${fintech.avgOpportunityLifetimeMs.toFixed(0)}ms`}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--type-mute)]">
              p95 lifetime
            </div>
            <div className="mt-1 font-mono text-xl font-semibold tabular-numbers text-[var(--type-ink)]">
              {fintech.p95OpportunityLifetimeMs > 1000
                ? `${(fintech.p95OpportunityLifetimeMs / 1000).toFixed(2)}s`
                : `${fintech.p95OpportunityLifetimeMs.toFixed(0)}ms`}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--type-mute)]">
              samples
            </div>
            <div className="mt-1 font-mono text-xl font-semibold tabular-numbers text-[var(--type-mute)]">
              {fintech.totalOpportunityDeaths.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-[var(--type-faint)]">
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
    <div
      className="instrument-frame glass p-5"
      style={{ borderRadius: "2px" }}
    >
      <div className="caption-nav">{label}</div>
      <div
        className={`font-display mt-3.5 text-2xl font-medium tabular-numbers leading-none ${valueClass}`}
      >
        {value}
      </div>
      <div
        className="mt-2.5 text-xs"
        style={{ color: "var(--type-faint)", fontFamily: "var(--font-mono)" }}
      >
        {subtitle}
      </div>
    </div>
  );
}

function SurvivalBadge({
  prob,
  bucket,
}: {
  prob: number;
  bucket: "high" | "medium" | "low";
}) {
  const cls =
    bucket === "high"
      ? "bg-emerald-500/10 text-[var(--signal-up)]"
      : bucket === "low"
        ? "bg-red-500/10 text-[var(--signal-down)]"
        : "bg-[var(--foam)]/40 text-[var(--type-mute)]";
  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-medium tabular-numbers ${cls}`}
      title={`Survival probability: ${(prob * 100).toFixed(0)}%`}
    >
      {(prob * 100).toFixed(0)}%
    </span>
  );
}

function TobiPanel({
  tobi,
  skippedLowSurvival,
}: {
  tobi: TobiCalibration | undefined;
  skippedLowSurvival: number;
}) {
  if (!tobi) {
    return (
      <div className="glass rounded-2xl p-6 text-sm text-[var(--type-mute)]">
        Inicializando modelo TOBI…
      </div>
    );
  }

  const totalDetected =
    tobi.detectedHigh + tobi.detectedMedium + tobi.detectedLow;

  // Cuando "high" tiene mejor hit rate que "low", el modelo discrimina bien.
  const isCalibrated =
    totalDetected >= 10 && tobi.hitRateHigh > tobi.hitRateLow;

  return (
    <div className="space-y-4">
      {/* Explicación con la fórmula */}
      <div className="glass rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--signal-up)]">
          <Activity className="h-3.5 w-3.5" />
          Cómo funciona
        </div>
        <p className="text-sm leading-relaxed text-[var(--type-ink)]">
          Para cada oportunidad cross-exchange, calculamos el imbalance del
          libro en ambos exchanges:
        </p>
        <div className="mt-3 rounded-xl bg-[var(--abyss)]/60 p-4 font-mono text-xs text-[var(--type-ink)]">
          TOBI = (bidQty − askQty) / (bidQty + askQty)
          <br />
          survivalProb = (TOBI<sub>sell</sub> − TOBI<sub>buy</sub> + 2) / 4
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[var(--type-mute)]">
          Si en el exchange donde compramos hay presión vendedora, el precio va
          a bajar (mejor para nosotros). Si en el exchange donde vendemos hay
          presión compradora, el precio va a subir (mejor para nosotros). Las
          dos cosas juntas hacen que el spread <strong>crezca</strong> y la
          oportunidad <strong>viva más tiempo</strong>.
        </p>
        <p className="mt-2 text-xs text-[var(--type-mute)]">
          El bot bloquea ejecución cuando survivalProb &lt; 0.5. Bloqueadas
          hasta ahora:{" "}
          <span className="font-mono tabular-numbers text-[var(--type-ink)]">
            {skippedLowSurvival.toLocaleString()}
          </span>
        </p>
      </div>

      {/* Calibración por bucket */}
      <div className="glass rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--signal-up)]">
            <Activity className="h-3.5 w-3.5" />
            Calibración en vivo
          </div>
          {totalDetected < 10 ? (
            <span className="text-[10px] uppercase tracking-wide text-[var(--type-mute)]">
              Acumulando muestras ({totalDetected}/10)
            </span>
          ) : isCalibrated ? (
            <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-[var(--signal-up)]">
              Modelo discrimina
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-[var(--beacon)]">
              Pendiente de validación
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <TobiBucketCard
            bucket="high"
            label="prob ≥ 0.6"
            detected={tobi.detectedHigh}
            survived={tobi.survivedHigh}
            hitRate={tobi.hitRateHigh}
          />
          <TobiBucketCard
            bucket="medium"
            label="0.4 – 0.6"
            detected={tobi.detectedMedium}
            survived={tobi.survivedMedium}
            hitRate={tobi.hitRateMedium}
          />
          <TobiBucketCard
            bucket="low"
            label="prob ≤ 0.4"
            detected={tobi.detectedLow}
            survived={tobi.survivedLow}
            hitRate={tobi.hitRateLow}
          />
        </div>
        <p className="mt-3 text-[11px] text-[var(--type-mute)]">
          <strong className="text-[var(--type-mute)]">Lectura:</strong> hit rate = % de
          oportunidades que sobrevivieron &gt; 1s antes de morir. Si el bucket
          "high" supera al "low", el modelo discrimina correctamente.{" "}
          <span className="text-[var(--type-faint)]">
            Es la prueba científica de que la señal funciona — sin papers,
            con datos en vivo.
          </span>
        </p>
      </div>
    </div>
  );
}

function TobiBucketCard({
  bucket,
  label,
  detected,
  survived,
  hitRate,
}: {
  bucket: "high" | "medium" | "low";
  label: string;
  detected: number;
  survived: number;
  hitRate: number;
}) {
  const titleCls =
    bucket === "high"
      ? "text-[var(--signal-up)]"
      : bucket === "low"
        ? "text-[var(--signal-down)]"
        : "text-[var(--type-mute)]";
  const valueCls =
    detected === 0
      ? "text-[var(--type-faint)]"
      : bucket === "high"
        ? "text-[var(--signal-up)]"
        : bucket === "low"
          ? "text-[var(--signal-down)]"
          : "text-[var(--type-ink)]";

  return (
    <div className="rounded-xl bg-[var(--abyss)]/50 p-4">
      <div
        className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${titleCls}`}
      >
        {bucket}
      </div>
      <div className="mt-1 text-[10px] text-[var(--type-mute)]">{label}</div>
      <div
        className={`mt-3 font-mono text-2xl font-semibold tabular-numbers leading-none ${valueCls}`}
      >
        {detected === 0 ? "—" : `${(hitRate * 100).toFixed(0)}%`}
      </div>
      <div className="mt-2 text-[10px] text-[var(--type-mute)]">
        <span className="font-mono tabular-numbers text-[var(--type-mute)]">
          {survived}
        </span>
        {" / "}
        <span className="font-mono tabular-numbers text-[var(--type-mute)]">
          {detected}
        </span>{" "}
        sobrevivieron &gt; 1s
      </div>
    </div>
  );
}

function KellyPanel({ kelly }: { kelly: KellyMetrics | undefined }) {
  if (!kelly) {
    return (
      <div className="glass rounded-2xl p-6 text-sm text-[var(--type-mute)]">
        Inicializando Kelly Criterion…
      </div>
    );
  }

  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const fmtRatio = (n: number) =>
    Number.isFinite(n) ? n.toFixed(2) : "∞";
  const fmtUSD = (n: number) =>
    `$${n.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  return (
    <div className="space-y-4">
      {/* Cómo funciona */}
      <div className="glass rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--signal-up)]">
          <Sparkles className="h-3.5 w-3.5" />
          Cómo funciona
        </div>
        <p className="text-sm leading-relaxed text-[var(--type-ink)]">
          Fórmula clásica de Kelly: dado un win rate{" "}
          <span className="font-mono text-[var(--type-ink)]">p</span> y un ratio de
          ganancia/pérdida <span className="font-mono text-[var(--type-ink)]">b</span>,
          la fracción óptima del bankroll para arriesgar es:
        </p>
        <div className="mt-3 rounded-xl bg-[var(--abyss)]/60 p-4 font-mono text-xs text-[var(--type-ink)]">
          f* = (p · b − q) / b{"   "}donde q = 1 − p
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[var(--type-mute)]">
          Kelly completo tiene varianza brutal en la práctica. Aplicamos{" "}
          <strong>Fractional Kelly (25%)</strong> y cappeamos al{" "}
          <strong>20% del bankroll</strong> por trade. Hasta los primeros 10
          trades válidos usamos una fracción default conservadora (10%) para
          no apostar sobre estadísticas inestables.
        </p>
      </div>

      {/* Métricas en vivo */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricBox
          label="Position size actual"
          value={fmtUSD(kelly.currentPositionSizeUSDT)}
          subtitle={
            kelly.isReliable
              ? `${fmtPct(kelly.fractionalKelly)} del portfolio`
              : "cold start (10% default)"
          }
          valueClass={
            kelly.currentPositionSizeUSDT > 0
              ? "text-[var(--signal-up)]"
              : "text-[var(--type-mute)]"
          }
        />
        <MetricBox
          label="Fractional Kelly"
          value={fmtPct(kelly.fractionalKelly)}
          subtitle={`f* = ${kelly.fullKelly.toFixed(3)} (raw)`}
          valueClass={
            kelly.fractionalKelly === 0
              ? "text-[var(--signal-down)]"
              : kelly.fractionalKelly >= 0.15
                ? "text-[var(--signal-up)]"
                : "text-[var(--type-ink)]"
          }
        />
        <MetricBox
          label="Win probability"
          value={kelly.samples > 0 ? fmtPct(kelly.winProb) : "—"}
          subtitle={`${kelly.samples} trades válidos`}
          valueClass={
            kelly.winProb > 0.5 ? "text-[var(--signal-up)]" : "text-[var(--type-ink)]"
          }
        />
        <MetricBox
          label="Edge ratio (b)"
          value={kelly.samples > 0 ? fmtRatio(kelly.edgeRatio) : "—"}
          subtitle="avg_win / |avg_loss|"
          valueClass={
            Number.isFinite(kelly.edgeRatio) && kelly.edgeRatio > 1
              ? "text-[var(--signal-up)]"
              : "text-[var(--type-ink)]"
          }
        />
      </div>

      {!kelly.isReliable && (
        <div className="rounded-xl bg-amber-500/5 px-4 py-3 text-xs text-[var(--beacon-warm)]/90">
          Modelo aún no calibrado — usando fracción default (10%) hasta
          acumular ≥ 10 trades. Esto evita decisiones agresivas sobre
          estadísticas inestables.
        </div>
      )}
    </div>
  );
}

function BayesianPanel({
  bayesian,
}: {
  bayesian: BayesianSlippageMetrics | undefined;
}) {
  if (!bayesian) {
    return (
      <div className="glass rounded-2xl p-6 text-sm text-[var(--type-mute)]">
        Inicializando estimador Bayesiano…
      </div>
    );
  }

  const totalSamples =
    bayesian.binance.samples +
    bayesian.coinbase.samples +
    bayesian.kraken.samples;

  return (
    <div className="space-y-4">
      {/* Cómo funciona */}
      <div className="glass rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--signal-up)]">
          <Telescope className="h-3.5 w-3.5" />
          Cómo funciona
        </div>
        <p className="text-sm leading-relaxed text-[var(--type-ink)]">
          El detector usa hoy un estimate global de slippage de{" "}
          <span className="font-mono text-[var(--type-ink)]">
            {bayesian.staticEstimateBps} bps
          </span>{" "}
          aplicado por igual a los tres exchanges. Eso es ingenuo: cada exchange
          tiene su propia liquidez. Mantenemos un{" "}
          <strong>posterior Bayesiano por exchange</strong> que se actualiza
          después de cada trade ejecutado:
        </p>
        <div className="mt-3 rounded-xl bg-[var(--abyss)]/60 p-4 font-mono text-xs text-[var(--type-ink)]">
          μ<sub>post</sub> = (σ²<sub>obs</sub>·μ<sub>prior</sub> + σ²
          <sub>prior</sub>·x<sub>obs</sub>) / (σ²<sub>obs</sub> + σ²
          <sub>prior</sub>)
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[var(--type-mute)]">
          A medida que el estimador acumula observaciones, el posterior
          converge al slippage <strong>real</strong> por exchange. En
          producción, este posterior alimentaría el detector reemplazando el
          estimate estático — el modelo de costos pasaría de ingenuo a
          exchange-aware.
        </p>
        <p className="mt-2 text-xs text-[var(--type-mute)]">
          Observaciones totales acumuladas:{" "}
          <span className="font-mono tabular-numbers text-[var(--type-ink)]">
            {totalSamples.toLocaleString()}
          </span>
        </p>
      </div>

      {/* Posteriors por exchange */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <BayesianExchangeCard
          exchange="binance"
          label="Binance.US"
          posterior={bayesian.binance}
          staticBps={bayesian.staticEstimateBps}
        />
        <BayesianExchangeCard
          exchange="coinbase"
          label="Coinbase"
          posterior={bayesian.coinbase}
          staticBps={bayesian.staticEstimateBps}
        />
        <BayesianExchangeCard
          exchange="kraken"
          label="Kraken"
          posterior={bayesian.kraken}
          staticBps={bayesian.staticEstimateBps}
        />
      </div>

      <p className="text-[11px] text-[var(--type-mute)]">
        <strong className="text-[var(--type-mute)]">Lectura:</strong> el bot necesita
        acumular trades reales para converger. Si el modelo está aprendiendo,
        verás los posteriors moverse desde 5 bps (prior) hacia valores
        diferenciados por exchange. La columna "Δ vs estático" cuantifica
        cuánto mejoraría el detector si lo conectáramos.
      </p>
    </div>
  );
}

function BayesianExchangeCard({
  label,
  posterior,
  staticBps,
}: {
  exchange: "binance" | "coinbase" | "kraken";
  label: string;
  posterior: { mean: number; variance: number; samples: number };
  staticBps: number;
}) {
  const stddev = Math.sqrt(posterior.variance);
  const delta = posterior.mean - staticBps;
  const deltaSign = delta >= 0 ? "+" : "";
  const isConverged = posterior.samples >= 10;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--type-mute)]">
          {label}
        </div>
        {isConverged ? (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-[var(--signal-up)]">
            converging
          </span>
        ) : (
          <span className="rounded-full bg-[var(--foam)]/40 px-2 py-0.5 text-[10px] font-medium text-[var(--type-mute)]">
            cold start
          </span>
        )}
      </div>
      <div className="mt-3 font-mono text-2xl font-semibold tabular-numbers leading-none text-[var(--type-ink)]">
        {posterior.mean.toFixed(2)}
        <span className="ml-1 text-sm text-[var(--type-mute)]">bps</span>
      </div>
      <div className="mt-2 text-[10px] text-[var(--type-mute)]">
        posterior mean · σ ={" "}
        <span className="font-mono tabular-numbers text-[var(--type-mute)]">
          {stddev.toFixed(2)}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[var(--foam)] pt-3">
        <span className="text-[10px] uppercase tracking-wide text-[var(--type-mute)]">
          samples
        </span>
        <span className="font-mono tabular-numbers text-xs text-[var(--type-ink)]">
          {posterior.samples.toLocaleString()}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-[var(--type-mute)]">
          Δ vs estático
        </span>
        <span
          className={`font-mono tabular-numbers text-xs ${
            Math.abs(delta) < 0.5
              ? "text-[var(--type-mute)]"
              : delta > 0
                ? "text-[var(--beacon)]"
                : "text-[var(--signal-up)]"
          }`}
        >
          {posterior.samples === 0
            ? "—"
            : `${deltaSign}${delta.toFixed(2)} bps`}
        </span>
      </div>
    </div>
  );
}

function DecisionsPanel({ counters }: { counters: ScanCounters | undefined }) {
  if (!counters) {
    return (
      <div className="glass rounded-2xl p-6 text-sm text-[var(--type-mute)]">
        —
      </div>
    );
  }
  const totalSkipped =
    counters.skippedSuspicious +
    counters.skippedStaleData +
    counters.skippedCooldown +
    counters.skippedInsufficientCapital +
    counters.skippedLowSurvival;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <SkipBox
        label="Cooldown"
        value={counters.skippedCooldown}
        color="text-[var(--beacon)]"
        subtitle="throttle 3s por par"
      />
      <SkipBox
        label="Bajo TOBI"
        value={counters.skippedLowSurvival}
        color="text-[var(--beacon-warm)]"
        subtitle="señal predice muerte"
      />
      <SkipBox
        label="Sospechosa"
        value={counters.skippedSuspicious}
        color="text-[var(--signal-down)]"
        subtitle="spread > 2% (breaker)"
      />
      <SkipBox
        label="Data vieja"
        value={counters.skippedStaleData}
        color="text-[var(--type-mute)]"
        subtitle="ticker > 60s viejo"
      />
      <SkipBox
        label="Sin capital"
        value={counters.skippedInsufficientCapital}
        color="text-[var(--type-mute)]"
        subtitle="wallet agotado"
      />
      <div className="col-span-2 glass rounded-2xl p-4 lg:col-span-5">
        <div className="flex items-baseline justify-between">
          <div className="text-xs uppercase tracking-wide text-[var(--type-mute)]">
            Total de rentables descartadas
          </div>
          <div className="font-mono text-xs text-[var(--type-mute)] tabular-numbers">
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
      <div className="glass rounded-2xl p-6 text-sm text-[var(--type-mute)]">
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
          valueClass={risk.maxDrawdownUSD > 0 ? "text-[var(--signal-down)]" : "text-[var(--signal-up)]"}
        />
        <MetricBox
          label="Desbalance de wallet"
          value={`${(risk.walletImbalance * 100).toFixed(1)}%`}
          subtitle="desv std / media de USD/exchange"
          valueClass={risk.walletImbalance > 0.2 ? "text-[var(--beacon)]" : "text-[var(--signal-up)]"}
        />
        <MetricBox
          label="Capital desplegado"
          value={`${(risk.capitalDeployedPercent * 100).toFixed(1)}%`}
          subtitle="vol trade / USDT inicial"
          valueClass="text-[var(--type-ink)]"
        />
        <MetricBox
          label="Circuit breaker"
          value="ACTIVO"
          subtitle="rechaza spreads > 2%"
          valueClass="text-[var(--signal-up)]"
        />
      </div>
      <div className="glass rounded-2xl p-4">
        <div className="mb-3 text-xs uppercase tracking-wide text-[var(--type-mute)]">
          Exposición por exchange
        </div>
        <div className="space-y-2">
          {risk.exposureByExchange.map((e) => (
            <div key={e.exchange} className="flex items-center gap-3">
              <span className="w-24 text-xs uppercase text-[var(--type-mute)]">
                {EXCHANGE_LABEL[e.exchange]}
              </span>
              <div className="flex-1 overflow-hidden rounded-full bg-[var(--tide)]">
                <div
                  className="h-2 bg-emerald-500/70"
                  style={{ width: `${e.pctOfPortfolio * 100}%` }}
                />
              </div>
              <span className="w-20 text-right font-mono text-xs tabular-numbers text-[var(--type-ink)]">
                {(e.pctOfPortfolio * 100).toFixed(1)}%
              </span>
              <span className="w-28 text-right font-mono text-xs tabular-numbers text-[var(--type-mute)]">
                $
                {e.usdValue.toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </span>
              <span className="w-28 text-right font-mono text-[10px] tabular-numbers text-[var(--type-faint)]">
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
        <span className="text-[var(--type-mute)]">
          {newestAgeSec === null
            ? "Esperando primera decisión rentable…"
            : newestAgeSec < 60
              ? `Última decisión hace ${newestAgeSec.toFixed(0)}s · el bot sigue escaneando ~5,000 oportunidades/min en background.`
              : `Última decisión hace ${(newestAgeSec / 60).toFixed(1)} min. El mercado está quieto pero el bot sigue escaneando miles de oportunidades por minuto — solo registra decisiones cuando aparece una rentable.`}
        </span>
      </div>
      {decisions.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-center text-sm text-[var(--type-mute)]">
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
                  <span className="w-16 text-right text-[var(--type-faint)] tabular-numbers">
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
                  <span className="w-32 text-[var(--type-ink)]">{d.route}</span>
                  <span
                    className={`w-20 text-right tabular-numbers ${d.outcome === "executed" ? "text-[var(--signal-up)]" : "text-[var(--type-mute)]"}`}
                  >
                    {d.netProfit >= 0 ? "+" : ""}${d.netProfit.toFixed(3)}
                  </span>
                  <span className="flex-1 truncate text-[var(--type-mute)]">
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
      <div className="glass rounded-2xl p-6 text-sm text-[var(--type-mute)]">
        Cost breakdown appears after the first executed trade.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <CostBox
        label="Fees de trading"
        value={stats.totalTradingFees}
        color="text-[var(--signal-down)]"
        sub="taker × 2 lados"
      />
      <CostBox
        label="Retiro (amortizado)"
        value={stats.totalAmortizedWithdrawal}
        color="text-[var(--beacon)]"
        sub="÷ 100 trades/rebalance"
      />
      <CostBox
        label="Slippage estimado"
        value={stats.totalEstimatedSlippage}
        color="text-[var(--beacon)]"
        sub="0.002% × valor del trade"
      />
      <CostBox
        label="Costo de latencia"
        value={stats.totalLatencyCost}
        color="text-[var(--beacon)]"
        sub="0.001% × valor del trade"
      />
      <CostBox
        label="Costo total all-in"
        value={stats.totalCosts}
        color="text-[var(--type-ink)]"
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
    <div
      className="instrument-frame glass p-4"
      style={{ borderRadius: "2px" }}
    >
      <div className="caption-nav">{label}</div>
      <div
        className={`font-display mt-3 text-xl font-medium tabular-numbers leading-none ${color}`}
      >
        ${value.toFixed(2)}
      </div>
      <div
        className="mt-2 text-[10px]"
        style={{ color: "var(--type-faint)", fontFamily: "var(--font-mono)" }}
      >
        {sub}
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
    <div
      className="instrument-frame glass p-4"
      style={{ borderRadius: "2px" }}
    >
      <div className="caption-nav">{label}</div>
      <div
        className={`font-display mt-3 text-xl font-medium tabular-numbers leading-none ${color}`}
      >
        {value.toLocaleString()}
      </div>
      <div
        className="mt-2 text-[10px]"
        style={{ color: "var(--type-faint)", fontFamily: "var(--font-mono)" }}
      >
        {subtitle}
      </div>
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
      className={`glass !rounded-2xl text-[var(--type-ink)] ${isStale ? "opacity-50" : ""}`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium uppercase tracking-wide text-[var(--type-mute)]">
          <span>{EXCHANGE_LABEL[exchange]}</span>
          {isStale ? (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium normal-case text-[var(--beacon)]">
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
          colorOnFresh={isStale ? "text-[var(--type-mute)]" : "text-[var(--signal-up)]"}
        />
        <PriceRow
          label="ask"
          value={ticker?.ask}
          colorOnFresh={isStale ? "text-[var(--type-mute)]" : "text-[var(--signal-down)]"}
        />
        <div className="flex flex-wrap justify-between gap-2 pt-2 text-xs text-[var(--type-mute)]">
          <span>
            spread{" "}
            {ticker ? `$${(ticker.ask - ticker.bid).toFixed(2)}` : "—"}
          </span>
          {exchangeStats ? (
            <span className="flex items-center gap-2">
              <span title="Tasa de mensajes WebSocket">
                <span className="text-[var(--type-ink)]">
                  {exchangeStats.ticksPerSecond.toFixed(1)}
                </span>{" "}
                msg/s
              </span>
              {exchangeStats.networkLatencyMs > 0 ? (
                <span
                  title="RTT real medido vía REST ping cada 30s"
                  className="border-l border-[var(--foam)] pl-2"
                >
                  <span className="text-[var(--type-ink)]">
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
      <span className="text-xs uppercase text-[var(--type-mute)]">{label}</span>
      <span
        className={`text-xl font-semibold ${value ? colorOnFresh : "text-[var(--type-faint)]"} lg:text-2xl`}
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
    <Card className="glass !rounded-2xl text-[var(--type-ink)]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium uppercase tracking-wide text-[var(--type-mute)]">
          <span>{EXCHANGE_LABEL[exchange]}</span>
          <span className="font-mono text-xs tabular-numbers text-[var(--type-mute)] normal-case">
            ≈ $
            {totalUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 font-mono tabular-numbers">
        <BalanceRow
          label="USDT"
          value={wallet?.usdt}
          color="text-[var(--type-ink)]"
          decimals={2}
        />
        <BalanceRow
          label="BTC"
          value={wallet?.btc}
          color="text-[var(--beacon)]"
          decimals={6}
        />
        <BalanceRow
          label="ETH"
          value={wallet?.eth}
          color="text-[var(--beacon-warm)]"
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
      <span className="text-xs uppercase text-[var(--type-mute)]">{label}</span>
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
      <div className="glass rounded-2xl p-8 text-center text-sm text-[var(--type-mute)]">
        La curva de equity aparecerá cuando alguno de los bots ejecute su
        primer trade.
      </div>
    );
  }

  const finalFaro = data[data.length - 1].faro;
  const finalNaive = data[data.length - 1].naive;
  const gap = finalFaro - finalNaive;

  return (
    <div
      className="instrument-frame glass p-4 sm:p-6"
      style={{ borderRadius: "2px" }}
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-[3px] w-5"
              style={{ background: "var(--beacon)" }}
            />
            <span className="font-display text-base font-medium text-[var(--type-ink)]">
              Faro
            </span>
            <span
              className={`font-mono tabular-numbers ${finalFaro >= 0 ? "text-[var(--signal-up)]" : "text-[var(--signal-down)]"}`}
            >
              {finalFaro >= 0 ? "+" : ""}${finalFaro.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-[3px] w-5"
              style={{ background: "var(--signal-down)" }}
            />
            <span className="font-display text-base font-medium text-[var(--type-ink)]">
              Naive
            </span>
            <span
              className={`font-mono tabular-numbers ${finalNaive >= 0 ? "text-[var(--signal-up)]" : "text-[var(--signal-down)]"}`}
            >
              {finalNaive >= 0 ? "+" : ""}${finalNaive.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="caption-nav">gap</span>
          <span className="font-mono text-sm tabular-numbers text-[var(--beacon)]">
            +${gap.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <CartesianGrid strokeDasharray="2 4" stroke="#1b2d4f" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#5d6f8c", fontSize: 11, fontFamily: "var(--font-mono)" }}
              tickLine={{ stroke: "#2a3f64" }}
              axisLine={{ stroke: "#2a3f64" }}
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: "#5d6f8c", fontSize: 11, fontFamily: "var(--font-mono)" }}
              tickLine={{ stroke: "#2a3f64" }}
              axisLine={{ stroke: "#2a3f64" }}
              tickFormatter={(v: number) => `$${v.toFixed(2)}`}
            />
            <Tooltip
              contentStyle={{
                background: "#04081a",
                border: "1px solid #2a3f64",
                borderRadius: 2,
                fontSize: 12,
                fontFamily: "var(--font-mono)",
              }}
              labelStyle={{ color: "#94a3c0" }}
              formatter={(value, name) => [
                `$${Number(value).toFixed(2)}`,
                name === "faro" ? "Faro (inst)" : "Naive (retail)",
              ]}
            />
            <ReferenceLine y={0} stroke="#2a3f64" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="naive"
              stroke="#ef4444"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="3 3"
            />
            <Line
              type="monotone"
              dataKey="faro"
              stroke="#f7931a"
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
      <div className="glass rounded-2xl p-6 text-sm text-[var(--type-mute)]">
        Inicializando comparativa…
      </div>
    );
  }
  const faroNet = faro.totalArbitrageProfit;
  const advantage = faroNet - naive.cumulativeNet;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--signal-up)]">
          <Sparkles className="h-3.5 w-3.5" />
          Faro (institucional)
        </div>
        <div
          className={`mt-2.5 font-mono text-3xl font-semibold tabular-numbers ${faroNet >= 0 ? "text-[var(--signal-up)]" : "text-[var(--signal-down)]"}`}
        >
          {faroNet >= 0 ? "+" : ""}${faroNet.toFixed(2)}
        </div>
        <div className="mt-2 text-xs text-[var(--type-mute)]">
          {faro.totalTrades} trades · filtro por NET tras 4-stack cost model
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--signal-down)]">
          <Skull className="h-3.5 w-3.5" />
          Naive (retail 0.5%)
        </div>
        <div
          className={`mt-2.5 font-mono text-3xl font-semibold tabular-numbers ${naive.cumulativeNet >= 0 ? "text-[var(--signal-up)]" : "text-[var(--signal-down)]"}`}
        >
          {naive.cumulativeNet >= 0 ? "+" : ""}${naive.cumulativeNet.toFixed(2)}
        </div>
        <div className="mt-2 text-xs text-[var(--type-mute)]">
          {naive.totalTrades} trades · filtro solo por GROSS positivo
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-400/10 to-transparent p-5 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--signal-up)]">
          <Swords className="h-3.5 w-3.5" />
          Ventaja Faro
        </div>
        <div className="mt-2.5 font-mono text-3xl font-semibold tabular-numbers text-[var(--signal-up)]">
          {advantage >= 0 ? "+" : ""}${advantage.toFixed(2)}
        </div>
        <div className="mt-2 text-xs text-[var(--signal-up)]/70">
          Diferencia neta sobre el bot retail · mismos datos, mismos exchanges
        </div>
      </div>
    </div>
  );
}

function TradesTable({ trades }: { trades: ExecutedTrade[] }) {
  if (trades.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-sm text-[var(--type-mute)]">
        Aún no se ejecutan trades. Faro observa — solo ejecuta oportunidades
        rentables DESPUÉS de fees. La mayoría son espejismos.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto glass rounded-2xl">
      <table className="w-full text-sm">
        <thead className="bg-[var(--abyss)]/40 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--type-mute)]">
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
              <tr key={t.id} className="border-t border-[var(--foam)]">
                <td className="px-4 py-2 text-[var(--type-mute)]">
                  {new Date(t.timestamp).toLocaleTimeString("en-US", {
                    hour12: false,
                  })}
                </td>
                <td className={`px-4 py-2 ${PAIR_ACCENT[t.pair]}`}>{asset}</td>
                <td className="px-4 py-2 text-[var(--type-ink)]">
                  {t.buyExchange} → {t.sellExchange}
                  {t.partial ? (
                    <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-[var(--beacon)]">
                      partial
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2 text-right text-[var(--type-mute)]">
                  {t.executedVolume.toFixed(6)}
                </td>
                <td className="px-4 py-2 text-right text-[var(--type-mute)]">
                  ${t.grossProfit.toFixed(2)}
                </td>
                <td
                  className="cursor-help px-4 py-2 text-right text-[var(--type-mute)] underline decoration-dotted underline-offset-2"
                  title={costTooltip}
                >
                  ${t.totalCosts.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right font-semibold text-[var(--signal-up)]">
                  +${t.netProfit.toFixed(2)}
                </td>
                <td
                  className={`px-4 py-2 text-right font-semibold ${
                    t.retailNetProfit < 0 ? "text-[var(--signal-down)]" : "text-[var(--type-mute)]"
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
      <div className="glass rounded-2xl p-6 text-center text-xs text-[var(--type-mute)]">
        Esperando oportunidades en este par…
      </div>
    );
  }

  return (
    <div className="overflow-x-auto glass rounded-2xl">
      <table className="w-full text-sm">
        <thead className="bg-[var(--abyss)]/40 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--type-mute)]">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Hora</th>
            <th className="px-4 py-3 text-left font-medium">Ruta</th>
            <th className="px-4 py-3 text-right font-medium">Bruto</th>
            <th className="px-4 py-3 text-right font-medium">Neto (inst)</th>
            <th className="px-4 py-3 text-right font-medium">Neto (retail)</th>
            <th className="px-4 py-3 text-right font-medium">TOBI</th>
            <th className="px-4 py-3 text-right font-medium">Veredicto</th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-numbers">
          {opps.slice(0, 8).map((o, i) => (
            <tr key={i} className="border-t border-[var(--foam)]">
              <td className="px-4 py-2 text-[var(--type-mute)]">
                {new Date(o.timestamp).toLocaleTimeString("en-US", {
                  hour12: false,
                })}
              </td>
              <td className="px-4 py-2 text-[var(--type-ink)]">
                {o.buyExchange} → {o.sellExchange}
              </td>
              <td className="px-4 py-2 text-right text-[var(--type-mute)]">
                ${o.grossProfit.toFixed(2)}
              </td>
              <td
                className={`px-4 py-2 text-right font-semibold ${o.profitable ? "text-[var(--signal-up)]" : "text-[var(--signal-down)]"}`}
              >
                {o.netProfit >= 0 ? "+" : ""}${o.netProfit.toFixed(2)}
              </td>
              <td
                className={`px-4 py-2 text-right ${o.retailNetProfit < 0 ? "text-[var(--signal-down)]" : "text-[var(--type-mute)]"}`}
              >
                {o.retailNetProfit >= 0 ? "+" : ""}$
                {o.retailNetProfit.toFixed(2)}
              </td>
              <td className="px-4 py-2 text-right">
                <SurvivalBadge prob={o.survivalProb} bucket={o.survivalBucket} />
              </td>
              <td className="px-4 py-2 text-right">
                {o.suspicious ? (
                  <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-[var(--beacon)]">
                    SOSPECHOSA
                  </span>
                ) : o.profitable ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-[var(--signal-up)]">
                    RENTABLE
                  </span>
                ) : (
                  <span className="rounded-full bg-[var(--tide)] px-2 py-1 text-xs font-medium text-[var(--type-mute)]">
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
          valueClass="text-[var(--type-ink)]"
        />
        <MetricBox
          label="Rentables detectadas"
          value={profitable.toString()}
          subtitle={`${scanned > 0 ? ((profitable / scanned) * 100).toFixed(0) : 0}% hit rate`}
          valueClass={profitable > 0 ? "text-[var(--signal-up)]" : "text-[var(--type-mute)]"}
        />
        <MetricBox
          label="Trades triangulares ejecutados"
          value={trades.length.toString()}
          subtitle="dentro de un solo exchange"
          valueClass={trades.length > 0 ? "text-[var(--signal-up)]" : "text-[var(--type-mute)]"}
        />
        <MetricBox
          label="P&L triangular"
          value={`${triProfit >= 0 ? "+" : ""}$${triProfit.toFixed(2)}`}
          subtitle={`sobre $1,000 notional/ciclo`}
          valueClass={
            triProfit > 0
              ? "text-[var(--signal-up)]"
              : triProfit < 0
                ? "text-[var(--signal-down)]"
                : "text-[var(--type-mute)]"
          }
        />
      </div>

      {opps.length === 0 ? (
        <div className="glass rounded-2xl p-6 text-center text-sm text-[var(--type-mute)]">
          Esperando los 3 pares (BTC/USDT + ETH/USDT + ETH/BTC) en al menos
          un exchange…
        </div>
      ) : (
        <div className="overflow-x-auto glass rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-[var(--abyss)]/40 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--type-mute)]">
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
                <tr key={i} className="border-t border-[var(--foam)]">
                  <td className="px-4 py-2 text-[var(--type-mute)]">
                    {new Date(o.timestamp).toLocaleTimeString("en-US", {
                      hour12: false,
                    })}
                  </td>
                  <td className="px-4 py-2 text-[var(--type-ink)]">
                    {EXCHANGE_LABEL[o.exchange]}
                  </td>
                  <td className="px-4 py-2 text-[var(--type-ink)]">{o.direction}</td>
                  <td className="px-4 py-2 text-right text-[var(--type-mute)]">
                    ${o.startUSDT.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right text-[var(--type-mute)]">
                    ${o.finalUSDT.toFixed(2)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-semibold ${
                      o.profitable ? "text-[var(--signal-up)]" : "text-[var(--signal-down)]"
                    }`}
                  >
                    {o.netProfit >= 0 ? "+" : ""}${o.netProfit.toFixed(4)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right ${
                      o.profitable ? "text-[var(--signal-up)]" : "text-[var(--signal-down)]"
                    }`}
                  >
                    {(o.netPercent * 100).toFixed(4)}%
                  </td>
                  <td className="px-4 py-2 text-right">
                    {o.profitable ? (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-[var(--signal-up)]">
                        RENTABLE
                      </span>
                    ) : (
                      <span className="rounded-full bg-[var(--tide)] px-2 py-1 text-xs font-medium text-[var(--type-mute)]">
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
          <div className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-[var(--signal-up)]">
            Trades triangulares ejecutados
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-[var(--type-mute)]">
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
                <tr key={t.id} className="border-t border-[var(--foam)]">
                  <td className="px-4 py-2 text-[var(--type-mute)]">
                    {new Date(t.timestamp).toLocaleTimeString("en-US", {
                      hour12: false,
                    })}
                  </td>
                  <td className="px-4 py-2 text-[var(--type-ink)]">
                    {EXCHANGE_LABEL[t.exchange]}
                  </td>
                  <td className="px-4 py-2 text-[var(--type-ink)]">{t.direction}</td>
                  <td className="px-4 py-2 text-right font-semibold text-[var(--signal-up)]">
                    +${t.netProfit.toFixed(4)}
                  </td>
                  <td className="px-4 py-2 text-right text-[var(--type-mute)]">
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
    <footer className="mt-12 space-y-2 border-t border-[var(--foam)] pt-6 text-xs text-[var(--type-mute)]">
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
