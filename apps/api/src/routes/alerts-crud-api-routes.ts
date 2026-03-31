import { Hono } from "hono";
import { z } from "zod";
import {
  createAlert,
  getActiveAlerts,
  deleteAlert,
} from "../services/alert-threshold-db-service";
import { logger } from "../lib/logger-instance";

const alertsRoutes = new Hono();

const createAlertSchema = z.object({
  condition: z.enum(["score_above", "score_below", "price_above", "price_below"]),
  threshold: z.number(),
  channel: z.enum(["web", "telegram"]).optional().default("web"),
  symbol: z.string().optional(),
  telegramChatId: z.string().optional(),
});

/** POST /api/alerts — create a new threshold alert */
alertsRoutes.post("/alerts", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = createAlertSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Invalid request", details: parsed.error.issues }, 400);
    }
    const alert = await createAlert(parsed.data);
    return c.json({ alert }, 201);
  } catch (err) {
    logger.error({ err }, "Failed to create alert");
    return c.json({ error: "Failed to create alert" }, 500);
  }
});

/** GET /api/alerts — list all active alerts */
alertsRoutes.get("/alerts", async (c) => {
  try {
    const alerts = await getActiveAlerts();
    return c.json({ alerts });
  } catch (err) {
    logger.error({ err }, "Failed to fetch alerts");
    return c.json({ error: "Failed to fetch alerts" }, 500);
  }
});

/** DELETE /api/alerts/:id — soft-delete an alert */
alertsRoutes.delete("/alerts/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "Invalid alert id" }, 400);
    await deleteAlert(id);
    return c.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to delete alert");
    return c.json({ error: "Failed to delete alert" }, 500);
  }
});

export { alertsRoutes };
