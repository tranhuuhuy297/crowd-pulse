import type { PriceSnapshot } from "@crowdpulse/shared";
import { SymbolPriceCard } from "./symbol-price-card";

interface SymbolPriceGridProps {
  prices: Record<string, PriceSnapshot>;
}

/** 2x2 responsive grid of SymbolPriceCards for tracked crypto symbols */
export function SymbolPriceGrid({ prices }: SymbolPriceGridProps) {
  const entries = Object.entries(prices);

  if (entries.length === 0) {
    return (
      <p className="text-gray-600 text-sm text-center py-4">No price data available</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {entries.map(([symbol, snapshot]) => (
        <SymbolPriceCard key={symbol} symbol={symbol} snapshot={snapshot} />
      ))}
    </div>
  );
}
