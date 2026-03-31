import type { CrowdPulseComponents } from "../lib/types";
import { InfoTooltip } from "./info-tooltip";

/** Config for each score component: label, weight, color, and value extractor */
const COMPONENT_CONFIG = [
  { key: "fearGreed", label: "Fear & Greed", weight: 35, color: "bg-amber-500", tooltip: "F&G Index (0-100). 35% weight." },
  { key: "avgRsi", label: "RSI", weight: 25, color: "bg-neutral-400", tooltip: "Avg RSI across symbols. 25% weight." },
  { key: "volumeAnomaly", label: "Volume", weight: 20, color: "bg-neutral-500", tooltip: "Current vs avg volume. 20% weight." },
  { key: "longShortRatio", label: "L/S Ratio", weight: 20, color: "bg-amber-400", tooltip: "Long/short ratio (0-100). 20% weight." },
] as const;

/** Normalize volume anomaly from raw % (-100..+200 typical) to 0-100 */
function normalizeVolumeAnomaly(val: number): number {
  return Math.min(100, Math.max(0, (val + 100) / 3));
}

/** Get normalized 0-100 value for display */
function getNormalizedValue(key: string, components: CrowdPulseComponents): number | null {
  const raw = components[key as keyof CrowdPulseComponents];
  if (raw === null) return null;
  if (key === "volumeAnomaly") return normalizeVolumeAnomaly(raw);
  return raw; // fearGreed, avgRsi, longShortRatio are already 0-100
}

interface Props {
  components: CrowdPulseComponents;
}

/** 4 mini horizontal progress bars showing each score component's contribution */
export function ScoreComponentBreakdown({ components }: Props) {
  return (
    <div className="w-full flex flex-col gap-2">
      {COMPONENT_CONFIG.map(({ key, label, weight, color, tooltip }) => {
        const value = getNormalizedValue(key, components);
        return (
          <div key={key} className="relative flex items-center gap-2 hover:z-20 focus-within:z-20">
            <span className="relative z-10 text-xs w-26 shrink-0 flex items-center gap-0.5 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
              {label}
              <InfoTooltip content={tooltip} />
            </span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-track)" }} role="progressbar" aria-label={`${label}: ${value !== null ? `${value.toFixed(0)}%` : "N/A"}`} aria-valuenow={value ?? undefined} aria-valuemin={0} aria-valuemax={100}>
              {value !== null && (
                <div
                  className={`h-full rounded-full ${color} transition-all duration-500`}
                  style={{ width: `${value}%` }}
                />
              )}
            </div>
            <span className="text-xs w-8 text-right" style={{ color: "var(--text-muted)" }}>
              {value !== null ? `${value.toFixed(0)}` : "N/A"}
            </span>
            <span className="text-xs w-8 text-right" style={{ color: "var(--text-faint)" }}>{weight}%</span>
          </div>
        );
      })}
    </div>
  );
}
