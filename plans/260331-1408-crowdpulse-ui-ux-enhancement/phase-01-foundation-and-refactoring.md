# Phase 1: Foundation & Refactoring

## Context Links
- Parent: [plan.md](./plan.md)
- CSS vars: `apps/web/src/index.css`
- Types: `apps/web/src/lib/types.ts`

## Overview
- **Priority:** P1 (blockers for Phase 2)
- **Status:** pending
- **Effort:** 1h
- **Description:** Extract duplicated card wrapper + sentiment color logic into shared modules

## Key Insights
- All 8 card components repeat `rounded-xl p-3 backdrop-blur-sm overflow-visible hover:z-20 focus-within:z-20` + identical inline `style={{ background: "var(--bg-card)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--bg-card-border)" }}`
- 6 components define local `xxxColor(value)` and `xxxBadgeStyle(value)` functions with identical green-to-red threshold patterns
- Extracting these eliminates ~120 lines of duplication

## Requirements

### Functional
- DashboardCard renders same visual output as current inline styles
- sentimentColor/sentimentBadge produce identical colors as existing per-card functions
- All existing tests (if any) continue passing

### Non-functional
- Each new file under 50 lines
- Zero visual regression

## Architecture

### DashboardCard Component
```
DashboardCard
  props: { children, className?, style?, padding? }
  renders: <div className={base + className} style={mergedStyle}>{children}</div>
```

Base classes: `relative rounded-xl backdrop-blur-sm overflow-visible hover:z-20 focus-within:z-20 transition-colors duration-200`
Default padding: `p-3`
Default inline style: `{ background: "var(--bg-card)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--bg-card-border)" }`
Style prop merges with defaults (spread after defaults so overrides win).

### Sentiment Color Utils
```typescript
// Threshold-based color mapping
type SentimentTier = { max: number; textClass: string; badgeClass: string; label: string };

sentimentTextColor(value: number, tiers: SentimentTier[]): string
sentimentBadge(value: number, tiers: SentimentTier[]): { classes: string; label: string }
```

Predefined tier sets exported as constants:
- `FEAR_GREED_TIERS` — 0-100 scale, green=fear red=greed
- `RATIO_TIERS` — L/S ratio scale
- `FUNDING_RATE_TIERS` — funding rate thresholds
- `BASIS_PCT_TIERS` — futures basis thresholds
- `OI_CHANGE_TIERS` — open interest change thresholds

## Related Code Files

### Create
| File | Purpose |
|------|---------|
| `apps/web/src/components/dashboard-card.tsx` | Shared card wrapper |
| `apps/web/src/lib/sentiment-color-utils.ts` | Shared sentiment color utilities |

### Modify
| File | Change |
|------|--------|
| `apps/web/src/components/fear-greed-display-card.tsx` | Use DashboardCard + sentiment utils |
| `apps/web/src/components/liquidation-ratio-display-card.tsx` | Use DashboardCard + sentiment utils |
| `apps/web/src/components/funding-rate-display-card.tsx` | Use DashboardCard + sentiment utils |
| `apps/web/src/components/open-interest-display-card.tsx` | Use DashboardCard + sentiment utils |
| `apps/web/src/components/futures-basis-display-card.tsx` | Use DashboardCard + sentiment utils |
| `apps/web/src/components/top-trader-and-taker-display-card.tsx` | Use DashboardCard + sentiment utils |
| `apps/web/src/components/crowd-pulse-score-card.tsx` | Use DashboardCard |
| `apps/web/src/components/buy-conclusion-display-card.tsx` | Use DashboardCard (partial - has custom border) |
| `apps/web/src/app.tsx` | Replace inline card div for SymbolPriceGrid with DashboardCard |

## Implementation Steps

### Item 1: DashboardCard wrapper

1. Create `apps/web/src/components/dashboard-card.tsx`
2. Define interface:
   ```typescript
   interface DashboardCardProps {
     children: React.ReactNode;
     className?: string;
     style?: React.CSSProperties;
     padding?: string; // default "p-3"
   }
   ```
3. Implement component merging base classes + padding + className, and default card style + style prop
4. Export as named export

### Item 2: Sentiment color utils

1. Create `apps/web/src/lib/sentiment-color-utils.ts`
2. Define `SentimentTier` type: `{ max: number; textClass: string; badgeClass: string; label: string }`
3. Implement `sentimentTextColor(value, tiers)` — iterate tiers, return first where `value <= tier.max`
4. Implement `sentimentBadge(value, tiers)` — same logic, return `{ classes: tier.badgeClass, label: tier.label }`
5. Export predefined tier constants matching current thresholds exactly:
   - Map `getBarColor`/`getValueColor` from fear-greed-display-card → `FEAR_GREED_TIERS`
   - Map `biasLabel`/`biasStyle` from liquidation-ratio → `RATIO_TIERS`
   - Map `rateColor`/`rateBadgeStyle`/`rateLabel` from funding-rate → `FUNDING_RATE_TIERS`
   - Map `basisColor`/`basisBadgeStyle`/`basisLabel` from futures-basis → `BASIS_PCT_TIERS`
   - Map `oiColor`/`oiBadgeStyle`/`oiLabel` from open-interest → `OI_CHANGE_TIERS`
   - Map `ratioColor`/`biasStyle`/`biasLabel` from top-trader → `TOP_TRADER_RATIO_TIERS`

### Item 3: Refactor all cards

6. Update each card component:
   - Replace outer `<div className="relative rounded-xl p-3 ..." style={{...}}>` with `<DashboardCard className="..." padding="p-3">`
   - Replace local color functions with calls to `sentimentTextColor(value, TIER_CONST)` and `sentimentBadge(value, TIER_CONST)`
   - Remove now-unused local functions
   - Keep card-specific logic (layout, content) unchanged
7. In `app.tsx`, replace the inline card div wrapping `<SymbolPriceGrid>` with `<DashboardCard padding="p-2.5">`
8. For `buy-conclusion-display-card.tsx`: use DashboardCard with custom `style` prop to override border/shadow per recommendation

## Todo List

- [ ] Create `dashboard-card.tsx` with props interface
- [ ] Create `sentiment-color-utils.ts` with tier types + predefined tiers
- [ ] Verify tier thresholds match existing per-card functions exactly
- [ ] Refactor `fear-greed-display-card.tsx`
- [ ] Refactor `liquidation-ratio-display-card.tsx`
- [ ] Refactor `funding-rate-display-card.tsx`
- [ ] Refactor `open-interest-display-card.tsx`
- [ ] Refactor `futures-basis-display-card.tsx`
- [ ] Refactor `top-trader-and-taker-display-card.tsx`
- [ ] Refactor `crowd-pulse-score-card.tsx`
- [ ] Refactor `buy-conclusion-display-card.tsx`
- [ ] Refactor `app.tsx` SymbolPriceGrid wrapper
- [ ] Visual regression check: compare before/after in both themes

## Success Criteria
- All card components use DashboardCard wrapper
- At least 4 cards use shared sentiment utils (eliminating local color functions)
- Zero visual difference in browser
- No new npm dependencies
- Each new file under 50 lines

## Risk Assessment
- **Tier mismatch risk:** Thresholds must match exactly or colors shift. Mitigate: side-by-side comparison.
- **buy-conclusion custom styles:** Has recommendation-specific border/shadow. Mitigate: use `style` prop override.
- **className merge conflicts:** Tailwind specificity. Mitigate: test that custom classNames override base classes.

## Security Considerations
- No auth, no data, pure UI. N/A.

## Next Steps
- Phase 2 depends on DashboardCard for new components
- Phase 3 can start in parallel once gauge/score files are not blocked
