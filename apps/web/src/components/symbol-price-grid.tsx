import type { PriceSnapshot } from "../lib/types";
import { formatPrice, formatPercent } from "../lib/number-format-utils";

interface SymbolPriceGridProps {
  prices: PriceSnapshot[];
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

/** Ethereum logo SVG icon */
function EthereumIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#627EEA" />
      <path d="M16 4v8.87l7.5 3.35L16 4z" fill="white" fillOpacity="0.6" />
      <path d="M16 4L8.5 16.22 16 12.87V4z" fill="white" />
      <path d="M16 21.97v6.03l7.5-10.4L16 21.97z" fill="white" fillOpacity="0.6" />
      <path d="M16 28V21.97L8.5 17.6 16 28z" fill="white" />
      <path d="M16 20.57l7.5-4.35L16 12.87v7.7z" fill="white" fillOpacity="0.2" />
      <path d="M8.5 16.22l7.5 4.35v-7.7l-7.5 3.35z" fill="white" fillOpacity="0.6" />
    </svg>
  );
}

/** Render a single price row */
function PriceRow({ icon, name, pair, price, change, sizeClass = "text-2xl" }: {
  icon: React.ReactNode;
  name: string;
  pair: string;
  price: number;
  change: number | null;
  sizeClass?: string;
}) {
  const isPositive = change !== null && change >= 0;
  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <div className="flex items-center gap-3 shrink-0">
        {icon}
        <div>
          <p className="text-base font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{name}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{pair}</p>
        </div>
      </div>
      <div className="w-px h-10 hidden sm:block" style={{ background: "var(--divider)" }} />
      <div className="flex flex-col gap-0.5">
        <span className={`${sizeClass} font-bold tracking-tight leading-tight`} style={{ color: "var(--text-primary)" }}>
          {formatPrice(price)}
        </span>
        {change !== null && (
          <span className={`text-sm font-semibold ${isPositive ? "text-green-500" : "text-red-500"}`}>
            {isPositive ? "▲" : "▼"} {formatPercent(change)}
            <span className="font-normal ml-1.5" style={{ color: "var(--text-muted)" }}>24h</span>
          </span>
        )}
      </div>
    </div>
  );
}

/** BTC + ETH price display */
export function SymbolPriceGrid({ prices }: SymbolPriceGridProps) {
  if (prices.length === 0) {
    return (
      <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>No price data available</p>
    );
  }

  const btc = prices[0]!;
  const eth = prices.find(p => p.symbol === "ETHUSDT");

  return (
    <div className="flex flex-col gap-2">
      <PriceRow
        icon={<BitcoinIcon className="w-10 h-10" />}
        name="Bitcoin"
        pair="BTC/USDT"
        price={btc.price}
        change={btc.change24hPct}
      />
      {eth && (
        <PriceRow
          icon={<EthereumIcon className="w-8 h-8" />}
          name="Ethereum"
          pair="ETH/USDT"
          price={eth.price}
          change={eth.change24hPct}
          sizeClass="text-xl"
        />
      )}
    </div>
  );
}
