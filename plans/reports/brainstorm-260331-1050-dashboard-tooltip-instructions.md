# Brainstorm: Dashboard Tooltips & Info Instructions

## Problem Statement
Dashboard displays multiple crypto metrics (CrowdPulse Score, Fear & Greed, RSI, Volume, Long/Short Ratio) without explanations. Users unfamiliar with these indicators have no way to understand what they mean or how the contrarian signal is derived.

## Requirements
- All metrics need tooltips/explanations
- Icon hover style (ⓘ next to labels)
- Zero new dependencies (custom Tailwind CSS)
- Mobile-friendly (tap to show)
- Light/dark theme support
- Accessible (aria attributes)

## Evaluated Approaches

### Option A: Pure CSS Tooltip (Recommended)
**Pros:** Zero deps, tiny code footprint (~40 lines), GPU-friendly animations, works with existing Tailwind setup
**Cons:** No smart repositioning (tooltip won't flip if clipped by viewport edge)
**Verdict:** Best fit. Dashboard is single-page, card layout is predictable — clipping risk is minimal.

### Option B: Radix UI Tooltip
**Pros:** Battle-tested, accessible out-of-box, auto-repositioning
**Cons:** +5KB bundle, new dependency for a simple feature, overkill for static tooltips
**Verdict:** Over-engineered for this use case.

### Option C: Floating UI
**Pros:** Low-level control, smart positioning
**Cons:** +3KB, requires writing wrapper component anyway, positioning logic unnecessary here
**Verdict:** Would make sense if tooltips appeared in unpredictable positions.

## Final Recommended Solution

### New Component: `<InfoTooltip>`
- File: `apps/web/src/components/info-tooltip.tsx` (~40 lines)
- Props: `content: string`, `placement?: 'top' | 'bottom' | 'right'`
- Renders Lucide `Info` icon (already in deps)
- CSS: `group/tooltip` + `group-hover/tooltip:opacity-100` pattern
- Mobile: `tabindex="0"` + `focus-within` for tap-to-show
- Theme: uses existing CSS custom properties

### Tooltip Content Per Metric

| Metric | Tooltip Text |
|--------|-------------|
| CrowdPulse Score | Composite sentiment score (0-100). Formula: F&G×35% + RSI×25% + Volume×20% + L/S×20%. Weights auto-redistribute when sources unavailable. |
| Signal Badge | Contrarian signal: crowd greedy (80+) → consider selling. Crowd fearful (<20) → consider buying. |
| Fear & Greed Index | Crypto market sentiment from alternative.me. 0=Extreme Fear, 100=Extreme Greed. Updated daily. |
| RSI | Relative Strength Index (14-period Wilder). >70=overbought, <30=oversold. From hourly candles. |
| 24h Volume | BTC/USDT spot trading volume in last 24 hours. Source: Binance. |
| Volume (breakdown) | Volume anomaly: current vs 50-period avg. High=greed signal, low=fear signal. |
| Long/Short Ratio | Long vs short positions on Binance Futures. >1=more longs (bullish crowd). 3 categories shown. |
| Component Breakdown | Each bar = weighted contribution to final score. Width reflects (value × weight). |

### Files to Modify
1. **Create:** `apps/web/src/components/info-tooltip.tsx`
2. **Edit:** `crowd-pulse-score-card.tsx` — add tooltip to score title + signal badge
3. **Edit:** `fear-greed-display-card.tsx` — add tooltip to card title
4. **Edit:** `symbol-price-grid.tsx` — add tooltips to RSI and Volume labels
5. **Edit:** `liquidation-ratio-display-card.tsx` — add tooltip to card title
6. **Edit:** `score-component-breakdown.tsx` — add tooltips to each component label

### Risks & Mitigation
- **Viewport clipping on mobile:** Use `placement="bottom"` for top-of-page elements, `placement="top"` for bottom cards
- **Tooltip staying open on mobile:** `blur` event on focusable wrapper auto-dismisses
- **Theme contrast:** Tooltip bg uses `var(--card-bg)` with slightly elevated shadow

### Success Criteria
- Every metric on dashboard has a visible ⓘ icon
- Hovering/tapping shows clear, concise explanation
- Works on desktop (hover) and mobile (tap)
- No layout shift when tooltips appear
- Dark/light theme consistent
- No new npm dependencies added
