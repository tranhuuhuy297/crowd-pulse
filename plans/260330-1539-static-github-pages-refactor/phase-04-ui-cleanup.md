# Phase 4: UI Cleanup

## Context Links
- Current app: `apps/web/src/app.tsx`
- Components dir: `apps/web/src/components/`

## Overview
- **Priority:** Medium
- **Status:** pending
- **Description:** Update `app.tsx` to use new hook, remove dropped components, update kept components to new data shapes.

## Key Insights
- 6 components get deleted, 5 remain (with modifications)
- app.tsx layout simplifies from 3 grid rows to 2 rows + price grid
- Components must import from local types instead of `@crowdpulse/shared`

## Requirements
**Functional:**
- app.tsx uses `useCrowdPulseData()` hook
- Remove: RedditSentimentDisplayCard, GoogleTrendsDisplayCard, OnchainMetricsDisplayCard, ContrarianSignalHistoryCard, SignalAccuracyStatsCard, AlertConfigurationPanel
- Keep & update: CrowdPulseScoreCard, FearGreedDisplayCard, LiquidationRatioDisplayCard, SymbolPriceGrid, SvgGaugeChart, DashboardLoadingSkeleton
- Remove SSE connection status indicators (no more "Live", "Reconnecting")
- Show simple "Last updated X min ago" + "Refreshing every 60s"

**Non-functional:**
- No broken imports after cleanup

## Architecture
New layout:
```
Row 1: CrowdPulseScoreCard | FearGreedDisplayCard
Row 2: LiquidationRatioDisplayCard | (volume anomaly inline in score card or separate small card)
Row 3: SymbolPriceGrid (full width, with RSI column)
Footer: Last updated timestamp
```

## Related Code Files
**Modify:**
- `apps/web/src/app.tsx` -- new hook, simplified layout
- `apps/web/src/components/crowd-pulse-score-card.tsx` -- same props, minor type import change
- `apps/web/src/components/fear-greed-display-card.tsx` -- same props
- `apps/web/src/components/liquidation-ratio-display-card.tsx` -- adapt to `LongShortData[]` array
- `apps/web/src/components/symbol-price-grid.tsx` -- adapt to `PriceSnapshot[]` array

**Delete:**
- `apps/web/src/components/reddit-sentiment-display-card.tsx`
- `apps/web/src/components/google-trends-display-card.tsx`
- `apps/web/src/components/onchain-metrics-display-card.tsx`
- `apps/web/src/components/contrarian-signal-history-card.tsx`
- `apps/web/src/components/signal-accuracy-stats-card.tsx`
- `apps/web/src/components/alert-configuration-panel.tsx`

## Implementation Steps

1. **Update app.tsx:**
   - Replace `useDashboardSSEStream` with `useCrowdPulseData`
   - Remove SSE status indicators
   - Remove deleted component imports
   - Simplify grid layout to 2 rows + price grid
   - Add simple "Last updated" + "Refreshes every 60s" footer

2. **Update CrowdPulseScoreCard:**
   - Change import from `@crowdpulse/shared` to local `../lib/types`
   - Props stay same: `{ score, signal, updatedAt }`

3. **Update FearGreedDisplayCard:**
   - Change type imports to local
   - Props stay same: `{ value, classification, change24h }`

4. **Update LiquidationRatioDisplayCard:**
   - Accept `longShort: LongShortData[]` instead of single values
   - Show average ratio + per-symbol breakdown

5. **Update SymbolPriceGrid / SymbolPriceCard:**
   - Accept `prices: PriceSnapshot[]` array instead of Record
   - Ensure RSI column displays

6. **Delete 6 removed component files**

7. **Update DashboardLoadingSkeleton:** remove skeleton cards for dropped components

## Todo List
- [ ] Update `app.tsx` with new hook and layout
- [ ] Update CrowdPulseScoreCard imports
- [ ] Update FearGreedDisplayCard imports
- [ ] Refactor LiquidationRatioDisplayCard for array input
- [ ] Refactor SymbolPriceGrid for array input
- [ ] Delete 6 removed component files
- [ ] Update DashboardLoadingSkeleton
- [ ] Verify no broken imports (run `tsc --noEmit`)

## Success Criteria
- App renders with live data from public APIs
- No console errors
- All deleted components gone, no dead imports
- TypeScript compiles clean

## Risk Assessment
- **Low.** Straightforward component deletion and prop adjustments.

## Security Considerations
- None.

## Next Steps
- Phase 5 configures Vite for GitHub Pages and adds deployment workflow
