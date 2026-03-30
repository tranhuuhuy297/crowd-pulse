import { useCrowdPulseData } from "./hooks/use-crowd-pulse-client-side-data";
import { CrowdPulseScoreCard } from "./components/crowd-pulse-score-card";
import { FearGreedDisplayCard } from "./components/fear-greed-display-card";
import { LiquidationRatioDisplayCard } from "./components/liquidation-ratio-display-card";
import { SymbolPriceGrid } from "./components/symbol-price-grid";
import { DashboardLoadingSkeleton } from "./components/dashboard-loading-skeleton";
import { formatRelativeTime } from "./lib/number-format-utils";

export function App() {
  const { data, loading, error } = useCrowdPulseData(60_000);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CrowdPulse</h1>
            <p className="text-sm text-gray-400">Crypto Crowd Sentiment Analysis</p>
          </div>
        </div>
        {data && (
          <span className="text-xs text-gray-500 hidden sm:block">
            Updated {formatRelativeTime(data.crowdPulse.updatedAt)}
          </span>
        )}
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {loading && !data && <DashboardLoadingSkeleton />}

        {error && !data && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-red-400 font-semibold">Failed to load dashboard</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        )}

        {data && (
          <div className="flex flex-col gap-6">
            {/* Row 1: Score + Fear & Greed */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <CrowdPulseScoreCard
                score={data.crowdPulse.score}
                signal={data.crowdPulse.signal}
                updatedAt={data.crowdPulse.updatedAt}
              />
              <FearGreedDisplayCard
                value={data.fearGreed.value}
                classification={data.fearGreed.classification}
                change24h={data.fearGreed.change24h}
              />
            </div>

            {/* Row 2: Long/Short Ratio */}
            <LiquidationRatioDisplayCard longShort={data.longShort} />

            {/* Row 3: Price grid */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Live Prices</h2>
              <SymbolPriceGrid prices={data.prices} />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800 px-6 py-3 text-center">
        <p className="text-xs text-gray-600">
          {data
            ? `Last updated: ${formatRelativeTime(data.crowdPulse.updatedAt)} · Refreshes every 60s`
            : "Loading..."}
        </p>
      </footer>
    </div>
  );
}
