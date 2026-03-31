import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db/database-connection";
import { contrarianSignals } from "../db/schema/contrarian-signals-schema";
import type { NewContrarianSignal } from "../db/schema/contrarian-signals-schema";

/** Insert a new contrarian signal event */
export async function insertSignal(data: NewContrarianSignal): Promise<number> {
  const rows = await db
    .insert(contrarianSignals)
    .values(data)
    .returning({ id: contrarianSignals.id });
  return rows[0]!.id;
}

/** Get the most recent signal of a given type (for cooldown check) */
export async function getLastSignalByType(signalType: string) {
  const rows = await db
    .select()
    .from(contrarianSignals)
    .where(eq(contrarianSignals.signal, signalType))
    .orderBy(desc(contrarianSignals.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

/** Get recent signals ordered newest-first (for API + dashboard) */
export async function getRecentSignals(limit: number) {
  return db
    .select()
    .from(contrarianSignals)
    .orderBy(desc(contrarianSignals.createdAt))
    .limit(limit);
}

type AccuracyPeriod = "24h" | "72h" | "7d";

/** Update a signal record with the price and accuracy result for a given period */
export async function updateAccuracy(
  signalId: number,
  period: AccuracyPeriod,
  price: number,
  accurate: boolean
): Promise<void> {
  if (period === "24h") {
    await db
      .update(contrarianSignals)
      .set({ priceAfter24h: String(price), accurate24h: accurate })
      .where(eq(contrarianSignals.id, signalId));
  } else if (period === "72h") {
    await db
      .update(contrarianSignals)
      .set({ priceAfter72h: String(price), accurate72h: accurate })
      .where(eq(contrarianSignals.id, signalId));
  } else {
    await db
      .update(contrarianSignals)
      .set({ priceAfter7d: String(price), accurate7d: accurate })
      .where(eq(contrarianSignals.id, signalId));
  }
}

/** Aggregate accuracy hit rates per signal type */
export async function getAccuracyStats() {
  const rows = await db
    .select({
      signalType: contrarianSignals.signal,
      totalCount: sql<number>`count(*)::int`,
      accurate24h: sql<number>`count(*) filter (where ${contrarianSignals.accurate24h} = true)::int`,
      accurate72h: sql<number>`count(*) filter (where ${contrarianSignals.accurate72h} = true)::int`,
      accurate7d: sql<number>`count(*) filter (where ${contrarianSignals.accurate7d} = true)::int`,
    })
    .from(contrarianSignals)
    .groupBy(contrarianSignals.signal);
  return rows;
}
