import { Queue } from "bullmq";
import IORedis from "ioredis";

/** Shared Redis connection for BullMQ queues and workers */
export const redisConnection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

/** Queue for price candle crawling jobs */
export const priceQueue = new Queue("price-crawler", {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

/** Queue for fear & greed index crawling jobs */
export const fearGreedQueue = new Queue("fear-greed-crawler", {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

/** Queue for Reddit sentiment crawling jobs */
export const redditSentimentQueue = new Queue("reddit-sentiment", {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

/** Queue for delayed signal accuracy check jobs (24h / 72h / 7d after signal fires) */
export const signalAccuracyQueue = new Queue("signal-accuracy", {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 20,
  },
});
