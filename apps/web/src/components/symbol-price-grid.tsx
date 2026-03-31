import type { PriceSnapshot } from "../lib/types";
import { formatPrice, formatPercent } from "../lib/number-format-utils";
import { InfoTooltip } from "./info-tooltip";

interface SymbolPriceGridProps {
  prices: PriceSnapshot[];
}

/** Returns RSI color class: green if oversold (<30), red if overbought (>70), neutral otherwise */
function getRsiColor(rsi: number | null): string {
  if (rsi === null) return "";
  if (rsi < 30) return "text-green-500";
  if (rsi > 70) return "text-red-500";
  return "";
}

/** Format volume as compact string, e.g. "1.2B" or "450M" */
function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
  return `$${vol.toFixed(0)}`;
}

/** Bitcoin logo SVG icon */
function BitcoinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#F7931A" />
      <path
        d="M22.5 14.2c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.7-.4-.7 2.6c-.4-.1-.9-.2-1.4-.3l.7-2.7-1.7-.4-.7 2.7c-.4-.1-.7-.2-1-.2l-2.3-.6-.4 1.8s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.3c0 .1.1.1.1.1l-.1 0-1.2 4.6c-.1.2-.3.6-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.9 2.2.5c.4.1.8.2 1.2.3l-.7 2.8 1.7.4.7-2.7c.5.1.9.2 1.4.3l-.7 2.7 1.7.4.7-2.8c2.9.5 5 .3 5.9-2.3.8-2.1 0-3.3-1.5-4.1 1.1-.3 1.9-1 2.1-2.5zm-3.8 5.3c-.5 2.2-4.2 1-5.4.7l1-3.9c1.2.3 5 .9 4.4 3.2zm.6-5.3c-.5 2-3.6.9-4.6.7l.9-3.5c1 .3 4.2.7 3.7 2.8z"
        fill="white"
      />
    </svg>
  );
}

/** BTC price card with clear Bitcoin branding, price, 24h change, RSI, and volume */
export function SymbolPriceGrid({ prices }: SymbolPriceGridProps) {
  if (prices.length === 0) {
    return (
      <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>No price data available</p>
    );
  }

  const btc = prices[0]!;
  const isPositive = btc.change24hPct !== null && btc.change24hPct >= 0;
  const rsiColor = getRsiColor(btc.rsi);

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      {/* Bitcoin identity */}
      <div className="flex items-center gap-3 shrink-0">
        <BitcoinIcon className="w-10 h-10" />
        <div>
          <p className="text-base font-bold leading-tight" style={{ color: "var(--text-primary)" }}>Bitcoin</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>BTC/USDT</p>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-10 hidden sm:block" style={{ background: "var(--divider)" }} />

      {/* Price + change */}
      <div className="flex flex-col gap-0.5">
        <span className="text-2xl font-bold tracking-tight leading-tight" style={{ color: "var(--text-primary)" }}>
          {formatPrice(btc.price)}
        </span>
        {btc.change24hPct !== null && (
          <span className={`text-sm font-semibold ${isPositive ? "text-green-500" : "text-red-500"}`}>
            {isPositive ? "▲" : "▼"} {formatPercent(btc.change24hPct)}
            <span className="font-normal ml-1.5" style={{ color: "var(--text-muted)" }}>24h</span>
          </span>
        )}
      </div>

      {/* RSI + Volume stats */}
      <div className="flex items-center gap-3 ml-auto flex-wrap">
        {btc.rsi !== null && (
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase flex items-center gap-0.5" style={{ color: "var(--text-muted)" }}>
              RSI
              <InfoTooltip placement="bottom" content="RSI-14. >70 overbought, <30 oversold." />
            </span>
            <span className={`text-sm font-semibold ${rsiColor}`} style={rsiColor ? undefined : { color: "var(--text-secondary)" }}>{btc.rsi.toFixed(1)}</span>
          </div>
        )}
        {btc.volume24h > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase flex items-center gap-0.5" style={{ color: "var(--text-muted)" }}>
              Volume
              <InfoTooltip placement="bottom" content="24h spot volume from Binance." />
            </span>
            <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{formatVolume(btc.volume24h)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
