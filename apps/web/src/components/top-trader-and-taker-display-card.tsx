import type { TopTraderLongShortData, TakerBuySellData } from "../lib/types";
import { InfoTooltip } from "./info-tooltip";

interface Props {
  topTrader: TopTraderLongShortData[];
  takerBuySell: TakerBuySellData[];
  className?: string;
}

function ratioColor(ratio: number): string {
  if (ratio >= 1.3) return "text-red-500";
  if (ratio >= 1.1) return "text-red-400";
  if (ratio >= 0.9) return "text-neutral-400";
  if (ratio >= 0.7) return "text-green-400";
  return "text-green-500";
}

function biasLabel(ratio: number): string {
  if (ratio >= 1.3) return "Heavy Long";
  if (ratio >= 1.1) return "Long Bias";
  if (ratio >= 0.9) return "Balanced";
  if (ratio >= 0.7) return "Short Bias";
  return "Heavy Short";
}

function biasStyle(ratio: number): string {
  if (ratio >= 1.3) return "bg-red-500/20 text-red-400 border-red-500/30";
  if (ratio >= 1.1) return "bg-red-500/15 text-red-400 border-red-500/20";
  if (ratio >= 0.9) return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
  if (ratio >= 0.7) return "bg-green-500/15 text-green-400 border-green-500/20";
  return "bg-green-500/20 text-green-400 border-green-500/30";
}

const TOP_TOOLTIP = "Top traders' positions. Divergence from crowd = strong contrarian signal.";
const TAKER_TOOLTIP = "Taker buy vs sell volume. >1 = aggressive buying.";

/** Combined card showing top trader L/S and taker buy/sell ratio */
export function TopTraderAndTakerDisplayCard({ topTrader, takerBuySell, className = "" }: Props) {
  const hasTopTrader = topTrader.length > 0;
  const hasTaker = takerBuySell.length > 0;

  if (!hasTopTrader && !hasTaker) {
    return (
      <div className={`relative rounded-xl p-3 backdrop-blur-sm overflow-visible hover:z-20 focus-within:z-20 ${className}`} style={{ background: "var(--bg-card)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--bg-card-border)" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Smart Money</h3>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>No data available</p>
      </div>
    );
  }

  const tt = topTrader[0];
  const tk = takerBuySell[0];

  return (
    <div className={`relative rounded-xl p-3 flex flex-col gap-3 backdrop-blur-sm overflow-visible hover:z-20 focus-within:z-20 ${className}`} style={{ background: "var(--bg-card)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--bg-card-border)" }}>
      {/* Top Trader L/S */}
      {tt && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              Top Traders
              <InfoTooltip content={TOP_TOOLTIP} />
            </h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${biasStyle(tt.ratio)}`}>
              {biasLabel(tt.ratio)}
            </span>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${ratioColor(tt.ratio)}`}>
            {tt.ratio.toFixed(2)}
          </div>
          <div className="flex h-5 rounded-full overflow-hidden text-xs font-bold">
            <div className="bg-green-500 flex items-center justify-center text-white transition-all duration-500" style={{ width: `${Math.max(tt.longPct, 12)}%` }}>
              {tt.longPct.toFixed(0)}% L
            </div>
            <div className="bg-red-500 flex items-center justify-center text-white transition-all duration-500" style={{ width: `${Math.max(tt.shortPct, 12)}%` }}>
              {tt.shortPct.toFixed(0)}% S
            </div>
          </div>
        </div>
      )}

      {/* Taker Buy/Sell */}
      {tk && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              Taker Buy/Sell
              <InfoTooltip content={TAKER_TOOLTIP} />
            </h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${biasStyle(tk.buySellRatio)}`}>
              {biasLabel(tk.buySellRatio)}
            </span>
          </div>
          <div className={`text-lg font-bold tracking-tight ${ratioColor(tk.buySellRatio)}`}>
            {tk.buySellRatio.toFixed(3)}
          </div>
        </div>
      )}
    </div>
  );
}
