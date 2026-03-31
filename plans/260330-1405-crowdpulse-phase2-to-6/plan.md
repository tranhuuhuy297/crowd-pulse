---
title: "CrowdPulse Phases 2-6 - Full Feature Implementation"
description: "Social sentiment, market data, contrarian signals, real-time alerts, and production deployment"
status: pending
priority: P1
effort: 32h
branch: kai/feat/crowdpulse-phase2-6
tags: [crypto, sentiment, reddit, google-trends, liquidation, onchain, sse, telegram, docker, gcp]
created: 2026-03-30
---

# CrowdPulse Phases 2-6 - Implementation Plan

## Overview

Extends CrowdPulse from Phase 1 (price + fear/greed crawlers, basic dashboard) into a full contrarian signal platform. Adds social sentiment (Reddit), market data crawlers (Google Trends, liquidation, on-chain), contrarian signal generation with accuracy tracking, real-time delivery (SSE + Telegram), and production Docker/GCP deployment.

## Current State (Phase 1 Complete)

- Monorepo: Bun workspaces with `apps/api`, `apps/web`, `packages/shared`
- Crawlers: Binance price (60s), Fear & Greed (1h) via BullMQ
- Score: `fearGreed*0.4 + RSI*0.3 + volume*0.3` with auto-redistribution
- Frontend: Dashboard with gauge, prices, fear/greed card
- DB schemas exist as placeholders for: `socialPosts`, `googleTrends`, `liquidationData`, `onchainMetrics`

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 2 | Reddit Sentiment Crawler | 8h | pending | [phase-02](./phase-02-reddit-sentiment-crawler.md) |
| 3 | Google Trends + Liquidation + On-chain | 7h | pending | [phase-03](./phase-03-google-trends-liquidation-onchain-crawlers.md) |
| 4 | Contrarian Signal Generator | 6h | pending | [phase-04](./phase-04-contrarian-signal-generator-and-accuracy-tracking.md) |
| 5 | Real-time SSE + Alerts + Telegram Bot | 6h | pending | [phase-05](./phase-05-realtime-sse-alerts-and-telegram-bot.md) |
| 6 | Docker Production + GCP Cloud Run + CI/CD | 5h | pending | [phase-06](./phase-06-docker-production-gcp-cloud-run-cicd.md) |

## Key Architecture Decisions

### Twitter/X: Skip (Reddit-Only for Social Sentiment)
- Twitter/X free API tier: 1,500 tweets/month read, no search endpoint
- Nitter scrapers are dead. No viable free alternative
- Reddit free API: 60 req/min with OAuth, full search, subreddit access
- **Decision**: Reddit-only for Phase 2. Twitter as optional future enhancement

### Score Formula Evolution
```
Phase 1: score = fearGreed*0.4 + RSI*0.3 + volume*0.3
Phase 4: score = fearGreed*0.25 + RSI*0.15 + volume*0.15 + sentiment*0.20 + trends*0.10 + liquidation*0.10 + onchain*0.05
```
Existing auto-redistribution handles missing components gracefully.

### New Dependencies
| Package | Purpose | Phase |
|---------|---------|-------|
| `snoowrap` | Reddit API wrapper | 2 |
| `natural` | NLP tokenizer + sentiment (local, no API) | 2 |
| `google-trends-api` | Google Trends scraping | 3 |
| `grammy` | Telegram Bot framework | 5 |

## Dependency Graph
```
Phase 2 (Reddit) ──┐
Phase 3 (Market)  ──┤──> Phase 4 (Signals) ──> Phase 5 (Realtime) ──> Phase 6 (Deploy)
```
Phases 2 and 3 are independent and can be implemented in parallel.

## Risk Summary

| Risk | Mitigation |
|------|------------|
| Reddit OAuth requires app registration | Documented in phase-02; free, instant approval |
| Google Trends rate limiting (informal) | 15-min crawl interval, random jitter |
| Binance futures API changes | Graceful degradation; score auto-redistributes |
| Telegram Bot API token required | Free, BotFather setup documented |
| GCP Cloud Run cold starts | Min instances=1 for prod, 0 for dev |
