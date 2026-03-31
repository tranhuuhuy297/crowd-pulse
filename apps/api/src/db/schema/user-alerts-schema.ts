import {
  pgTable,
  serial,
  integer,
  varchar,
  numeric,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./user-accounts-schema";

/** User alert thresholds for score/price notifications */
export const userAlerts = pgTable("user_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  symbol: varchar("symbol", { length: 20 }),
  condition: varchar("condition", { length: 50 }).notNull(),
  threshold: numeric("threshold", { precision: 10, scale: 4 }).notNull(),
  channel: varchar("channel", { length: 20 }).notNull().default("web"),
  isActive: boolean("is_active").notNull().default(true),
  telegramChatId: varchar("telegram_chat_id", { length: 50 }),
  lastFiredAt: timestamp("last_fired_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UserAlert = typeof userAlerts.$inferSelect;
