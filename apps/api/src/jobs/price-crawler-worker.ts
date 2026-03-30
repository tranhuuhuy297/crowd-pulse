import { Worker } from "bullmq";
import { TRACKED_SYMBOLS } from "@crowdpulse/shared";
import { logger } from "../lib/logger-instance";
import { fetchKlines } from "../services/binance-klines-fetcher";
import { calculateRSI } from "../services/rsi-calculator";
import { upsertCandle, getRecentCandles } from "../services/price-candles-db-service";
import { redisConnection } from "./bullmq-queue-manager";

const RSI_WARMUP_CANDLES = 15;
const INTERVAL = "1m";

async function processPriceJob(): Promise<void> {
  logger.info("Starting price crawl for all symbols");

  for (const symbol of TRACKED_SYMBOLS) {
    try {
      // Fetch latest candle from Binance
      const klines = await fetchKlines(symbol, INTERVAL, 1);
      const latest = klines[0];
      if (!latest) {
        logger.warn({ symbol }, "No klines returned from Binance");
        continue;
      }

      // Fetch recent candles from DB for RSI warm-up
      const recentCandles = await getRecentCandles(symbol, INTERVAL, RSI_WARMUP_CANDLES);

      // Build closes array: historical (oldest first) + latest
      const historicalCloses = recentCandles
        .slice()
        .reverse()
        .map((c) => parseFloat(c.close));
      const latestClose = parseFloat(latest.close);
      const allCloses = [...historicalCloses, latestClose];

      const rsi = calculateRSI(allCloses);

      // Calculate change percentages vs previous candle
      const prevCandle = recentCandles[0] ?? null;
      const prevClose = prevCandle ? parseFloat(prevCandle.close) : null;
      const prevVolume = prevCandle ? parseFloat(prevCandle.volume) : null;
      const latestVolume = parseFloat(latest.volume);

      const priceChangePct =
        prevClose !== null && prevClose !== 0
          ? (((latestClose - prevClose) / prevClose) * 100).toFixed(4)
          : null;

      const volumeChangePct =
        prevVolume !== null && prevVolume !== 0
          ? (((latestVolume - prevVolume) / prevVolume) * 100).toFixed(4)
          : null;

      await upsertCandle({
        symbol,
        interval: INTERVAL,
        openTime: new Date(latest.openTime),
        open: latest.open,
        high: latest.high,
        low: latest.low,
        close: latest.close,
        volume: latest.volume,
        closeTime: new Date(latest.closeTime),
        rsi: rsi !== null ? rsi.toFixed(4) : null,
        priceChangePct,
        volumeChangePct,
      });

      logger.info({ symbol, rsi, priceChangePct, volumeChangePct }, "Candle upserted");
    } catch (err) {
      // Log and continue — one symbol failure must not stop others
      logger.error({ symbol, err }, "Failed to process price for symbol");
    }
  }
}

export const priceCrawlerWorker = new Worker(
  "price-crawler",
  async () => {
    await processPriceJob();
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);

priceCrawlerWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Price crawler job failed");
});
