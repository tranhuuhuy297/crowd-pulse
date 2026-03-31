import type { FundingRateData } from "../lib/types";
import { sentimentTextColor, sentimentBadge, FUNDING_RATE_TIERS } from "../lib/sentiment-color-utils";
import { DashboardCard } from "./dashboard-card";
import { InfoTooltip } from "./info-tooltip";

interface Props {
  fundingRates: FundingRateData[];
  className?: string;
}

const TOOLTIP = "8h funding rate. Positive = longs pay shorts = bullish crowd.";

/** Compact card showing funding rate data */
export function FundingRateDisplayCard({ fundingRates, className = "" }: Props) {
  if (fundingRates.length === 0) {
    return (
      <DashboardCard className={className}>
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          Funding Rate
          <InfoTooltip content={TOOLTIP} />
        </h3>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>No data available</p>
      </DashboardCard>
    );
  }

  const avgRate = fundingRates.reduce((s, fr) => s + fr.rate, 0) / fundingRates.length;
  const pct = (avgRate * 100).toFixed(4);
  const badge = sentimentBadge(avgRate, FUNDING_RATE_TIERS);

  return (
    <DashboardCard className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          Funding Rate
          <InfoTooltip content={TOOLTIP} />
        </h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badge.classes}`}>
          {badge.label}
        </span>
      </div>

      <div className={`text-2xl font-bold tracking-tight stat-value ${sentimentTextColor(avgRate, FUNDING_RATE_TIERS)}`}>
        {avgRate >= 0 ? "+" : ""}{pct}%
      </div>

      <div className="flex gap-3">
        {fundingRates.map((fr) => (
          <span key={fr.symbol} className={`text-xs ${sentimentTextColor(fr.rate, FUNDING_RATE_TIERS)}`}>
            {fr.symbol}: {fr.rate >= 0 ? "+" : ""}{(fr.rate * 100).toFixed(4)}%
          </span>
        ))}
      </div>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Every 8h · Binance Futures
      </p>
    </DashboardCard>
  );
}
