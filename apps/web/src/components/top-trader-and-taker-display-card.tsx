import type { TopTraderLongShortData, TakerBuySellData } from "../lib/types";
import { sentimentTextColor, sentimentBadge, TOP_TRADER_RATIO_TIERS } from "../lib/sentiment-color-utils";
import { DashboardCard } from "./dashboard-card";
import { InfoTooltip } from "./info-tooltip";

interface Props {
  topTrader: TopTraderLongShortData[];
  takerBuySell: TakerBuySellData[];
  className?: string;
}

const TOP_TOOLTIP = "Top traders' positions. Divergence from crowd = strong contrarian signal.";
const TAKER_TOOLTIP = "Taker buy vs sell volume. >1 = aggressive buying.";

/** Combined card showing top trader L/S and taker buy/sell ratio */
export function TopTraderAndTakerDisplayCard({ topTrader, takerBuySell, className = "" }: Props) {
  const hasTopTrader = topTrader.length > 0;
  const hasTaker = takerBuySell.length > 0;

  if (!hasTopTrader && !hasTaker) {
    return (
      <DashboardCard className={className}>
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Smart Money</h3>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>No data available</p>
      </DashboardCard>
    );
  }

  const tt = topTrader[0];
  const tk = takerBuySell[0];
  const ttBadge = tt ? sentimentBadge(tt.ratio, TOP_TRADER_RATIO_TIERS) : null;
  const tkBadge = tk ? sentimentBadge(tk.buySellRatio, TOP_TRADER_RATIO_TIERS) : null;

  return (
    <DashboardCard className={`flex flex-col gap-5 ${className}`}>
      {/* Top Trader L/S */}
      {tt && ttBadge && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              Top Traders
              <InfoTooltip content={TOP_TOOLTIP} />
            </h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ttBadge.classes}`}>
              {ttBadge.label}
            </span>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${sentimentTextColor(tt.ratio, TOP_TRADER_RATIO_TIERS)}`}>
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

      {/* Divider between sections */}
      {tt && ttBadge && tk && tkBadge && (
        <hr className="border-t" style={{ borderColor: "var(--border)" }} />
      )}

      {/* Taker Buy/Sell */}
      {tk && tkBadge && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              Taker Buy/Sell
              <InfoTooltip content={TAKER_TOOLTIP} />
            </h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${tkBadge.classes}`}>
              {tkBadge.label}
            </span>
          </div>
          <div className={`text-lg font-bold tracking-tight ${sentimentTextColor(tk.buySellRatio, TOP_TRADER_RATIO_TIERS)}`}>
            {tk.buySellRatio.toFixed(3)}
          </div>
          {/* Taker buy/sell volume bar */}
          {(() => {
            const total = tk.buyVol + tk.sellVol;
            const buyPct = total > 0 ? (tk.buyVol / total) * 100 : 50;
            const sellPct = 100 - buyPct;
            return (
              <div className="flex h-5 rounded-full overflow-hidden text-xs font-bold">
                <div className="bg-green-500 flex items-center justify-center text-white transition-all duration-500" style={{ width: `${Math.max(buyPct, 12)}%` }}>
                  {buyPct.toFixed(0)}% Buy
                </div>
                <div className="bg-red-500 flex items-center justify-center text-white transition-all duration-500" style={{ width: `${Math.max(sellPct, 12)}%` }}>
                  {sellPct.toFixed(0)}% Sell
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </DashboardCard>
  );
}
