import { eq } from "drizzle-orm";
import { db } from "../db/database-connection";
import { telegramSubscribers } from "../db/schema/telegram-subscribers-schema";
import type { TelegramSubscriber } from "../db/schema/telegram-subscribers-schema";

/** Add a new subscriber or reactivate an existing one */
export async function addSubscriber(
  chatId: string,
  username?: string
): Promise<void> {
  await db
    .insert(telegramSubscribers)
    .values({ chatId, username, isActive: true })
    .onConflictDoUpdate({
      target: telegramSubscribers.chatId,
      set: { isActive: true, username },
    });
}

/** Deactivate a subscriber (soft delete) */
export async function removeSubscriber(chatId: string): Promise<void> {
  await db
    .update(telegramSubscribers)
    .set({ isActive: false })
    .where(eq(telegramSubscribers.chatId, chatId));
}

/** Fetch all active subscribers who should receive signal notifications */
export async function getActiveSubscribers(): Promise<TelegramSubscriber[]> {
  return db
    .select()
    .from(telegramSubscribers)
    .where(eq(telegramSubscribers.isActive, true));
}
