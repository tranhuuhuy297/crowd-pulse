---
title: "Refactor CrowdPulse to Static GitHub Pages App"
description: "Remove backend, make browser call free APIs directly, deploy on GitHub Pages"
status: pending
priority: P2
effort: 6h
branch: main
tags: [refactor, simplification, github-pages, static-site]
created: 2026-03-30
---

# CrowdPulse Static GitHub Pages Refactor

## Goal
Strip CrowdPulse from full-stack (API + DB + Redis + BullMQ) to a pure client-side React app. Browser calls free public APIs directly. Deploy via GitHub Actions to GitHub Pages.

## Score Formula (4 components)
```
score = fearGreed * 0.35 + avgRSI * 0.25 + volumeAnomaly * 0.20 + longShortRatio * 0.20
```

## What Stays
- CrowdPulse gauge, Fear & Greed card, price grid, long/short ratio card
- RSI calculator, score calculator (simplified)
- React 19 + Vite + TailwindCSS v4

## What Gets Dropped
- Backend API server, DB, Redis, BullMQ, SSE
- Google Trends, Reddit sentiment, on-chain metrics, signal history, alerts
- `apps/api/` entirely

## Phases

| # | Phase | Status | Effort | File |
|---|-------|--------|--------|------|
| 1 | [Simplify Types & Score Calculator](./phase-01-simplify-types-and-score-calculator.md) | pending | 1h |
| 2 | [Client-Side API Fetchers](./phase-02-client-side-api-fetchers.md) | pending | 1.5h |
| 3 | [New Dashboard Hook](./phase-03-new-dashboard-hook.md) | pending | 1h |
| 4 | [UI Cleanup](./phase-04-ui-cleanup.md) | pending | 1h |
| 5 | [Vite + GitHub Pages Deploy](./phase-05-vite-github-pages-deploy.md) | pending | 1h |
| 6 | [Cleanup & README](./phase-06-cleanup-and-readme.md) | pending | 0.5h |

## Key Dependencies
- Binance public API (no auth, CORS OK)
- alternative.me Fear & Greed API (no auth, CORS OK)
- Binance Futures globalLongShortAccountRatio (no auth, CORS OK)

## Risk
- Binance may rate-limit browser requests; mitigate with 60s polling interval
- CORS policies could change; all APIs verified working from browser
