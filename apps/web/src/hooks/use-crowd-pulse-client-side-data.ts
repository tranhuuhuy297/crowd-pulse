import { useState, useEffect, useRef, useCallback } from "react";
import { fetchAllDashboardData } from "../lib/crowd-pulse-dashboard-data-fetcher";
import type { DashboardData } from "../lib/types";

/**
 * Hook that fetches all asset data from public APIs, calculates per-asset CrowdPulse scores.
 * Polls every refreshMs (default 60s). Tracks per-asset score deltas.
 */
export function useCrowdPulseData(refreshMs = 60_000) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Per-asset score deltas keyed by display name */
  const [scoreDeltas, setScoreDeltas] = useState<Record<string, number | null>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevScoresRef = useRef<Record<string, number | null>>({});

  const refresh = useCallback(async () => {
    try {
      const result = await fetchAllDashboardData();
      setData(result);
      setError(null);

      // Compute per-asset score deltas
      const newDeltas: Record<string, number | null> = {};
      for (const [name, asset] of Object.entries(result.assets)) {
        const prev = prevScoresRef.current[name];
        if (asset.crowdPulse.score !== null && prev !== null && prev !== undefined) {
          newDeltas[name] = asset.crowdPulse.score - prev;
        } else {
          newDeltas[name] = null;
        }
        prevScoresRef.current[name] = asset.crowdPulse.score;
      }
      setScoreDeltas(newDeltas);
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

  return { data, loading, error, scoreDeltas };
}
