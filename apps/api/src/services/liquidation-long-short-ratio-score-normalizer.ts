/**
 * Normalizes the Binance long/short ratio into a 0-100 crowd sentiment score.
 * Higher ratio = more longs than shorts = crowd greed = higher score.
 *
 * Formula: score = clamp((ratio - 0.5) / 1.5 * 100, 0, 100)
 * - ratio 0.5 → score 0   (mostly shorts)
 * - ratio 1.0 → score ~33 (balanced)
 * - ratio 2.0 → score 100 (heavily long = max greed)
 */
export function normalizeLongShortRatioScore(longShortRatio: number): number {
  const raw = ((longShortRatio - 0.5) / 1.5) * 100;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

/**
 * Averages multiple symbol ratios and normalizes to 0-100.
 */
export function normalizeAverageLongShortScore(ratios: number[]): number | null {
  if (ratios.length === 0) return null;
  const avg = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
  return normalizeLongShortRatioScore(avg);
}
