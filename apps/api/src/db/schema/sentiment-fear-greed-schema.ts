import {
  pgTable,
  serial,
  integer,
  varchar,
  numeric,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Fear & Greed Index from alternative.me */
export const fearGreedIndex = pgTable(
  "fear_greed_index",
  {
    id: serial("id").primaryKey(),
    value: integer("value").notNull(),
    valueClassification: varchar("value_classification", {
      length: 50,
    }).notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    change24h: numeric("change_24h", { precision: 8, scale: 4 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("fear_greed_index_timestamp_idx").on(table.timestamp),
  ]
);

export type FearGreedEntry = typeof fearGreedIndex.$inferSelect;
export type NewFearGreedEntry = typeof fearGreedIndex.$inferInsert;
