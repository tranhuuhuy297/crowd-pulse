import {
  pgTable,
  serial,
  varchar,
  text,
  numeric,
  jsonb,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

/** Social media posts (Twitter/Reddit) - placeholder for Phase 2 */
export const socialPosts = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 20 }).notNull(),
  content: text("content").notNull(),
  sentimentScore: numeric("sentiment_score", { precision: 8, scale: 4 }),
  keywords: jsonb("keywords"),
  author: varchar("author", { length: 255 }),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  crawledAt: timestamp("crawled_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Google Trends data - placeholder for Phase 3 */
export const googleTrends = pgTable("google_trends", {
  id: serial("id").primaryKey(),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  interestValue: integer("interest_value").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Liquidation data - placeholder for Phase 3 */
export const liquidationData = pgTable("liquidation_data", {
  id: serial("id").primaryKey(),
  longVolume: numeric("long_volume", { precision: 24, scale: 8 }),
  shortVolume: numeric("short_volume", { precision: 24, scale: 8 }),
  longShortRatio: numeric("long_short_ratio", { precision: 10, scale: 6 }),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** On-chain metrics - placeholder for Phase 3 */
export const onchainMetrics = pgTable("onchain_metrics", {
  id: serial("id").primaryKey(),
  metricName: varchar("metric_name", { length: 100 }).notNull(),
  value: numeric("value", { precision: 24, scale: 8 }).notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
