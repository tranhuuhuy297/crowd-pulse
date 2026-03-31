---
title: "CrowdPulse Dashboard UI/UX Improvements"
description: "Redesign dashboard layout, add score breakdown, visual long/short bars, data health indicator, and mobile fixes"
status: pending
priority: P2
effort: 3h
branch: main
tags: [frontend, ui-ux, react, tailwind]
created: 2026-03-30
---

# CrowdPulse Dashboard UI/UX Improvements

## Goal
Improve dashboard readability: score component breakdown, visual long/short bars, data health indicator, better mobile layout, and loading skeleton alignment.

## Current State
- Single gauge + signal badge, no score breakdown
- Long/short ratios shown as text-only numbers
- RSI/Volume hidden on mobile (`hidden sm:flex`)
- No indication of which data sources succeeded/failed
- Footer duplicates header "last updated" info

## Phases

| # | Phase | Est. | Status |
|---|-------|------|--------|
| 1 | [Data Layer Updates](./phase-01-data-layer-updates.md) | 15m | pending |
| 2 | [Score Card Redesign](./phase-02-score-card-redesign.md) | 45m | pending |
| 3 | [Long/Short Visual Bars](./phase-03-longshort-visual-bars.md) | 30m | pending |
| 4 | [Layout Restructure + Mobile Fix](./phase-04-layout-restructure-mobile-fix.md) | 20m | pending |
| 5 | [Header/Footer Polish](./phase-05-header-footer-polish.md) | 15m | pending |
| 6 | [Loading Skeleton Update](./phase-06-loading-skeleton-update.md) | 10m | pending |

## Dependencies
- Phase 2 depends on Phase 1 (needs `components` and `scoreDelta`)
- Phase 4 depends on Phases 2-3 (passes new props, uses redesigned cards)
- Phase 5 depends on Phase 1 (needs `dataSourceHealth`)
- Phase 6 depends on Phase 4 (matches new layout)

## Constraints
- No new npm dependencies
- TailwindCSS v4, client-side only
- Each code file under 200 lines
- YAGNI/KISS/DRY
