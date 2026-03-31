import { desc, eq, gte } from "drizzle-orm";
import { db } from "../db/database-connection";
import { onchainMetrics } from "../db/schema/social-sentiment-schema";
import type { BlockchainStats } from "./blockchain-info-onchain-stats-fetcher";

/** Metric names stored in the onchain_metrics table */
export const ONCHAIN_METRIC_NAMES = {
  HASH_RATE: "hash_rate",
  TX_COUNT: "tx_count",
  TRADE_VOLUME_BTC: "trade_volume_btc",
  DIFFICULTY: "difficulty",
} as const;

/**
 * Inserts blockchain stats as individual metric rows into onchain_metrics table.
 * Each stat is stored as a separate row with metric_name + value.
 */
export async function insertOnchainMetrics(stats: BlockchainStats): Promise<void> {
  const rows = [
    { metricName: ONCHAIN_METRIC_NAMES.HASH_RATE, value: stats.hashRate.toFixed(8), timestamp: stats.timestamp },
    { metricName: ONCHAIN_METRIC_NAMES.TX_COUNT, value: stats.txCount.toFixed(8), timestamp: stats.timestamp },
    { metricName: ONCHAIN_METRIC_NAMES.TRADE_VOLUME_BTC, value: stats.tradeVolumeBtc.toFixed(8), timestamp: stats.timestamp },
    { metricName: ONCHAIN_METRIC_NAMES.DIFFICULTY, value: stats.difficulty.toFixed(8), timestamp: stats.timestamp },
  ];

  await db.insert(onchainMetrics).values(rows);
}

/**
 * Returns the latest value for a specific metric name.
 */
export async function getLatestMetricValue(metricName: string): Promise<number | null> {
  const rows = await db
    .select()
    .from(onchainMetrics)
    .where(eq(onchainMetrics.metricName, metricName))
    .orderBy(desc(onchainMetrics.timestamp))
    .limit(1);

  if (rows.length === 0 || !rows[0]) return null;
  return parseFloat(rows[0].value);
}

/**
 * Returns the average value of a metric over the past N days.
 * Used as baseline for normalization.
 */
export async function getMetricAverage(metricName: string, days: number): Promise<number | null> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await db
    .select()
    .from(onchainMetrics)
    .where(
      eq(onchainMetrics.metricName, metricName)
    )
    .orderBy(desc(onchainMetrics.timestamp));

  const filtered = rows.filter((r) => r.timestamp >= since);
  if (filtered.length === 0) return null;

  const sum = filtered.reduce((acc, r) => acc + parseFloat(r.value), 0);
  return sum / filtered.length;
}

/**
 * Returns latest values for all tracked metrics.
 */
export async function getLatestOnchainMetrics(): Promise<Record<string, number>> {
  const metricNames = Object.values(ONCHAIN_METRIC_NAMES);
  const result: Record<string, number> = {};

  for (const name of metricNames) {
    const val = await getLatestMetricValue(name);
    if (val !== null) result[name] = val;
  }

  return result;
}
