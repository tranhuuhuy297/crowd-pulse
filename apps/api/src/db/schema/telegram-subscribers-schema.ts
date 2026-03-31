import {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

/** Telegram users who subscribed to receive contrarian signal notifications */
export const telegramSubscribers = pgTable("telegram_subscribers", {
  id: serial("id").primaryKey(),
  chatId: varchar("chat_id", { length: 50 }).notNull().unique(),
  username: varchar("username", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TelegramSubscriber = typeof telegramSubscribers.$inferSelect;
