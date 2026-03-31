import type { OpenInterestData } from "../lib/types";
import { sentimentTextColor, sentimentBadge, OI_CHANGE_TIERS } from "../lib/sentiment-color-utils";
import { DashboardCard } from "./dashboard-card";
import { InfoTooltip } from "./info-tooltip";

interface Props {
  openInterest: OpenInterestData[];
  className?: string;
}

const TOOLTIP = "OI vs 14d avg. High OI = overleveraged crowd.";

/** Compact card showing open interest vs 14-day average */
export function OpenInterestDisplayCard({ openInterest, className = "" }: Props) {
  if (openInterest.length === 0) {
    return (
      <DashboardCard className={className}>
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          Open Interest
          <InfoTooltip content={TOOLTIP} />
        </h3>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>No data available</p>
      </DashboardCard>
    );
  }

  const avgChange = openInterest.reduce((s, oi) => s + oi.changePercent, 0) / openInterest.length;
  const badge = sentimentBadge(avgChange, OI_CHANGE_TIERS);

  return (
    <DashboardCard className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          Open Interest
          <InfoTooltip content={TOOLTIP} />
        </h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badge.classes}`}>
          {badge.label}
        </span>
      </div>

      <div className={`text-2xl font-bold tracking-tight stat-value ${sentimentTextColor(avgChange, OI_CHANGE_TIERS)}`}>
        {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(1)}%
      </div>

      <div className="flex gap-3">
        {openInterest.map((oi) => (
          <span key={oi.symbol} className={`text-xs ${sentimentTextColor(oi.changePercent, OI_CHANGE_TIERS)}`}>
            {oi.symbol}: {oi.changePercent >= 0 ? "+" : ""}{oi.changePercent.toFixed(1)}%
          </span>
        ))}
      </div>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        vs 14d avg · Binance Futures
      </p>
    </DashboardCard>
  );
}
