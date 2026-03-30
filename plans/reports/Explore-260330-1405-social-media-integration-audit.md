# Social Media Integration Audit Report

**Date:** 2026-03-30  
**Project:** CrowdPulse - Crypto Crowd Sentiment Dashboard  
**Codebase:** /Users/huyth/Projects/personal/contrarian-thinking  
**Thoroughness:** Very Thorough (40+ files analyzed, all source files reviewed)

---

## Executive Summary

**Finding:** NO SOCIAL MEDIA INTEGRATIONS CURRENTLY IMPLEMENTED in Phase 1.

The codebase is a fully-scaffolded monorepo for Phase 1 of CrowdPulse, implementing only crypto price crawling (Binance) and fear/greed index sentiment. Social media data fetching is explicitly planned for **Phase 2** and beyond, as documented in the roadmap.

---

## Search Results Summary

### What Was NOT Found

1. **No Twitter/X Integration**
   - No `twitter`, `X`, or `nitter` code/imports
   - No Twitter API client libraries (tweepy, twitter-api-v2, etc.)
   - No authentication tokens or OAuth handlers for Twitter

2. **No Reddit Integration**
   - No `reddit` or `PRAW` (Python Reddit API Wrapper) code
   - No subreddit crawlers or Reddit API clients
   - No Reddit OAuth or credentials

3. **No Telegram Integration**
   - No `telegram` or `node-telegram-bot-api` code
   - No Telegram bot handlers or message processing

4. **No Discord Integration**
   - No `discord.js` or `discord-api` code
   - No Discord bot token handling or channel scrapers

5. **No YouTube Integration**
   - No `youtube-api` or `@googleapis/youtube` code
   - No video comment/metadata crawlers

6. **No Sentiment Analysis Code**
   - No NLP libraries (`sentiment`, `natural`, `transformers`, etc.)
   - No sentiment scoring logic outside of Fear/Greed index
   - No training data or ML models for social sentiment

7. **No API Keys or Credentials**
   - .env.example contains only 3 variables: DATABASE_URL, REDIS_URL, API_PORT
   - No TWITTER_API_KEY, REDDIT_CLIENT_ID, TELEGRAM_TOKEN, DISCORD_TOKEN, or YOUTUBE_API_KEY
   - No .env.local.example or credential templates for social media

8. **No Scrapers or Crawlers for Social Platforms**
   - No generic web scrapers (puppeteer, playwright, cheerio)
   - No social media crawlers beyond the Binance + Alternative.me crawlers

---

## What IS Currently Implemented

### Data Sources (Phase 1 - ACTIVE)

1. **Binance API (Price Data)**
   - File: `/apps/api/src/services/binance-klines-fetcher.ts`
   - Fetches OHLCV candles for: BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT
   - 1-minute interval, every 60 seconds
   - No authentication required (public API)
   - Rate limit: 1200 req/min (very conservative usage)

2. **Alternative.me Fear & Greed Index**
   - File: `/apps/api/src/services/fear-greed-api-fetcher.ts`
   - Fetches sentiment value + classification
   - 1-hour interval, automatic backfill on first run (30 days)
   - No authentication required (public API)
   - Calculates 24h change in percentage

### Sentiment/Score Calculation (Custom, Not Social-Based)

- **File:** `/apps/api/src/services/crowd-pulse-score-calculator.ts`
- **Formula:** `(fearGreed × 0.4) + (avgRSI × 0.3) + (volumeAnomaly × 0.3)`
- **Score Range:** 0-100 (0 = extreme bearish, 100 = extreme bullish)
- **Signals:** STRONG_BUY, BUY, NEUTRAL, SELL, STRONG_SELL
- **Input Sources:** Only Binance prices + Fear/Greed index, NOT social media

---

## Placeholder Tables (Not Yet Populated)

Database schema includes 5 placeholder tables defined for future phases:

1. **social_posts** (Phase 2 - Planned)
   - File: `/apps/api/src/db/schema/social-posts-placeholder-schema.ts`
   - Columns: id, source (varchar 20), content, sentimentScore (numeric), keywords (jsonb), author, postedAt, crawledAt
   - Sources field ready for: twitter, reddit, telegram, discord, youtube
   - sentimentScore column reserved but not yet populated

2. **google_trends** (Phase 3 - Planned)
   - id, keyword, interestValue, timestamp, createdAt

3. **liquidationData** (Phase 3 - Planned)
   - Long/short volumes and ratios for on-chain analysis

4. **onchainMetrics** (Phase 3 - Planned)
   - Generic on-chain metric tracking

5. **user_alerts** (User-specific, not phase-specific)
   - id, user_id, symbol, condition, threshold, is_active, created_at

---

## Project Roadmap (From README.md)

### Phase 1 (COMPLETE)
- [x] Monorepo, price crawler, fear & greed, dashboard API, frontend skeleton

### Phase 2 (NOT STARTED)
- [ ] **Twitter + Reddit sentiment crawlers** ← Social media integration planned here

### Phase 3 (NOT STARTED)
- [ ] Google Trends, liquidation data, on-chain metrics

### Phase 4 (NOT STARTED)
- [ ] Contrarian signal generator + historical accuracy tracking

### Phase 5 (NOT STARTED)
- [ ] Real-time SSE, alerts, Telegram bot ← Telegram integration planned here

### Phase 6 (NOT STARTED)
- [ ] Docker production setup, GCP Cloud Run deploy, CI/CD

---

## Environment Variables & Configuration

### Current .env.example
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crowdpulse
REDIS_URL=redis://localhost:6379
API_PORT=4177
```

### What Would Be Needed for Phase 2

Based on schema design and typical social media API integration:

**Twitter/X:**
- `TWITTER_API_KEY`
- `TWITTER_API_SECRET`
- `TWITTER_BEARER_TOKEN`
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_SECRET`

**Reddit:**
- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_USER_AGENT`
- `REDDIT_SUBREDDIT_LIST` (comma-separated keywords like: "cryptocurrency,bitcoin,ethereum")

**Telegram:**
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_IDS` (groups to monitor)

**Discord:**
- `DISCORD_BOT_TOKEN`
- `DISCORD_CHANNEL_IDS` (channels to monitor)

**YouTube:**
- `YOUTUBE_API_KEY`

**NLP/Sentiment:**
- `SENTIMENT_API_URL` (optional, if using external service like Hugging Face)

---

## Dependencies Analysis

### Currently Installed (Relevant)

**Backend (apps/api):**
- `hono` (HTTP framework)
- `bullmq` (job queue) + `ioredis` (Redis client)
- `drizzle-orm` (ORM) + `pg` (PostgreSQL driver)
- `pino` (structured logging)

**Frontend (apps/web):**
- `react` (UI framework)
- `vite` (bundler)
- `tailwindcss` v4 (styling)

**Shared (packages/shared):**
- `zod` (schema validation)
- `typescript` (type safety)

### NOT Installed (Would Be Needed for Phase 2)

Social media SDKs:
- `tweepy` or `twitter-api-v2` (Twitter)
- `praw` (Reddit)
- `node-telegram-bot-api` or `gramjs` (Telegram)
- `discord.js` (Discord)
- `@googleapis/youtube` (YouTube)

NLP/Sentiment libraries:
- `sentiment` or `natural` (lightweight sentiment analysis)
- `transformers.js` (Hugging Face models)
- `node-nlp` (natural language processing)

Crawling/Scraping (if not using official APIs):
- `puppeteer` or `playwright` (headless browser)
- `cheerio` or `jsdom` (DOM parsing)

---

## Files Analyzed

### Source Files (TypeScript)
- `/apps/api/src/index.ts` - Main API entry
- `/apps/api/src/db/schema/*.ts` (6 schema files)
- `/apps/api/src/services/*.ts` (4 service files)
- `/apps/api/src/jobs/*.ts` (3 job files)
- `/apps/api/src/routes/*.ts` (1 route file)
- `/apps/api/src/lib/logger-instance.ts`
- `/apps/web/src/` (11 React components + hooks + utilities)
- `/packages/shared/` (types, constants, schemas)

### Configuration Files
- `package.json` (root + 3 workspaces)
- `.env` and `.env.example`
- `tsconfig.base.json`
- `docker-compose.yml`
- `drizzle.config.ts`
- `vite.config.ts`

### Documentation Files
- `README.md`
- `plans/260329-1848-crowdpulse-phase1/` (6 phase documents)
- `plans/reports/` (2 previous reports)

### Total Files Reviewed: 40+

---

## Architecture Overview

```
contrarian-thinking/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   └── schema/        ← social_posts table (placeholder)
│   │   │   ├── services/
│   │   │   │   ├── binance-*.ts   ✓ Active
│   │   │   │   ├── fear-greed-*.ts ✓ Active
│   │   │   │   └── crowd-pulse-*.ts ✓ Active
│   │   │   ├── jobs/              ← Workers for price & F&G
│   │   │   └── routes/            ← Dashboard API
│   │   └── drizzle.config.ts
│   └── web/
│       └── src/                   ← React dashboard UI
└── packages/
    └── shared/                    ← Types & constants
```

---

## Key Findings

1. **Phase 1 is Complete & Standalone**
   - CrowdPulse works independently without social media
   - Uses only crypto price + fear/greed data
   - No external dependencies blocking Phase 2

2. **Schema is Ready for Social Media**
   - `social_posts` table explicitly designed for multiple sources
   - Columns: source (varchar 20), sentimentScore, keywords, author
   - Supports: twitter, reddit, telegram, discord, youtube

3. **Sentiment Calculation is Flexible**
   - Current formula can be extended to include social sentiment
   - Weight redistribution logic already handles missing components
   - Can add socialSentiment as 4th component in Phase 2

4. **No Credential Leakage Risk**
   - No API keys or tokens hardcoded
   - .env template clean (no sensitive defaults)
   - Safe to add credentials in Phase 2

5. **Infrastructure Ready for Scaling**
   - BullMQ + Redis for job queuing
   - PostgreSQL for data persistence
   - Separate workers for different crawlers
   - Can easily add social media workers in Phase 2

---

## Recommendations for Phase 2 (Social Media Integration)

### Architecture Decisions
1. **Use Official APIs First**
   - Twitter API v2 with bearer token
   - Reddit OAuth 2.0
   - YouTube Data API v3
   - Telegram Bot API
   - Discord Bot via gateway

2. **Create Separate Workers**
   - `/jobs/twitter-crawler-worker.ts`
   - `/jobs/reddit-crawler-worker.ts`
   - `/jobs/youtube-crawler-worker.ts`
   - `/jobs/telegram-crawler-worker.ts`
   - `/jobs/discord-crawler-worker.ts`

3. **Sentiment Analysis Strategy**
   - Option A: Use lightweight library (`sentiment` npm package)
   - Option B: Call Hugging Face Inference API
   - Option C: Use OpenAI/Claude API for better accuracy

4. **Data Storage**
   - Store raw posts in `social_posts` table
   - Calculate sentiment score on insert
   - Keep keywords (hashtags, mentioned coins) in jsonb
   - Index by source + timestamp for query performance

5. **Rate Limiting**
   - Twitter: 450 req/15min (app-level)
   - Reddit: ~60 req/min (built-in by PRAW)
   - YouTube: 10k units/day quota
   - Use exponential backoff for retries

### Dependencies to Add
```json
{
  "twitter-api-v2": "^1.14.2",
  "praw": "^5.x.x",  // Python - separate service or node wrapper
  "@googleapis/youtube": "^11.0.0",
  "node-telegram-bot-api": "^0.65.0",
  "discord.js": "^14.x.x",
  "sentiment": "^6.2.2"
}
```

---

## Unresolved Questions

1. **Sentiment Analysis Approach:** 
   - Will Phase 2 use lightweight local library, API service, or LLM?
   - Impact on accuracy and latency

2. **Data Retention Policy:**
   - How long to keep raw social posts? (storage/cost considerations)
   - Archive to S3/GCS after N days?

3. **Keyword Definition:**
   - How to identify crypto-relevant posts vs noise?
   - Hardcoded coin list + hashtags, or dynamic NER?

4. **Backfill Strategy:**
   - Bootstrap with historical Twitter search?
   - Reddit pushshift archive or live API only?

5. **Real-time vs Batch:**
   - Phase 2 batch crawlers? Real-time streaming in Phase 5?
   - WebSocket connections for Telegram/Discord?

---

## Summary Table

| Category | Status | Details |
|----------|--------|---------|
| **Twitter Integration** | NOT STARTED | Planned Phase 2 |
| **Reddit Integration** | NOT STARTED | Planned Phase 2 |
| **Telegram Integration** | NOT STARTED | Planned Phase 5 (bot) |
| **Discord Integration** | NOT STARTED | Not explicitly planned |
| **YouTube Integration** | NOT STARTED | Not explicitly planned |
| **Sentiment Analysis** | PARTIAL | Only Fear/Greed index; table schema ready |
| **API Keys** | NONE STORED | Safe for Phase 2 implementation |
| **Scrapers** | NONE | Only API crawlers (Binance, Alternative.me) |
| **Database Schema** | READY | social_posts table exists, empty |

---

## Conclusion

CrowdPulse Phase 1 is a **complete standalone system** that does not implement social media integration. The codebase is well-architected, properly typed, and explicitly planned for social media in Phase 2. All necessary infrastructure is in place; the main work for Phase 2 will be:

1. Adding social media API client libraries
2. Creating new crawler workers for each platform
3. Implementing sentiment analysis (local or API-based)
4. Populating the `social_posts` table with streaming data
5. Integrating social sentiment into the Crowd Pulse Score calculation

No security risks found. No API keys leaking. Ready to proceed with Phase 2 implementation.
