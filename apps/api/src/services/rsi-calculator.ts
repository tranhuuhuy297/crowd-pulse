/**
 * Calculates RSI (Relative Strength Index) using Wilder's smoothing (EMA) method.
 * @param closes - Array of closing prices in chronological order (oldest first)
 * @param period - RSI period, default 14
 * @returns RSI value 0-100, or null if insufficient data
 */
export function calculateRSI(closes: number[], period = 14): number | null {
  // Need at least period+1 values to compute period changes
  if (closes.length < period + 1) return null;

  // Compute initial gains and losses over first `period` changes
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const curr = closes[i] ?? 0;
    const prev = closes[i - 1] ?? 0;
    const change = curr - prev;
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }

  avgGain /= period;
  avgLoss /= period;

  // Apply Wilder's smoothing for remaining data points
  for (let i = period + 1; i < closes.length; i++) {
    const curr = closes[i] ?? 0;
    const prev = closes[i - 1] ?? 0;
    const change = curr - prev;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}
