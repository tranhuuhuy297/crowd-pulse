---
title: "Dashboard Info Tooltips"
description: "Add ⓘ hover/tap tooltips explaining every metric on the CrowdPulse dashboard"
status: pending
priority: P3
effort: 1.5h
branch: main
tags: [ui, ux, tooltips, accessibility]
created: 2026-03-31
---

# Dashboard Info Tooltips

## Goal
Add info (ⓘ) tooltips to all dashboard metrics so users can understand what each indicator means, how it's calculated, and where data comes from.

## Approach
- Zero new dependencies — pure CSS/Tailwind tooltip component
- Lucide `Info` icon (already in deps)
- Hover on desktop, tap on mobile (`focus-within`)
- Light/dark theme via existing CSS variables

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Create InfoTooltip component](./phase-01-create-info-tooltip-component.md) | pending | 30m |
| 2 | [Integrate tooltips into all cards](./phase-02-integrate-tooltips-into-dashboard-cards.md) | pending | 1h |

## Key Decisions
- No tooltip library — CSS `group-hover` + `focus-within` sufficient for fixed-layout dashboard
- Tooltip placement per-instance (`top`/`bottom`/`right`) to avoid viewport clipping
- Content is plain text strings, not rich HTML

## Files Overview
- **Create:** `apps/web/src/components/info-tooltip.tsx`
- **Edit:** `crowd-pulse-score-card.tsx`, `fear-greed-display-card.tsx`, `symbol-price-grid.tsx`, `liquidation-ratio-display-card.tsx`, `score-component-breakdown.tsx`

## Reference
- [Brainstorm report](../reports/brainstorm-260331-1050-dashboard-tooltip-instructions.md)
