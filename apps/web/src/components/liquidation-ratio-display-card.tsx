import type { LongShortData, LongShortRatios } from "../lib/types";
import { sentimentBadge, RATIO_TIERS } from "../lib/sentiment-color-utils";
import { DashboardCard } from "./dashboard-card";
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

const TOOLTIP = "Longs vs shorts. Ratio >1 = bullish crowd.";

/** Compact card showing global long/short account ratio */
export function LiquidationRatioDisplayCard({ longShort, className = "" }: Props) {
  const avg = avgRatio(longShort);

  if (avg === null) {
    return (
      <DashboardCard className={className}>
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          Long/Short Ratio
          <InfoTooltip content={TOOLTIP} />
        </h3>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>No data available</p>
      </DashboardCard>
    );
  }

  const { longPct, shortPct } = ratioToPercentages(avg);
  const badge = sentimentBadge(avg, RATIO_TIERS);

  return (
    <DashboardCard className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          Long/Short Ratio
          <InfoTooltip content={TOOLTIP} />
        </h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badge.classes}`}>
          {badge.label}
        </span>
      </div>

      {/* Hero ratio number */}
      <div className="text-2xl font-bold tracking-tight stat-value" style={{ color: "var(--text-primary)" }}>
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
    </DashboardCard>
  );
}
