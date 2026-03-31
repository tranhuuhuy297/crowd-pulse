import { desc, eq } from "drizzle-orm";
import { db } from "../db/database-connection";
import { sentimentAggregates } from "../db/schema/social-sentiment-schema";
import type { SentimentAggregate } from "../db/schema/social-sentiment-schema";
import { getRecentSocialPosts } from "./reddit-social-posts-db-service";
import { logger } from "../lib/logger-instance";

const WINDOW_HOURS = 4;
const SOURCE = "reddit";

/**
 * Compute time-weighted average sentiment from recent posts.
 * More recent posts carry slightly higher weight.
 */
function computeTimeWeightedAvg(
  posts: Array<{ sentimentScore: string | null; crawledAt: Date }>
): number | null {
  const valid = posts.filter((p) => p.sentimentScore !== null);
  if (valid.length === 0) return null;

  const now = Date.now();
  let weightedSum = 0;
  let totalWeight = 0;

  for (const post of valid) {
    const ageMs = now - post.crawledAt.getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    // Linear decay: posts at 0h get weight 1.0, posts at WINDOW_HOURS get weight ~0.0
    const weight = Math.max(0, 1 - ageHours / WINDOW_HOURS);
    weightedSum += Number(post.sentimentScore) * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return null;
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

/**
 * Query posts from last 4 hours, compute time-weighted avg sentiment,
 * store result in sentiment_aggregates, return 0-100 score (or null).
 */
export async function aggregateRedditSentiment(): Promise<number | null> {
  const windowEnd = new Date();
  const windowStart = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000);

  const posts = await getRecentSocialPosts(SOURCE, WINDOW_HOURS);

  if (posts.length === 0) {
    logger.warn("No recent Reddit posts found for sentiment aggregation");
    return null;
  }

  const avgScore = computeTimeWeightedAvg(posts);
  if (avgScore === null) {
    logger.warn("All recent posts have null sentiment scores");
    return null;
  }

  await db.insert(sentimentAggregates).values({
    source: SOURCE,
    avgScore: String(avgScore),
    postCount: posts.length,
    windowStart,
    windowEnd,
  });

  logger.info(
    { avgScore, postCount: posts.length, windowHours: WINDOW_HOURS },
    "Reddit sentiment aggregate stored"
  );

  return avgScore;
}

/**
 * Fetch the most recent sentiment aggregate for a given source.
 */
export async function getLatestSentimentAggregate(
  source: string
): Promise<SentimentAggregate | null> {
  const rows = await db
    .select()
    .from(sentimentAggregates)
    .where(eq(sentimentAggregates.source, source))
    .orderBy(desc(sentimentAggregates.createdAt))
    .limit(1);

  return rows[0] ?? null;
}
