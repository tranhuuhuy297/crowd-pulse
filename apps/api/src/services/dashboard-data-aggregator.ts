import { desc, eq, and } from "drizzle-orm";
import { db } from "../db/database-connection";
import { priceCandles } from "../db/schema/market-price-candles-schema";
import { fearGreedIndex } from "../db/schema/sentiment-fear-greed-schema";
import { crowdPulse } from "../db/schema/sentiment-crowd-pulse-schema";
import { calculateCrowdPulse } from "./crowd-pulse-score-calculator";
import { logger } from "../lib/logger-instance";
import { TRACKED_SYMBOLS, SYMBOL_DISPLAY_NAMES } from "@crowdpulse/shared";
import type {
  DashboardResponse,
  PriceSnapshot,
} from "@crowdpulse/shared";

const CANDLE_INTERVAL = "1m";

/** Fetch latest fear & greed index entry */
async function fetchLatestFearGreed() {
  const rows = await db
    .select()
    .from(fearGreedIndex)
    .orderBy(desc(fearGreedIndex.timestamp))
    .limit(1);
  return rows[0] ?? null;
}

/** Fetch latest price candle per symbol for interval '1m' */
async function fetchLatestCandles() {
  const results: Record<string, (typeof priceCandles.$inferSelect) | null> = {};

  await Promise.all(
    TRACKED_SYMBOLS.map(async (symbol) => {
      const rows = await db
        .select()
        .from(priceCandles)
        .where(
          and(
            eq(priceCandles.symbol, symbol),
            eq(priceCandles.interval, CANDLE_INTERVAL)
          )
        )
        .orderBy(desc(priceCandles.openTime))
        .limit(1);
      results[symbol] = rows[0] ?? null;
    })
  );

  return results;
}

/** Save crowd pulse snapshot to DB (best-effort, non-blocking) */
async function saveCrowdPulseSnapshot(
  score: number,
  signal: string,
  components: unknown
): Promise<void> {
  try {
    await db.insert(crowdPulse).values({
      symbol: null,
      score: String(score),
      signal,
      components: components as Record<string, unknown>,
    });
  } catch (err) {
    logger.warn({ err }, "Failed to save crowd pulse snapshot — non-critical");
  }
}

/** Build prices map with display names as keys */
function buildPricesMap(
  candleMap: Record<string, (typeof priceCandles.$inferSelect) | null>
): Record<string, PriceSnapshot> {
  const prices: Record<string, PriceSnapshot> = {};

  for (const symbol of TRACKED_SYMBOLS) {
    const candle = candleMap[symbol];
    if (!candle) continue;
    const displayName = SYMBOL_DISPLAY_NAMES[symbol] ?? symbol;
    prices[displayName] = {
      price: Number(candle.close),
      change1h: candle.priceChangePct !== null ? Number(candle.priceChangePct) : null,
      rsi: candle.rsi !== null ? Number(candle.rsi) : null,
    };
  }

  return prices;
}

/** Aggregate all data sources and compute dashboard response */
export async function getDashboardData(): Promise<DashboardResponse> {
  logger.info("Fetching dashboard data");

  const [latestFng, candleMap] = await Promise.all([
    fetchLatestFearGreed(),
    fetchLatestCandles(),
  ]);

  // Build RSI and volume maps from candles
  const rsiValues: Record<string, number | null> = {};
  const volumeChanges: Record<string, number | null> = {};

  for (const symbol of TRACKED_SYMBOLS) {
    const candle = candleMap[symbol];
    rsiValues[symbol] = candle?.rsi !== undefined && candle.rsi !== null
      ? Number(candle.rsi)
      : null;
    volumeChanges[symbol] = candle?.volumeChangePct !== undefined && candle.volumeChangePct !== null
      ? Number(candle.volumeChangePct)
      : null;
  }

  const result = calculateCrowdPulse({
    fearGreedValue: latestFng?.value ?? null,
    fearGreedClassification: latestFng?.valueClassification ?? "Unknown",
    fearGreedChange24h: latestFng?.change24h !== undefined && latestFng.change24h !== null
      ? Number(latestFng.change24h)
      : null,
    rsiValues,
    volumeChanges,
  });

  // Persist snapshot if score is available (non-blocking)
  if (result.score !== null) {
    saveCrowdPulseSnapshot(result.score, result.signal, result.components);
  }

  const prices = buildPricesMap(candleMap);

  logger.info(
    { score: result.score, signal: result.signal },
    "Dashboard data assembled"
  );

  return {
    crowdPulse: {
      score: result.score,
      signal: result.signal,
      updatedAt: new Date().toISOString(),
    },
    components: result.components,
    prices,
  };
}
