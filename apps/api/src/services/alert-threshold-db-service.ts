import { eq, and } from "drizzle-orm";
import { db } from "../db/database-connection";
import { userAlerts } from "../db/schema/user-alerts-schema";
import type { UserAlert } from "../db/schema/user-alerts-schema";

export interface CreateAlertInput {
  condition: string;
  threshold: number;
  channel?: string;
  symbol?: string;
  telegramChatId?: string;
}

/** Create a new user alert threshold */
export async function createAlert(input: CreateAlertInput): Promise<UserAlert> {
  const rows = await db
    .insert(userAlerts)
    .values({
      condition: input.condition,
      threshold: String(input.threshold),
      channel: input.channel ?? "web",
      symbol: input.symbol ?? null,
      telegramChatId: input.telegramChatId ?? null,
    })
    .returning();
  const row = rows[0];
  if (!row) throw new Error("Insert returned no rows");
  return row;
}

/** Fetch all active alerts (no userId filter — single-user MVP) */
export async function getActiveAlerts(): Promise<UserAlert[]> {
  return db
    .select()
    .from(userAlerts)
    .where(eq(userAlerts.isActive, true));
}

/** Mark lastFiredAt to enforce 1h deduplication window */
export async function updateAlertLastFiredAt(alertId: number): Promise<void> {
  await db
    .update(userAlerts)
    .set({ lastFiredAt: new Date() })
    .where(eq(userAlerts.id, alertId));
}

/** Soft-delete an alert by ID */
export async function deleteAlert(alertId: number): Promise<void> {
  await db
    .update(userAlerts)
    .set({ isActive: false })
    .where(and(eq(userAlerts.id, alertId), eq(userAlerts.isActive, true)));
}
