import type { FundingRateData } from "../types";

const FUTURES_DATA_BASE = "https://fapi.binance.com";

interface BinanceFundingRateEntry {
  symbol: string;
  fundingRate: string;
  fundingTime: number;
}

/** Fetch latest funding rate for a single symbol */
async function fetchFundingRateForSymbol(symbol: string): Promise<FundingRateData | null> {
  try {
    const res = await fetch(
      `${FUTURES_DATA_BASE}/fapi/v1/fundingRate?symbol=${symbol}&limit=1`,
    );
    if (!res.ok) return null;

    const entries: BinanceFundingRateEntry[] = await res.json();
    if (!entries || entries.length === 0) return null;

    const rate = parseFloat(entries[0]!.fundingRate);
    if (isNaN(rate)) return null;

    return { symbol, rate, timestamp: entries[0]!.fundingTime };
  } catch {
    return null;
  }
}

/** Fetch funding rates for multiple symbols in parallel */
export async function fetchAllFundingRates(
  symbols: readonly string[],
): Promise<FundingRateData[]> {
  const results = await Promise.allSettled(
    symbols.map((s) => fetchFundingRateForSymbol(s)),
  );
  return results
    .filter((r): r is PromiseFulfilledResult<FundingRateData | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((v): v is FundingRateData => v !== null);
}
