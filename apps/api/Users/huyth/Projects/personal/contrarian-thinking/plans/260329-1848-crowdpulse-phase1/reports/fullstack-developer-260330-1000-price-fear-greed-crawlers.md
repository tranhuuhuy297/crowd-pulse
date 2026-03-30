## Phase Implementation Report

### Executed Phase
- Phase: price-crawler + fear-greed-crawler (CrowdPulse Phase 1)
- Plan: /Users/huyth/Projects/personal/contrarian-thinking/plans/260329-1848-crowdpulse-phase1
- Status: completed

### Files Modified
- `apps/api/src/index.ts` — added queue manager, worker imports, job schedulers, graceful shutdown (+28 lines)

### Files Created
- `apps/api/src/jobs/bullmq-queue-manager.ts` — shared IORedis connection + priceQueue + fearGreedQueue (23 lines)
- `apps/api/src/services/binance-klines-fetcher.ts` — fetchKlines() using native fetch, typed RawKline (44 lines)
- `apps/api/src/services/rsi-calculator.ts` — calculateRSI() pure function, Wilder's EMA smoothing (41 lines)
- `apps/api/src/services/price-candles-db-service.ts` — upsertCandle() + getRecentCandles() with Drizzle (47 lines)
- `apps/api/src/jobs/price-crawler-worker.ts` — BullMQ Worker iterating TRACKED_SYMBOLS, RSI + change pcts (91 lines)
- `apps/api/src/services/fear-greed-api-fetcher.ts` — fetchFearGreed() parsing alternative.me API (47 lines)
- `apps/api/src/services/fear-greed-db-service.ts` — upsertFearGreedEntry() + getLatestFearGreed() + getPreviousEntry() (51 lines)
- `apps/api/src/jobs/fear-greed-crawler-worker.ts` — BullMQ Worker with first-run backfill (limit=30) (57 lines)

### Tasks Completed
- [x] bullmq-queue-manager: shared redis connection, priceQueue, fearGreedQueue exported
- [x] binance-klines-fetcher: fetchKlines with typed RawKline output
- [x] rsi-calculator: pure calculateRSI with Wilder's smoothing, returns null on insufficient data
- [x] price-candles-db-service: upsertCandle (onConflictDoUpdate), getRecentCandles
- [x] price-crawler-worker: BullMQ Worker on 'price-crawler', per-symbol error isolation, RSI + change pcts
- [x] fear-greed-api-fetcher: fetchFearGreed with Unix timestamp → Date conversion
- [x] fear-greed-db-service: upsert + getLatest + getPreviousEntry
- [x] fear-greed-crawler-worker: BullMQ Worker with first-run backfill detection
- [x] index.ts: queue schedulers (60s price, 1h fear-greed), worker imports, SIGTERM/SIGINT shutdown

### Tests Status
- Type check: pass (bunx tsc --noEmit, zero errors)
- Unit tests: n/a (not requested)
- Integration tests: n/a

### Issues Encountered
- Package name was `@crowdpulse/shared` not `@contrarian/shared` — caught and fixed before final type check
- `noUncheckedIndexedAccess: true` in tsconfig required explicit `klines[0]` undefined guard and `closes[i] ?? 0` fallbacks
- `index.ts` had been modified by a parallel phase (dashboardRoutes added) — preserved that and merged crawler wiring via Edit

### Next Steps
- Env var `REDIS_URL` and `DATABASE_URL` must be set in `.env` for workers to connect
- Workers start automatically on API boot; no separate process needed
- RSI warm-up uses 15 DB candles — first few runs will return null RSI until DB is populated
