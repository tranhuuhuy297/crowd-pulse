import type { LongShortData, LongShortRatios } from "../lib/types";
import { InfoTooltip } from "./info-tooltip";

interface Props {
  longShort: LongShortRatios;
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

const TOOLTIP = "Longs vs shorts. Ratio >1 = bullish crowd.";

/** Compact card showing global long/short account ratio */
export function LiquidationRatioDisplayCard({ longShort, className = "" }: Props) {
  const avg = avgRatio(longShort);

  if (avg === null) {
    return (
      <div className={`relative rounded-xl p-3 backdrop-blur-sm overflow-visible hover:z-20 focus-within:z-20 ${className}`} style={{ background: "var(--bg-card)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--bg-card-border)" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          Long/Short Ratio
          <InfoTooltip content={TOOLTIP} />
        </h3>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>No data available</p>
      </div>
    );
  }

  const { longPct, shortPct } = ratioToPercentages(avg);
  const bias = biasLabel(avg);

  return (
    <div className={`relative rounded-xl p-3 flex flex-col gap-2 backdrop-blur-sm overflow-visible hover:z-20 focus-within:z-20 ${className}`} style={{ background: "var(--bg-card)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--bg-card-border)" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          Long/Short Ratio
          <InfoTooltip content={TOOLTIP} />
        </h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${biasStyle(avg)}`}>
          {bias}
        </span>
      </div>

      {/* Hero ratio number */}
      <div className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
        {avg.toFixed(2)}
      </div>

      {/* Stacked long/short bar */}
      <div className="flex h-5 rounded-full overflow-hidden text-xs font-bold">
        <div
          className="bg-green-500 flex items-center justify-center text-white transition-all duration-500"
          style={{ width: `${Math.max(longPct, 12)}%` }}
        >
          {longPct.toFixed(0)}% L
        </div>
        <div
          className="bg-red-500 flex items-center justify-center text-white transition-all duration-500"
          style={{ width: `${Math.max(shortPct, 12)}%` }}
        >
          {shortPct.toFixed(0)}% S
        </div>
      </div>

    </div>
  );
}
