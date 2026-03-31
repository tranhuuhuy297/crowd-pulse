import { formatPercent } from "../lib/number-format-utils";
import { InfoTooltip } from "./info-tooltip";

interface FearGreedDisplayCardProps {
  value: number;
  classification: string;
  change24h: number | null;
  className?: string;
}

/** Returns progress bar color — green (fear) to red (greed) */
function getBarColor(value: number): string {
  if (value <= 25) return "bg-green-500";
  if (value <= 45) return "bg-green-400";
  if (value <= 55) return "bg-neutral-400";
  if (value <= 75) return "bg-red-400";
  return "bg-red-500";
}

/** Returns text color — green (fear) to red (greed) */
function getValueColor(value: number): string {
  if (value <= 25) return "text-green-500";
  if (value <= 45) return "text-green-400";
  if (value <= 55) return "text-neutral-400";
  if (value <= 75) return "text-red-400";
  return "text-red-500";
}

/** Compact Fear & Greed index card */
export function FearGreedDisplayCard({ value, classification, change24h, className = "" }: FearGreedDisplayCardProps) {
  const barColor = getBarColor(value);
  const valueColor = getValueColor(value);
  const isPositiveChange = change24h !== null && change24h >= 0;

  return (
    <div className={`relative rounded-xl p-3 flex flex-col gap-1.5 backdrop-blur-sm overflow-visible hover:z-20 focus-within:z-20 ${className}`} style={{ background: "var(--bg-card)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--bg-card-border)" }}>
      <h2 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
        Market Sentiment
        <InfoTooltip content="alternative.me Fear & Greed Index. One of 4 inputs to Contrarian Signal." />
      </h2>

      <div className="flex items-end justify-between">
        <div>
          <span className={`text-4xl font-bold ${valueColor}`}>{value}</span>
          <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>/ 100</span>
        </div>
        <div className="text-right">
          <p className={`text-lg font-semibold ${valueColor}`}>{classification}</p>
          {change24h !== null && (
            <p className={`text-xs ${isPositiveChange ? "text-green-500" : "text-red-500"}`}>
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
    </div>
  );
}
