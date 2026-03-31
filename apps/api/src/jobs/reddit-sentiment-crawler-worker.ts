import { Worker } from "bullmq";
import { logger } from "../lib/logger-instance";
import { redisConnection } from "./bullmq-queue-manager";
import { fetchRedditHotPosts } from "../services/reddit-hot-posts-fetcher";
import { analyzeTextSentiment } from "../services/crypto-text-sentiment-analyzer";
import { batchUpsertSocialPosts } from "../services/reddit-social-posts-db-service";
import { aggregateRedditSentiment } from "../services/reddit-sentiment-score-aggregator";
import { REDDIT_SUBREDDITS } from "@crowdpulse/shared";

async function processRedditSentimentJob(): Promise<void> {
  logger.info("Starting Reddit sentiment crawl");

  // 1. Fetch hot posts from all subreddits
  const posts = await fetchRedditHotPosts(REDDIT_SUBREDDITS);
  if (posts.length === 0) {
    logger.warn("No Reddit posts fetched — skipping sentiment aggregation");
    return;
  }

  // 2. Analyze sentiment for each post and prepare DB records
  const dbRecords = posts.map((post) => {
    const text = `${post.title} ${post.body}`.trim();
    const sentiment = analyzeTextSentiment(text);

    return {
      source: "reddit" as const,
      externalId: post.externalId,
      subreddit: post.subreddit,
      postType: "post" as const,
      content: text.slice(0, 2000), // cap content length
      sentimentScore: String(sentiment.normalized),
      author: post.author,
      postedAt: post.postedAt,
    };
  });

  // 3. Store posts in DB (skip duplicates)
  const inserted = await batchUpsertSocialPosts(dbRecords);
  logger.info({ fetched: posts.length, inserted }, "Reddit posts stored");

  // 4. Compute aggregate sentiment score
  const aggregateScore = await aggregateRedditSentiment();
  logger.info({ aggregateScore }, "Reddit sentiment crawl complete");
}

export const redditSentimentCrawlerWorker = new Worker(
  "reddit-sentiment",
  async () => {
    await processRedditSentimentJob();
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);

redditSentimentCrawlerWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Reddit sentiment crawler job failed");
});
