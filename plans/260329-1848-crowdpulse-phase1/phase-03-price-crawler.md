# Phase 3: Price Crawler (Binance)

## Context Links
- [Plan Overview](./plan.md)
- [Phase 2: Database Schema](./phase-02-database-schema.md)
- [Binance API: GET /api/v3/klines](https://binance-docs.github.io/apidocs/spot/en/#kline-candlestick-data)

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 2.5h
- **Description:** BullMQ repeatable job fetching OHLCV from Binance for BTC, ETH, SOL, BNB every 1 min. Calculates RSI-14, volume change %, price change %.

## Key Insights
- Binance public API: no auth, 1200 req/min limit
- GET /api/v3/klines returns array of arrays (not objects)
- RSI-14 needs 14+ prior candles; fetch 20 on first run for warm-up
- BullMQ `upsertJobScheduler` for repeatable jobs (replaces deprecated `repeat` option)
- ioredis required; BullMQ doesn't support native Redis client

## Requirements

### Functional
- Fetch 1-minute OHLCV for BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT
- Calculate RSI-14 from close prices
- Calculate volume change % and price change % vs previous candle
- Upsert candles (no duplicates on symbol+interval+open_time)
- BullMQ repeatable job every 60 seconds
- Retry with exponential backoff on failure (max 3 attempts)

### Non-functional
- Structured logging with pino
- Graceful error handling (one symbol failing doesn't block others)
- Job progress tracking

## Architecture

```
apps/api/src/
  jobs/
    queue-manager.ts        # Redis connection, queue creation
    price-crawler-job.ts    # Job processor
  services/
    binance-service.ts      # Binance API client
    rsi-calculator.ts       # RSI-14 calculation
    price-service.ts        # DB operations for candles
```

### Flow
1. BullMQ scheduler triggers every 60s
2. Job processor iterates TRACKED_SYMBOLS
3. For each symbol: fetch latest kline -> calculate indicators -> upsert to DB
4. On error: log + continue to next symbol

## Related Code Files

### Create
- `apps/api/src/jobs/queue-manager.ts` - Shared Redis connection + queue factory
- `apps/api/src/jobs/price-crawler-job.ts` - BullMQ worker + processor
- `apps/api/src/services/binance-service.ts` - Binance klines API wrapper
- `apps/api/src/services/rsi-calculator.ts` - RSI-14 pure function
- `apps/api/src/services/price-service.ts` - Candle DB operations (upsert, get recent)

### Modify
- `apps/api/src/index.ts` - Register job schedulers on startup
- `packages/shared/src/constants/index.ts` - Add TRACKED_SYMBOLS, BINANCE_BASE_URL

## Implementation Steps

1. **Create queue-manager.ts:**
   ```typescript
   import IORedis from 'ioredis'
   import { Queue } from 'bullmq'

   const connection = new IORedis(process.env.REDIS_URL!)
   export const priceQueue = new Queue('price-crawler', { connection })
   ```

2. **Create binance-service.ts:**
   - `fetchKlines(symbol: string, interval: string, limit: number)` using native `fetch`
   - Parse Binance array response into typed `RawKline` objects
   - URL: `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`

3. **Create rsi-calculator.ts:**
   - Pure function: `calculateRSI(closes: number[], period = 14): number | null`
   - Returns null if insufficient data (< period + 1 candles)
   - Uses exponential moving average method (Wilder's smoothing)

4. **Create price-service.ts:**
   - `upsertCandle(candle: NewPriceCandle)` using Drizzle `onConflictDoUpdate`
   - `getRecentCandles(symbol, interval, limit)` for RSI warm-up
   - Conflict target: (symbol, interval, open_time)

5. **Create price-crawler-job.ts:**
   ```typescript
   import { Worker } from 'bullmq'
   const worker = new Worker('price-crawler', async (job) => {
     for (const symbol of TRACKED_SYMBOLS) {
       try {
         const klines = await fetchKlines(symbol, '1m', 1)
         const recent = await getRecentCandles(symbol, '1m', 15)
         const closes = [...recent.map(c => c.close), klines[0].close]
         const rsi = calculateRSI(closes)
         // calc volume_change_pct, price_change_pct
         await upsertCandle({ ...klines[0], rsi, volume_change_pct, price_change_pct })
       } catch (err) { logger.error({ symbol, err }, 'Price crawl failed') }
     }
   }, { connection })
   ```

6. **Register scheduler in index.ts:**
   ```typescript
   await priceQueue.upsertJobScheduler('price-1m',
     { every: 60_000 },
     { name: 'crawl-prices' }
   )
   ```

7. **Add warm-up logic:** On first run (no recent candles in DB), fetch limit=20 to seed RSI calculation

8. **Test:** Start API, verify candles appear in DB after 2 minutes

## Todo List

- [ ] queue-manager.ts (Redis + queue)
- [ ] binance-service.ts (klines fetcher)
- [ ] rsi-calculator.ts (RSI-14)
- [ ] price-service.ts (upsert + query)
- [ ] price-crawler-job.ts (worker)
- [ ] Register scheduler in index.ts
- [ ] Warm-up logic for first run
- [ ] Verify candles in DB
- [ ] Verify RSI calculation accuracy

## Success Criteria
- After 5 minutes: 4 symbols x 5 candles = ~20 rows in price_candles
- RSI values between 0-100 and non-null after warm-up
- No duplicate candles (upsert working)
- Job retries on Binance API failure

## Risk Assessment
- **Binance API downtime:** Exponential backoff + job retries handle transient failures
- **RSI warm-up:** First few minutes show null RSI; acceptable for Phase 1
- **ioredis + Bun:** Tested compatible; if issues, fallback to `redis` package with adapter

## Security Considerations
- No API keys stored (public endpoint)
- Rate limiting is server-side; our 4 req/min is well under 1200 limit
