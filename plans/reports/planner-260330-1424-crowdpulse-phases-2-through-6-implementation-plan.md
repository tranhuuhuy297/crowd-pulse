# Planner Report: CrowdPulse Phases 2-6

**Date**: 2026-03-30
**Plan**: `/Users/huyth/Projects/personal/contrarian-thinking/plans/260330-1405-crowdpulse-phase2-to-6/plan.md`

## Summary

Created comprehensive implementation plan for CrowdPulse Phases 2-6, covering 5 phase files totaling ~32h of effort. Plan builds on Phase 1's monorepo + crawlers + dashboard foundation.

## Key Decisions

1. **Twitter/X skipped** - free tier is 1,500 tweets/month read, no search. Unusable. Reddit-only for social sentiment (60 req/min free with OAuth).
2. **Reddit via `snoowrap`** + local NLP via `sentiment` package (AFINN-165). No external API keys for sentiment analysis.
3. **Google Trends via `google-trends-api`** npm (scraper, no key). Binance futures public API for long/short ratios. Blockchain.info free API for on-chain.
4. **Single container** for production - API serves static Vite build. Simpler than separate containers.
5. **Neon + Upstash** recommended for free-tier Postgres + Redis in production (vs paid Cloud SQL + Memorystore).
6. **SSE via Hono built-in** `streamSSE` helper. EventSource on frontend with polling fallback.
7. **grammy** for Telegram bot (TypeScript-first, Bun compatible).

## Score Formula Evolution

```
Phase 1: fearGreed*0.4 + RSI*0.3 + volume*0.3
Phase 4: fearGreed*0.25 + RSI*0.15 + volume*0.15 + sentiment*0.20 + trends*0.10 + liquidation*0.10 + onchain*0.05
```

## Phase Dependency Graph

Phases 2 + 3 are parallelizable. Phase 4 depends on both. Phase 5 depends on 4. Phase 6 depends on 5.

## Files Created

- `plans/260330-1405-crowdpulse-phase2-to-6/plan.md`
- `plans/260330-1405-crowdpulse-phase2-to-6/phase-02-reddit-sentiment-crawler.md`
- `plans/260330-1405-crowdpulse-phase2-to-6/phase-03-google-trends-liquidation-onchain-crawlers.md`
- `plans/260330-1405-crowdpulse-phase2-to-6/phase-04-contrarian-signal-generator-and-accuracy-tracking.md`
- `plans/260330-1405-crowdpulse-phase2-to-6/phase-05-realtime-sse-alerts-and-telegram-bot.md`
- `plans/260330-1405-crowdpulse-phase2-to-6/phase-06-docker-production-gcp-cloud-run-cicd.md`

## New Dependencies (All Free)

| Package | Phase | Purpose |
|---------|-------|---------|
| `snoowrap` | 2 | Reddit API wrapper |
| `sentiment` | 2 | Local NLP sentiment (AFINN-165) |
| `google-trends-api` | 3 | Google Trends scraping |
| `grammy` | 5 | Telegram bot framework |

## New DB Tables

| Table | Phase |
|-------|-------|
| `sentiment_aggregates` | 2 |
| `contrarian_signals` | 4 |
| `telegram_subscribers` | 5 |

Existing placeholder tables (`social_posts`, `google_trends`, `liquidation_data`, `onchain_metrics`) get minor column additions.

## Env Vars Needed

| Variable | Phase | Source |
|----------|-------|--------|
| `REDDIT_CLIENT_ID` | 2 | reddit.com/prefs/apps |
| `REDDIT_CLIENT_SECRET` | 2 | reddit.com/prefs/apps |
| `REDDIT_USERNAME` | 2 | Reddit account |
| `REDDIT_PASSWORD` | 2 | Reddit account |
| `TELEGRAM_BOT_TOKEN` | 5 | @BotFather |
| `GCP_PROJECT_ID` | 6 | GCP Console |

## Unresolved Questions

1. **Reddit `snoowrap` + Bun compatibility** - widely used but not explicitly tested on Bun. Mitigated by early testing in Phase 2 Step 1.
2. **Cloud Run SSE timeout** - default 5min; needs explicit timeout=3600s config. Documented in Phase 6.
3. **google-trends-api reliability** - unofficial scraper; may break. Graceful degradation built in via score auto-redistribution.
4. **On-chain metric baseline** - 30-day rolling average needs 30 days of data. Initial period will have less accurate normalization. Could seed with historical data from blockchain.info.
