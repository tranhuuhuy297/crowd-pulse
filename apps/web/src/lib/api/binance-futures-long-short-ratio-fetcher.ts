import type { LongShortData, LongShortRatios } from "../types";

const FUTURES_DATA_BASE = "https://fapi.binance.com/futures/data";

interface BinanceLongShortEntry {
  symbol: string;
  longShortRatio: string;
  longAccount: string;
  shortAccount: string;
  timestamp: string;
}

/**
 * Fetch a single long/short ratio entry from a Binance Futures endpoint.
 * Uses /futures/data/ path — /fapi/v1/ is geo-blocked in some regions.
 */
async function fetchRatio(
  endpoint: string,
  symbol: string,
  period = "1h",
): Promise<LongShortData | null> {
  try {
    const res = await fetch(
      `${FUTURES_DATA_BASE}/${endpoint}?symbol=${symbol}&period=${period}&limit=1`,
    );
    if (!res.ok) return null;

    const entries: BinanceLongShortEntry[] = await res.json();
    if (!entries || entries.length === 0) return null;

    return {
      symbol,
      ratio: parseFloat(entries[0]!.longShortRatio),
    };
  } catch {
    return null;
  }
}

/** Fetch ratios from one endpoint for multiple symbols in parallel */
async function fetchRatiosForSymbols(
  endpoint: string,
  symbols: readonly string[],
): Promise<LongShortData[]> {
  const results = await Promise.allSettled(
    symbols.map((s) => fetchRatio(endpoint, s)),
  );
  return results
    .filter((r): r is PromiseFulfilledResult<LongShortData | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((v): v is LongShortData => v !== null);
}

/**
 * Fetch global long/short account ratio for given symbols.
 * Uses Binance Futures globalLongShortAccountRatio endpoint.
 */
export async function fetchAllLongShortData(
  symbols: readonly string[],
): Promise<LongShortRatios> {
  return fetchRatiosForSymbols("globalLongShortAccountRatio", symbols);
}
