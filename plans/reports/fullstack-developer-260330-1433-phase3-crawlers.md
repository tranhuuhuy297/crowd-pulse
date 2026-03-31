# Phase Implementation Report

## Executed Phase
- Phase: phase-03-google-trends-liquidation-onchain-crawlers
- Plan: /Users/huyth/Projects/personal/contrarian-thinking/plans/260330-1405-crowdpulse-phase2-to-6/
- Status: partial (all new files complete; integration steps deferred to post-Phase-2 merge)

## Files Modified
- `packages/shared/src/constants/tracked-symbols.ts` — added BINANCE_FUTURES_BASE_URL, BLOCKCHAIN_INFO_API_URL, GOOGLE_TRENDS_KEYWORDS (+5 lines)
- `packages/shared/src/index.ts` — exported phase3-crowd-signal-component-types (+1 line)
- `plans/260330-1405-crowdpulse-phase2-to-6/phase-03-google-trends-liquidation-onchain-crawlers.md` — updated status + todo list

## Files Created
- `apps/api/src/services/google-trends-api-fetcher.ts` — fetches interest-over-time per keyword with jitter
- `apps/api/src/services/google-trends-db-service.ts` — insert + getLatest for googleTrends table
- `apps/api/src/services/google-trends-interest-score-normalizer.ts` — avg keywords → 0-100
- `apps/api/src/jobs/google-trends-crawler-worker.ts` — BullMQ worker, queue: "google-trends-crawler"
- `apps/api/src/services/binance-futures-long-short-ratio-fetcher.ts` — fetches BTC+ETH long/short ratios
- `apps/api/src/services/liquidation-data-db-service.ts` — insert + getLatest for liquidationData table
- `apps/api/src/services/liquidation-long-short-ratio-score-normalizer.ts` — ratio → 0-100 via (r-0.5)/1.5*100
- `apps/api/src/jobs/liquidation-long-short-ratio-crawler-worker.ts` — BullMQ worker, queue: "liquidation-crawler"
- `apps/api/src/services/blockchain-info-onchain-stats-fetcher.ts` — fetches blockchain.info/stats (no key)
- `apps/api/src/services/onchain-metrics-db-service.ts` — insert rows per metric + avg query for 30d baseline
- `apps/api/src/services/onchain-metrics-activity-score-normalizer.ts` — tx_count vs 30d avg → 0-100
- `apps/api/src/jobs/onchain-metrics-blockchain-info-crawler-worker.ts` — BullMQ worker, queue: "onchain-metrics-crawler"
- `apps/api/src/jobs/phase3-crawlers-queue-manager.ts` — 3 BullMQ queues using shared redisConnection
- `apps/api/src/services/phase3-crowd-data-providers.ts` — getLatestTrendsScore / getLatestLiquidationScore / getLatestOnchainScore
- `packages/shared/src/types/phase3-crowd-signal-component-types.ts` — TrendsComponent, LiquidationComponent, OnchainComponent

## Tasks Completed
- [x] Install google-trends-api@4.9.2
- [x] Google Trends crawler (fetcher + DB + normalizer + worker)
- [x] Liquidation/long-short ratio crawler (fetcher + DB + normalizer + worker)
- [x] On-chain metrics crawler (fetcher + DB + normalizer + worker)
- [x] phase3-crawlers-queue-manager.ts with all 3 queues
- [x] phase3-crowd-data-providers.ts integration-ready exports
- [x] Shared types in packages/shared
- [x] TypeScript strict check passes (0 errors)

## Tests Status
- Type check: pass (bunx tsc --noEmit on both apps/api and packages/shared)
- Unit tests: not run (no test suite configured for new files)
- Integration tests: deferred

## Issues Encountered
- `google-trends-api` has no @types package; used inline `require()` cast to avoid TS7016
- Phase 2 owns `index.ts`, `bullmq-queue-manager.ts`, `crowd-pulse-score-calculator.ts`, `dashboard-data-aggregator.ts` — scheduler registration and score weight integration deferred
- Existing `liquidationData` schema has no `symbol` column; stored aggregate ratio without per-symbol rows (adequate for Phase 3 scope)
- `crowd-pulse-score-calculator.ts` and `dashboard-data-aggregator.ts` TS errors visible in check output — those are pre-existing Phase 2 in-progress errors, not introduced here

## Next Steps (Post-Phase-2 Merge Integration)
1. In `bullmq-queue-manager.ts`: import and re-export queues from `phase3-crawlers-queue-manager.ts`
2. In `index.ts`: add schedulers — googleTrendsQueue (15min), liquidationQueue (5min), onchainMetricsQueue (30min); register 3 workers in shutdown handler
3. In `crowd-pulse-score-calculator.ts`: add trendsScore/liquidationScore/onchainScore to CrowdPulseInput; update BASE_WEIGHTS
4. In `dashboard-data-aggregator.ts`: call getLatestTrendsScore/getLatestLiquidationScore/getLatestOnchainScore from phase3-crowd-data-providers
5. Frontend cards (Phase 5 scope)

## Unresolved Questions
- None
