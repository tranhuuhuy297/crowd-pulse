# Phase 4: Layout Restructure + Mobile Fix

## Context Links
- [Plan overview](./plan.md)
- [Phase 2 (dependency)](./phase-02-score-card-redesign.md)
- [Phase 3 (dependency)](./phase-03-longshort-visual-bars.md)
- App: `apps/web/src/components/../app.tsx`
- Price grid: `apps/web/src/components/symbol-price-grid.tsx`

## Overview
- **Priority:** Medium
- **Status:** pending
- **Description:** Restructure dashboard to 3-row layout, pass new props to score card, fix mobile visibility of RSI/Volume.

## Key Insights
- Current layout: 2-col (score + F&G) then 3-col (L/S 2/3 + price 1/3)
- New layout: full-width score hero -> 2-col (F&G + L/S) -> full-width BTC price
- `symbol-price-grid.tsx` hides RSI/Volume on mobile with `hidden sm:flex` (line 77)
- App is 76 lines, price grid is 93 lines -- both well within limit

## Requirements
### Functional
- Row 1: Full-width `CrowdPulseScoreCard` (hero position with breakdown)
- Row 2: 2-col grid -- `FearGreedDisplayCard` + `LiquidationRatioDisplayCard`
- Row 3: Full-width BTC price card
- RSI/Volume visible on all screen sizes
- Pass `components` and `scoreDelta` to `CrowdPulseScoreCard`

### Non-functional
- Responsive: single column on mobile, grid on lg+

## Architecture
```
<main>
  Row 1: <CrowdPulseScoreCard /> (full width)
  Row 2: <div grid 1->2 cols>
           <FearGreedDisplayCard />
           <LiquidationRatioDisplayCard />
         </div>
  Row 3: <div card wrapper>
           <SymbolPriceGrid />
         </div>
</main>
```

## Related Code Files
| Action | File |
|--------|------|
| Modify | `apps/web/src/app.tsx` |
| Modify | `apps/web/src/components/symbol-price-grid.tsx` |

## Implementation Steps

### 1. Update `app.tsx` layout
Replace current grid structure:
```tsx
{data && (
  <div className="flex flex-col gap-4">
    {/* Row 1: Score hero */}
    <CrowdPulseScoreCard
      score={data.crowdPulse.score}
      signal={data.crowdPulse.signal}
      updatedAt={data.crowdPulse.updatedAt}
      components={data.crowdPulse.components}
      scoreDelta={scoreDelta}
    />

    {/* Row 2: Fear & Greed + Long/Short */}
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <FearGreedDisplayCard
        value={data.fearGreed.value}
        classification={data.fearGreed.classification}
        change24h={data.fearGreed.change24h}
      />
      <LiquidationRatioDisplayCard longShort={data.longShort} />
    </div>

    {/* Row 3: BTC Price */}
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <SymbolPriceGrid prices={data.prices} />
    </div>
  </div>
)}
```

### 2. Destructure `scoreDelta` from hook
```tsx
const { data, loading, error, scoreDelta } = useCrowdPulseData(60_000);
```

### 3. Fix mobile RSI/Volume in `symbol-price-grid.tsx`
Change line 77:
```tsx
// Before:
<div className="hidden sm:flex items-center gap-4 ml-auto">
// After:
<div className="flex items-center gap-3 ml-auto flex-wrap">
```
Reduce gap from `gap-4` to `gap-3` for tighter mobile fit.

## Todo List
- [ ] Destructure `scoreDelta` from `useCrowdPulseData`
- [ ] Restructure `app.tsx` to 3-row layout
- [ ] Pass `components` and `scoreDelta` to `CrowdPulseScoreCard`
- [ ] Remove `hidden sm:flex` from price grid RSI/Volume section
- [ ] Verify both files under 200 lines

## Success Criteria
- Score card spans full width as hero element
- F&G and L/S side by side on desktop, stacked on mobile
- BTC price full width below
- RSI and Volume visible on mobile screens
- No layout overflow or horizontal scrolling

## Risk Assessment
- Score card full-width may look sparse on ultrawide -- mitigated by `max-w-7xl mx-auto` on main
- Mobile RSI/Volume may wrap to second line -- acceptable, `flex-wrap` handles it

## Security Considerations
- None

## Next Steps
- Phase 5 adds health indicator to header
- Phase 6 updates skeleton to match this layout
