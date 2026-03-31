# Phase 3: Polish

## Context Links
- Parent: [plan.md](./plan.md)
- Independent of Phase 2 (can run in parallel)
- CSS: `apps/web/src/index.css`

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 30m
- **Description:** 3 polish items: gauge needle animation, score component bar improvements, buy conclusion pulse border

## Key Insights
- Gauge currently uses CSS `transition` on needle/arc, but no mount animation — score appears instantly
- Score bars use `h-1.5` (very thin), increasing to `h-2` improves readability
- Buy conclusion "BUY NOW" state should draw attention with subtle pulsing border
- CSS keyframes approach avoids JS complexity

## Requirements

### Functional
- Gauge needle sweeps from 0 to actual score on mount (CSS animation)
- Score bars taller, show weighted contribution format "12/25"
- BUY_NOW card border pulses with green glow on 3-second cycle

### Non-functional
- Animations respect `prefers-reduced-motion`
- No JS timers or requestAnimationFrame (pure CSS)
- Pulse subtle enough to not be distracting

## Architecture

### Gauge Needle Animation
Use CSS `@keyframes` on the SVG group containing needle + fill arc.
Since SVG `d` attribute and line coordinates are computed in JS, use a wrapper approach:
- Wrap needle+fill in `<g>` with `transform-origin: center`
- Apply CSS animation rotating from left (180deg) to computed angle
- OR simpler: use `opacity` + `clip-path` animation (fade in from left)

**Simplest approach:** Use React state + useEffect:
- Render gauge with score=0 on mount
- After 50ms, set actual score — existing CSS `transition: 0.6s` handles animation
- This leverages the already-built transition on `style={{ transition: "d 0.6s ease" }}` and needle `transition`

### Score Component Bars
- `h-1.5` → `h-2` for better visibility
- After the value number, show weighted contribution: `{weightedValue}/{weight}`
- `weightedValue = Math.round(value * weight / 100)`

### Buy Conclusion Pulse
CSS keyframes in `index.css`:
```css
@keyframes pulse-border {
  0%, 100% { box-shadow: 0 0 20px rgba(34,197,94,0.2), 0 0 40px rgba(34,197,94,0.08); }
  50% { box-shadow: 0 0 30px rgba(34,197,94,0.35), 0 0 60px rgba(34,197,94,0.15); }
}
```
Apply `.pulse-buy-now` class only when `recommendation === "BUY_NOW"`.

## Related Code Files

### Modify
| File | Change |
|------|--------|
| `apps/web/src/components/svg-gauge-chart.tsx` | Add mount animation via delayed score |
| `apps/web/src/components/score-component-breakdown.tsx` | `h-1.5` → `h-2`, add weighted value display |
| `apps/web/src/components/buy-conclusion-display-card.tsx` | Add `pulse-buy-now` class for BUY_NOW |
| `apps/web/src/index.css` | Add `@keyframes pulse-border` + `.pulse-buy-now` + `prefers-reduced-motion` |

## Implementation Steps

### Item 8: Gauge Needle Animation

1. In `svg-gauge-chart.tsx`, add state:
   ```typescript
   const [animatedScore, setAnimatedScore] = useState(0);
   useEffect(() => {
     const t = setTimeout(() => setAnimatedScore(score), 50);
     return () => clearTimeout(t);
   }, [score]);
   ```
2. Replace all `score` references in arc/needle math with `animatedScore`
3. Keep the existing `transition: "d 0.6s ease"` and needle transitions — they handle the animation
4. Add `import { useState, useEffect } from "react"` at top
5. Score text should show `Math.round(score)` (real score, not animated) — keep as-is since it already uses `score` prop

   **Alternative:** Show animated score text too for polish:
   - Use `Math.round(animatedScore)` in the `<text>` element
   - This makes the number "count up" during animation

### Item 9: Score Component Bars

6. In `score-component-breakdown.tsx` line 36: change `h-1.5` to `h-2` (both track and bar)
7. Update the value display span (line 44): change from `{value.toFixed(0)}` to weighted contribution format
8. Compute: `const weighted = Math.round(value * weight / 100)`
9. Display: `{weighted}/{weight}` instead of just `{value.toFixed(0)}`
10. Remove the separate weight column (line 46) since weight is now shown inline
11. This reduces columns from 4 to 3 (label, bar, weighted/weight)

### Item 10: Buy Conclusion Pulse

12. In `index.css`, add keyframes:
    ```css
    @keyframes pulse-border {
      0%, 100% { box-shadow: 0 0 20px rgba(34,197,94,0.2), 0 0 40px rgba(34,197,94,0.08); }
      50% { box-shadow: 0 0 30px rgba(34,197,94,0.35), 0 0 60px rgba(34,197,94,0.15); }
    }

    .pulse-buy-now {
      animation: pulse-border 3s ease-in-out infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      .pulse-buy-now {
        animation: none;
      }
    }
    ```
13. In `buy-conclusion-display-card.tsx`, add `pulse-buy-now` class to root div when `conclusion.recommendation === "BUY_NOW"`:
    ```typescript
    const pulseClass = conclusion.recommendation === "BUY_NOW" ? "pulse-buy-now" : "";
    ```
14. Add `${pulseClass}` to the className string of the root div

## Todo List

- [ ] Add `useState`/`useEffect` mount animation to `svg-gauge-chart.tsx`
- [ ] Use `animatedScore` for arc/needle math
- [ ] Change score bar height `h-1.5` → `h-2` in `score-component-breakdown.tsx`
- [ ] Replace value + weight columns with `weighted/weight` format
- [ ] Add `@keyframes pulse-border` to `index.css`
- [ ] Add `.pulse-buy-now` class to `index.css`
- [ ] Add `prefers-reduced-motion` media query
- [ ] Apply `pulse-buy-now` class in `buy-conclusion-display-card.tsx`
- [ ] Test gauge animation on page load
- [ ] Test pulse visibility in both themes
- [ ] Verify reduced motion disables pulse

## Success Criteria
- Gauge needle sweeps from 0 to score on mount (0.6s duration)
- Score bars visually thicker and show "12/25" weighted format
- BUY_NOW card gently pulses green glow
- No animation when `prefers-reduced-motion` is set
- No layout shifts from any animation

## Risk Assessment
- **Gauge re-animation on data refresh:** `useEffect` with `[score]` dep re-triggers on every 60s refresh. Could add `useRef` to only animate on first mount. Mitigate: acceptable UX — brief sweep on refresh confirms data updated.
- **Pulse distraction:** 3s cycle may annoy. Mitigate: very subtle shadow change only, not border color change.
- **Score text count-up:** `Math.round(animatedScore)` jumps from 0 to score — may flash. Mitigate: use real `score` for text, only animate visual arc/needle.

## Security Considerations
- Pure CSS animations. N/A.

## Next Steps
- After all 3 phases: full visual QA at desktop + mobile breakpoints in both themes
- Consider `prefers-reduced-motion` for the existing gauge `transition` properties too
