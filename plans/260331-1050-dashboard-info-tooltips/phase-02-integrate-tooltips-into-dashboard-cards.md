# Phase 2: Integrate Tooltips into Dashboard Cards

## Context
- Parent plan: [plan.md](./plan.md)
- Depends on: [Phase 1](./phase-01-create-info-tooltip-component.md)
- Brainstorm: [brainstorm report](../reports/brainstorm-260331-1050-dashboard-tooltip-instructions.md)

## Overview
- **Priority:** Medium
- **Status:** Pending
- **Description:** Add `<InfoTooltip>` to all metric labels across 5 dashboard card components

## Key Insights
- All card titles use same pattern: `<h2 class="text-xs font-semibold uppercase tracking-wider">`
- `score-component-breakdown.tsx` has 4 rows — each gets unique tooltip text
- `symbol-price-grid.tsx` RSI and Volume are in a flex stats section
- `liquidation-ratio-display-card.tsx` already has explanatory footer text — tooltip supplements it

## Requirements

### Functional
- Every metric on dashboard has visible ⓘ icon next to its label
- Tooltip content matches brainstorm spec (see content map below)

### Non-Functional
- No layout shift from adding icons
- Consistent icon sizing and spacing across all cards

## Tooltip Content Map

### crowd-pulse-score-card.tsx (2 tooltips)
| Location | Content | Placement |
|----------|---------|-----------|
| "Crowd Pulse" title | "Composite sentiment score (0-100). Formula: F&G×35% + RSI×25% + Volume×20% + L/S×20%. Weights auto-redistribute when sources unavailable." | top |
| Signal badge row | "Contrarian signal: when crowd is greedy (80+), consider selling. When fearful (<20), consider buying." | top |

### fear-greed-display-card.tsx (1 tooltip)
| Location | Content | Placement |
|----------|---------|-----------|
| "Fear & Greed" title | "Crypto market sentiment from alternative.me. 0 = Extreme Fear, 100 = Extreme Greed. Updated daily." | top |

### symbol-price-grid.tsx (2 tooltips)
| Location | Content | Placement |
|----------|---------|-----------|
| "RSI" label | "Relative Strength Index (14-period Wilder). >70 = overbought, <30 = oversold. From hourly candles." | bottom |
| "Volume" label | "BTC/USDT spot trading volume in last 24 hours. Source: Binance." | bottom |

### liquidation-ratio-display-card.tsx (1 tooltip)
| Location | Content | Placement |
|----------|---------|-----------|
| "Long/Short Ratio" title | "Long vs short positions on Binance Futures. Ratio >1 = more longs (bullish crowd). Shows All Accounts, Top Traders by Account, and Top Traders by Position." | top |

### score-component-breakdown.tsx (4 tooltips)
| Component | Content | Placement |
|-----------|---------|-----------|
| Fear & Greed | "Fear & Greed Index value (0-100). Weight: 35% of total score." | right |
| RSI | "Average RSI across tracked symbols. Weight: 25% of total score." | right |
| Volume | "Volume anomaly: current vs 50-period average. Weight: 20% of total score." | right |
| L/S Ratio | "Long/short ratio normalized to 0-100. Weight: 20% of total score." | right |

## Related Code Files
- **Edit:** `apps/web/src/components/crowd-pulse-score-card.tsx` (74 lines)
- **Edit:** `apps/web/src/components/fear-greed-display-card.tsx` (65 lines)
- **Edit:** `apps/web/src/components/symbol-price-grid.tsx` (93 lines)
- **Edit:** `apps/web/src/components/liquidation-ratio-display-card.tsx` (119 lines)
- **Edit:** `apps/web/src/components/score-component-breakdown.tsx` (54 lines)

## Implementation Steps

### 2.1 crowd-pulse-score-card.tsx
1. Import `InfoTooltip` from `./info-tooltip`
2. Add `<InfoTooltip>` after "Crowd Pulse" h2 text
3. Add `<InfoTooltip>` next to signal badge (in the flex row)

### 2.2 fear-greed-display-card.tsx
1. Import `InfoTooltip`
2. Add `<InfoTooltip>` after "Fear & Greed" h2 text

### 2.3 symbol-price-grid.tsx
1. Import `InfoTooltip`
2. Add `<InfoTooltip placement="bottom">` after "RSI" label
3. Add `<InfoTooltip placement="bottom">` after "Volume" label

### 2.4 liquidation-ratio-display-card.tsx
1. Import `InfoTooltip`
2. Add `<InfoTooltip>` after "Long/Short Ratio" h3 text (both in empty-state and main render)

### 2.5 score-component-breakdown.tsx
1. Import `InfoTooltip`
2. Add tooltip description to `COMPONENT_CONFIG` array (new `tooltip` field per item)
3. Render `<InfoTooltip placement="right" content={tooltip}>` after each label span

### 2.6 Build Verification
1. Run `cd apps/web && bun run build` to verify no compile errors
2. Visual check in dev server for both themes

## Todo
- [ ] Add tooltips to crowd-pulse-score-card.tsx (title + signal)
- [ ] Add tooltip to fear-greed-display-card.tsx (title)
- [ ] Add tooltips to symbol-price-grid.tsx (RSI + Volume)
- [ ] Add tooltip to liquidation-ratio-display-card.tsx (title)
- [ ] Add tooltips to score-component-breakdown.tsx (4 component labels)
- [ ] Run build to verify no compile errors
- [ ] Visual verify both light and dark themes

## Success Criteria
- All 10 tooltip locations render ⓘ icon
- Hovering each shows correct explanatory text
- No layout shift or visual regression
- Build passes without errors
- Both light/dark themes look correct

## Risk Assessment
- **Layout shift in score breakdown:** Fixed-width label span (`w-22`) may need adjustment if icon crowds text — check visually
- **Tooltip clipping on small screens:** Use `bottom` placement for top-of-page elements, `right` for narrow breakdown bars

## Security Considerations
- All content is static strings — no injection risk

## Next Steps
- Commit changes
- Optional: add tooltip to health status dot in app.tsx header
