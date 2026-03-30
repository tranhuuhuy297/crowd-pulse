# Phase 4: Fear & Greed Crawler

## Context Links
- [Plan Overview](./plan.md)
- [Phase 3: Price Crawler](./phase-03-price-crawler.md)
- [Alternative.me API](https://alternative.me/crypto/fear-and-greed-index/)

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 1h
- **Description:** BullMQ job fetching Fear & Greed Index every 1 hour. Calculate 24h change.

## Key Insights
- API returns up to 30 days of data in one call
- Response format: `{ data: [{ value, value_classification, timestamp }] }`
- Timestamp is Unix seconds (not milliseconds)
- 24h change = current value - value from ~24h ago

## Requirements

### Functional
- Fetch from `https://api.alternative.me/fng/?limit=2&format=json` every 1 hour
- Store value, classification, timestamp
- Calculate 24h change from previous entry in DB
- Upsert on timestamp (no duplicates)

### Non-functional
- Retry with backoff (API can be slow)
- Structured logging

## Related Code Files

### Create
- `apps/api/src/jobs/fear-greed-crawler-job.ts` - Worker + processor
- `apps/api/src/services/fear-greed-service.ts` - API client + DB ops

### Modify
- `apps/api/src/jobs/queue-manager.ts` - Add fearGreedQueue
- `apps/api/src/index.ts` - Register fear-greed scheduler

## Implementation Steps

1. **Add fearGreedQueue to queue-manager.ts:**
   ```typescript
   export const fearGreedQueue = new Queue('fear-greed-crawler', { connection })
   ```

2. **Create fear-greed-service.ts:**
   - `fetchFearGreed()`: GET with native fetch, parse response
   - `upsertFearGreedEntry(entry)`: Drizzle upsert on timestamp
   - `getPreviousEntry(currentTimestamp)`: Get entry ~24h before for change calc

3. **Create fear-greed-crawler-job.ts:**
   ```typescript
   const worker = new Worker('fear-greed-crawler', async (job) => {
     const data = await fetchFearGreed()
     const latest = data[0]
     const previous = await getPreviousEntry(latest.timestamp)
     const change24h = previous ? latest.value - previous.value : null
     await upsertFearGreedEntry({ ...latest, change_24h: change24h })
   }, { connection })
   ```

4. **Register scheduler:**
   ```typescript
   await fearGreedQueue.upsertJobScheduler('fng-1h',
     { every: 3_600_000 },
     { name: 'crawl-fear-greed' }
   )
   ```

5. **Seed initial data:** On first run, fetch limit=30 to backfill 30 days

## Todo List

- [ ] fear-greed-service.ts (fetch + DB)
- [ ] fear-greed-crawler-job.ts (worker)
- [ ] Register scheduler
- [ ] Seed/backfill logic
- [ ] Verify entries in DB

## Success Criteria
- Fear & Greed entry in DB after first run
- 24h change calculated correctly
- No duplicate entries
- Backfill creates ~30 historical entries

## Risk Assessment
- **API downtime:** Retry handles it; data updates hourly so a miss is tolerable
- **Timestamp precision:** Unix seconds; convert to JS Date carefully

## Security Considerations
- No auth needed; public API
