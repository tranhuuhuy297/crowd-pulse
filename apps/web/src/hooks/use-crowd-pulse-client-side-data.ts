import { useState, useEffect, useRef, useCallback } from "react";
import { fetchAllDashboardData } from "../lib/crowd-pulse-dashboard-data-fetcher";
import type { DashboardData } from "../lib/types";

/**
 * Hook that fetches data from public APIs, calculates CrowdPulse score client-side.
 * Polls every refreshMs (default 60s). No backend needed.
 */
export function useCrowdPulseData(refreshMs = 60_000) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoreDelta, setScoreDelta] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevScoreRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchAllDashboardData();
      setData(result);
      setError(null);
      if (result.crowdPulse.score !== null && prevScoreRef.current !== null) {
        setScoreDelta(result.crowdPulse.score - prevScoreRef.current);
      }
      prevScoreRef.current = result.crowdPulse.score;
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

  return { data, loading, error, scoreDelta };
}
