# Phase 2: Score Card Redesign

## Context Links
- [Plan overview](./plan.md)
- [Phase 1 (dependency)](./phase-01-data-layer-updates.md)
- Score card: `apps/web/src/components/crowd-pulse-score-card.tsx`
- Gauge: `apps/web/src/components/svg-gauge-chart.tsx`
- Score calc: `apps/web/src/lib/crowd-pulse-score-calculator.ts`

## Overview
- **Priority:** High
- **Status:** pending
- **Description:** Redesign CrowdPulse score card with gauge labels, score trend arrow, contrarian hero banner, and 4-component breakdown bars.

## Key Insights
- Current card is 56 lines -- room to add breakdown without exceeding 200 lines
- `CrowdPulseComponents` has 4 fields with weights defined in `crowd-pulse-score-calculator.ts`: fearGreed 35%, rsi 25%, volume 20%, longShort 20%
- Gauge SVG (97 lines) has room for "Fear"/"Greed" text labels at endpoints
- Components may be `null` when API source fails -- show "N/A" with dimmed bar

## Requirements
### Functional
- Gauge: "Fear" label at left arc end, "Greed" at right arc end
- Score delta arrow: up/down arrow with +/- value, colored green/red
- Contrarian message: promoted to colored banner strip (green tint for BUY, red for SELL, yellow for NEUTRAL)
- Score breakdown: 4 mini horizontal progress bars showing each component's normalized contribution

### Non-functional
- Smooth transitions on bar width changes
- Accessible: aria-labels on progress bars

## Architecture
```
CrowdPulseScoreCard
  -> SvgGaugeChart (+ Fear/Greed labels)
  -> ScoreDeltaIndicator (inline, small)
  -> Contrarian banner (full-width tinted strip)
  -> ScoreComponentBreakdown (4 mini bars)
```

## Related Code Files
| Action | File |
|--------|------|
| Modify | `apps/web/src/components/svg-gauge-chart.tsx` |
| Modify | `apps/web/src/components/crowd-pulse-score-card.tsx` |
| Create | `apps/web/src/components/score-component-breakdown.tsx` (if card exceeds 200 lines) |

## Implementation Steps

### 1. Add Fear/Greed labels to `svg-gauge-chart.tsx`
After the score text element, add two SVG text elements:
```tsx
<text x={cx - r - 2} y={cy + 12} textAnchor="end" fill="#6b7280" fontSize={size * 0.06} fontFamily="system-ui">
  Fear
</text>
<text x={cx + r + 2} y={cy + 12} textAnchor="start" fill="#6b7280" fontSize={size * 0.06} fontFamily="system-ui">
  Greed
</text>
```
Adjust `viewBox` width if labels clip. Keep file under 120 lines.

### 2. Update `CrowdPulseScoreCardProps`
```ts
interface CrowdPulseScoreCardProps {
  score: number | null;
  signal: SignalType;
  updatedAt: string;
  components: CrowdPulseComponents;
  scoreDelta: number | null;
}
```

### 3. Add score delta indicator
Below the gauge, render inline:
```tsx
{scoreDelta !== null && (
  <span className={`text-sm font-semibold ${scoreDelta >= 0 ? "text-red-400" : "text-green-400"}`}>
    {scoreDelta >= 0 ? "▲" : "▼"} {Math.abs(scoreDelta).toFixed(1)}
  </span>
)}
```
Note: positive delta = more greed = red (contrarian bearish). Negative = green.

### 4. Promote contrarian message to hero banner
Replace plain `<p>` with:
```tsx
const SIGNAL_BG: Record<SignalType, string> = {
  STRONG_BUY: "bg-emerald-500/10 border-emerald-500/20",
  BUY: "bg-green-500/10 border-green-500/20",
  NEUTRAL: "bg-yellow-500/10 border-yellow-500/20",
  SELL: "bg-orange-500/10 border-orange-500/20",
  STRONG_SELL: "bg-red-500/10 border-red-500/20",
};
```
Render as:
```tsx
<div className={`w-full rounded-lg border px-3 py-2 text-center ${SIGNAL_BG[signal]}`}>
  <p className="text-sm text-gray-300 italic">{message}</p>
</div>
```

### 5. Add score component breakdown
Create 4 mini bars showing each component's contribution:
```tsx
const COMPONENT_CONFIG = [
  { key: "fearGreed", label: "Fear & Greed", weight: 35, color: "bg-yellow-500" },
  { key: "avgRsi", label: "RSI", weight: 25, color: "bg-blue-500" },
  { key: "volumeAnomaly", label: "Volume", weight: 20, color: "bg-purple-500" },
  { key: "longShortRatio", label: "L/S Ratio", weight: 20, color: "bg-cyan-500" },
] as const;
```
For each: render label, weight%, and a thin progress bar filled to normalized value (0-100). Null values show "N/A" with empty bar.

If card file exceeds 200 lines, extract breakdown into `score-component-breakdown.tsx`.

### 6. Remove redundant updatedAt display
The "Updated: ..." line at the bottom of the card duplicates header info. Remove it.

## Todo List
- [ ] Add "Fear"/"Greed" SVG text labels to gauge endpoints
- [ ] Update `CrowdPulseScoreCardProps` with `components` and `scoreDelta`
- [ ] Add score delta indicator (arrow + value)
- [ ] Promote contrarian message to colored banner
- [ ] Add 4-component breakdown mini bars
- [ ] Extract `score-component-breakdown.tsx` if needed
- [ ] Remove redundant updatedAt from card bottom

## Success Criteria
- Gauge shows Fear/Greed labels at arc ends
- Delta arrow visible after second data refresh
- Contrarian banner has signal-appropriate color tint
- All 4 components shown with weight %, null handled gracefully
- Each file under 200 lines

## Risk Assessment
- Gauge label clipping: test with `size=180` (current default) -- may need viewBox padding
- Component normalization: `fearGreed` is already 0-100, `avgRsi` is 0-100, `volumeAnomaly` needs re-normalization (currently raw %), `longShortRatio` is already normalized to 0-100

## Security Considerations
- None -- purely presentational changes

## Next Steps
- Phase 4 passes new props from `app.tsx`
