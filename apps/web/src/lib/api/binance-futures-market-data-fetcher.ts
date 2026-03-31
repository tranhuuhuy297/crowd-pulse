import type { FuturesBasisData, TopTraderLongShortData, TakerBuySellData } from "../types";
import { SYMBOL_DISPLAY_NAMES } from "../constants";

const BASE = "https://fapi.binance.com";

interface BinancePremiumIndex {
  symbol: string;
  markPrice: string;
  indexPrice: string;
}

interface BinanceLongShortEntry {
  symbol: string;
  longShortRatio: string;
  longAccount: string;
  shortAccount: string;
}

interface BinanceTakerEntry {
  buySellRatio: string;
  buyVol: string;
  sellVol: string;
}

/** Fetch futures basis (premium/discount) for each symbol */
export async function fetchAllFuturesBasis(
  symbols: readonly string[],
): Promise<FuturesBasisData[]> {
  const results = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const res = await fetch(`${BASE}/fapi/v1/premiumIndex?symbol=${symbol}`);
      if (!res.ok) return null;
      const data: BinancePremiumIndex = await res.json();
      const mark = parseFloat(data.markPrice);
      const index = parseFloat(data.indexPrice);
      if (isNaN(mark) || isNaN(index) || index === 0) return null;
      return {
        symbol: SYMBOL_DISPLAY_NAMES[symbol] ?? symbol,
        markPrice: mark,
        indexPrice: index,
        basisPct: ((mark - index) / index) * 100,
      };
    }),
  );
  return results
    .filter((r): r is PromiseFulfilledResult<FuturesBasisData | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((v): v is FuturesBasisData => v !== null);
}

/** Fetch top trader long/short position ratio for each symbol */
export async function fetchAllTopTraderLongShort(
  symbols: readonly string[],
): Promise<TopTraderLongShortData[]> {
  const results = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const res = await fetch(`${BASE}/futures/data/topLongShortPositionRatio?symbol=${symbol}&period=1h&limit=1`);
      if (!res.ok) return null;
      const entries: BinanceLongShortEntry[] = await res.json();
      if (!entries || entries.length === 0) return null;
      const ratio = parseFloat(entries[0]!.longShortRatio);
      if (isNaN(ratio)) return null;
      const longPct = parseFloat(entries[0]!.longAccount) * 100;
      const shortPct = parseFloat(entries[0]!.shortAccount) * 100;
      return {
        symbol: SYMBOL_DISPLAY_NAMES[symbol] ?? symbol,
        ratio, longPct, shortPct,
      };
    }),
  );
  return results
    .filter((r): r is PromiseFulfilledResult<TopTraderLongShortData | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((v): v is TopTraderLongShortData => v !== null);
}

/** Fetch taker buy/sell volume ratio for each symbol */
export async function fetchAllTakerBuySell(
  symbols: readonly string[],
): Promise<TakerBuySellData[]> {
  const results = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const res = await fetch(`${BASE}/futures/data/takerlongshortRatio?symbol=${symbol}&period=1h&limit=1`);
      if (!res.ok) return null;
      const entries: BinanceTakerEntry[] = await res.json();
      if (!entries || entries.length === 0) return null;
      const ratio = parseFloat(entries[0]!.buySellRatio);
      if (isNaN(ratio)) return null;
      return {
        symbol: SYMBOL_DISPLAY_NAMES[symbol] ?? symbol,
        buySellRatio: ratio,
        buyVol: parseFloat(entries[0]!.buyVol),
        sellVol: parseFloat(entries[0]!.sellVol),
      };
    }),
  );
  return results
    .filter((r): r is PromiseFulfilledResult<TakerBuySellData | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((v): v is TakerBuySellData => v !== null);
}
