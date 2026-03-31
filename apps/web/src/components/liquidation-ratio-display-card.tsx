import type { LongShortAggregated, LongShortData } from "../lib/types";
import { InfoTooltip } from "./info-tooltip";

interface Props {
  longShort: LongShortAggregated;
  className?: string;
}

/** Convert ratio to long/short percentages */
function ratioToPercentages(ratio: number): { longPct: number; shortPct: number } {
  const longPct = (ratio / (1 + ratio)) * 100;
  return { longPct, shortPct: 100 - longPct };
}

/** Compute average ratio from array, or null if empty */
function avgRatio(data: LongShortData[]): number | null {
  if (data.length === 0) return null;
  return data.reduce((s, d) => s + d.ratio, 0) / data.length;
}

/** Classify bias label from ratio */
function biasLabel(ratio: number): string {
  if (ratio >= 1.5) return "Heavy Long";
  if (ratio >= 1.1) return "Long Bias";
  if (ratio >= 0.9) return "Balanced";
  if (ratio >= 0.7) return "Short Bias";
  return "Heavy Short";
}

/** Bias badge color — heavy long is red (greedy/sell), heavy short is green (fearful/buy) */
function biasStyle(ratio: number): string {
  if (ratio >= 1.5) return "bg-red-500/20 text-red-400 border-red-500/30";
  if (ratio >= 1.1) return "bg-red-500/15 text-red-400 border-red-500/20";
  if (ratio >= 0.9) return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
  if (ratio >= 0.7) return "bg-green-500/15 text-green-400 border-green-500/20";
  return "bg-green-500/20 text-green-400 border-green-500/30";
}

/** Single ratio row with stacked long/short bar + per-symbol detail */
function RatioRow({ label, data }: { label: string; data: LongShortData[] }) {
  const avg = avgRatio(data);
  if (avg === null) return null;

  const { longPct, shortPct } = ratioToPercentages(avg);
  const bias = biasLabel(avg);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${biasStyle(avg)}`}>
          {bias}
        </span>
      </div>

      {/* Stacked long/short bar */}
      <div className="flex h-4 rounded-full overflow-hidden text-xs font-semibold">
        <div
          className="bg-green-500/80 flex items-center justify-center text-white/90 transition-all duration-500"
          style={{ width: `${Math.max(longPct, 8)}%` }}
        >
          {longPct.toFixed(0)}%
        </div>
        <div
          className="bg-red-500/80 flex items-center justify-center text-white/90 transition-all duration-500"
          style={{ width: `${Math.max(shortPct, 8)}%` }}
        >
          {shortPct.toFixed(0)}%
        </div>
      </div>

      {/* Per-symbol detail */}
      <div className="flex gap-3">
        {data.map((d) => (
          <span key={d.symbol} className="text-xs" style={{ color: "var(--text-muted)" }}>
            {d.symbol}: {d.ratio.toFixed(2)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Compact card showing 3 long/short ratio types: global, top trader account, top trader position */
export function LiquidationRatioDisplayCard({ longShort, className = "" }: Props) {
  const hasData = longShort.global.length > 0
    || longShort.topTraderAccount.length > 0
    || longShort.topTraderPosition.length > 0;

  if (!hasData) {
    return (
      <div className={`relative rounded-xl p-4 backdrop-blur-sm overflow-visible hover:z-20 focus-within:z-20 ${className}`} style={{ background: "var(--bg-card)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--bg-card-border)" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          Long/Short Ratio
          <InfoTooltip content="Long vs short positions on Binance Futures. Ratio >1 = more longs (bullish crowd). Shows All Accounts, Top Traders by Account, and Top Traders by Position." />
        </h3>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>No data available</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl p-4 flex flex-col gap-2 backdrop-blur-sm overflow-visible hover:z-20 focus-within:z-20 ${className}`} style={{ background: "var(--bg-card)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--bg-card-border)" }}>
      <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
        Long/Short Ratio
        <InfoTooltip content="Long vs short positions on Binance Futures. Ratio >1 = more longs (bullish crowd). Shows All Accounts, Top Traders by Account, and Top Traders by Position." />
      </h3>

      <div className="flex flex-col gap-1.5">
        {longShort.global.length > 0 && (
          <RatioRow label="All Accounts" data={longShort.global} />
        )}
        {longShort.topTraderAccount.length > 0 && (
          <RatioRow label="Top Traders (Acct)" data={longShort.topTraderAccount} />
        )}
        {longShort.topTraderPosition.length > 0 && (
          <RatioRow label="Top Traders (Pos)" data={longShort.topTraderPosition} />
        )}
      </div>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Long % = ratio/(1+ratio) · Binance Futures
      </p>
    </div>
  );
}
