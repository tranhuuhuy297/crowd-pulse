import { useCrowdPulseData } from "./hooks/use-crowd-pulse-client-side-data";
import { useThemeToggle } from "./hooks/use-theme-toggle";
import { CrowdPulseScoreCard } from "./components/crowd-pulse-score-card";
import { FearGreedDisplayCard } from "./components/fear-greed-display-card";
import { LiquidationRatioDisplayCard } from "./components/liquidation-ratio-display-card";
import { FundingRateDisplayCard } from "./components/funding-rate-display-card";
import { OpenInterestDisplayCard } from "./components/open-interest-display-card";
import { FuturesBasisDisplayCard } from "./components/futures-basis-display-card";
import { TopTraderAndTakerDisplayCard } from "./components/top-trader-and-taker-display-card";
import { SymbolPriceGrid } from "./components/symbol-price-grid";
import { BuyConclusionDisplayCard } from "./components/buy-conclusion-display-card";
import { DashboardLoadingSkeleton } from "./components/dashboard-loading-skeleton";
import { ThemeToggleButton } from "./components/theme-toggle-button";
import { formatRelativeTime } from "./lib/number-format-utils";
import type { DataSourceHealth } from "./lib/types";

/** Health dot: green = all OK, yellow = some failed, red = most failed */
function healthDotColor(health: DataSourceHealth): string {
  const ok = [health.fearGreed, health.prices, health.klines, health.longShort, health.fundingRate, health.openInterest].filter(Boolean).length;
  if (ok === 6) return "bg-green-500";
  if (ok >= 3) return "bg-amber-500 animate-pulse";
  return "bg-red-500 animate-pulse";
}

function failedSources(health: DataSourceHealth): string[] {
  const names: string[] = [];
  if (!health.fearGreed) names.push("Market Sentiment");
  if (!health.prices) names.push("Spot Prices");
  if (!health.klines) names.push("Klines/RSI");
  if (!health.longShort) names.push("Long/Short");
  if (!health.fundingRate) names.push("Funding Rate");
  if (!health.openInterest) names.push("Open Interest");
  return names;
}

export function App() {
  const { data, loading, error, scoreDelta } = useCrowdPulseData(60_000);
  const { theme, toggle: toggleTheme } = useThemeToggle();

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Minimal top bar */}
      <header className="px-4 py-1.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight" style={{ color: "var(--accent)" }}>
            CrowdPulse
          </span>
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>·</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Crypto Sentiment</span>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <>
              <span
                className={`w-1.5 h-1.5 rounded-full ${healthDotColor(data.dataSourceHealth)}`}
                title={
                  failedSources(data.dataSourceHealth).length > 0
                    ? `Failed: ${failedSources(data.dataSourceHealth).join(", ")}`
                    : "All sources OK"
                }
              />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {formatRelativeTime(data.crowdPulse.updatedAt)}
              </span>
            </>
          )}
          <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      {/* Main content — fills remaining space */}
      <main className="flex-1 px-3 pb-2 max-w-7xl mx-auto w-full flex flex-col gap-2 min-h-0">
        {loading && !data && <DashboardLoadingSkeleton />}

        {error && !data && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-red-500 font-semibold">Failed to load dashboard</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error}</p>
          </div>
        )}

        {data && (
          <>
            {/* Row 1: BTC Price + Buy Conclusion side by side */}
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 shrink-0">
              <div className="relative rounded-xl p-2.5 backdrop-blur-sm overflow-visible hover:z-20 focus-within:z-20" style={{ background: "var(--bg-card)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--bg-card-border)" }}>
                <SymbolPriceGrid prices={data.prices} />
              </div>
              {data.buyConclusion && (
                <BuyConclusionDisplayCard conclusion={data.buyConclusion} />
              )}
            </div>

            {/* Row 2: 3-column layout — Score | Metrics | Smart Money */}
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-3 flex-1 min-h-0">
              {/* Col 1: Contrarian Signal */}
              <CrowdPulseScoreCard
                score={data.crowdPulse.score}
                signal={data.crowdPulse.signal}
                updatedAt={data.crowdPulse.updatedAt}
                components={data.crowdPulse.components}
                scoreDelta={scoreDelta}
              />

              {/* Col 2: Core metrics */}
              <div className="flex flex-col gap-2 min-h-0">
                <FearGreedDisplayCard
                  value={data.fearGreed.value}
                  classification={data.fearGreed.classification}
                  change24h={data.fearGreed.change24h}
                  className="flex-1"
                />
                <LiquidationRatioDisplayCard longShort={data.longShort} className="flex-1" />
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <FundingRateDisplayCard fundingRates={data.fundingRates} className="flex-1" />
                  <OpenInterestDisplayCard openInterest={data.openInterest} className="flex-1" />
                </div>
              </div>

              {/* Col 3: Smart money indicators */}
              <div className="flex flex-col gap-2 min-h-0">
                <FuturesBasisDisplayCard futuresBasis={data.futuresBasis} className="flex-1" />
                <TopTraderAndTakerDisplayCard topTrader={data.topTraderLongShort} takerBuySell={data.takerBuySell} className="flex-1" />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Tiny footer */}
      <footer className="px-4 py-1 text-center shrink-0">
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          Fear & Greed Index · Binance Spot & Futures · 60s refresh
        </p>
      </footer>
    </div>
  );
}
