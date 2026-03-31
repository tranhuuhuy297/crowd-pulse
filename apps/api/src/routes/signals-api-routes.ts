import { Hono } from "hono";
import { getRecentSignals, getAccuracyStats } from "../services/contrarian-signals-db-service";
import { logger } from "../lib/logger-instance";

const signalsRoutes = new Hono();

/** GET /api/signals — returns the 20 most recent contrarian signals with accuracy data */
signalsRoutes.get("/signals", async (c) => {
  try {
    const rows = await getRecentSignals(20);
    const signals = rows.map((r) => ({
      id: r.id,
      signal: r.signal,
      confidence: r.confidence,
      score: Number(r.score),
      priceAtSignal: Number(r.priceAtSignal),
      accurate24h: r.accurate24h ?? null,
      accurate72h: r.accurate72h ?? null,
      accurate7d: r.accurate7d ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
    return c.json({ signals });
  } catch (err) {
    logger.error({ err }, "Failed to fetch signals");
    return c.json({ error: "Failed to fetch signals" }, 500);
  }
});

/** GET /api/signals/stats — returns accuracy hit rates per signal type */
signalsRoutes.get("/signals/stats", async (c) => {
  try {
    const rows = await getAccuracyStats();
    const stats = rows.map((r) => ({
      signalType: r.signalType,
      totalCount: r.totalCount,
      accurate24h: r.accurate24h,
      accurate72h: r.accurate72h,
      accurate7d: r.accurate7d,
    }));
    return c.json({ stats });
  } catch (err) {
    logger.error({ err }, "Failed to fetch signal stats");
    return c.json({ error: "Failed to fetch signal stats" }, 500);
  }
});

export { signalsRoutes };
