import type { SignalType, CrowdPulseComponents } from "../lib/types";
import { SvgGaugeChart } from "./svg-gauge-chart";
import { ScoreComponentBreakdown } from "./score-component-breakdown";
import { InfoTooltip } from "./info-tooltip";

interface CrowdPulseScoreCardProps {
  score: number | null;
  signal: SignalType;
  updatedAt: string;
  components: CrowdPulseComponents;
  scoreDelta: number | null;
}

const SIGNAL_STYLES: Record<SignalType, { badge: string; label: string }> = {
  STRONG_BUY: { badge: "bg-green-500/20 text-green-400 border-green-500/30",    label: "Strong Buy" },
  BUY:        { badge: "bg-green-500/15 text-green-400 border-green-500/20",    label: "Buy" },
  NEUTRAL:    { badge: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30", label: "Neutral" },
  SELL:       { badge: "bg-red-500/15 text-red-400 border-red-500/20",          label: "Sell" },
  STRONG_SELL:{ badge: "bg-red-500/20 text-red-400 border-red-500/30",          label: "Strong Sell" },
};

const CONTRARIAN_MESSAGES: Record<SignalType, string> = {
  STRONG_BUY:  "Crowd is fearful — consider buying the dip",
  BUY:         "Sentiment leans fearful — mild buy opportunity",
  NEUTRAL:     "Crowd sentiment is balanced — stay cautious",
  SELL:        "Crowd is optimistic — consider trimming positions",
  STRONG_SELL: "Crowd is greedy — consider selling",
};

const SIGNAL_BANNER: Record<SignalType, string> = {
  STRONG_BUY:  "bg-green-500/10 border-green-500/20",
  BUY:         "bg-green-500/8 border-green-500/15",
  NEUTRAL:     "bg-neutral-500/10 border-neutral-500/20",
  SELL:        "bg-red-500/8 border-red-500/15",
  STRONG_SELL: "bg-red-500/10 border-red-500/20",
};

/** Compact score card with gauge, delta, contrarian banner, and breakdown */
export function CrowdPulseScoreCard({ score, signal, components, scoreDelta }: CrowdPulseScoreCardProps) {
  const style = SIGNAL_STYLES[signal];
  const message = CONTRARIAN_MESSAGES[signal];

  return (
    <div className="relative rounded-xl p-4 flex flex-col items-center gap-2 backdrop-blur-sm overflow-visible hover:z-20 focus-within:z-20" style={{ background: "var(--bg-card)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--bg-card-border)" }}>
      <div className="flex items-center justify-between w-full">
        <h2 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          Crowd Pulse
          <InfoTooltip content="Composite sentiment score (0-100). Formula: F&G×35% + RSI×25% + Volume×20% + L/S×20%. Weights auto-redistribute when sources unavailable." />
        </h2>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
          {style.label}
        </span>
      </div>

      {score === null ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: "var(--text-faint)", borderTopColor: "var(--accent)" }} />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Collecting data...</p>
        </div>
      ) : (
        <>
          <SvgGaugeChart score={score} size={150} />
          {scoreDelta !== null && (
            <span className={`text-xs font-semibold ${scoreDelta >= 0 ? "text-red-500" : "text-green-500"}`}>
              {scoreDelta >= 0 ? "▲" : "▼"} {Math.abs(scoreDelta).toFixed(1)}
            </span>
          )}
        </>
      )}

      <div className={`w-full rounded-lg border px-3 py-1.5 flex items-center justify-center gap-1 ${SIGNAL_BANNER[signal]}`}>
        <p className="text-xs italic" style={{ color: "var(--text-secondary)" }}>{message}</p>
        <InfoTooltip content="Contrarian signal: when crowd is greedy (80+), consider selling. When fearful (<20), consider buying." />
      </div>

      <ScoreComponentBreakdown components={components} />
    </div>
  );
}
