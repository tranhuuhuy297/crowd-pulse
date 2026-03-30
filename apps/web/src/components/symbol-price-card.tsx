import type { PriceSnapshot } from "../lib/types";
import { formatPrice, formatPercent } from "../lib/number-format-utils";

interface SymbolPriceCardProps {
  symbol: string;
  snapshot: PriceSnapshot;
}

/** Returns RSI color class: green if oversold (<30), red if overbought (>70), neutral otherwise */
function getRsiColor(rsi: number | null): string {
  if (rsi === null) return "text-gray-500";
  if (rsi < 30) return "text-emerald-400";
  if (rsi > 70) return "text-red-400";
  return "text-gray-400";
}

/** Compact card showing symbol price, 1h change, and RSI indicator */
export function SymbolPriceCard({ symbol, snapshot }: SymbolPriceCardProps) {
  const { price, change24hPct: change1h, rsi } = snapshot;
  const isPositive = change1h !== null && change1h >= 0;
  const rsiColor = getRsiColor(rsi);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-200 tracking-wide">{symbol}</span>
        {rsi !== null && (
          <span className={`text-xs font-medium ${rsiColor}`}>
            RSI {rsi.toFixed(1)}
          </span>
        )}
      </div>

      <p className="text-xl font-semibold text-gray-100">{formatPrice(price)}</p>

      <div className="flex items-center gap-1">
        {change1h !== null ? (
          <>
            <span className={`text-sm font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
              {isPositive ? "▲" : "▼"} {formatPercent(change1h)}
            </span>
            <span className="text-xs text-gray-600">24h</span>
          </>
        ) : (
          <span className="text-xs text-gray-600">No 24h data</span>
        )}
      </div>
    </div>
  );
}
