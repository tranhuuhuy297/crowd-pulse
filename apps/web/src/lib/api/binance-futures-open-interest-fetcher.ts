import type { OpenInterestData } from "../types";

const FUTURES_DATA_BASE = "https://fapi.binance.com";

interface BinanceCurrentOI {
  symbol: string;
  openInterest: string;
  time: number;
}

interface BinanceHistoricalOI {
  symbol: string;
  sumOpenInterest: string;
  sumOpenInterestValue: string;
  timestamp: number;
}

/** Fetch current + 14-day historical OI for a single symbol, compute change % */
async function fetchOpenInterestForSymbol(symbol: string): Promise<OpenInterestData | null> {
  try {
    const [currentRes, histRes] = await Promise.all([
      fetch(`${FUTURES_DATA_BASE}/fapi/v1/openInterest?symbol=${symbol}`),
      fetch(`${FUTURES_DATA_BASE}/futures/data/openInterestHist?symbol=${symbol}&period=1d&limit=14`),
    ]);

    if (!currentRes.ok || !histRes.ok) return null;

    const current: BinanceCurrentOI = await currentRes.json();
    const historical: BinanceHistoricalOI[] = await histRes.json();

    if (!historical || historical.length === 0) return null;

    const currentOI = parseFloat(current.openInterest);
    if (isNaN(currentOI)) return null;

    const avgOI = historical.reduce((s, h) => s + parseFloat(h.sumOpenInterest), 0) / historical.length;
    if (avgOI === 0 || isNaN(avgOI)) return null;

    const changePercent = ((currentOI - avgOI) / avgOI) * 100;

    return { symbol, currentOI, avgOI, changePercent };
  } catch {
    return null;
  }
}

/** Fetch open interest for multiple symbols in parallel */
export async function fetchAllOpenInterest(
  symbols: readonly string[],
): Promise<OpenInterestData[]> {
  const results = await Promise.allSettled(
    symbols.map((s) => fetchOpenInterestForSymbol(s)),
  );
  return results
    .filter((r): r is PromiseFulfilledResult<OpenInterestData | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((v): v is OpenInterestData => v !== null);
}
