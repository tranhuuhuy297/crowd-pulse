import { Worker } from "bullmq";
import { logger } from "../lib/logger-instance";
import { fetchBinanceLongShortRatios } from "../services/binance-futures-long-short-ratio-fetcher";
import { insertLiquidationEntries } from "../services/liquidation-data-db-service";
import { redisConnection } from "./bullmq-queue-manager";

async function processLiquidationJob(): Promise<void> {
  logger.info("Fetching Binance futures long/short ratio data");

  const entries = await fetchBinanceLongShortRatios();

  if (entries.length === 0) {
    logger.warn("Liquidation crawler: no entries returned, skipping insert");
    return;
  }

  await insertLiquidationEntries(entries);

  logger.info(
    { count: entries.length, symbols: entries.map((e) => e.symbol) },
    "Liquidation long/short ratio entries stored"
  );
}

export const liquidationCrawlerWorker = new Worker(
  "liquidation-crawler",
  async () => {
    await processLiquidationJob();
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);

liquidationCrawlerWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Liquidation crawler job failed");
});
