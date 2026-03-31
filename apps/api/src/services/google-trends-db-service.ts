import { desc, eq } from "drizzle-orm";
import { db } from "../db/database-connection";
import { googleTrends } from "../db/schema/social-sentiment-schema";
import type { TrendEntry } from "./google-trends-api-fetcher";

/**
 * Upserts Google Trends entries into the database.
 * Inserts or ignores on (keyword, timestamp) conflict — no unique constraint exists,
 * so we do a plain insert and rely on the crawl interval to avoid duplicates.
 */
export async function insertTrendsData(entries: TrendEntry[]): Promise<void> {
  if (entries.length === 0) return;

  await db.insert(googleTrends).values(
    entries.map((e) => ({
      keyword: e.keyword,
      interestValue: e.value,
      timestamp: e.timestamp,
    }))
  );
}

/**
 * Returns the most recent entry per keyword (latest crawl).
 */
export async function getLatestTrends(): Promise<
  Array<{ keyword: string; interestValue: number; timestamp: Date }>
> {
  // Get the most recent timestamp across all keywords
  const latestRow = await db
    .select()
    .from(googleTrends)
    .orderBy(desc(googleTrends.timestamp))
    .limit(1);

  if (latestRow.length === 0 || !latestRow[0]) return [];

  const latestTs = latestRow[0].timestamp;

  // Get all rows at that timestamp
  const rows = await db
    .select()
    .from(googleTrends)
    .where(eq(googleTrends.timestamp, latestTs));

  return rows.map((r) => ({
    keyword: r.keyword,
    interestValue: r.interestValue,
    timestamp: r.timestamp,
  }));
}
