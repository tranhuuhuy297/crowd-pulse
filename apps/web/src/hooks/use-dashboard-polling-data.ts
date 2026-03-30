import { useEffect, useRef, useState } from "react";
import type { DashboardResponse } from "@crowdpulse/shared";
import { fetchDashboard } from "../lib/dashboard-api-client";

interface DashboardDataState {
  data: DashboardResponse | null;
  loading: boolean;
  error: string | null;
}

/** Custom hook that fetches dashboard data and auto-refreshes on an interval */
export function useDashboardData(refreshMs = 60_000): DashboardDataState {
  const [state, setState] = useState<DashboardDataState>({
    data: null,
    loading: true,
    error: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    try {
      const data = await fetchDashboard();
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard";
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, refreshMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshMs]);

  return state;
}
