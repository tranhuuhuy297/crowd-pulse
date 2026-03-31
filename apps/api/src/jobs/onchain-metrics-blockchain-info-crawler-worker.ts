import { Worker } from "bullmq";
import { logger } from "../lib/logger-instance";
import { fetchBlockchainStats } from "../services/blockchain-info-onchain-stats-fetcher";
import { insertOnchainMetrics } from "../services/onchain-metrics-db-service";
import { redisConnection } from "./bullmq-queue-manager";

async function processOnchainMetricsJob(): Promise<void> {
  logger.info("Fetching on-chain BTC metrics from blockchain.info");

  const stats = await fetchBlockchainStats();

  if (stats === null) {
    logger.warn("On-chain metrics crawler: no data returned, skipping insert");
    return;
  }

  await insertOnchainMetrics(stats);

  logger.info(
    { hashRate: stats.hashRate, txCount: stats.txCount, tradeVolumeBtc: stats.tradeVolumeBtc },
    "On-chain metrics stored"
  );
}

export const onchainMetricsCrawlerWorker = new Worker(
  "onchain-metrics-crawler",
  async () => {
    await processOnchainMetricsJob();
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);

onchainMetricsCrawlerWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "On-chain metrics crawler job failed");
});
