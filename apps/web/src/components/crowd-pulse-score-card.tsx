import type { SignalType } from "../lib/types";
import { SvgGaugeChart } from "./svg-gauge-chart";

interface CrowdPulseScoreCardProps {
  score: number | null;
  signal: SignalType;
  updatedAt: string;
}

const SIGNAL_STYLES: Record<SignalType, { badge: string; label: string }> = {
  STRONG_BUY: { badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "Strong Buy" },
  BUY:        { badge: "bg-green-500/20 text-green-400 border-green-500/30",     label: "Buy" },
  NEUTRAL:    { badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",  label: "Neutral" },
  SELL:       { badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",  label: "Sell" },
  STRONG_SELL:{ badge: "bg-red-500/20 text-red-400 border-red-500/30",           label: "Strong Sell" },
};

const CONTRARIAN_MESSAGES: Record<SignalType, string> = {
  STRONG_BUY:  "Crowd is fearful — consider buying the dip",
  BUY:         "Sentiment leans fearful — mild buy opportunity",
  NEUTRAL:     "Crowd sentiment is balanced — stay cautious",
  SELL:        "Crowd is optimistic — consider trimming positions",
  STRONG_SELL: "Crowd is greedy — consider selling",
};

/** Card showing the CrowdPulse composite score with gauge, signal badge, and contrarian message */
export function CrowdPulseScoreCard({ score, signal, updatedAt }: CrowdPulseScoreCardProps) {
  const style = SIGNAL_STYLES[signal];
  const message = CONTRARIAN_MESSAGES[signal];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Crowd Pulse Score</h2>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${style.badge}`}>
          {style.label}
        </span>
      </div>

      {score === null ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <div className="w-12 h-12 rounded-full border-2 border-gray-700 border-t-gray-400 animate-spin" />
          <p className="text-gray-500 text-sm">Collecting data...</p>
        </div>
      ) : (
        <SvgGaugeChart score={score} size={180} />
      )}

      <p className="text-sm text-gray-300 text-center italic">{message}</p>

      <p className="text-xs text-gray-600">
        Updated: {new Date(updatedAt).toLocaleTimeString()}
      </p>
    </div>
  );
}
