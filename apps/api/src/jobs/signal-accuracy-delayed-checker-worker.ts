import { Worker } from "bullmq";
import { redisConnection } from "./bullmq-queue-manager";
import { compareAndRecordAccuracy } from "../services/signal-accuracy-price-comparator";
import { logger } from "../lib/logger-instance";

interface AccuracyJobData {
  signalId: number;
  period: "24h" | "72h" | "7d";
}

/** BullMQ worker processing delayed signal accuracy check jobs */
export const signalAccuracyCheckerWorker = new Worker(
  "signal-accuracy",
  async (job) => {
    const { signalId, period } = job.data as AccuracyJobData;
    logger.info({ signalId, period }, "Processing signal accuracy check");
    await compareAndRecordAccuracy(signalId, period);
  },
  {
    connection: redisConnection,
    concurrency: 2,
  }
);

signalAccuracyCheckerWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Signal accuracy check job failed");
});
