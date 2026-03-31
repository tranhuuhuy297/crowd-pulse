import type { CrowdPulseComponents } from "../lib/types";
import { InfoTooltip } from "./info-tooltip";

/** Config for each score component: label, weight, color, and tooltip */
const COMPONENT_CONFIG = [
  { key: "fearGreed", label: "Mkt Sentiment", weight: 25, color: "bg-amber-500", tooltip: "Fear & Greed Index (0-100). 25% weight." },
  { key: "fundingRate", label: "Funding Rate", weight: 25, color: "bg-orange-500", tooltip: "8h funding rate normalized. 25% weight." },
  { key: "avgRsi", label: "RSI", weight: 15, color: "bg-neutral-400", tooltip: "Avg RSI across symbols. 15% weight." },
  { key: "longShortRatio", label: "L/S Ratio", weight: 15, color: "bg-amber-400", tooltip: "Long/short ratio (0-100). 15% weight." },
  { key: "openInterest", label: "Open Interest", weight: 20, color: "bg-purple-400", tooltip: "OI vs 14d avg normalized. 20% weight." },
] as const;

/** Get normalized 0-100 value for display */
function getNormalizedValue(key: string, components: CrowdPulseComponents): number | null {
  const raw = components[key as keyof CrowdPulseComponents];
  if (raw === null) return null;
  return raw;
}

interface Props {
  components: CrowdPulseComponents;
}

/** 5 mini horizontal progress bars showing each score component's weighted contribution */
export function ScoreComponentBreakdown({ components }: Props) {
  return (
    <div className="w-full flex flex-col gap-2">
      {COMPONENT_CONFIG.map(({ key, label, weight, color, tooltip }) => {
        const value = getNormalizedValue(key, components);
        const weighted = value !== null ? Math.round(value * weight / 100) : null;
        return (
          <div key={key} className="relative flex items-center gap-2 hover:z-20 focus-within:z-20">
            <span className="relative z-10 text-xs w-26 shrink-0 flex items-center gap-0.5 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
              {label}
              <InfoTooltip content={tooltip} />
            </span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-track)" }} role="progressbar" aria-label={`${label}: ${value !== null ? `${value.toFixed(0)}%` : "N/A"}`} aria-valuenow={value ?? undefined} aria-valuemin={0} aria-valuemax={100}>
              {value !== null && (
                <div
                  className={`h-full rounded-full ${color} transition-all duration-500`}
                  style={{ width: `${value}%` }}
                />
              )}
            </div>
            <span className="text-xs w-10 text-right tabular-nums" style={{ color: "var(--text-muted)" }}>
              {weighted !== null ? `${weighted}/${weight}` : "N/A"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
