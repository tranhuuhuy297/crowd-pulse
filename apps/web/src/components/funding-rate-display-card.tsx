import type { FundingRateData } from "../lib/types";
import { InfoTooltip } from "./info-tooltip";

interface Props {
  fundingRates: FundingRateData[];
  className?: string;
}

/** Color based on funding rate: negative (green/fear) → positive (red/greed) */
function rateColor(rate: number): string {
  if (rate <= -0.0003) return "text-green-500";
  if (rate < 0) return "text-green-400";
  if (rate < 0.0003) return "text-neutral-400";
  if (rate < 0.0007) return "text-red-400";
  return "text-red-500";
}

function rateBadgeStyle(rate: number): string {
  if (rate < -0.0001) return "bg-green-500/20 text-green-400 border-green-500/30";
  if (rate < 0.0003) return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
}

function rateLabel(rate: number): string {
  if (rate < -0.0001) return "Shorts Pay";
  if (rate < 0.0003) return "Neutral";
  return "Longs Pay";
}

const TOOLTIP = "8h funding rate. Positive = longs pay shorts = bullish crowd.";

/** Compact card showing funding rate data */
export function FundingRateDisplayCard({ fundingRates, className = "" }: Props) {
  if (fundingRates.length === 0) {
    return (
      <div className={`relative rounded-xl p-3 backdrop-blur-sm overflow-visible hover:z-20 focus-within:z-20 ${className}`} style={{ background: "var(--bg-card)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--bg-card-border)" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          Funding Rate
          <InfoTooltip content={TOOLTIP} />
        </h3>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>No data available</p>
      </div>
    );
  }

  const avgRate = fundingRates.reduce((s, fr) => s + fr.rate, 0) / fundingRates.length;
  const pct = (avgRate * 100).toFixed(4);

  return (
    <div className={`relative rounded-xl p-3 flex flex-col gap-2 backdrop-blur-sm overflow-visible hover:z-20 focus-within:z-20 ${className}`} style={{ background: "var(--bg-card)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--bg-card-border)" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          Funding Rate
          <InfoTooltip content={TOOLTIP} />
        </h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${rateBadgeStyle(avgRate)}`}>
          {rateLabel(avgRate)}
        </span>
      </div>

      <div className={`text-2xl font-bold tracking-tight ${rateColor(avgRate)}`}>
        {avgRate >= 0 ? "+" : ""}{pct}%
      </div>

      <div className="flex gap-3">
        {fundingRates.map((fr) => (
          <span key={fr.symbol} className={`text-xs ${rateColor(fr.rate)}`}>
            {fr.symbol}: {fr.rate >= 0 ? "+" : ""}{(fr.rate * 100).toFixed(4)}%
          </span>
        ))}
      </div>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Every 8h · Binance Futures
      </p>
    </div>
  );
}
