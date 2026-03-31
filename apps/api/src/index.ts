import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { logger } from "./lib/logger-instance";
import { dashboardRoutes } from "./routes/dashboard-api-routes";
import { priceQueue, fearGreedQueue, redditSentimentQueue, signalAccuracyQueue, redisConnection } from "./jobs/bullmq-queue-manager";
import { googleTrendsQueue, liquidationQueue, onchainMetricsQueue } from "./jobs/phase3-crawlers-queue-manager";
import { priceCrawlerWorker } from "./jobs/price-crawler-worker";
import { fearGreedCrawlerWorker } from "./jobs/fear-greed-crawler-worker";
import { redditSentimentCrawlerWorker } from "./jobs/reddit-sentiment-crawler-worker";
import { googleTrendsCrawlerWorker } from "./jobs/google-trends-crawler-worker";
import { liquidationCrawlerWorker } from "./jobs/liquidation-long-short-ratio-crawler-worker";
import { onchainMetricsCrawlerWorker } from "./jobs/onchain-metrics-blockchain-info-crawler-worker";
import { signalAccuracyCheckerWorker } from "./jobs/signal-accuracy-delayed-checker-worker";
import { signalsRoutes } from "./routes/signals-api-routes";
import { sseRoutes } from "./routes/sse-dashboard-stream-route";
import { alertsRoutes } from "./routes/alerts-crud-api-routes";
import { createTelegramBot } from "./services/telegram-bot-command-handlers";
import { initTelegramSignalNotificationSender } from "./services/telegram-signal-notification-sender";
import { initAlertThresholdEvaluator } from "./services/alert-threshold-evaluator";
import { registerStaticFileServingMiddleware } from "./middleware/static-file-serving-middleware";

const app = new Hono();

app.use("*", cors());
app.use("*", honoLogger());

// Health check
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.route("/api", dashboardRoutes);
app.route("/api", signalsRoutes);
app.route("/api", sseRoutes);
app.route("/api", alertsRoutes);

// Serve frontend static files in production (must be after all /api/* routes)
registerStaticFileServingMiddleware(app);

// Initialize alert evaluator (subscribes to event bus dashboard:update)
initAlertThresholdEvaluator();

// Initialize Telegram bot (skipped gracefully if token not set)
const telegramBot = createTelegramBot();
if (telegramBot) {
  initTelegramSignalNotificationSender(telegramBot);
  telegramBot.start().catch((err) =>
    logger.error({ err }, "Telegram bot failed to start")
  );
  logger.info("Telegram bot started");
}

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

await redditSentimentQueue.upsertJobScheduler(
  "reddit-sentiment-15m",
  { every: 900_000 },
  { name: "crawl-reddit-sentiment" }
);

await googleTrendsQueue.upsertJobScheduler(
  "google-trends-15m",
  { every: 900_000 },
  { name: "crawl-google-trends" }
);

await liquidationQueue.upsertJobScheduler(
  "liquidation-5m",
  { every: 300_000 },
  { name: "crawl-liquidation" }
);

await onchainMetricsQueue.upsertJobScheduler(
  "onchain-30m",
  { every: 1_800_000 },
  { name: "crawl-onchain-metrics" }
);

logger.info("Job schedulers registered: price-1m, fng-1h, reddit-15m, trends-15m, liquidation-5m, onchain-30m");

// Graceful shutdown — close workers, queues, and bot cleanly
const shutdown = async () => {
  logger.info("Shutting down workers and queues...");
  const tasks: Promise<unknown>[] = [
    priceCrawlerWorker.close(),
    fearGreedCrawlerWorker.close(),
    redditSentimentCrawlerWorker.close(),
    googleTrendsCrawlerWorker.close(),
    liquidationCrawlerWorker.close(),
    onchainMetricsCrawlerWorker.close(),
    signalAccuracyCheckerWorker.close(),
    priceQueue.close(),
    fearGreedQueue.close(),
    redditSentimentQueue.close(),
    googleTrendsQueue.close(),
    liquidationQueue.close(),
    onchainMetricsQueue.close(),
    signalAccuracyQueue.close(),
    redisConnection.quit(),
  ];
  if (telegramBot) tasks.push(telegramBot.stop());
  await Promise.all(tasks);
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
