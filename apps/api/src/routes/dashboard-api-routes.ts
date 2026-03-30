import { Hono } from "hono";
import { getDashboardData } from "../services/dashboard-data-aggregator";
import { logger } from "../lib/logger-instance";

const dashboardRoutes = new Hono();

/** GET /api/dashboard — returns aggregated crowd pulse dashboard data */
dashboardRoutes.get("/dashboard", async (c) => {
  try {
    const data = await getDashboardData();
    return c.json(data);
  } catch (err) {
    logger.error({ err }, "Failed to fetch dashboard data");
    return c.json({ error: "Failed to fetch dashboard data" }, 500);
  }
});

export { dashboardRoutes };
