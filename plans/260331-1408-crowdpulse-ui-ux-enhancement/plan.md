---
title: "CrowdPulse UI/UX Enhancement"
description: "10 UI/UX improvements: DashboardCard wrapper, sentiment utils, market pulse bar, taker visual bar, ETH display, hover effects, gauge animation, score bars, buy conclusion pulse"
status: pending
priority: P1
effort: 3h
branch: main
tags: [ui-ux, refactoring, dashboard, crypto]
created: 2026-03-31
---

# CrowdPulse UI/UX Enhancement

10 improvements across 3 priority tiers. No new npm deps. Both light/dark themes.

## Phases

| # | Phase | Items | Effort | Status |
|---|-------|-------|--------|--------|
| 1 | [Foundation & Refactoring](./phase-01-foundation-and-refactoring.md) | DashboardCard wrapper, sentiment color utils | 1h | pending |
| 2 | [New Features](./phase-02-new-features.md) | Market pulse bar, taker visual bar, ETH display, basis decimals, hover effects | 1.5h | pending |
| 3 | [Polish](./phase-03-polish.md) | Gauge animation, score bars, buy conclusion pulse | 30m | pending |

## Key Dependencies

- Phase 2 depends on Phase 1 (DashboardCard wrapper used by new components)
- Phase 3 independent, can run in parallel with Phase 2

## Architecture Summary

- All cards share repeated classes: `rounded-xl p-3 backdrop-blur-sm overflow-visible hover:z-20 focus-within:z-20` + inline bg/border styles
- 8 card components currently duplicate these patterns
- Sentiment coloring (green-fear to red-greed) duplicated across 6+ files
- CSS variables already in `index.css` for light/dark theme support

## Files Overview

**New files (2):**
- `apps/web/src/components/dashboard-card.tsx` - shared card wrapper
- `apps/web/src/lib/sentiment-color-utils.ts` - shared color utilities
- `apps/web/src/components/market-pulse-summary-bar.tsx` - horizontal summary strip

**Modified files (10):**
- All 8 card components, `app.tsx`, `index.css`

## Constraints

- No new npm dependencies
- Files under 200 lines
- kebab-case naming
- YAGNI/KISS/DRY
- Both light and dark themes supported
