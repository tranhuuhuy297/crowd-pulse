import { FEAR_GREED_API_URL } from "../constants";
import type { FearGreedData } from "../types";

interface FearGreedApiEntry {
  value: string;
  value_classification: string;
  timestamp: string;
}

/**
 * Fetches Fear & Greed Index from alternative.me.
 * Returns current value + 24h change (computed from limit=2).
 * Returns null on failure — score auto-redistributes.
 */
export async function fetchFearGreedIndex(): Promise<FearGreedData | null> {
  try {
    const res = await fetch(`${FEAR_GREED_API_URL}/?limit=2&format=json`);
    if (!res.ok) return null;

    const json = await res.json();
    const entries: FearGreedApiEntry[] = json?.data;
    if (!entries || entries.length === 0) return null;

    const current = entries[0]!;
    const previous = entries[1] ?? null;

    const value = parseInt(current.value, 10);
    const prevValue = previous ? parseInt(previous.value, 10) : null;

    return {
      value,
      classification: current.value_classification,
      change24h: prevValue !== null ? value - prevValue : null,
    };
  } catch {
    return null;
  }
}
