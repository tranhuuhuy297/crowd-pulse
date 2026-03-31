import { desc, eq, gte, and } from "drizzle-orm";
import { db } from "../db/database-connection";
import { socialPosts } from "../db/schema/social-sentiment-schema";
import type { NewSocialPost, SocialPost } from "../db/schema/social-sentiment-schema";
import { logger } from "../lib/logger-instance";

/**
 * Insert a social post only if (source, externalId) pair doesn't already exist.
 * Returns true if inserted, false if skipped (duplicate).
 */
export async function upsertSocialPost(post: NewSocialPost): Promise<boolean> {
  try {
    await db
      .insert(socialPosts)
      .values(post)
      .onConflictDoNothing({
        target: [socialPosts.source, socialPosts.externalId],
      });
    return true;
  } catch (err) {
    logger.error({ err, externalId: post.externalId }, "Failed to upsert social post");
    return false;
  }
}

/**
 * Batch upsert social posts, skipping duplicates.
 * Returns count of newly inserted posts.
 */
export async function batchUpsertSocialPosts(posts: NewSocialPost[]): Promise<number> {
  if (posts.length === 0) return 0;

  let inserted = 0;
  for (const post of posts) {
    const ok = await upsertSocialPost(post);
    if (ok) inserted++;
  }

  logger.info({ total: posts.length, inserted }, "Batch upsert social posts complete");
  return inserted;
}

/**
 * Fetch recent social posts from a given source within the last N hours.
 * Used for sentiment aggregation.
 */
export async function getRecentSocialPosts(
  source: string,
  hoursBack: number
): Promise<SocialPost[]> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  return db
    .select()
    .from(socialPosts)
    .where(
      and(
        eq(socialPosts.source, source),
        gte(socialPosts.crawledAt, since)
      )
    )
    .orderBy(desc(socialPosts.crawledAt));
}
