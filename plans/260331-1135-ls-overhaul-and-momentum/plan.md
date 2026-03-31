---
title: "L/S Tug-of-War & MACD Momentum Card"
description: "Overhaul L/S Ratio card with tug-of-war design + sparkline, add new MACD momentum card"
status: pending
priority: P2
effort: 3h
branch: main
tags: [ui, dashboard, metrics, macd, long-short-ratio]
created: 2026-03-31
---

# L/S Tug-of-War & MACD Momentum Card

## Summary

Overhaul the existing Long/Short Ratio card into a full-width tug-of-war visualization with 24-point sparkline and crowding signals. Add a new compact MACD Momentum card derived from existing kline data. Reorganize dashboard layout.

## Brainstorm Report

- [brainstorm-260331-1135-ls-overhaul-and-momentum.md](../reports/brainstorm-260331-1135-ls-overhaul-and-momentum.md)

## Phases

| # | Phase | Effort | Status |
|---|-------|--------|--------|
| 1 | [Data Layer Updates](./phase-01-data-layer-updates.md) | 45min | Pending |
| 2 | [L/S Tug-of-War Card](./phase-02-ls-tug-of-war-card.md) | 45min | Pending |
| 3 | [Momentum MACD Card](./phase-03-momentum-macd-card.md) | 45min | Pending |
| 4 | [Layout Reorganization](./phase-04-layout-reorganization.md) | 45min | Pending |

## Key Dependencies

- Phase 2 and 3 depend on Phase 1 (new types + data)
- Phase 4 depends on Phase 3 (new component import)
- No new APIs or charting libraries
- All math from existing 100x 4h klines (MACD) or new 24-point L/S history

## Constraints

- Pure SVG + CSS, no charting libs
- Files under 200 lines, kebab-case
- Must not break CrowdPulse score (L/S weight stays 20%)
- Responsive: mobile stacks vertically

## Success Criteria

- L/S card communicates bias + trend direction in <2s glance
- MACD card adds non-redundant signal (distinct from RSI)
- No new API dependencies or keys
- Dashboard doesn't feel cluttered
