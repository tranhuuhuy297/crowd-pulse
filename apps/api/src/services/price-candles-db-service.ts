import { desc, eq, and } from "drizzle-orm";
import { db } from "../db/database-connection";
import {
  priceCandles,
  type NewPriceCandle,
  type PriceCandle,
} from "../db/schema/market-price-candles-schema";

/**
 * Upserts a price candle record — inserts or updates on (symbol, interval, openTime) conflict.
 */
export async function upsertCandle(candle: NewPriceCandle): Promise<void> {
  await db
    .insert(priceCandles)
    .values(candle)
    .onConflictDoUpdate({
      target: [priceCandles.symbol, priceCandles.interval, priceCandles.openTime],
      set: {
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        closeTime: candle.closeTime,
        rsi: candle.rsi,
        volumeChangePct: candle.volumeChangePct,
        priceChangePct: candle.priceChangePct,
      },
    });
}

/**
 * Fetches recent candles for a symbol/interval ordered by openTime descending.
 */
export async function getRecentCandles(
  symbol: string,
  interval: string,
  limit: number
): Promise<PriceCandle[]> {
  return db
    .select()
    .from(priceCandles)
    .where(and(eq(priceCandles.symbol, symbol), eq(priceCandles.interval, interval)))
    .orderBy(desc(priceCandles.openTime))
    .limit(limit);
}
