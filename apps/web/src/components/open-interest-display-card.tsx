import type { OpenInterestData } from "../lib/types";
import { InfoTooltip } from "./info-tooltip";

interface Props {
  openInterest: OpenInterestData[];
  className?: string;
}

/** Color based on OI change: below avg (green/fear) → above avg (red/greed) */
function oiColor(changePct: number): string {
  if (changePct <= -15) return "text-green-500";
  if (changePct < -5) return "text-green-400";
  if (changePct <= 5) return "text-neutral-400";
  if (changePct < 15) return "text-red-400";
  return "text-red-500";
}

function oiBadgeStyle(changePct: number): string {
  if (changePct < -10) return "bg-green-500/20 text-green-400 border-green-500/30";
  if (changePct <= 10) return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
}

function oiLabel(changePct: number): string {
  if (changePct < -10) return "Low Leverage";
  if (changePct <= 10) return "Normal";
  return "High Leverage";
}

const TOOLTIP = "OI vs 14d avg. High OI = overleveraged crowd.";

/** Compact card showing open interest vs 14-day average */
export function OpenInterestDisplayCard({ openInterest, className = "" }: Props) {
  if (openInterest.length === 0) {
    return (
      <div className={`relative rounded-xl p-3 backdrop-blur-sm overflow-visible hover:z-20 focus-within:z-20 ${className}`} style={{ background: "var(--bg-card)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--bg-card-border)" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          Open Interest
          <InfoTooltip content={TOOLTIP} />
        </h3>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>No data available</p>
      </div>
    );
  }

  const avgChange = openInterest.reduce((s, oi) => s + oi.changePercent, 0) / openInterest.length;

  return (
    <div className={`relative rounded-xl p-3 flex flex-col gap-2 backdrop-blur-sm overflow-visible hover:z-20 focus-within:z-20 ${className}`} style={{ background: "var(--bg-card)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--bg-card-border)" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          Open Interest
          <InfoTooltip content={TOOLTIP} />
        </h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${oiBadgeStyle(avgChange)}`}>
          {oiLabel(avgChange)}
        </span>
      </div>

      <div className={`text-2xl font-bold tracking-tight ${oiColor(avgChange)}`}>
        {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(1)}%
      </div>

      <div className="flex gap-3">
        {openInterest.map((oi) => (
          <span key={oi.symbol} className={`text-xs ${oiColor(oi.changePercent)}`}>
            {oi.symbol}: {oi.changePercent >= 0 ? "+" : ""}{oi.changePercent.toFixed(1)}%
          </span>
        ))}
      </div>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        vs 14d avg · Binance Futures
      </p>
    </div>
  );
}
