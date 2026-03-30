import { useState, useEffect, useRef, useCallback } from "react";
import { TRACKED_SYMBOLS, SYMBOL_DISPLAY_NAMES } from "../lib/constants";
import { fetchFearGreedIndex } from "../lib/api/fear-greed-index-fetcher";
import { fetchSpotTickers, fetchKlineClosesAndVolumes } from "../lib/api/binance-spot-price-and-klines-fetcher";
import { fetchAllLongShortRatios } from "../lib/api/binance-futures-long-short-ratio-fetcher";
import { calculateRSI } from "../lib/rsi-wilder-smoothing-calculator";
import { calculateCrowdPulseScore, normalizeToHundred } from "../lib/crowd-pulse-score-calculator";
import type { DashboardData, PriceSnapshot, LongShortData } from "../lib/types";

/** Compute volume anomaly: latest volume vs average of previous candles */
function computeVolumeAnomaly(volumes: number[]): number | null {
  if (volumes.length < 2) return null;
  const prev = volumes.slice(0, -1);
  const avg = prev.reduce((s, v) => s + v, 0) / prev.length;
  if (avg === 0) return null;
  const latest = volumes[volumes.length - 1]!;
  return ((latest - avg) / avg) * 100; // percent change
}

/** Normalize long/short ratio: [0.5, 2.0] -> [0, 100] */
function normalizeLongShortRatio(ratios: LongShortData[]): number | null {
  if (ratios.length === 0) return null;
  const avg = ratios.reduce((s, r) => s + r.ratio, 0) / ratios.length;
  return normalizeToHundred(avg, 0.5, 2.0);
}

async function fetchAllData(): Promise<DashboardData> {
  // Parallel fetch all data sources — partial failures are OK
  const [fearGreedResult, tickersResult, klinesResult, longShortResult] = await Promise.allSettled([
    fetchFearGreedIndex(),
    fetchSpotTickers(TRACKED_SYMBOLS),
    Promise.all(TRACKED_SYMBOLS.map((s) => fetchKlineClosesAndVolumes(s))),
    fetchAllLongShortRatios(TRACKED_SYMBOLS),
  ]);

  // Extract results with safe defaults
  const fearGreed = fearGreedResult.status === "fulfilled" ? fearGreedResult.value : null;
  const tickers = tickersResult.status === "fulfilled" ? tickersResult.value : [];
  const klineResults = klinesResult.status === "fulfilled" ? klinesResult.value : [];

  // Calculate RSI + volume anomaly per symbol from klines
  const rsiValues: number[] = [];
  const volumeAnomalies: number[] = [];
  const prices: PriceSnapshot[] = tickers.map((t, i) => {
    const klineData = klineResults[i] ?? null;

    let rsi: number | null = null;
    if (klineData) {
      rsi = calculateRSI(klineData.closes);
      if (rsi !== null) rsiValues.push(rsi);

      const anomaly = computeVolumeAnomaly(klineData.volumes);
      if (anomaly !== null) volumeAnomalies.push(anomaly);
    }

    return { ...t, rsi };
  });

  // Long/short ratios
  const longShort: LongShortData[] =
    longShortResult.status === "fulfilled" ? longShortResult.value : [];

  // Map long/short display names
  const longShortDisplay = longShort.map((ls) => ({
    ...ls,
    symbol: SYMBOL_DISPLAY_NAMES[ls.symbol] ?? ls.symbol,
  }));

  // Compute aggregates for score
  const avgRsi = rsiValues.length > 0
    ? rsiValues.reduce((s, v) => s + v, 0) / rsiValues.length
    : null;
  const avgVolumeAnomaly = volumeAnomalies.length > 0
    ? volumeAnomalies.reduce((s, v) => s + v, 0) / volumeAnomalies.length
    : null;
  const normalizedLongShort = normalizeLongShortRatio(longShort);

  // Calculate CrowdPulse score
  const fgValue = fearGreed?.value ?? 50;
  const { score, signal } = calculateCrowdPulseScore({
    fearGreed: fgValue,
    avgRsi,
    volumeAnomaly: avgVolumeAnomaly,
    longShortRatio: normalizedLongShort,
  });

  return {
    crowdPulse: {
      score,
      signal,
      updatedAt: new Date().toISOString(),
      components: {
        fearGreed: fgValue,
        avgRsi,
        volumeAnomaly: avgVolumeAnomaly,
        longShortRatio: normalizedLongShort,
      },
    },
    fearGreed: fearGreed ?? { value: 0, classification: "Unknown", change24h: null },
    prices,
    longShort: longShortDisplay,
  };
}

/**
 * Hook that fetches data from public APIs, calculates CrowdPulse score client-side.
 * Polls every refreshMs (default 60s). No backend needed.
 */
export function useCrowdPulseData(refreshMs = 60_000) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchAllData();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, refreshMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh, refreshMs]);

  return { data, loading, error };
}
