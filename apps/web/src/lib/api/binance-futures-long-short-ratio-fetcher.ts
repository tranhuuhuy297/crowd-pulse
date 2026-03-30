import { BINANCE_FUTURES_BASE_URL } from "../constants";
import type { LongShortData } from "../types";

interface BinanceLongShortEntry {
  symbol: string;
  longShortRatio: string;
  longAccount: string;
  shortAccount: string;
  timestamp: string;
}

/**
 * Fetch global long/short account ratio from Binance Futures API.
 * High ratio (>1) = more longs = crowd bullish = greed signal.
 * Returns null on failure.
 */
export async function fetchLongShortRatio(
  symbol: string,
  period = "1h",
): Promise<LongShortData | null> {
  try {
    const res = await fetch(
      `${BINANCE_FUTURES_BASE_URL}/fapi/v1/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=1`,
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

/**
 * Fetch long/short ratios for multiple symbols in parallel.
 * Returns only successful results.
 */
export async function fetchAllLongShortRatios(
  symbols: readonly string[],
): Promise<LongShortData[]> {
  const results = await Promise.allSettled(
    symbols.map((s) => fetchLongShortRatio(s)),
  );

  return results
    .filter((r): r is PromiseFulfilledResult<LongShortData | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((v): v is LongShortData => v !== null);
}
