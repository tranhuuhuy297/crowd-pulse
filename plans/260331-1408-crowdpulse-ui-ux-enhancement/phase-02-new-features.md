# Phase 2: New Features

## Context Links
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 1](./phase-01-foundation-and-refactoring.md) (DashboardCard, sentiment utils)
- Types: `apps/web/src/lib/types.ts`

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 1.5h
- **Description:** 5 new features: market pulse summary bar, taker buy/sell visual bar, ETH price display, futures basis decimal cleanup, card hover effects

## Key Insights
- Market pulse bar provides at-a-glance dashboard health without scrolling
- Taker buy/sell data already includes `buyVol`/`sellVol` fields but only ratio displayed
- `prices` array already supports multiple symbols; just filtering to BTC currently
- Futures basis hero shows 4 decimals which is excessive for the large number
- Hover effects handled via DashboardCard from Phase 1 (just add CSS transition + border accent)

## Requirements

### Functional
- Market pulse bar shows 5 colored chips: Fear/Greed value, L/S ratio, funding rate, OI change, basis
- Taker card shows stacked green/red bar proportional to buyVol/sellVol
- ETH price displayed alongside BTC in symbol-price-grid
- Futures basis hero number uses 2 decimals, per-symbol uses 4 decimals
- Cards show subtle border accent on hover

### Non-functional
- Market pulse bar under 80 lines
- No layout shift on hover
- Responsive: chips wrap on narrow screens

## Architecture

### Market Pulse Summary Bar
Horizontal strip component placed in `app.tsx` between header and main.
Receives `DashboardData`, extracts 5 key metrics, renders colored chips.

```
<MarketPulseSummaryBar data={data} />
  ├── Chip: F&G {value} — color from FEAR_GREED_TIERS
  ├── Chip: L/S {ratio} — color from RATIO_TIERS
  ├── Chip: FR {rate%} — color from FUNDING_RATE_TIERS
  ├── Chip: OI {change%} — color from OI_CHANGE_TIERS
  └── Chip: Basis {pct%} — color from BASIS_PCT_TIERS
```

### Taker Visual Bar
Inside existing `top-trader-and-taker-display-card.tsx`, below taker ratio number.
Same pattern as existing long/short bar in the top trader section.

### ETH Price Display
`symbol-price-grid.tsx` updated to show ETH if present in prices array.
Add inline EthereumIcon SVG (same pattern as BitcoinIcon).

### Card Hover Effect
In `dashboard-card.tsx` (Phase 1): add `transition-colors duration-200` to base classes.
Add CSS variable `--bg-card-border-hover` to `index.css` for both themes.
Use `hover:border-[var(--bg-card-border-hover)]` or handle via inline style + onMouseEnter/Leave.

Simpler approach: use `group` + Tailwind `hover:` modifier on the existing border. Since border is inline style, use a CSS approach:
- Add `hover-card` class to DashboardCard
- In `index.css`, define `.hover-card:hover { border-color: rgba(var(--accent-rgb), 0.3) !important; }`
- Add `--accent-rgb` to CSS vars: light `217, 119, 6`, dark `245, 158, 11`

## Related Code Files

### Create
| File | Purpose |
|------|---------|
| `apps/web/src/components/market-pulse-summary-bar.tsx` | Horizontal metric chips |

### Modify
| File | Change |
|------|--------|
| `apps/web/src/app.tsx` | Add MarketPulseSummaryBar between header and main |
| `apps/web/src/components/top-trader-and-taker-display-card.tsx` | Add stacked buy/sell volume bar |
| `apps/web/src/components/symbol-price-grid.tsx` | Add ETH display + EthereumIcon |
| `apps/web/src/components/futures-basis-display-card.tsx` | Hero `toFixed(2)`, keep per-symbol `toFixed(4)` |
| `apps/web/src/components/dashboard-card.tsx` | Add `hover-card` class |
| `apps/web/src/index.css` | Add `--accent-rgb`, `.hover-card:hover` rule |

## Implementation Steps

### Item 3: Market Pulse Summary Bar

1. Create `apps/web/src/components/market-pulse-summary-bar.tsx`
2. Import `DashboardData` type and sentiment utils from Phase 1
3. Props: `{ data: DashboardData }`
4. Compute 5 metrics:
   - Fear/Greed: `data.fearGreed.value`
   - L/S: avg ratio from `data.longShort`
   - Funding: avg rate from `data.fundingRates`
   - OI: avg changePercent from `data.openInterest`
   - Basis: avg basisPct from `data.futuresBasis`
5. Render horizontal `flex flex-wrap gap-1.5 px-4 py-1` with 5 chips
6. Each chip: `<span className="text-xs font-medium px-2 py-0.5 rounded-full border {badgeClasses}">{label}: {formattedValue}</span>`
7. In `app.tsx`, import and place `<MarketPulseSummaryBar data={data} />` after header, before `<main>`
8. Only render when `data` is available

### Item 4: Taker Buy/Sell Visual Bar

9. In `top-trader-and-taker-display-card.tsx`, below the taker ratio number (`<div className="text-lg ...">`)
10. Add stacked bar (same markup pattern as top trader L/S bar):
    ```tsx
    <div className="flex h-5 rounded-full overflow-hidden text-xs font-bold">
      <div className="bg-green-500 ..." style={{ width: `${buyPct}%` }}>{buyPct.toFixed(0)}% Buy</div>
      <div className="bg-red-500 ..." style={{ width: `${sellPct}%` }}>{sellPct.toFixed(0)}% Sell</div>
    </div>
    ```
11. Compute `buyPct` and `sellPct` from `tk.buyVol` and `tk.sellVol`:
    ```typescript
    const total = tk.buyVol + tk.sellVol;
    const buyPct = total > 0 ? (tk.buyVol / total) * 100 : 50;
    const sellPct = 100 - buyPct;
    ```

### Item 5: ETH Price Display

12. In `symbol-price-grid.tsx`, find ETH in prices: `const eth = prices.find(p => p.symbol === "ETHUSDT")`
13. Add `EthereumIcon` SVG component (diamond shape, #627EEA fill)
14. If `eth` exists, render a second row/column with ETH info (smaller text, same layout pattern)
15. Layout: use `flex flex-col gap-2` wrapping BTC row + optional ETH row
16. ETH row uses `text-xl` for price (smaller than BTC's `text-2xl`)

### Item 6: Futures Basis Decimal Cleanup

17. In `futures-basis-display-card.tsx` line 60: change `avg.toFixed(4)` to `avg.toFixed(2)` for hero number
18. Keep per-symbol `b.basisPct.toFixed(4)` unchanged on line 66

### Item 7: Card Hover Effects

19. In `index.css`, add to `:root`:
    ```css
    --accent-rgb: 217, 119, 6;
    ```
20. In `.dark`, add:
    ```css
    --accent-rgb: 245, 158, 11;
    ```
21. Add rule:
    ```css
    .hover-card:hover {
      border-color: rgba(var(--accent-rgb), 0.3) !important;
    }
    ```
22. In `dashboard-card.tsx`, add `hover-card` to base class string

## Todo List

- [ ] Create `market-pulse-summary-bar.tsx`
- [ ] Add MarketPulseSummaryBar to `app.tsx`
- [ ] Add taker buy/sell stacked bar to `top-trader-and-taker-display-card.tsx`
- [ ] Add EthereumIcon SVG to `symbol-price-grid.tsx`
- [ ] Add ETH row to `symbol-price-grid.tsx`
- [ ] Change futures basis hero to `toFixed(2)`
- [ ] Add `--accent-rgb` CSS variables to both themes
- [ ] Add `.hover-card:hover` rule to `index.css`
- [ ] Add `hover-card` class to DashboardCard
- [ ] Verify hover effect in both light/dark themes
- [ ] Verify ETH display when ETH data absent (graceful fallback)

## Success Criteria
- Market pulse bar visible below header with 5 colored chips
- Taker card shows buy/sell volume bar
- ETH price shown alongside BTC (when data available)
- Futures basis hero shows 2 decimal places
- Cards show subtle amber border accent on hover in both themes

## Risk Assessment
- **ETH data absence:** prices array may not include ETHUSDT. Mitigate: conditional render, BTC layout unchanged.
- **Market pulse bar layout:** may cause vertical shift on mobile. Mitigate: small py-1 padding, flex-wrap.
- **Hover !important:** could conflict with buy-conclusion custom borders. Mitigate: buy-conclusion already has stronger inline styles; test both.

## Security Considerations
- No auth, no data mutation. N/A.

## Next Steps
- Phase 3 can proceed independently
- After all phases: visual QA in both themes at multiple breakpoints
