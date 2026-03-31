# Phase 3: Google Trends + Liquidation Data + On-Chain Metrics

## Context Links
- [Placeholder schemas](../../apps/api/src/db/schema/social-posts-placeholder-schema.ts)
- [BullMQ queue manager](../../apps/api/src/jobs/bullmq-queue-manager.ts)
- [Score calculator](../../apps/api/src/services/crowd-pulse-score-calculator.ts)
- [Binance base URL constant](../../packages/shared/src/constants/tracked-symbols.ts)

## Overview
- **Priority**: P1
- **Status**: partial (Phase 3 new files complete; integration into index.ts/bullmq-queue-manager/score-calculator deferred to post-Phase-2 merge)
- **Effort**: 7h
- **Description**: Three new data crawlers — Google Trends interest for crypto keywords, Binance futures long/short ratio, and basic on-chain metrics (active addresses). All free APIs, no keys required for Trends/Binance.

## Key Insights

### Google Trends (Free, No Key)
- `google-trends-api` npm package scrapes Google Trends without API key
- Returns interest-over-time values (0-100 relative scale)
- Keywords: "bitcoin", "crypto", "ethereum", "buy crypto", "sell crypto"
- High search interest = retail FOMO = contrarian sell signal
- Rate limited informally; crawl every 30 min with jitter to avoid blocks
- Returns last 7 days of hourly data by default

### Binance Futures API (Free, No Key)
- `/futures/data/globalLongShortAccountRatio` - ratio of long vs short accounts
- `/futures/data/topLongShortPositionRatio` - top trader position ratio
- No API key needed for public data endpoints
- High long/short ratio = overleveraged longs = contrarian sell signal
- Crawl every 15 min

### On-Chain Metrics (Free)
- **Blockchain.com API** (free, no key): `https://api.blockchain.info/stats` returns:
  - `n_tx` (daily transactions), `hash_rate`, `trade_volume_btc`, `miners_revenue_btc`
- **Mempool.space API** (free): `https://mempool.space/api/v1/fees/recommended` for fee estimation
- **Blockchair API** (free tier): active addresses, avg transaction value
- High on-chain activity + rising fees = network congestion = potential top signal
- Crawl every 1h (on-chain metrics don't change rapidly)

## Requirements

### Functional
- **Google Trends**: Crawl interest values for 5 crypto keywords every 30 min
- **Liquidation**: Fetch Binance global long/short ratio every 15 min for tracked symbols
- **On-chain**: Fetch BTC network stats (tx count, hash rate) every 1h from blockchain.info
- Store all data in existing placeholder tables (already defined in schema)
- Normalize each metric to 0-100 for CrowdPulse integration

### Non-Functional
- All APIs free, no keys required (except on-chain Blockchair has free tier limits)
- Graceful degradation per crawler (score auto-redistributes)
- Jitter on crawl intervals to avoid synchronized burst requests

## Architecture

```
BullMQ Schedulers:
  google-trends (30min) -> google-trends-crawler-worker
  liquidation (15min)   -> liquidation-crawler-worker
  onchain (1h)          -> onchain-metrics-crawler-worker

Each worker:
  -> fetcher service (API call)
  -> normalizer (raw -> 0-100)
  -> DB service (store)
```

### Normalization Formulas

**Google Trends**: Raw 0-100 already. Average across keywords. >70 = high retail interest.

**Long/Short Ratio**:
- Ratio > 1.0 = more longs than shorts
- Normalize: `score = clamp((ratio - 0.5) / 1.5 * 100, 0, 100)`
- Higher score = more longs = more crowd greed

**On-chain (BTC tx count)**:
- Use 30-day rolling average as baseline
- `score = clamp((current / avg30d - 0.5) * 100, 0, 100)`
- Higher activity = more retail participation

## Related Code Files

### Files to Modify
- `apps/api/src/db/schema/social-posts-placeholder-schema.ts` - add `symbol` to liquidationData, improve schemas
- `apps/api/src/db/schema/index.ts` - ensure all tables exported
- `apps/api/src/jobs/bullmq-queue-manager.ts` - add 3 new queues
- `apps/api/src/index.ts` - register 3 new schedulers + workers, update shutdown handler
- `apps/api/src/services/crowd-pulse-score-calculator.ts` - add trends/liquidation/onchain weights
- `apps/api/src/services/dashboard-data-aggregator.ts` - fetch latest from all 3 new sources
- `packages/shared/src/types/dashboard-types.ts` - add component types
- `packages/shared/src/constants/tracked-symbols.ts` - add GOOGLE_TRENDS_KEYWORDS, BINANCE_FUTURES_URL
- `apps/api/package.json` - add google-trends-api
- `apps/web/src/app.tsx` - add new data cards

### Files to Create
- `apps/api/src/services/google-trends-fetcher.ts` - fetch interest-over-time
- `apps/api/src/services/google-trends-db-service.ts` - store/query trends data
- `apps/api/src/services/google-trends-normalizer.ts` - avg keywords -> 0-100
- `apps/api/src/jobs/google-trends-crawler-worker.ts` - BullMQ worker
- `apps/api/src/services/binance-long-short-ratio-fetcher.ts` - fetch from futures API
- `apps/api/src/services/liquidation-db-service.ts` - store/query liquidation
- `apps/api/src/services/liquidation-score-normalizer.ts` - ratio -> 0-100
- `apps/api/src/jobs/liquidation-crawler-worker.ts` - BullMQ worker
- `apps/api/src/services/blockchain-stats-fetcher.ts` - fetch from blockchain.info
- `apps/api/src/services/onchain-metrics-db-service.ts` - store/query metrics
- `apps/api/src/services/onchain-score-normalizer.ts` - tx count -> 0-100
- `apps/api/src/jobs/onchain-metrics-crawler-worker.ts` - BullMQ worker
- `apps/web/src/components/google-trends-display-card.tsx` - trends UI
- `apps/web/src/components/liquidation-ratio-display-card.tsx` - long/short UI
- `apps/web/src/components/onchain-metrics-display-card.tsx` - on-chain UI

## Implementation Steps

### Step 1: Install Dependencies (10min)
1. `cd apps/api && bun add google-trends-api`
2. No deps needed for Binance/blockchain.info (use native fetch)

### Step 2: Schema Refinements (30min)
1. Add `symbol` column to `liquidationData` table (track per-symbol ratios)
2. Verify `googleTrends` schema has all needed columns
3. Verify `onchainMetrics` schema is adequate
4. `make db-push`

### Step 3: Google Trends Crawler (1.5h)
1. Create `google-trends-fetcher.ts`
   - Use `google-trends-api` `interestOverTime()` with keywords array
   - Return `{ keyword, value, timestamp }[]`
   - Add random jitter (0-60s) before each call
2. Create `google-trends-db-service.ts`
   - `insertTrendsData(entries)` - batch insert
   - `getLatestTrends()` - latest per keyword
3. Create `google-trends-normalizer.ts`
   - Average across keywords -> single 0-100 score
4. Create `google-trends-crawler-worker.ts`
   - BullMQ worker, calls fetcher -> db service -> normalizer

### Step 4: Liquidation/Long-Short Ratio Crawler (1.5h)
1. Create `binance-long-short-ratio-fetcher.ts`
   - `GET https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol={}&period=15m&limit=1`
   - Fetch for each tracked symbol
   - Return `{ symbol, longAccount, shortAccount, longShortRatio, timestamp }`
2. Create `liquidation-db-service.ts`
   - Insert ratio data into `liquidationData` table
   - `getLatestLongShortRatio()` - latest aggregate
3. Create `liquidation-score-normalizer.ts`
   - Average ratio across symbols -> normalize to 0-100
4. Create `liquidation-crawler-worker.ts`

### Step 5: On-Chain Metrics Crawler (1.5h)
1. Create `blockchain-stats-fetcher.ts`
   - `GET https://api.blockchain.info/stats` (returns JSON with BTC network stats)
   - Extract: `n_tx`, `hash_rate`, `trade_volume_btc`
   - Fallback: return null on error
2. Create `onchain-metrics-db-service.ts`
   - Store each metric as separate row in `onchainMetrics`
   - `getLatestMetrics()` - latest per metric name
   - `getMetricAverage(metricName, days)` - for baseline calculation
3. Create `onchain-score-normalizer.ts`
   - Compare current vs 30-day average
   - Normalize deviation to 0-100
4. Create `onchain-metrics-crawler-worker.ts`

### Step 6: Register All Workers (30min)
1. Add 3 queues to `bullmq-queue-manager.ts`:
   - `google-trends-crawler`
   - `liquidation-crawler`
   - `onchain-metrics-crawler`
2. Register schedulers in `index.ts`: 30min, 15min, 1h
3. Add all 3 workers to shutdown handler

### Step 7: Integrate into CrowdPulse Score (45min)
1. Update `CrowdPulseInput` with: `trendsScore`, `liquidationScore`, `onchainScore`
2. Update BASE_WEIGHTS:
   ```
   { fearGreed: 0.25, rsi: 0.15, volume: 0.15, sentiment: 0.20, trends: 0.10, liquidation: 0.10, onchain: 0.05 }
   ```
3. Update `dashboard-data-aggregator.ts` to fetch latest from all 3 new sources
4. Add component types to shared package

### Step 8: Frontend Cards (1h)
1. Create `google-trends-display-card.tsx` - show trending keywords + interest level
2. Create `liquidation-ratio-display-card.tsx` - show long/short ratio with bar chart
3. Create `onchain-metrics-display-card.tsx` - show tx count, hash rate
4. Add all 3 cards to `app.tsx` dashboard layout

## Todo List

- [x] Install google-trends-api package
- [ ] Refine liquidationData schema (add symbol column) — deferred, existing schema adequate
- [x] Implement google-trends-api-fetcher.ts
- [x] Implement google-trends-db-service.ts
- [x] Implement google-trends-interest-score-normalizer.ts
- [x] Implement google-trends-crawler-worker.ts
- [x] Implement binance-futures-long-short-ratio-fetcher.ts
- [x] Implement liquidation-data-db-service.ts
- [x] Implement liquidation-long-short-ratio-score-normalizer.ts
- [x] Implement liquidation-long-short-ratio-crawler-worker.ts
- [x] Implement blockchain-info-onchain-stats-fetcher.ts
- [x] Implement onchain-metrics-db-service.ts
- [x] Implement onchain-metrics-activity-score-normalizer.ts
- [x] Implement onchain-metrics-blockchain-info-crawler-worker.ts
- [x] Create phase3-crawlers-queue-manager.ts (queues ready for integration)
- [x] Create phase3-crowd-data-providers.ts (integration-ready exports)
- [x] Create phase3-crowd-signal-component-types.ts (shared types)
- [x] Add BINANCE_FUTURES_BASE_URL + BLOCKCHAIN_INFO_API_URL + GOOGLE_TRENDS_KEYWORDS to tracked-symbols.ts
- [ ] Register all 3 queues + schedulers + shutdown — deferred to post-Phase-2 merge (index.ts owned by Phase 2)
- [ ] Integrate all 3 into crowd-pulse-score-calculator — deferred to post-Phase-2 merge
- [ ] Update dashboard-data-aggregator — deferred to post-Phase-2 merge
- [ ] Create frontend cards (3) — deferred to Phase 5
- [ ] Test each crawler independently
- [ ] Verify score incorporates all new data

## Success Criteria

- Google Trends data crawled every 30 min for 5 keywords
- Long/short ratio crawled every 15 min for 4 symbols
- On-chain BTC stats crawled every 1h
- All metrics normalized to 0-100 and fed into CrowdPulse score
- Dashboard displays 3 new data cards
- Each crawler degrades gracefully when API unavailable

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| google-trends-api scraping blocked | Medium | Medium | Jitter + 30min interval; fallback to score redistribution |
| Binance futures API geo-restricted | Low | Medium | Works globally; VPN fallback documented |
| blockchain.info rate limits | Low | Low | 1h interval is very conservative |
| google-trends-api Bun compatibility | Low | Medium | Uses standard HTTP; test early |

## Security Considerations
- No API keys required for any of these three data sources
- All data is public market data, no PII

## Next Steps
- Phase 4 depends on data flowing from Phase 2 + Phase 3
- Consider adding more on-chain sources (Etherscan for ETH) in future
