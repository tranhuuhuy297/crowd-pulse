import { Worker } from "bullmq";
import { logger } from "../lib/logger-instance";
import { fetchFearGreed } from "../services/fear-greed-api-fetcher";
import {
  upsertFearGreedEntry,
  getLatestFearGreed,
  getPreviousEntry,
} from "../services/fear-greed-db-service";
import { redisConnection } from "./bullmq-queue-manager";

const BACKFILL_LIMIT = 30;
const DEFAULT_LIMIT = 2;

async function processFearGreedJob(): Promise<void> {
  // Check if DB has any existing entries to decide between backfill vs regular fetch
  const existing = await getLatestFearGreed();
  const isFirstRun = existing === null;
  const limit = isFirstRun ? BACKFILL_LIMIT : DEFAULT_LIMIT;

  logger.info({ isFirstRun, limit }, "Fetching Fear & Greed data");

  const entries = await fetchFearGreed(limit);

  for (const entry of entries) {
    // Calculate 24h change relative to the previous entry already in DB
    const prev = await getPreviousEntry(entry.timestamp);
    const change24h =
      prev !== null
        ? ((entry.value - prev.value) / prev.value * 100).toFixed(4)
        : null;

    await upsertFearGreedEntry({
      value: entry.value,
      valueClassification: entry.valueClassification,
      timestamp: entry.timestamp,
      change24h,
    });

    logger.info(
      { value: entry.value, classification: entry.valueClassification, change24h },
      "Fear & Greed entry upserted"
    );
  }
}

export const fearGreedCrawlerWorker = new Worker(
  "fear-greed-crawler",
  async () => {
    await processFearGreedJob();
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);

fearGreedCrawlerWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Fear & Greed crawler job failed");
});
