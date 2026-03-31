import { BINANCE_BASE_URL, SYMBOL_DISPLAY_NAMES } from "../constants";
import type { PriceSnapshot } from "../types";

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
}

/**
 * Fetch 24hr ticker data for multiple symbols from Binance spot API.
 * Returns price and 24h change % per symbol.
 */
export async function fetchSpotTickers(symbols: readonly string[]): Promise<PriceSnapshot[]> {
  try {
    const symbolsParam = JSON.stringify([...symbols]);
    const res = await fetch(`${BINANCE_BASE_URL}/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`);
    if (!res.ok) return [];

    const tickers: BinanceTicker[] = await res.json();

    return tickers.map((t) => ({
      symbol: SYMBOL_DISPLAY_NAMES[t.symbol] ?? t.symbol,
      price: parseFloat(t.lastPrice),
      change24hPct: parseFloat(t.priceChangePercent),
      rsi: null,
    }));
  } catch {
    return [];
  }
}

/** Kline data: [openTime, open, high, low, close, volume, ...] */
type BinanceKline = [number, string, string, string, string, string, ...unknown[]];

export interface KlineData {
  closes: number[];
  highs: number[];
  lows: number[];
}

/**
 * Fetch kline (candlestick) data for a single symbol.
 * Returns closes, highs, lows for RSI and support/resistance.
 */
export async function fetchKlineClosesAndVolumes(
  symbol: string,
  interval = "1d",
  limit = 30,
): Promise<KlineData | null> {
  try {
    const res = await fetch(
      `${BINANCE_BASE_URL}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    );
    if (!res.ok) return null;

    const klines: BinanceKline[] = await res.json();

    return {
      closes: klines.map((k) => parseFloat(k[4])),
      highs: klines.map((k) => parseFloat(k[2])),
      lows: klines.map((k) => parseFloat(k[3])),
    };
  } catch {
    return null;
  }
}
