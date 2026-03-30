import { BINANCE_BASE_URL } from "@crowdpulse/shared";

export interface RawKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

/**
 * Fetches OHLCV kline data from Binance REST API.
 * @param symbol - Trading pair e.g. "BTCUSDT"
 * @param interval - Kline interval e.g. "1m", "1h"
 * @param limit - Number of candles to fetch (max 1000)
 */
export async function fetchKlines(
  symbol: string,
  interval: string,
  limit: number
): Promise<RawKline[]> {
  const url = `${BINANCE_BASE_URL}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status} ${response.statusText} for ${symbol}`);
  }

  // Binance returns array of arrays:
  // [openTime, open, high, low, close, volume, closeTime, ...]
  const raw = (await response.json()) as unknown[][];

  return raw.map((item) => ({
    openTime: item[0] as number,
    open: item[1] as string,
    high: item[2] as string,
    low: item[3] as string,
    close: item[4] as string,
    volume: item[5] as string,
    closeTime: item[6] as number,
  }));
}
