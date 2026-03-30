import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { logger } from "./lib/logger-instance";
import { dashboardRoutes } from "./routes/dashboard-api-routes";
import { priceQueue, fearGreedQueue, redisConnection } from "./jobs/bullmq-queue-manager";
import { priceCrawlerWorker } from "./jobs/price-crawler-worker";
import { fearGreedCrawlerWorker } from "./jobs/fear-greed-crawler-worker";

const app = new Hono();

app.use("*", cors());
app.use("*", honoLogger());

// Health check
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.route("/api", dashboardRoutes);

// Register recurring job schedulers
await priceQueue.upsertJobScheduler(
  "price-1m",
  { every: 60_000 },
  { name: "crawl-prices" }
);

await fearGreedQueue.upsertJobScheduler(
  "fng-1h",
  { every: 3_600_000 },
  { name: "crawl-fear-greed" }
);

logger.info("Job schedulers registered: price-1m (60s), fng-1h (1h)");

// Graceful shutdown — close workers and queues cleanly
const shutdown = async () => {
  logger.info("Shutting down workers and queues...");
  await Promise.all([
    priceCrawlerWorker.close(),
    fearGreedCrawlerWorker.close(),
    priceQueue.close(),
    fearGreedQueue.close(),
    redisConnection.quit(),
  ]);
  logger.info("Shutdown complete");
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

const port = Number(process.env.API_PORT) || 4177;

logger.info({ port }, "CrowdPulse API starting");

export default {
  port,
  fetch: app.fetch,
};
