import {
  pgTable,
  serial,
  varchar,
  numeric,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

/** Computed Crowd Pulse Score snapshots */
export const crowdPulse = pgTable("crowd_pulse", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 20 }),
  score: numeric("score", { precision: 5, scale: 2 }).notNull(),
  components: jsonb("components").notNull(),
  signal: varchar("signal", { length: 20 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type CrowdPulseEntry = typeof crowdPulse.$inferSelect;
export type NewCrowdPulseEntry = typeof crowdPulse.$inferInsert;
