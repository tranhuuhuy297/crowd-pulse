import { formatPercent } from "../lib/number-format-utils";
import { sentimentTextColor, FEAR_GREED_TIERS } from "../lib/sentiment-color-utils";
import { DashboardCard } from "./dashboard-card";
import { InfoTooltip } from "./info-tooltip";

interface FearGreedDisplayCardProps {
  value: number;
  classification: string;
  change24h: number | null;
  className?: string;
}

/** Returns progress bar color — green (fear) to red (greed) */
function getBarColor(value: number): string {
  if (value <= 25) return "bg-emerald-500";
  if (value <= 45) return "bg-emerald-400";
  if (value <= 55) return "bg-neutral-400";
  if (value <= 75) return "bg-rose-400";
  return "bg-rose-500";
}

/** Compact Fear & Greed index card */
export function FearGreedDisplayCard({ value, classification, change24h, className = "" }: FearGreedDisplayCardProps) {
  const barColor = getBarColor(value);
  const valueColor = sentimentTextColor(value, FEAR_GREED_TIERS);
  const isPositiveChange = change24h !== null && change24h >= 0;

  return (
    <DashboardCard className={`flex flex-col gap-1.5 ${className}`}>
      <h2 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
        Market Sentiment
        <InfoTooltip content="alternative.me Fear & Greed Index. One of 4 inputs to Contrarian Signal." />
      </h2>

      <div className="flex items-end justify-between">
        <div>
          <span className={`text-4xl font-bold stat-value ${valueColor}`}>{value}</span>
          <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>/ 100</span>
        </div>
        <div className="text-right">
          <p className={`text-lg font-semibold ${valueColor}`}>{classification}</p>
          {change24h !== null && (
            <p className={`text-xs ${isPositiveChange ? "text-emerald-500" : "text-rose-500"}`}>
              {isPositiveChange ? "▲" : "▼"} {formatPercent(Math.abs(change24h))} 24h
            </p>
          )}
        </div>
      </div>

      <div className="w-full rounded-full h-3 overflow-hidden" style={{ background: "var(--bg-track)" }}>
        <div
          className={`h-3 rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>

      <div className="flex justify-between text-xs" style={{ color: "var(--text-faint)" }}>
        <span>Fear</span>
        <span>Greed</span>
      </div>
    </DashboardCard>
  );
}
