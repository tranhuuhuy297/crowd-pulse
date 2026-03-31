# Phase 5: UI Components

## Context
- Parent: [plan.md](plan.md)
- Depends on: [Phase 4](phase-04-data-hook-integration.md)
- Pattern ref: existing display cards in `apps/web/src/components/`

## Overview
- Priority: P2
- Status: pending
- Add display cards for funding rate and open interest, update score breakdown to 6 rows, update dashboard layout and health display.

## Key Insights
- Score breakdown currently 4 rows — add 2 more (Funding Rate, Open Interest)
- Follow existing card pattern: rounded-xl, backdrop-blur-sm, CSS vars for theming
- Funding rate card: show rate %, color-coded (green = negative/fear, red = positive/greed)
- OI card: show % change vs 14d avg, color-coded similarly
- Dashboard health needs 6 sources instead of 4

## Requirements
### Score Breakdown (MODIFY)
- Add "Funding Rate" row: weight 20%, color bg-orange-500, tooltip explaining metric
- Add "Open Interest" row: weight 15%, color bg-purple-400, tooltip explaining metric
- Reorder: F&G, Funding, RSI, L/S, OI, Volume (by weight descending)

### Funding Rate Display Card (NEW)
- Title: "Funding Rate"
- Hero value: rate as percentage (e.g., "+0.01%")
- Color: green (negative) → neutral → red (positive)
- Per-symbol breakdown (BTC: +0.01%)
- Tooltip: "8h funding rate. Positive = longs pay shorts = bullish crowd."

### Open Interest Display Card (NEW)
- Title: "Open Interest"
- Hero value: % change from 14d avg (e.g., "+12.5%")
- Color: green (below avg) → neutral → red (above avg)
- Per-symbol breakdown
- Tooltip: "OI vs 14d avg. High OI = overleveraged crowd."

### Dashboard Layout (MODIFY)
- Add new cards to grid alongside existing ones
- Update health dot to check 6 sources
- Update failedSources() with new source names

### Loading Skeleton (MODIFY)
- Add skeleton placeholders for 2 new cards

## Related Code Files
- MODIFY: `apps/web/src/components/score-component-breakdown.tsx`
- NEW: `apps/web/src/components/funding-rate-display-card.tsx`
- NEW: `apps/web/src/components/open-interest-display-card.tsx`
- MODIFY: `apps/web/src/app.tsx`
- MODIFY: `apps/web/src/components/dashboard-loading-skeleton.tsx`

## Implementation Steps
1. Update COMPONENT_CONFIG in score-component-breakdown.tsx: add 2 entries, reorder
2. Create funding-rate-display-card.tsx following fear-greed card pattern
3. Create open-interest-display-card.tsx following L/S ratio card pattern
4. Update app.tsx: import new cards, add to grid, update healthDotColor for 6 sources, update failedSources
5. Update dashboard-loading-skeleton.tsx: add 2 skeleton cards

## Todo
- [ ] Score breakdown: 6 rows with correct weights/colors
- [ ] Funding rate display card
- [ ] Open interest display card
- [ ] App layout updated with new cards
- [ ] Health indicator updated for 6 sources
- [ ] Loading skeleton updated

## Success Criteria
- All 6 components visible in score breakdown
- New cards render with correct data and colors
- Health dot reflects 6 data sources
- Responsive layout works on mobile

## Risk Assessment
- Low — follows established patterns
- Grid layout may need adjustment for 4+ cards in a row on desktop

## Next Steps
→ Phase 6: Buy Conclusion Enhancement
