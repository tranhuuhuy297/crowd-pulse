import { TRACKED_SYMBOLS, SYMBOL_DISPLAY_NAMES } from "./constants";
import { fetchFearGreedIndex } from "./api/fear-greed-index-fetcher";
import { fetchSpotTickers, fetchKlineClosesAndVolumes } from "./api/binance-spot-price-and-klines-fetcher";
import { fetchAllLongShortData } from "./api/binance-futures-long-short-ratio-fetcher";
import { fetchAllFundingRates } from "./api/binance-futures-funding-rate-fetcher";
import { fetchAllOpenInterest } from "./api/binance-futures-open-interest-fetcher";
import { fetchAllFuturesBasis, fetchAllTopTraderLongShort, fetchAllTakerBuySell } from "./api/binance-futures-market-data-fetcher";
import { calculateRSI } from "./rsi-wilder-smoothing-calculator";
import { calculateCrowdPulseScore, normalizeToHundred } from "./crowd-pulse-score-calculator";
import { calculateBuyConclusion } from "./price-level-calculator";
import type {
  DashboardData, PriceSnapshot, LongShortData, FundingRateData,
  OpenInterestData, DataSourceHealth, AssetDashboardData,
} from "./types";

/** Normalize long/short ratio: [0.5, 2.0] -> [0, 100] */
function normalizeLongShortRatio(ratio: number): number {
  return normalizeToHundred(ratio, 0.7, 1.5);
}

/** Build per-asset dashboard data from raw arrays */
function buildAssetData(
  symbol: string,
  displayName: string,
  prices: PriceSnapshot[],
  klineResults: (Awaited<ReturnType<typeof fetchKlineClosesAndVolumes>> | null)[],
  symbolIndex: number,
  longShortRaw: LongShortData[],
  fundingRatesRaw: FundingRateData[],
  openInterestRaw: OpenInterestData[],
  futuresBasisRaw: { symbol: string; markPrice: number; indexPrice: number; basisPct: number }[],
  topTraderRaw: { symbol: string; ratio: number; longPct: number; shortPct: number }[],
  takerRaw: { symbol: string; buySellRatio: number; buyVol: number; sellVol: number }[],
  fearGreedValue: number,
): AssetDashboardData {
  const price = prices[symbolIndex] ?? null;
  const klineData = klineResults[symbolIndex] ?? null;

  // Per-asset metrics — some fetchers return raw symbol (BTCUSDT), others display name (BTC)
  const match = (d: { symbol: string }) => d.symbol === symbol || d.symbol === displayName;
  const ls = longShortRaw.find(match) ?? null;
  const fr = fundingRatesRaw.find(match) ?? null;
  const oi = openInterestRaw.find(match) ?? null;
  const basis = futuresBasisRaw.find(match) ?? null;
  const tt = topTraderRaw.find(match) ?? null;
  const tk = takerRaw.find(match) ?? null;

  // Normalize components for score
  const normalizedLS = ls ? normalizeLongShortRatio(ls.ratio) : null;
  const normalizedFR = fr ? normalizeToHundred(fr.rate, -0.0003, 0.0005) : null;
  const normalizedOI = oi ? normalizeToHundred(oi.changePercent, -20, 20) : null;
  const rsi = klineData ? calculateRSI(klineData.closes) : null;

  const { score, signal } = calculateCrowdPulseScore({
    fearGreed: fearGreedValue,
    avgRsi: rsi,
    longShortRatio: normalizedLS,
    fundingRate: normalizedFR,
    openInterest: normalizedOI,
  });

  // Buy conclusion from price levels
  const buyConclusion =
    score !== null && price && klineData && klineData.highs.length > 0
      ? calculateBuyConclusion(signal, score, price.price, rsi, klineData.highs, klineData.lows, fr?.rate ?? null)
      : null;

  return {
    crowdPulse: {
      score,
      signal,
      updatedAt: new Date().toISOString(),
      components: { fearGreed: fearGreedValue, avgRsi: rsi, longShortRatio: normalizedLS, fundingRate: normalizedFR, openInterest: normalizedOI },
    },
    price,
    longShort: ls ? { ...ls, symbol: displayName } : null,
    fundingRate: fr ? { ...fr, symbol: displayName } : null,
    openInterest: oi ? { ...oi, symbol: displayName } : null,
    futuresBasis: basis ? { ...basis, symbol: displayName } : null,
    topTraderLongShort: tt ? { ...tt, symbol: displayName } : null,
    takerBuySell: tk ? { ...tk, symbol: displayName } : null,
    buyConclusion,
  };
}

/** Fetch all dashboard data sources in parallel, compute per-asset scores */
export async function fetchAllDashboardData(): Promise<DashboardData> {
  const [fearGreedResult, tickersResult, klinesResult, longShortResult, fundingRateResult, openInterestResult, basisResult, topTraderResult, takerResult] = await Promise.allSettled([
    fetchFearGreedIndex(),
    fetchSpotTickers(TRACKED_SYMBOLS),
    Promise.all(TRACKED_SYMBOLS.map((s) => fetchKlineClosesAndVolumes(s))),
    fetchAllLongShortData(TRACKED_SYMBOLS),
    fetchAllFundingRates(TRACKED_SYMBOLS),
    fetchAllOpenInterest(TRACKED_SYMBOLS),
    fetchAllFuturesBasis(TRACKED_SYMBOLS),
    fetchAllTopTraderLongShort(TRACKED_SYMBOLS),
    fetchAllTakerBuySell(TRACKED_SYMBOLS),
  ]);

  const dataSourceHealth: DataSourceHealth = {
    fearGreed: fearGreedResult.status === "fulfilled",
    prices: tickersResult.status === "fulfilled",
    klines: klinesResult.status === "fulfilled",
    longShort: longShortResult.status === "fulfilled",
    fundingRate: fundingRateResult.status === "fulfilled" && fundingRateResult.value.length > 0,
    openInterest: openInterestResult.status === "fulfilled" && openInterestResult.value.length > 0,
  };

  const fearGreed = fearGreedResult.status === "fulfilled" ? fearGreedResult.value : null;
  const tickers = tickersResult.status === "fulfilled" ? tickersResult.value : [];
  const klineResults = klinesResult.status === "fulfilled" ? klinesResult.value : [];
  const longShortRaw = longShortResult.status === "fulfilled" ? longShortResult.value : [];
  const fundingRatesRaw = fundingRateResult.status === "fulfilled" ? fundingRateResult.value : [];
  const openInterestRaw = openInterestResult.status === "fulfilled" ? openInterestResult.value : [];
  const futuresBasisRaw = basisResult.status === "fulfilled" ? basisResult.value : [];
  const topTraderRaw = topTraderResult.status === "fulfilled" ? topTraderResult.value : [];
  const takerRaw = takerResult.status === "fulfilled" ? takerResult.value : [];

  const fgValue = fearGreed?.value ?? 50;

  // Build prices with RSI
  const prices: PriceSnapshot[] = tickers.map((t, i) => {
    const klineData = klineResults[i] ?? null;
    const rsi = klineData ? calculateRSI(klineData.closes) : null;
    return { ...t, rsi };
  });

  // Build per-asset data
  const assets: Record<string, AssetDashboardData> = {};
  for (let i = 0; i < TRACKED_SYMBOLS.length; i++) {
    const symbol = TRACKED_SYMBOLS[i]!;
    const displayName = SYMBOL_DISPLAY_NAMES[symbol] ?? symbol;
    assets[displayName] = buildAssetData(
      symbol, displayName, prices, klineResults, i,
      longShortRaw, fundingRatesRaw, openInterestRaw,
      futuresBasisRaw, topTraderRaw, takerRaw, fgValue,
    );
  }

  return {
    assets,
    fearGreed: fearGreed ?? { value: 0, classification: "Unknown", change24h: null },
    prices,
    dataSourceHealth,
  };
}
