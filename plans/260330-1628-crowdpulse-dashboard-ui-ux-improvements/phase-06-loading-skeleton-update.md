# Phase 6: Loading Skeleton Update

## Context Links
- [Plan overview](./plan.md)
- [Phase 4 (dependency)](./phase-04-layout-restructure-mobile-fix.md)
- File: `apps/web/src/components/dashboard-loading-skeleton.tsx`

## Overview
- **Priority:** Low
- **Status:** pending
- **Description:** Update loading skeleton to match new 3-row layout from Phase 4.

## Key Insights
- Current skeleton: 2-col top (score + F&G), then 4-col price grid
- New layout: full-width score, 2-col (F&G + L/S), full-width price
- File is 59 lines -- will stay well under 200

## Requirements
### Functional
- Row 1: Full-width skeleton card (gauge placeholder + 4 breakdown bar placeholders)
- Row 2: 2-col skeleton (F&G card + L/S card with bar placeholders)
- Row 3: Full-width price skeleton (BTC icon area + price + stats)

### Non-functional
- Match approximate heights of real components

## Architecture
```
DashboardLoadingSkeleton
  Row 1: SkeletonCard (score hero)
  Row 2: grid 2-col [SkeletonCard (F&G), SkeletonCard (L/S)]
  Row 3: SkeletonCard (price)
```

## Related Code Files
| Action | File |
|--------|------|
| Modify | `apps/web/src/components/dashboard-loading-skeleton.tsx` |

## Implementation Steps

### 1. Replace entire skeleton layout
```tsx
export function DashboardLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: Score hero */}
      <SkeletonCard>
        <div className="flex flex-col items-center gap-3">
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="h-32 w-32 rounded-full" />
          <SkeletonBlock className="h-8 w-full rounded-lg" />
          {/* Breakdown bars */}
          <div className="w-full flex flex-col gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="h-2 flex-1 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </SkeletonCard>

      {/* Row 2: Fear & Greed + Long/Short */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonCard>
          <SkeletonBlock className="h-4 w-40" />
          <div className="flex justify-between items-end">
            <SkeletonBlock className="h-12 w-16" />
            <SkeletonBlock className="h-8 w-24" />
          </div>
          <SkeletonBlock className="h-2.5 w-full rounded-full" />
        </SkeletonCard>

        <SkeletonCard>
          <SkeletonBlock className="h-4 w-36" />
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <SkeletonBlock key={i} className="h-5 w-full rounded-full" />
            ))}
          </div>
        </SkeletonCard>
      </div>

      {/* Row 3: Price */}
      <SkeletonCard>
        <div className="flex items-center gap-4">
          <SkeletonBlock className="h-10 w-10 rounded-full" />
          <div className="flex flex-col gap-1">
            <SkeletonBlock className="h-5 w-20" />
            <SkeletonBlock className="h-3 w-14" />
          </div>
          <SkeletonBlock className="h-7 w-32 ml-4" />
          <div className="flex gap-4 ml-auto">
            <SkeletonBlock className="h-8 w-12" />
            <SkeletonBlock className="h-8 w-16" />
          </div>
        </div>
      </SkeletonCard>
    </div>
  );
}
```

## Todo List
- [ ] Update Row 1 skeleton for full-width score hero with breakdown placeholders
- [ ] Update Row 2 skeleton for 2-col F&G + L/S
- [ ] Update Row 3 skeleton for full-width BTC price card
- [ ] Verify file under 200 lines

## Success Criteria
- Skeleton structure matches real dashboard layout
- No layout shift when data loads
- File under 200 lines

## Risk Assessment
- Minor: skeleton heights may not perfectly match loaded components -- acceptable, close approximation is fine

## Security Considerations
- None

## Next Steps
- All phases complete. Run `tsc --noEmit` to verify no type errors, then visual review in browser.
