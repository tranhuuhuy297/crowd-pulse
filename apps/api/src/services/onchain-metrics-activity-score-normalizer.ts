import { getLatestMetricValue, getMetricAverage, ONCHAIN_METRIC_NAMES } from "./onchain-metrics-db-service";

/**
 * Normalizes on-chain BTC tx count relative to 30-day average into a 0-100 score.
 * Higher activity vs baseline = more retail participation = higher crowd score.
 *
 * Formula: score = clamp((current / avg30d - 0.5) * 100, 0, 100)
 * - current == avg30d → score 50 (neutral)
 * - current == 1.5x avg30d → score 100 (high activity)
 * - current == 0.5x avg30d → score 0 (low activity)
 */
export async function computeOnchainActivityScore(): Promise<number | null> {
  const current = await getLatestMetricValue(ONCHAIN_METRIC_NAMES.TX_COUNT);
  if (current === null) return null;

  const avg30d = await getMetricAverage(ONCHAIN_METRIC_NAMES.TX_COUNT, 30);
  // If no historical baseline yet, use current as neutral (score 50)
  const baseline = avg30d ?? current;
  if (baseline === 0) return 50;

  const raw = (current / baseline - 0.5) * 100;
  return Math.min(100, Math.max(0, Math.round(raw)));
}
