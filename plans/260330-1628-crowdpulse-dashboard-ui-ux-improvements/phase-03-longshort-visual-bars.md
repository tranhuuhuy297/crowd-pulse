# Phase 3: Long/Short Visual Bars

## Context Links
- [Plan overview](./plan.md)
- File: `apps/web/src/components/liquidation-ratio-display-card.tsx`

## Overview
- **Priority:** Medium
- **Status:** pending
- **Description:** Replace text-only ratio display with horizontal stacked bars showing long/short percentages visually.

## Key Insights
- Current `RatioRow` shows symbol + numeric ratio + avg + bias label (54 lines for the component)
- Ratio conversion: `longPct = ratio / (1 + ratio) * 100`, `shortPct = 100 - longPct`
  - ratio=1.0 -> 50/50, ratio=2.0 -> 67/33, ratio=0.5 -> 33/67
- File is 92 lines -- room for visual bars within 200-line limit
- Per-symbol bars may clutter; show bars only for the average ratio per type

## Requirements
### Functional
- Each `RatioRow` shows: label, horizontal stacked bar (green=long %, red=short %), percentage labels, bias badge
- Per-symbol ratios shown as small text below the bar
- Average ratio drives the main bar

### Non-functional
- Bar transition on data refresh: `transition-all duration-500`
- Min-width on smaller segment so it doesn't collapse to 0px

## Architecture
```
RatioRow
  -> label text
  -> stacked bar div (flex, green left + red right)
  -> pct labels inside bar
  -> per-symbol small text row
  -> bias badge
```

## Related Code Files
| Action | File |
|--------|------|
| Modify | `apps/web/src/components/liquidation-ratio-display-card.tsx` |

## Implementation Steps

### 1. Add percentage conversion helper
```ts
function ratioToPercentages(ratio: number): { longPct: number; shortPct: number } {
  const longPct = (ratio / (1 + ratio)) * 100;
  return { longPct, shortPct: 100 - longPct };
}
```

### 2. Redesign `RatioRow` component
Replace current layout with:
```tsx
function RatioRow({ label, data }: { label: string; data: LongShortData[] }) {
  const avg = avgRatio(data);
  if (avg === null) return null;

  const { longPct, shortPct } = ratioToPercentages(avg);
  const bias = biasLabel(avg);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${biasStyle(avg)}`}>
          {bias}
        </span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-5 rounded-full overflow-hidden text-xs font-semibold">
        <div
          className="bg-emerald-500/80 flex items-center justify-center text-white transition-all duration-500"
          style={{ width: `${Math.max(longPct, 8)}%` }}
        >
          {longPct.toFixed(0)}%
        </div>
        <div
          className="bg-red-500/80 flex items-center justify-center text-white transition-all duration-500"
          style={{ width: `${Math.max(shortPct, 8)}%` }}
        >
          {shortPct.toFixed(0)}%
        </div>
      </div>

      {/* Per-symbol detail */}
      <div className="flex gap-3">
        {data.map((d) => (
          <span key={d.symbol} className="text-xs text-gray-600">
            {d.symbol}: {d.ratio.toFixed(2)}
          </span>
        ))}
      </div>
    </div>
  );
}
```

### 3. Add bias badge style helper
```ts
function biasStyle(ratio: number): string {
  if (ratio >= 1.5) return "bg-red-500/20 text-red-400 border-red-500/30";
  if (ratio >= 1.1) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (ratio >= 0.9) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  if (ratio >= 0.7) return "bg-green-500/20 text-green-400 border-green-500/30";
  return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
}
```

### 4. Update footer text
Change `Ratio >1 = more longs` to: `Long % = ratio/(1+ratio) | Binance Futures`

### 5. Remove unused `ratioColor` function
No longer needed after visual bars replace text coloring.

## Todo List
- [ ] Add `ratioToPercentages()` helper
- [ ] Add `biasStyle()` helper
- [ ] Redesign `RatioRow` with stacked bar + per-symbol detail
- [ ] Remove unused `ratioColor()` function
- [ ] Update footer text
- [ ] Verify file under 200 lines

## Success Criteria
- Stacked bars clearly show long vs short percentages
- Bias badge colored appropriately
- Per-symbol detail preserved below bars
- Smooth transitions on data refresh
- File under 200 lines

## Risk Assessment
- Very small percentages (<8%): mitigated by `Math.max(pct, 8)` minimum width
- Text overflow in narrow bars: font-size is `text-xs`, should fit down to ~15%

## Security Considerations
- None

## Next Steps
- Phase 4 adjusts layout grid for the taller card
