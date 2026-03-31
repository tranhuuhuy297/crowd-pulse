import type { BuyConclusionData } from "../lib/types";
import { DashboardCard } from "./dashboard-card";
import { InfoTooltip } from "./info-tooltip";

interface BuyConclusionDisplayCardProps {
  conclusion: BuyConclusionData;
}

const RECOMMENDATION_CONFIG: Record<BuyConclusionData["recommendation"], {
  label: string;
  labelColor: string;
  borderColor: string;
  glowShadow: string;
  bgGradient: string;
  accentRgb: string;
}> = {
  BUY_NOW: {
    label: "BUY NOW",
    labelColor: "text-green-700 dark:text-green-400",
    borderColor: "rgba(34, 197, 94, 0.35)",
    glowShadow: "0 0 20px rgba(34,197,94,0.2), 0 0 40px rgba(34,197,94,0.08)",
    bgGradient: "radial-gradient(ellipse at left, rgba(34,197,94,0.1), transparent 50%)",
    accentRgb: "34, 197, 94",
  },
  WAIT_FOR_DIP: {
    label: "WAIT FOR DIP",
    labelColor: "text-amber-700 dark:text-amber-400",
    borderColor: "rgba(245, 158, 11, 0.3)",
    glowShadow: "0 0 20px rgba(245,158,11,0.15), 0 0 40px rgba(245,158,11,0.06)",
    bgGradient: "radial-gradient(ellipse at left, rgba(245,158,11,0.08), transparent 50%)",
    accentRgb: "245, 158, 11",
  },
  HOLD_OFF: {
    label: "HOLD OFF",
    labelColor: "text-neutral-600 dark:text-neutral-400",
    borderColor: "rgba(163, 163, 163, 0.2)",
    glowShadow: "0 0 12px rgba(163,163,163,0.06)",
    bgGradient: "none",
    accentRgb: "163, 163, 163",
  },
  AVOID: {
    label: "AVOID",
    labelColor: "text-red-700 dark:text-red-400",
    borderColor: "rgba(239, 68, 68, 0.3)",
    glowShadow: "0 0 20px rgba(239,68,68,0.15), 0 0 40px rgba(239,68,68,0.06)",
    bgGradient: "radial-gradient(ellipse at left, rgba(239,68,68,0.08), transparent 50%)",
    accentRgb: "239, 68, 68",
  },
};

function fmtPrice(p: number): string {
  return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/** Concise horizontal conclusion card — recommendation + summary + key price in one row */
export function BuyConclusionDisplayCard({ conclusion }: BuyConclusionDisplayCardProps) {
  const c = RECOMMENDATION_CONFIG[conclusion.recommendation];
  const keyPrice = conclusion.suggestedEntry ?? conclusion.resistance;
  const keyLabel = conclusion.suggestedEntry !== null ? "Entry" : "Resistance";
  const pulseClass = conclusion.recommendation === "BUY_NOW" ? "pulse-buy-now" : "";

  return (
    <DashboardCard
      className={pulseClass}
      padding="p-4"
      style={{
        borderColor: c.borderColor,
        boxShadow: c.glowShadow,
      }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: c.bgGradient }} />

      {/* Centered balanced layout */}
      <div className="relative flex items-center gap-4">
        {/* Left: confidence ring */}
        <ConfidenceRing value={conclusion.confidence} color={`rgb(${c.accentRgb})`} />

        {/* Center: recommendation + summary */}
        <div className="flex-1 flex flex-col items-center text-center min-w-0 gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
            Should you buy?
            <InfoTooltip content="Sentiment + support/resistance. NFA." />
          </span>
          <span className={`text-xl font-bold tracking-tight ${c.labelColor}`}>{c.label}</span>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            {conclusion.summary}
          </p>
        </div>

        {/* Right: key price */}
        {keyPrice !== null ? (
          <div className="text-center shrink-0">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{keyLabel}</p>
            <p className="text-base font-bold tabular-nums" style={{ color: "var(--accent)" }}>{fmtPrice(keyPrice)}</p>
          </div>
        ) : (
          <div className="w-11 shrink-0" />
        )}
      </div>
    </DashboardCard>
  );
}

/** Tiny SVG confidence ring */
function ConfidenceRing({ value, color }: { value: number; color: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="relative shrink-0 w-11 h-11 flex items-center justify-center">
      <svg width="44" height="44" viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="2.5" style={{ stroke: "var(--bg-track)" }} />
        <circle
          cx="22" cy="22" r={r} fill="none" strokeWidth="2.5"
          stroke={color} strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="text-[10px] font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{value}%</span>
    </div>
  );
}
