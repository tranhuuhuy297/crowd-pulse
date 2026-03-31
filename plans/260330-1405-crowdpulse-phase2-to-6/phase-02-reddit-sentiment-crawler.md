# Phase 2: Reddit Sentiment Crawler

## Context Links
- [Phase 1 Plan](../260329-1848-crowdpulse-phase1/plan.md)
- [Existing social posts schema](../../apps/api/src/db/schema/social-posts-placeholder-schema.ts)
- [BullMQ worker pattern](../../apps/api/src/jobs/fear-greed-crawler-worker.ts)
- [Score calculator](../../apps/api/src/services/crowd-pulse-score-calculator.ts)

## Overview
- **Priority**: P1
- **Status**: complete
- **Effort**: 8h
- **Description**: Crawl Reddit crypto subreddits for posts/comments, run local NLP sentiment analysis, store results, and integrate sentiment into CrowdPulse score.

## Key Insights

### Why Reddit-Only (No Twitter/X)
- Twitter/X free tier: 1,500 tweets/month read, no search API. Unusable for real-time sentiment
- Nitter scrapers no longer functional
- Reddit free API via OAuth: 60 req/min, full subreddit search, comment trees
- Reddit crypto communities (r/CryptoCurrency, r/Bitcoin, r/ethereum) are highly active and representative of retail sentiment

### Reddit API Access (Free)
1. Create Reddit app at https://www.reddit.com/prefs/apps
2. Select "script" type app
3. Get `client_id` and `client_secret` (instant, no approval wait)
4. Use `snoowrap` npm package (well-maintained Reddit API wrapper)
5. Rate limit: 60 requests/min with OAuth

### Local NLP Sentiment (No API Key)
- `natural` npm package: tokenizer, stemmer, Bayes classifier, AFINN-based sentiment
- `Sentiment` class from `sentiment` npm package (AFINN-165 wordlist, ~3,400 words)
- Runs locally in Bun, zero cost, no external calls
- **Recommendation**: Use `sentiment` package (simpler, AFINN-165 based, returns -5 to +5 score per word, normalized)

## Requirements

### Functional
- Crawl top/hot/new posts from: r/CryptoCurrency, r/Bitcoin, r/ethereum, r/solana
- Extract post title + selftext + top 10 comments per post
- Run sentiment analysis on each piece of text
- Store in `social_posts` table (schema already exists)
- Aggregate sentiment into a 0-100 normalized score for CrowdPulse
- Crawl every 15 minutes (avoid rate limits, sentiment doesn't change by the second)

### Non-Functional
- Graceful degradation: if Reddit API down, score auto-redistributes (already built)
- Deduplication: skip posts already crawled (by Reddit post ID stored in `author` field or add `externalId`)
- Respect Reddit rate limits with built-in delays

## Architecture

```
BullMQ Scheduler (15min)
  -> reddit-sentiment-worker
    -> reddit-post-fetcher.ts (snoowrap, fetch posts)
    -> reddit-comment-fetcher.ts (fetch top comments per post)
    -> text-sentiment-analyzer.ts (sentiment npm, score text)
    -> social-posts-db-service.ts (upsert to DB)
    -> sentiment-score-aggregator.ts (aggregate recent sentiment -> 0-100)
```

### Sentiment Normalization
- `sentiment` package returns comparative score: -1.0 (very negative) to +1.0 (very positive)
- Normalize to 0-100: `score = (comparative + 1) * 50`
- For CrowdPulse: higher = more bullish crowd = contrarian SELL signal (consistent with fear/greed)

## Schema Changes

### Update `social_posts` table
Add `external_id` column for deduplication:
```typescript
// Add to social-posts-placeholder-schema.ts
externalId: varchar("external_id", { length: 100 }),
subreddit: varchar("subreddit", { length: 100 }),
postType: varchar("post_type", { length: 20 }), // 'post' | 'comment'
```
Add unique index on `(source, external_id)`.

### New: `sentiment_aggregates` table
```typescript
export const sentimentAggregates = pgTable("sentiment_aggregates", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 20 }).notNull(), // 'reddit'
  avgScore: numeric("avg_score", { precision: 8, scale: 4 }).notNull(),
  postCount: integer("post_count").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  windowEnd: timestamp("window_end", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

## Related Code Files

### Files to Modify
- `apps/api/src/db/schema/social-posts-placeholder-schema.ts` - add columns + sentiment_aggregates table
- `apps/api/src/db/schema/index.ts` - export new table
- `apps/api/src/jobs/bullmq-queue-manager.ts` - add reddit queue
- `apps/api/src/index.ts` - register reddit scheduler + worker
- `apps/api/src/services/crowd-pulse-score-calculator.ts` - add sentiment weight
- `apps/api/src/services/dashboard-data-aggregator.ts` - fetch latest sentiment aggregate
- `packages/shared/src/types/dashboard-types.ts` - add SentimentComponent type
- `packages/shared/src/constants/tracked-symbols.ts` - add REDDIT_SUBREDDITS constant
- `apps/api/package.json` - add snoowrap + sentiment deps
- `apps/web/src/app.tsx` - add sentiment card to dashboard
- `.env.example` - add REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD

### Files to Create
- `apps/api/src/services/reddit-post-fetcher.ts` - fetch hot/new posts from subreddits
- `apps/api/src/services/reddit-comment-fetcher.ts` - fetch top comments per post
- `apps/api/src/services/text-sentiment-analyzer.ts` - score text with `sentiment` package
- `apps/api/src/services/social-posts-db-service.ts` - upsert posts, skip duplicates
- `apps/api/src/services/sentiment-score-aggregator.ts` - compute rolling avg from recent posts
- `apps/api/src/jobs/reddit-sentiment-crawler-worker.ts` - BullMQ worker orchestrating the crawl
- `apps/web/src/components/reddit-sentiment-display-card.tsx` - UI card for sentiment

## Implementation Steps

### Step 1: Install Dependencies (15min)
1. `cd apps/api && bun add snoowrap sentiment`
2. `cd apps/api && bun add -d @types/sentiment`
3. Add env vars to `.env.example`

### Step 2: Schema Updates (30min)
1. Add `externalId`, `subreddit`, `postType` columns to `socialPosts`
2. Create `sentimentAggregates` table in same schema file (rename file to `social-sentiment-schema.ts`)
3. Export from `schema/index.ts`
4. Run `make db-push`

### Step 3: Reddit Post Fetcher (1h)
1. Create `reddit-post-fetcher.ts`
2. Initialize snoowrap with env credentials
3. Fetch 25 hot posts from each subreddit
4. Return normalized array: `{ externalId, title, body, author, subreddit, postedAt }`
5. Handle auth errors gracefully (log + return empty array)

### Step 4: Text Sentiment Analyzer (45min)
1. Create `text-sentiment-analyzer.ts`
2. Import `Sentiment` from `sentiment` package
3. Expose `analyzeText(text: string): { score: number; comparative: number; normalized: number }`
4. Add crypto-specific word overrides (e.g., "moon" +3, "dump" -3, "rug" -4, "diamond hands" +2, "HODL" +2, "rekt" -3)
5. Normalize comparative to 0-100 scale

### Step 5: Social Posts DB Service (45min)
1. Create `social-posts-db-service.ts`
2. `upsertSocialPost()` - insert if externalId not exists
3. `getRecentPosts(source, hoursBack)` - for aggregation
4. Handle batch inserts efficiently

### Step 6: Sentiment Score Aggregator (45min)
1. Create `sentiment-score-aggregator.ts`
2. Query posts from last 4 hours
3. Compute weighted average (more recent = higher weight)
4. Store result in `sentiment_aggregates`
5. Return normalized 0-100 score for CrowdPulse integration

### Step 7: Reddit Crawler Worker (1h)
1. Create `reddit-sentiment-crawler-worker.ts` following existing worker pattern
2. Orchestrate: fetch posts -> analyze sentiment -> store -> aggregate
3. Add queue to `bullmq-queue-manager.ts`
4. Register 15-min scheduler in `index.ts`
5. Add worker to shutdown handler

### Step 8: Integrate into CrowdPulse Score (1h)
1. Add `sentimentScore: number | null` to `CrowdPulseInput`
2. Add `sentiment: 0.20` to BASE_WEIGHTS, reduce others proportionally
3. Update `dashboard-data-aggregator.ts` to fetch latest sentiment aggregate
4. Add `SentimentComponent` to shared types
5. Update `DashboardResponse` to include sentiment component

### Step 9: Frontend Sentiment Card (1h)
1. Create `reddit-sentiment-display-card.tsx`
2. Show: avg sentiment score, post count, bullish/bearish ratio, last updated
3. Add to dashboard layout in `app.tsx`
4. Color coding: green (bullish) / red (bearish) / gray (neutral)

### Step 10: Testing & Validation (1h)
1. Start API, verify Reddit crawl runs
2. Check `social_posts` table has data
3. Check `sentiment_aggregates` has computed scores
4. Verify dashboard shows sentiment component
5. Verify CrowdPulse score incorporates sentiment

## Todo List

- [x] Install snoowrap + sentiment packages
- [x] Update social_posts schema with new columns
- [x] Create sentiment_aggregates table
- [x] Implement reddit-hot-posts-fetcher.ts
- [x] Implement crypto-text-sentiment-analyzer.ts with crypto word overrides
- [x] Implement reddit-social-posts-db-service.ts
- [x] Implement reddit-sentiment-score-aggregator.ts
- [x] Implement reddit-sentiment-crawler-worker.ts
- [x] Add reddit queue + scheduler to bullmq-queue-manager + index.ts
- [x] Integrate sentiment into crowd-pulse-score-calculator.ts
- [x] Update dashboard-data-aggregator.ts
- [x] Update shared types (SentimentComponent, DashboardResponse)
- [x] Create reddit-sentiment-display-card.tsx
- [x] Add sentiment card to app.tsx layout
- [ ] Test full pipeline end-to-end (requires Reddit credentials + db push)

## Success Criteria

- Reddit posts crawled every 15 min from 4 subreddits
- Sentiment scores computed locally (no external NLP API)
- CrowdPulse score includes sentiment with 0.20 weight
- Dashboard displays sentiment card with score + post count
- Deduplication prevents re-processing same posts
- Graceful degradation when Reddit API unavailable

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Reddit requires app registration | Certain | Low | Free, instant; documented in steps |
| Reddit API rate limiting | Low | Medium | 15-min interval, max 100 posts/crawl |
| snoowrap compatibility with Bun | Low | High | Well-maintained, uses standard fetch; test early |
| Sentiment accuracy on crypto slang | Medium | Medium | Custom word overrides for crypto terms |
| Reddit API deprecation/changes | Low | High | Abstracted behind fetcher service; easy to swap |

## Security Considerations
- Reddit credentials stored in `.env` (never committed)
- No user PII stored beyond Reddit usernames (public data)
- Rate limiting respected to avoid IP bans

## Next Steps
- Phase 3 (Google Trends + Liquidation + On-chain) can start in parallel
- Phase 4 needs sentiment data flowing to generate contrarian signals
