import {
  pgTable,
  serial,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";

/** User accounts (Google Sign-In) - placeholder for Phase 1 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  googleId: varchar("google_id", { length: 255 }).unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
