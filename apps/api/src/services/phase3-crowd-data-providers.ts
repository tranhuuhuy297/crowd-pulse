import { getLatestTrends } from "./google-trends-db-service";
import { normalizeGoogleTrendsScore } from "./google-trends-interest-score-normalizer";
import { getLatestLiquidationEntry } from "./liquidation-data-db-service";
import { normalizeLongShortRatioScore } from "./liquidation-long-short-ratio-score-normalizer";
import { computeOnchainActivityScore } from "./onchain-metrics-activity-score-normalizer";

/**
 * Returns the latest Google Trends crowd interest score normalized to 0-100.
 * High value = retail FOMO = crowd greed signal.
 * Returns null if no data available (score redistributed by calculator).
 */
export async function getLatestTrendsScore(): Promise<number | null> {
  try {
    const entries = await getLatestTrends();
    return normalizeGoogleTrendsScore(entries);
  } catch {
    return null;
  }
}

/**
 * Returns the latest Binance long/short ratio score normalized to 0-100.
 * High value = more longs than shorts = crowd greed signal.
 * Returns null if no data available.
 */
export async function getLatestLiquidationScore(): Promise<number | null> {
  try {
    const entry = await getLatestLiquidationEntry();
    if (entry === null) return null;
    return normalizeLongShortRatioScore(entry.longShortRatio);
  } catch {
    return null;
  }
}

/**
 * Returns the latest on-chain activity score normalized to 0-100.
 * High value = above-average BTC network activity = crowd participation signal.
 * Returns null if no data available.
 */
export async function getLatestOnchainScore(): Promise<number | null> {
  try {
    return await computeOnchainActivityScore();
  } catch {
    return null;
  }
}
