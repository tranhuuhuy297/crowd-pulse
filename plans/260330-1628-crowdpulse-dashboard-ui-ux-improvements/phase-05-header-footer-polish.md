# Phase 5: Header/Footer Polish

## Context Links
- [Plan overview](./plan.md)
- [Phase 1 (dependency)](./phase-01-data-layer-updates.md)
- App: `apps/web/src/app.tsx`

## Overview
- **Priority:** Low
- **Status:** pending
- **Description:** Add data source health indicator dot to header and clean up footer.

## Key Insights
- `DataSourceHealth` from Phase 1 has 4 booleans
- Health dot logic: all true = green, 1-2 false = yellow, 3-4 false = red
- Footer currently shows "Last updated: ... Refreshes every 60s" -- duplicates header "Updated ..." text

## Requirements
### Functional
- Header: colored dot next to "Updated ..." indicating data health
- Tooltip on dot showing which sources failed
- Footer: replace "Last updated" with data source attribution text

### Non-functional
- Dot pulses gently when yellow/red (CSS animation)

## Architecture
```
Header
  -> existing title + subtitle
  -> health dot + "Updated X ago" (right side)

Footer
  -> "Data: Fear & Greed Index, Binance Spot & Futures APIs"
```

## Related Code Files
| Action | File |
|--------|------|
| Modify | `apps/web/src/app.tsx` |

## Implementation Steps

### 1. Add health dot helper
```tsx
function healthDotColor(health: DataSourceHealth): string {
  const ok = [health.fearGreed, health.prices, health.klines, health.longShort].filter(Boolean).length;
  if (ok === 4) return "bg-emerald-400";
  if (ok >= 2) return "bg-yellow-400 animate-pulse";
  return "bg-red-400 animate-pulse";
}

function failedSources(health: DataSourceHealth): string[] {
  const names: string[] = [];
  if (!health.fearGreed) names.push("Fear & Greed");
  if (!health.prices) names.push("Spot Prices");
  if (!health.klines) names.push("Klines/RSI");
  if (!health.longShort) names.push("Long/Short");
  return names;
}
```

### 2. Update header right section
```tsx
{data && (
  <div className="flex items-center gap-2">
    <span
      className={`w-2 h-2 rounded-full ${healthDotColor(data.dataSourceHealth)}`}
      title={
        failedSources(data.dataSourceHealth).length > 0
          ? `Failed: ${failedSources(data.dataSourceHealth).join(", ")}`
          : "All sources OK"
      }
    />
    <span className="text-xs text-gray-500 hidden sm:block">
      Updated {formatRelativeTime(data.crowdPulse.updatedAt)}
    </span>
  </div>
)}
```

### 3. Update footer
```tsx
<footer className="border-t border-gray-800 px-6 py-3 text-center">
  <p className="text-xs text-gray-600">
    Data: Fear & Greed Index, Binance Spot & Futures APIs · Refreshes every 60s
  </p>
</footer>
```
Remove conditional "Loading..." / "Last updated" logic.

## Todo List
- [ ] Add `healthDotColor()` helper
- [ ] Add `failedSources()` helper
- [ ] Render health dot with title tooltip in header
- [ ] Simplify footer to static attribution text
- [ ] Import `DataSourceHealth` type

## Success Criteria
- Green dot when all 4 sources OK
- Yellow pulsing dot when 1-2 fail, red when 3-4 fail
- Hover on dot shows failed source names
- Footer shows clean attribution without duplicate timestamp

## Risk Assessment
- `animate-pulse` on the dot may be distracting -- can remove if feedback is negative
- `title` attribute tooltip is basic; sufficient for MVP, could upgrade to custom tooltip later

## Security Considerations
- None

## Next Steps
- Phase 6 updates skeleton to match final layout
