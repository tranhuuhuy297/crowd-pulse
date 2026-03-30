---
title: "CrowdPulse Phase 1 - Crypto Crowd Sentiment Dashboard"
description: "Monorepo setup, data crawlers, API, and dashboard skeleton for crypto sentiment analysis"
status: pending
priority: P1
effort: 12h
branch: kai/feat/crowdpulse-phase1
tags: [crypto, sentiment, dashboard, crawlers, monorepo]
created: 2026-03-29
---

# CrowdPulse Phase 1 - Implementation Plan

## Overview

Web app analyzing crypto crowd sentiment using contrarian principles. Phase 1 delivers: monorepo scaffolding, price + fear/greed crawlers, dashboard API, and React gauge UI.

## Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | Bun.js |
| Backend | Hono.js + TypeScript (strict) |
| Database | PostgreSQL + Drizzle ORM |
| Cache/Queue | Redis + BullMQ (ioredis) |
| Frontend | React + Vite + TailwindCSS |
| Monorepo | Bun workspaces |

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | Monorepo & Dev Environment | 2h | pending | [phase-01](./phase-01-monorepo-setup.md) |
| 2 | Database Schema & Migrations | 2h | pending | [phase-02](./phase-02-database-schema.md) |
| 3 | Price Crawler (Binance) | 2.5h | pending | [phase-03](./phase-03-price-crawler.md) |
| 4 | Fear & Greed Crawler | 1h | pending | [phase-04](./phase-04-fear-greed-crawler.md) |
| 5 | Dashboard API Endpoint | 2h | pending | [phase-05](./phase-05-dashboard-api.md) |
| 6 | Frontend Dashboard Skeleton | 2.5h | pending | [phase-06](./phase-06-frontend-dashboard.md) |

## Key Dependencies

- Docker Compose for local Postgres + Redis
- Binance public API (no key needed)
- Alternative.me Fear & Greed API (free)
- BullMQ requires ioredis (not native Redis client)

## Architecture

```
apps/
  api/          # Hono.js backend + BullMQ workers
  web/          # React + Vite frontend
packages/
  shared/       # Types, constants, Zod schemas
docker-compose.yml
```

API serves on :3001, frontend on :5173. BullMQ workers run in same process as API (Phase 1 simplicity). Crowd Pulse Score = weighted composite of fear/greed index + RSI + volume change.

## Risk Summary

- BullMQ ioredis dependency works with Bun but needs testing
- Binance rate limits: 1200 req/min (4 symbols x 1/min = trivial)
- Fear & Greed API occasionally slow; retry with backoff handles it
