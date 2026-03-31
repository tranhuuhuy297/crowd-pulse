import { TRACKED_SYMBOLS, SYMBOL_DISPLAY_NAMES } from "./constants";
import { fetchFearGreedIndex } from "./api/fear-greed-index-fetcher";
import { fetchSpotTickers, fetchKlineClosesAndVolumes } from "./api/binance-spot-price-and-klines-fetcher";
import { fetchAllLongShortData } from "./api/binance-futures-long-short-ratio-fetcher";
import { fetchAllFundingRates } from "./api/binance-futures-funding-rate-fetcher";
import { fetchAllOpenInterest } from "./api/binance-futures-open-interest-fetcher";
import { calculateRSI } from "./rsi-wilder-smoothing-calculator";
import { calculateCrowdPulseScore, normalizeToHundred } from "./crowd-pulse-score-calculator";
import { calculateBuyConclusion } from "./price-level-calculator";
import type { DashboardData, PriceSnapshot, LongShortData, FundingRateData, OpenInterestData, DataSourceHealth } from "./types";

/** Normalize long/short ratio: [0.5, 2.0] -> [0, 100] */
function normalizeLongShortRatio(ratios: LongShortData[]): number | null {
  if (ratios.length === 0) return null;
  const avg = ratios.reduce((s, r) => s + r.ratio, 0) / ratios.length;
  return normalizeToHundred(avg, 0.5, 2.0);
}

/** Fetch all dashboard data sources in parallel, compute score and buy conclusion */
export async function fetchAllDashboardData(): Promise<DashboardData> {
  const [fearGreedResult, tickersResult, klinesResult, longShortResult, fundingRateResult, openInterestResult] = await Promise.allSettled([
    fetchFearGreedIndex(),
    fetchSpotTickers(TRACKED_SYMBOLS),
    Promise.all(TRACKED_SYMBOLS.map((s) => fetchKlineClosesAndVolumes(s))),
    fetchAllLongShortData(TRACKED_SYMBOLS),
    fetchAllFundingRates(TRACKED_SYMBOLS),
    fetchAllOpenInterest(TRACKED_SYMBOLS),
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

  // Calculate RSI per symbol from klines
  const rsiValues: number[] = [];
  let btcKlineHighs: number[] = [];
  let btcKlineLows: number[] = [];
  const prices: PriceSnapshot[] = tickers.map((t, i) => {
    const klineData = klineResults[i] ?? null;
    let rsi: number | null = null;
    if (klineData) {
      rsi = calculateRSI(klineData.closes);
      if (rsi !== null) rsiValues.push(rsi);
      if (i === 0) {
        btcKlineHighs = klineData.highs;
        btcKlineLows = klineData.lows;
      }
    }
    return { ...t, rsi };
  });

  // Extract and map display names for each data source
  const longShortRaw: LongShortData[] = longShortResult.status === "fulfilled" ? longShortResult.value : [];
  const longShortDisplay = longShortRaw.map((ls) => ({ ...ls, symbol: SYMBOL_DISPLAY_NAMES[ls.symbol] ?? ls.symbol }));

  const fundingRatesRaw: FundingRateData[] = fundingRateResult.status === "fulfilled" ? fundingRateResult.value : [];
  const fundingRatesDisplay = fundingRatesRaw.map((fr) => ({ ...fr, symbol: SYMBOL_DISPLAY_NAMES[fr.symbol] ?? fr.symbol }));

  const openInterestRaw: OpenInterestData[] = openInterestResult.status === "fulfilled" ? openInterestResult.value : [];
  const openInterestDisplay = openInterestRaw.map((oi) => ({ ...oi, symbol: SYMBOL_DISPLAY_NAMES[oi.symbol] ?? oi.symbol }));

  // Compute aggregates for score
  const avgRsi = rsiValues.length > 0 ? rsiValues.reduce((s, v) => s + v, 0) / rsiValues.length : null;
  const normalizedLongShort = normalizeLongShortRatio(longShortRaw);

  const avgFundingRate = fundingRatesRaw.length > 0
    ? fundingRatesRaw.reduce((s, fr) => s + fr.rate, 0) / fundingRatesRaw.length : null;
  const normalizedFundingRate = avgFundingRate !== null ? normalizeToHundred(avgFundingRate, -0.0005, 0.001) : null;

  const avgOIChange = openInterestRaw.length > 0
    ? openInterestRaw.reduce((s, oi) => s + oi.changePercent, 0) / openInterestRaw.length : null;
  const normalizedOI = avgOIChange !== null ? normalizeToHundred(avgOIChange, -30, 30) : null;

  // Lookup BTC by symbol — not by index — to avoid wrong-coin bugs if TRACKED_SYMBOLS reorders
  const btcIndex = TRACKED_SYMBOLS.indexOf("BTCUSDT");
  const btcPrice = btcIndex >= 0 ? (prices[btcIndex]?.price ?? null) : null;
  const btcRsi = btcIndex >= 0 ? (prices[btcIndex]?.rsi ?? null) : null;

  const fgValue = fearGreed?.value ?? 50; // neutral fallback when F&G API fails — weight still applied
  const { score, signal } = calculateCrowdPulseScore({
    fearGreed: fgValue, avgRsi,
    longShortRatio: normalizedLongShort, fundingRate: normalizedFundingRate, openInterest: normalizedOI,
  });

  const buyConclusion = (score !== null && btcPrice !== null && btcKlineHighs.length > 0)
    ? calculateBuyConclusion(signal, score, btcPrice, btcRsi, btcKlineHighs, btcKlineLows, avgFundingRate) : null;

  return {
    crowdPulse: {
      score, signal, updatedAt: new Date().toISOString(),
      components: { fearGreed: fgValue, avgRsi, longShortRatio: normalizedLongShort, fundingRate: normalizedFundingRate, openInterest: normalizedOI },
    },
    fearGreed: fearGreed ?? { value: 0, classification: "Unknown", change24h: null },
    prices, longShort: longShortDisplay, fundingRates: fundingRatesDisplay, openInterest: openInterestDisplay,
    dataSourceHealth, buyConclusion,
  };
}
