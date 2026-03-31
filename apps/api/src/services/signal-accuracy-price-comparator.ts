import { desc, eq } from "drizzle-orm";
import { db } from "../db/database-connection";
import { priceCandles } from "../db/schema/market-price-candles-schema";
import { contrarianSignals } from "../db/schema/contrarian-signals-schema";
import { updateAccuracy } from "./contrarian-signals-db-service";
import { logger } from "../lib/logger-instance";

const BTC_SYMBOL = "BTCUSDT";
const CANDLE_INTERVAL = "1m";

/** Fetch the latest BTC price from DB price candles */
async function fetchLatestBtcPrice(): Promise<number | null> {
  const rows = await db
    .select({ close: priceCandles.close })
    .from(priceCandles)
    .where(eq(priceCandles.symbol, BTC_SYMBOL))
    .orderBy(desc(priceCandles.openTime))
    .limit(1);
  const row = rows[0];
  return row ? Number(row.close) : null;
}

/** Determine if a signal was accurate based on price movement direction */
function isAccurate(signal: string, priceAtSignal: number, currentPrice: number): boolean {
  const bullish = signal === "STRONG_BUY" || signal === "BUY";
  const priceWentUp = currentPrice > priceAtSignal;
  return bullish ? priceWentUp : !priceWentUp;
}

/**
 * Fetch current BTC price, compare with signal's price at time of generation,
 * determine accuracy, and persist the result for the given period.
 * Idempotent: skips if the period field is already filled.
 */
export async function compareAndRecordAccuracy(
  signalId: number,
  period: "24h" | "72h" | "7d"
): Promise<void> {
  // Fetch the signal record
  const rows = await db
    .select()
    .from(contrarianSignals)
    .where(eq(contrarianSignals.id, signalId))
    .limit(1);

  const signal = rows[0];
  if (!signal) {
    logger.warn({ signalId }, "Signal not found for accuracy check — skipping");
    return;
  }

  // Idempotency guard: skip if already recorded
  const alreadyFilled =
    (period === "24h" && signal.accurate24h !== null) ||
    (period === "72h" && signal.accurate72h !== null) ||
    (period === "7d" && signal.accurate7d !== null);

  if (alreadyFilled) {
    logger.debug({ signalId, period }, "Accuracy already recorded — skipping");
    return;
  }

  const currentPrice = await fetchLatestBtcPrice();
  if (currentPrice === null) {
    logger.warn({ signalId, period }, "No BTC price available for accuracy check");
    return;
  }

  const priceAtSignal = Number(signal.priceAtSignal);
  const accurate = isAccurate(signal.signal, priceAtSignal, currentPrice);

  await updateAccuracy(signalId, period, currentPrice, accurate);

  logger.info(
    { signalId, period, priceAtSignal, currentPrice, accurate },
    "Signal accuracy recorded"
  );
}
