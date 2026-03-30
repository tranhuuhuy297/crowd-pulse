import { desc, lt, eq } from "drizzle-orm";
import { db } from "../db/database-connection";
import {
  fearGreedIndex,
  type NewFearGreedEntry,
  type FearGreedEntry,
} from "../db/schema/sentiment-fear-greed-schema";

/**
 * Upserts a fear & greed entry — inserts or updates on timestamp conflict.
 */
export async function upsertFearGreedEntry(entry: NewFearGreedEntry): Promise<void> {
  await db
    .insert(fearGreedIndex)
    .values(entry)
    .onConflictDoUpdate({
      target: [fearGreedIndex.timestamp],
      set: {
        value: entry.value,
        valueClassification: entry.valueClassification,
        change24h: entry.change24h,
      },
    });
}

/**
 * Returns the most recent fear & greed entry from DB.
 */
export async function getLatestFearGreed(): Promise<FearGreedEntry | null> {
  const rows = await db
    .select()
    .from(fearGreedIndex)
    .orderBy(desc(fearGreedIndex.timestamp))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Returns the entry approximately 24h before the given timestamp.
 * Finds the most recent entry strictly before currentTimestamp.
 */
export async function getPreviousEntry(currentTimestamp: Date): Promise<FearGreedEntry | null> {
  const rows = await db
    .select()
    .from(fearGreedIndex)
    .where(lt(fearGreedIndex.timestamp, currentTimestamp))
    .orderBy(desc(fearGreedIndex.timestamp))
    .limit(1);

  return rows[0] ?? null;
}
