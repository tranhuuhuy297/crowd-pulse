import {
  pgTable,
  serial,
  varchar,
  numeric,
  jsonb,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

/** Persisted contrarian signal events triggered at extreme CrowdPulse score readings */
export const contrarianSignals = pgTable("contrarian_signals", {
  id: serial("id").primaryKey(),
  signal: varchar("signal", { length: 20 }).notNull(),         // STRONG_BUY, BUY, SELL, STRONG_SELL
  confidence: varchar("confidence", { length: 10 }).notNull(), // HIGH, MEDIUM, LOW
  score: numeric("score", { precision: 8, scale: 4 }).notNull(),
  priceAtSignal: numeric("price_at_signal", { precision: 20, scale: 8 }).notNull(),
  componentSnapshot: jsonb("component_snapshot"),

  // Accuracy filled by delayed BullMQ jobs
  priceAfter24h: numeric("price_after_24h", { precision: 20, scale: 8 }),
  priceAfter72h: numeric("price_after_72h", { precision: 20, scale: 8 }),
  priceAfter7d: numeric("price_after_7d", { precision: 20, scale: 8 }),
  accurate24h: boolean("accurate_24h"),
  accurate72h: boolean("accurate_72h"),
  accurate7d: boolean("accurate_7d"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ContrarianSignal = typeof contrarianSignals.$inferSelect;
export type NewContrarianSignal = typeof contrarianSignals.$inferInsert;
