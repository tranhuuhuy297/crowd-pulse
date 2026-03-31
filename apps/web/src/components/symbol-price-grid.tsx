import { useRef, useEffect } from "react";
import type { PriceSnapshot, BuyConclusionData } from "../lib/types";
import { formatPrice, formatPercent } from "../lib/number-format-utils";

interface SymbolPriceGridProps {
  prices: PriceSnapshot[];
  /** Currently selected asset display name (e.g. "BTC") */
  selectedAsset: string;
  /** Called when user clicks a different asset */
  onAssetChange: (displayName: string) => void;
  /** Buy recommendation per asset display name (e.g. { BTC: "BUY_NOW", ETH: "AVOID" }) */
  buyRecommendations?: Record<string, BuyConclusionData["recommendation"]>;
}

/** Brand colors per asset for the glow/accent effect */
const ASSET_COLORS: Record<string, string> = {
  BTC: "#F7931A",
  ETH: "#627EEA",
  SOL: "#9945FF",
  BNB: "#F3BA2F",
};

const ASSET_NAMES: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
  BNB: "BNB",
};

/** Crypto logo icons keyed by display name */
const ASSET_ICONS: Record<string, (props: { className?: string }) => React.ReactNode> = {
  BTC: BitcoinIcon,
  ETH: EthereumIcon,
  SOL: SolanaIcon,
  BNB: BnbIcon,
};

/** Extract display name from Binance symbol (BTCUSDT -> BTC) */
function toDisplayName(symbol: string): string {
  return symbol.replace("USDT", "");
}

/* ─── SVG Icons ───────────────────────────────────────────────── */

function BitcoinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#F7931A" />
      <path d="M22.5 14.2c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.7-.4-.7 2.6c-.4-.1-.9-.2-1.4-.3l.7-2.7-1.7-.4-.7 2.7c-.4-.1-.7-.2-1-.2l-2.3-.6-.4 1.8s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.3c0 .1.1.1.1.1l-.1 0-1.2 4.6c-.1.2-.3.6-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.9 2.2.5c.4.1.8.2 1.2.3l-.7 2.8 1.7.4.7-2.7c.5.1.9.2 1.4.3l-.7 2.7 1.7.4.7-2.8c2.9.5 5 .3 5.9-2.3.8-2.1 0-3.3-1.5-4.1 1.1-.3 1.9-1 2.1-2.5zm-3.8 5.3c-.5 2.2-4.2 1-5.4.7l1-3.9c1.2.3 5 .9 4.4 3.2zm.6-5.3c-.5 2-3.6.9-4.6.7l.9-3.5c1 .3 4.2.7 3.7 2.8z" fill="white" />
    </svg>
  );
}

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

function SolanaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#000" />
      <defs>
        <linearGradient id="sol-grad" x1="6" y1="24" x2="26" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9945FF" />
          <stop offset="0.5" stopColor="#14F195" />
          <stop offset="1" stopColor="#00D1FF" />
        </linearGradient>
      </defs>
      <path d="M9.2 20.8h12.4c.2 0 .4.1.5.2l1.7 1.7c.3.3.1.8-.3.8H11.1c-.2 0-.4-.1-.5-.2l-1.7-1.7c-.3-.3-.1-.8.3-.8z" fill="url(#sol-grad)" />
      <path d="M9.2 8.5h12.4c.2 0 .4.1.5.2l1.7 1.7c.3.3.1.8-.3.8H11.1c-.2 0-.4-.1-.5-.2L8.9 9.3c-.3-.3-.1-.8.3-.8z" fill="url(#sol-grad)" />
      <path d="M22.8 14.6H10.4c-.2 0-.4.1-.5.2l-1.7 1.8c.3.3-.1.8.3.8h12.4c.2 0 .4-.1.5-.2l1.7-1.8c.3-.3.1-.8-.3-.8z" fill="url(#sol-grad)" />
    </svg>
  );
}

function BnbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
      <path d="M16 7l3 3-3 3-3-3 3-3zm-5.5 5.5L13.5 16l-3 3-3-3 3-3zm11 0L24.5 16l-3 3-3-3 3-3zM16 18l3 3-3 3-3-3 3-3z" fill="white" />
    </svg>
  );
}

function DefaultIcon({ className }: { className?: string }) {
  return (
    <div className={`${className} rounded-full flex items-center justify-center font-bold text-white`} style={{ background: "var(--text-muted)" }}>
      ?
    </div>
  );
}

/* ─── Animated Price Display ──────────────────────────────────── */

/** Price text that flashes green/red briefly when value changes */
function AnimatedPrice({ price, className }: { price: number; className?: string }) {
  const prevPrice = useRef(price);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prevPrice.current !== price && spanRef.current) {
      const flash = price > prevPrice.current ? "text-green-400" : "text-red-400";
      spanRef.current.classList.add(flash);
      const timeout = setTimeout(() => spanRef.current?.classList.remove(flash), 600);
      prevPrice.current = price;
      return () => clearTimeout(timeout);
    }
    prevPrice.current = price;
  }, [price]);

  return (
    <span ref={spanRef} className={`transition-colors duration-600 ${className}`} style={{ color: "var(--text-primary)" }}>
      {formatPrice(price)}
    </span>
  );
}

/* ─── Asset Pill (clickable mini-ticker) ──────────────────────── */

/** Short labels for pill chips */
const BUY_CHIP_SHORT: Record<BuyConclusionData["recommendation"], { label: string; color: string }> = {
  BUY_NOW: { label: "Buy", color: "rgb(34, 197, 94)" },
  WAIT_FOR_DIP: { label: "Wait", color: "rgb(245, 158, 11)" },
  HOLD_OFF: { label: "Hold", color: "rgb(163, 163, 163)" },
  AVOID: { label: "Avoid", color: "rgb(239, 68, 68)" },
};

function AssetPill({ displayName, price, isActive, onClick, recommendation }: {
  displayName: string;
  price: PriceSnapshot;
  isActive: boolean;
  onClick: () => void;
  recommendation?: BuyConclusionData["recommendation"];
}) {
  const color = ASSET_COLORS[displayName] ?? "var(--text-muted)";
  const IconComponent = ASSET_ICONS[displayName] ?? DefaultIcon;
  const isPositive = price.change24hPct >= 0;
  const chip = recommendation ? BUY_CHIP_SHORT[recommendation] : null;

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg border
        transition-all duration-300 cursor-pointer
        ${isActive
          ? "scale-100 border-transparent shadow-lg"
          : "hover:scale-[1.02] border-transparent opacity-70 hover:opacity-100"
        }
      `}
      style={{
        background: isActive ? `${color}15` : "transparent",
        borderColor: isActive ? `${color}40` : "transparent",
        boxShadow: isActive ? `0 0 12px ${color}20` : "none",
      }}
    >
      <IconComponent className="w-6 h-6" />
      <div className="flex flex-col items-start">
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold leading-tight" style={{ color: isActive ? color : "var(--text-primary)" }}>
            {displayName}
          </span>
          {chip && (
            <span
              className="text-[9px] font-semibold leading-none px-1 py-0.5 rounded"
              style={{ color: chip.color, background: `${chip.color}20` }}
            >
              {chip.label}
            </span>
          )}
        </div>
        <span className={`text-xs leading-tight ${isPositive ? "text-green-500" : "text-red-500"}`}>
          {isPositive ? "+" : ""}{price.change24hPct.toFixed(1)}%
        </span>
      </div>
    </button>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */

/** Interactive price card with built-in asset switcher pills and animated hero price */
export function SymbolPriceGrid({ prices, selectedAsset, onAssetChange, buyRecommendations }: SymbolPriceGridProps) {
  if (prices.length === 0) {
    return (
      <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>No price data available</p>
    );
  }

  const selected = prices.find((p) => toDisplayName(p.symbol) === selectedAsset);
  const accentColor = ASSET_COLORS[selectedAsset] ?? "var(--text-muted)";
  const IconComponent = ASSET_ICONS[selectedAsset] ?? DefaultIcon;

  return (
    <div className="flex flex-col gap-3">
      {/* Hero: selected asset large display */}
      {selected && (
        <div
          key={selectedAsset}
          className="flex items-center gap-4 animate-[fadeSlideIn_0.3s_ease-out]"
        >
          {/* Glowing icon */}
          <div className="relative shrink-0">
            <IconComponent className="w-11 h-11 relative z-10" />
            <div
              className="absolute inset-0 rounded-full blur-lg opacity-30 animate-pulse"
              style={{ background: accentColor }}
            />
          </div>

          {/* Name + price */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: accentColor }}>
                {ASSET_NAMES[selectedAsset] ?? selectedAsset}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ color: "var(--text-muted)", background: "var(--bg-tertiary)" }}>
                {selectedAsset}/USDT
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <AnimatedPrice price={selected.price} className="text-2xl font-bold tracking-tight" />
              {(() => {
                const isPositive = selected.change24hPct >= 0;
                return (
                  <span className={`text-sm font-semibold ${isPositive ? "text-green-500" : "text-red-500"}`}>
                    {isPositive ? "▲" : "▼"} {formatPercent(selected.change24hPct)}
                    <span className="font-normal ml-1" style={{ color: "var(--text-muted)" }}>24h</span>
                  </span>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Asset switcher pills */}
      <div className="flex gap-1">
        {prices.map((p) => {
          const dn = toDisplayName(p.symbol);
          return (
            <AssetPill
              key={dn}
              displayName={dn}
              price={p}
              isActive={dn === selectedAsset}
              onClick={() => onAssetChange(dn)}
              recommendation={buyRecommendations?.[dn]}
            />
          );
        })}
      </div>
    </div>
  );
}
