import {
  pgTable,
  serial,
  varchar,
  numeric,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** OHLCV candle data from Binance for tracked symbols */
export const priceCandles = pgTable(
  "price_candles",
  {
    id: serial("id").primaryKey(),
    symbol: varchar("symbol", { length: 20 }).notNull(),
    interval: varchar("interval", { length: 10 }).notNull(),
    openTime: timestamp("open_time", { withTimezone: true }).notNull(),
    open: numeric("open", { precision: 18, scale: 8 }).notNull(),
    high: numeric("high", { precision: 18, scale: 8 }).notNull(),
    low: numeric("low", { precision: 18, scale: 8 }).notNull(),
    close: numeric("close", { precision: 18, scale: 8 }).notNull(),
    volume: numeric("volume", { precision: 24, scale: 8 }).notNull(),
    closeTime: timestamp("close_time", { withTimezone: true }).notNull(),
    rsi: numeric("rsi", { precision: 8, scale: 4 }),
    volumeChangePct: numeric("volume_change_pct", { precision: 8, scale: 4 }),
    priceChangePct: numeric("price_change_pct", { precision: 8, scale: 4 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("price_candles_symbol_interval_open_time_idx").on(
      table.symbol,
      table.interval,
      table.openTime
    ),
  ]
);

export type PriceCandle = typeof priceCandles.$inferSelect;
export type NewPriceCandle = typeof priceCandles.$inferInsert;
