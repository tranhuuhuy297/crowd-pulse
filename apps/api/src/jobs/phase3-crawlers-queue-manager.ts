import { Queue } from "bullmq";
import { redisConnection } from "./bullmq-queue-manager";

const DEFAULT_JOB_OPTIONS = {
  removeOnComplete: 100,
  removeOnFail: 50,
};

/** Queue for Google Trends interest crawling jobs (every 15 min) */
export const googleTrendsQueue = new Queue("google-trends-crawler", {
  connection: redisConnection,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});

/** Queue for Binance futures long/short ratio crawling jobs (every 5 min) */
export const liquidationQueue = new Queue("liquidation-crawler", {
  connection: redisConnection,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});

/** Queue for on-chain BTC metrics crawling jobs (every 30 min) */
export const onchainMetricsQueue = new Queue("onchain-metrics-crawler", {
  connection: redisConnection,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});
