import { desc } from "drizzle-orm";
import { db } from "../db/database-connection";
import { liquidationData } from "../db/schema/social-sentiment-schema";
import type { LongShortRatioData } from "./binance-futures-long-short-ratio-fetcher";

/**
 * Inserts long/short ratio entries into the liquidation_data table.
 * Stores longAccount as longVolume, shortAccount as shortVolume for schema compatibility.
 */
export async function insertLiquidationEntries(entries: LongShortRatioData[]): Promise<void> {
  if (entries.length === 0) return;

  await db.insert(liquidationData).values(
    entries.map((e) => ({
      longVolume: e.longAccount.toFixed(8),
      shortVolume: e.shortAccount.toFixed(8),
      longShortRatio: e.longShortRatio.toFixed(6),
      timestamp: e.timestamp,
    }))
  );
}

/**
 * Returns the most recent liquidation/long-short ratio entry from DB.
 */
export async function getLatestLiquidationEntry(): Promise<{
  longShortRatio: number;
  timestamp: Date;
} | null> {
  const rows = await db
    .select()
    .from(liquidationData)
    .orderBy(desc(liquidationData.timestamp))
    .limit(1);

  if (rows.length === 0 || !rows[0]) return null;
  const row = rows[0];

  return {
    longShortRatio: row.longShortRatio ? parseFloat(row.longShortRatio) : 1.0,
    timestamp: row.timestamp,
  };
}
