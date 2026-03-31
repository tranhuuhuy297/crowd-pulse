import { TRACKED_SYMBOLS } from "@crowdpulse/shared";
import { logger } from "../lib/logger-instance";

export interface LongShortRatioData {
  symbol: string;
  longShortRatio: number;
  longAccount: number;
  shortAccount: number;
  timestamp: Date;
}

interface BinanceRatioEntry {
  symbol: string;
  longShortRatio: string;
  longAccount: string;
  shortAccount: string;
  timestamp: number;
}

/**
 * Fetches the global long/short account ratio from Binance Futures public API.
 * No API key required. Returns the most recent entry for each tracked symbol.
 */
async function fetchRatioForSymbol(symbol: string): Promise<LongShortRatioData | null> {
  // Use www.binance.com proxy — fapi.binance.com is geo-blocked in some regions
  const url = `https://www.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=1h&limit=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      logger.warn({ symbol, status: response.status }, "Binance futures ratio request failed");
      return null;
    }

    const data = (await response.json()) as BinanceRatioEntry[];
    if (!data || data.length === 0) return null;

    const entry = data[0];
    if (!entry) return null;
    return {
      symbol,
      longShortRatio: parseFloat(entry.longShortRatio),
      longAccount: parseFloat(entry.longAccount),
      shortAccount: parseFloat(entry.shortAccount),
      timestamp: new Date(entry.timestamp),
    };
  } catch (err) {
    logger.warn({ symbol, err }, "Binance futures ratio fetch error");
    return null;
  }
}

/**
 * Fetches long/short ratios for all tracked symbols from Binance Futures.
 * Only includes symbols that have futures markets (BTC, ETH).
 */
export async function fetchBinanceLongShortRatios(): Promise<LongShortRatioData[]> {
  // Only BTC and ETH have liquid futures long/short data
  const futuresSymbols = TRACKED_SYMBOLS.filter((s) =>
    ["BTCUSDT", "ETHUSDT"].includes(s)
  );

  const results = await Promise.all(futuresSymbols.map(fetchRatioForSymbol));
  return results.filter((r): r is LongShortRatioData => r !== null);
}
