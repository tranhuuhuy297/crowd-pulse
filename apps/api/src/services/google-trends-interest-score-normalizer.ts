/**
 * Normalizes Google Trends interest data into a single 0-100 crowd sentiment score.
 * High search interest = retail FOMO = crowd greed signal (higher score).
 */
export function normalizeGoogleTrendsScore(
  entries: Array<{ keyword: string; interestValue: number }>
): number | null {
  if (entries.length === 0) return null;

  const avg =
    entries.reduce((sum, e) => sum + e.interestValue, 0) / entries.length;

  // Raw values are already 0-100, clamp to be safe
  return Math.min(100, Math.max(0, Math.round(avg)));
}
