import type { FuturesBasisData } from "../lib/types";
import { InfoTooltip } from "./info-tooltip";

interface Props {
  futuresBasis: FuturesBasisData[];
  className?: string;
}

function basisColor(pct: number): string {
  if (pct < -0.05) return "text-green-500";
  if (pct < 0) return "text-green-400";
  if (pct < 0.05) return "text-neutral-400";
  if (pct < 0.15) return "text-red-400";
  return "text-red-500";
}

function basisBadgeStyle(pct: number): string {
  if (pct < -0.02) return "bg-green-500/20 text-green-400 border-green-500/30";
  if (pct <= 0.05) return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
}

function basisLabel(pct: number): string {
  if (pct < -0.02) return "Discount";
  if (pct <= 0.05) return "Fair";
  return "Premium";
}

const TOOLTIP = "Futures vs spot price. Premium = bullish crowd paying more for leverage.";

/** Compact card showing futures basis (premium/discount vs spot) */
export function FuturesBasisDisplayCard({ futuresBasis, className = "" }: Props) {
  if (futuresBasis.length === 0) {
    return (
      <div className={`relative rounded-xl p-3 backdrop-blur-sm overflow-visible hover:z-20 focus-within:z-20 ${className}`} style={{ background: "var(--bg-card)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--bg-card-border)" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          Futures Basis
          <InfoTooltip content={TOOLTIP} />
        </h3>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>No data available</p>
      </div>
    );
  }

  const avg = futuresBasis.reduce((s, b) => s + b.basisPct, 0) / futuresBasis.length;

  return (
    <div className={`relative rounded-xl p-3 flex flex-col gap-2 backdrop-blur-sm overflow-visible hover:z-20 focus-within:z-20 ${className}`} style={{ background: "var(--bg-card)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--bg-card-border)" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          Futures Basis
          <InfoTooltip content={TOOLTIP} />
        </h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${basisBadgeStyle(avg)}`}>
          {basisLabel(avg)}
        </span>
      </div>

      <div className={`text-2xl font-bold tracking-tight ${basisColor(avg)}`}>
        {avg >= 0 ? "+" : ""}{avg.toFixed(4)}%
      </div>

      <div className="flex gap-3">
        {futuresBasis.map((b) => (
          <span key={b.symbol} className={`text-xs ${basisColor(b.basisPct)}`}>
            {b.symbol}: {b.basisPct >= 0 ? "+" : ""}{b.basisPct.toFixed(4)}%
          </span>
        ))}
      </div>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Mark vs Index · Binance Futures
      </p>
    </div>
  );
}
