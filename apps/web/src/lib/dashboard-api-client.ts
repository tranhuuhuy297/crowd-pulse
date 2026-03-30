import type { DashboardResponse } from "@crowdpulse/shared";

/** Fetch dashboard data from the API */
export async function fetchDashboard(): Promise<DashboardResponse> {
  const response = await fetch("/api/dashboard");

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    throw new Error(`Failed to fetch dashboard: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data as DashboardResponse;
}
