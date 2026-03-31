import Snoowrap from "snoowrap";
import { logger } from "../lib/logger-instance";

export interface RedditPostData {
  externalId: string;
  title: string;
  body: string;
  author: string;
  subreddit: string;
  postedAt: Date;
}

/** Build snoowrap client from environment credentials */
function createRedditClient(): Snoowrap | null {
  const { REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD } = process.env;

  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET || !REDDIT_USERNAME || !REDDIT_PASSWORD) {
    logger.warn("Reddit credentials not configured — skipping Reddit crawl");
    return null;
  }

  return new Snoowrap({
    userAgent: "CrowdPulse/1.0 (contrarian sentiment analysis)",
    clientId: REDDIT_CLIENT_ID,
    clientSecret: REDDIT_CLIENT_SECRET,
    username: REDDIT_USERNAME,
    password: REDDIT_PASSWORD,
  });
}

/** Fetch up to 25 hot posts from a single subreddit */
async function fetchSubredditPosts(
  client: Snoowrap,
  subreddit: string
): Promise<RedditPostData[]> {
  const listing = await client.getSubreddit(subreddit).getHot({ limit: 25 });

  return listing.map((post) => ({
    externalId: post.id,
    title: post.title,
    body: post.selftext ?? "",
    author: post.author?.name ?? "[deleted]",
    subreddit,
    postedAt: new Date(post.created_utc * 1000),
  }));
}

/**
 * Fetch hot posts from all given subreddits.
 * Returns empty array if credentials are missing or Reddit API errors.
 */
export async function fetchRedditHotPosts(
  subreddits: readonly string[]
): Promise<RedditPostData[]> {
  const client = createRedditClient();
  if (!client) return [];

  const results: RedditPostData[] = [];

  for (const subreddit of subreddits) {
    try {
      const posts = await fetchSubredditPosts(client, subreddit);
      results.push(...posts);
      logger.debug({ subreddit, count: posts.length }, "Fetched Reddit posts");
    } catch (err) {
      logger.error({ subreddit, err }, "Failed to fetch posts from subreddit");
    }
  }

  logger.info({ total: results.length, subreddits: subreddits.length }, "Reddit posts fetched");
  return results;
}
