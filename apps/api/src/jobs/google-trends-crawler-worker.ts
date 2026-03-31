import { Worker } from "bullmq";
import { logger } from "../lib/logger-instance";
import { fetchGoogleTrends } from "../services/google-trends-api-fetcher";
import { insertTrendsData, getLatestTrends } from "../services/google-trends-db-service";
import { redisConnection } from "./bullmq-queue-manager";

async function processGoogleTrendsJob(): Promise<void> {
  const existing = await getLatestTrends();
  logger.info({ existingKeywords: existing.length }, "Fetching Google Trends data");

  const entries = await fetchGoogleTrends();

  if (entries.length === 0) {
    logger.warn("Google Trends: no entries returned, skipping insert");
    return;
  }

  await insertTrendsData(entries);

  logger.info({ count: entries.length }, "Google Trends entries stored");
}

export const googleTrendsCrawlerWorker = new Worker(
  "google-trends-crawler",
  async () => {
    await processGoogleTrendsJob();
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);

googleTrendsCrawlerWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Google Trends crawler job failed");
});
