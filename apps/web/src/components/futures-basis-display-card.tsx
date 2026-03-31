import type { FuturesBasisData } from "../lib/types";
import { sentimentTextColor, sentimentBadge, BASIS_PCT_TIERS } from "../lib/sentiment-color-utils";
import { DashboardCard } from "./dashboard-card";
import { InfoTooltip } from "./info-tooltip";

interface Props {
  futuresBasis: FuturesBasisData[];
  className?: string;
}

const TOOLTIP = "Futures vs spot price. Premium = bullish crowd paying more for leverage.";

/** Compact card showing futures basis (premium/discount vs spot) */
export function FuturesBasisDisplayCard({ futuresBasis, className = "" }: Props) {
  if (futuresBasis.length === 0) {
    return (
      <DashboardCard className={className}>
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          Futures Basis
          <InfoTooltip content={TOOLTIP} />
        </h3>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>No data available</p>
      </DashboardCard>
    );
  }

  const avg = futuresBasis.reduce((s, b) => s + b.basisPct, 0) / futuresBasis.length;
  const badge = sentimentBadge(avg, BASIS_PCT_TIERS);

  return (
    <DashboardCard className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          Futures Basis
          <InfoTooltip content={TOOLTIP} />
        </h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badge.classes}`}>
          {badge.label}
        </span>
      </div>

      {/* Hero: 2 decimal places for readability */}
      <div className={`text-2xl font-bold tracking-tight ${sentimentTextColor(avg, BASIS_PCT_TIERS)}`}>
        {avg >= 0 ? "+" : ""}{avg.toFixed(2)}%
      </div>

      <div className="flex gap-3">
        {futuresBasis.map((b) => (
          <span key={b.symbol} className={`text-xs ${sentimentTextColor(b.basisPct, BASIS_PCT_TIERS)}`}>
            {b.symbol}: {b.basisPct >= 0 ? "+" : ""}{b.basisPct.toFixed(4)}%
          </span>
        ))}
      </div>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Mark vs Index · Binance Futures
      </p>
    </DashboardCard>
  );
}
