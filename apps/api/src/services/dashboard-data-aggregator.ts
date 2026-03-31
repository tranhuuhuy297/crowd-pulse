import { desc, eq, and } from "drizzle-orm";
import { db } from "../db/database-connection";
import { priceCandles } from "../db/schema/market-price-candles-schema";
import { fearGreedIndex } from "../db/schema/sentiment-fear-greed-schema";
import { crowdPulse } from "../db/schema/sentiment-crowd-pulse-schema";
import { calculateCrowdPulse } from "./crowd-pulse-score-calculator";
import { getLatestSentimentAggregate } from "./reddit-sentiment-score-aggregator";
import { getLatestTrendsScore, getLatestLiquidationScore, getLatestOnchainScore } from "./phase3-crowd-data-providers";
import { getLatestTrends } from "./google-trends-db-service";
import { getLatestLiquidationEntry } from "./liquidation-data-db-service";
import { logger } from "../lib/logger-instance";
import { eventBus } from "../lib/event-bus-instance";
import { TRACKED_SYMBOLS, SYMBOL_DISPLAY_NAMES } from "@crowdpulse/shared";
import { evaluateSignal } from "./contrarian-signal-evaluator";
import { getRecentSignals } from "./contrarian-signals-db-service";
import type {
  DashboardResponse,
  PriceSnapshot,
  SignalEvent,
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

  const [latestFng, candleMap, latestSentiment, trendsScore, liquidationScore, onchainScore, trendsEntries, liquidationEntry] = await Promise.all([
    fetchLatestFearGreed(),
    fetchLatestCandles(),
    getLatestSentimentAggregate("reddit"),
    getLatestTrendsScore(),
    getLatestLiquidationScore(),
    getLatestOnchainScore(),
    getLatestTrends(),
    getLatestLiquidationEntry(),
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
    sentimentScore: latestSentiment?.avgScore !== undefined && latestSentiment.avgScore !== null
      ? Number(latestSentiment.avgScore)
      : null,
    sentimentPostCount: latestSentiment?.postCount ?? 0,
    trendsScore,
    trendsKeywords: Object.fromEntries(
      (trendsEntries ?? []).map((e) => [e.keyword, e.interestValue])
    ),
    liquidationScore,
    liquidationRatio: liquidationEntry?.longShortRatio !== undefined && liquidationEntry?.longShortRatio !== null
      ? Number(liquidationEntry.longShortRatio)
      : null,
    onchainScore,
  });

  // Persist snapshot if score is available (non-blocking)
  if (result.score !== null) {
    saveCrowdPulseSnapshot(result.score, result.signal, result.components);
  }

  const prices = buildPricesMap(candleMap);

  // Evaluate contrarian signal (non-blocking — runs after snapshot save)
  const btcCandle = candleMap["BTCUSDT"] ?? null;
  const btcPrice = btcCandle ? Number(btcCandle.close) : null;

  if (result.score !== null && btcPrice !== null) {
    evaluateSignal(result.score, btcPrice, result.components)
      .then((signal) => {
        if (signal) eventBus.emitNewSignal(signal);
      })
      .catch((err) =>
        logger.warn({ err }, "Signal evaluation failed — non-critical")
      );
  }

  // Fetch recent signals for dashboard (last 5)
  let recentSignals: SignalEvent[] = [];
  try {
    const rows = await getRecentSignals(5);
    recentSignals = rows.map((r) => ({
      id: r.id,
      signal: r.signal,
      confidence: r.confidence,
      score: Number(r.score),
      priceAtSignal: Number(r.priceAtSignal),
      accurate24h: r.accurate24h ?? null,
      accurate72h: r.accurate72h ?? null,
      accurate7d: r.accurate7d ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (err) {
    logger.warn({ err }, "Failed to fetch recent signals — non-critical");
  }

  logger.info(
    { score: result.score, signal: result.signal },
    "Dashboard data assembled"
  );

  const dashboardResponse: DashboardResponse = {
    crowdPulse: {
      score: result.score,
      signal: result.signal,
      updatedAt: new Date().toISOString(),
    },
    components: result.components,
    prices,
    signals: recentSignals,
  };

  // Emit to SSE clients and alert evaluator (non-blocking)
  eventBus.emitDashboardUpdate(dashboardResponse);

  return dashboardResponse;
}
