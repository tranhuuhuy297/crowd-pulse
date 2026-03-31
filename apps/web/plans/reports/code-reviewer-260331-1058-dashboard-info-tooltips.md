# Code Review: Dashboard Info Tooltips

**Score: 8.5 / 10**

## Scope

- Files reviewed: 6
- Lines analyzed: ~280 total
- Review focus: Accessibility, CSS correctness, theme compat, mobile tap, layout shift

---

## Overall Assessment

Solid, self-contained implementation. The `InfoTooltip` component is clean and reusable. Tailwind v4 named group syntax (`group/tip`) is correctly used. Theme variables are consistently applied. A few notable issues around accessibility and one edge case in the arrow CSS.

---

## Critical Issues

None.

---

## High Priority Findings

### 1. Tooltip arrow color uses `border-*-[var()]` — may not render in Tailwind v4

File: `info-tooltip.tsx` lines 16–18

```tsx
// Current
"border-t-[var(--bg-card-border)]"
"border-b-[var(--bg-card-border)]"
"border-r-[var(--bg-card-border)]"
```

In Tailwind v4 arbitrary value syntax for border side colors (`border-t-[...]`) resolves correctly, but `--bg-card-border` is `rgba(214,211,205,0.5)` — a semi-transparent value. The CSS triangle trick (zero-width/height box with `border` sides) requires **solid** colors; semi-transparent border colors produce an invisible or washed-out arrow against most backgrounds. The tooltip body uses `borderColor: "var(--bg-card-border)"` inline, which is fine for the box border, but the arrow will look faint or wrong in both themes.

**Fix:** either use a solid token (e.g. `--bg-card-border-solid`), or replace the CSS-triangle arrow with an absolutely-positioned rotated div:

```tsx
<span
  className={`absolute w-2 h-2 rotate-45 border border-transparent ${ARROW_BORDER_CLASSES[placement]}`}
  style={{ background: "var(--bg-card)", borderColor: "var(--bg-card-border)" }}
/>
```

with appropriate positional shifts per placement.

### 2. `focus-within` on trigger span won't help keyboard users — trigger IS the focusable element

File: `info-tooltip.tsx` line 31

```tsx
group-focus-within/tip:visible group-focus-within/tip:opacity-100
```

`focus-within` fires when any descendant is focused. The tooltip `<span role="tooltip">` has `pointer-events-none`, so it is never focused. The only focusable element inside `group/tip` is the outer `<span tabIndex={0}>` itself. So `focus-within` never adds value here — `group-focus/tip` (focus on the group element itself) is the correct variant in Tailwind v4.

**Fix:**
```tsx
// Replace focus-within with group-focus
group-focus/tip:visible group-focus/tip:opacity-100
```

This correctly shows the tooltip when the trigger span is keyboard-focused.

---

## Medium Priority Improvements

### 3. Missing `left` placement variant

`PLACEMENT_CLASSES` and `ARROW_CLASSES` only have `top | bottom | right`. The `placement` prop type also doesn't include `"left"`. This is fine for current usage, but `score-component-breakdown.tsx` uses `placement="right"` — which puts the tooltip offscreen on narrow mobile widths since breakdowns render at ~88px label width with `right: left-full`.

No immediate breakage, but worth noting for mobile at <360px viewports.

### 4. `liquidation-ratio-display-card.tsx` — InfoTooltip missing in the data-present branch

Lines 93–99 (empty state): `InfoTooltip` is rendered in the h3.
Line 104 (data present): `<h3>Long/Short Ratio</h3>` has **no** `InfoTooltip`.

Users who see data never get the tooltip. This appears unintentional.

**Fix:** add the same `InfoTooltip` to line 104:
```tsx
<h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
  Long/Short Ratio
  <InfoTooltip content="Long vs short positions on Binance Futures. Ratio >1 = more longs (bullish crowd). Shows All Accounts, Top Traders by Account, and Top Traders by Position." />
</h3>
```

### 5. `useId()` generates `":r0:"` style IDs with colons — safe but worth noting

React 18 `useId` returns IDs like `:r0:`. These are valid for `aria-describedby` / `id` pairing in HTML5 but some older screen reader / AT combinations may trip on colon characters. Low risk but be aware.

---

## Low Priority Suggestions

### 6. `w-22` is not a default Tailwind v4 utility

`score-component-breakdown.tsx` line 37: `w-22` (= 5.5rem). Tailwind's default scale includes `w-20` (5rem) and `w-24` (6rem) but not `w-22`. In Tailwind v4 this is auto-generated via the spacing scale if 22 is in the theme, but the project has no `tailwind.config.*` (pure CSS config). Verify this actually renders — if not, use `w-20` or inline `style={{ width: "5.5rem" }}`.

### 7. Tooltip `w-56` on `right` placement inside `score-component-breakdown` may overflow

`right` placement tooltips at 14rem wide (`w-56`) render to the right of label items that are themselves inside a constrained card. On mobile (<375px) this overflows the viewport. Consider `placement="top"` for the breakdown rows, or cap width and allow wrapping.

### 8. `pointer-events-none` on tooltip prevents text selection / copy

Minor UX: users can't select tooltip content. Acceptable for short one-liners but noted for future longer descriptions.

---

## Positive Observations

- Named group modifier `group/tip` (Tailwind v4 syntax) used correctly — avoids group nesting collisions.
- `role="tooltip"` + `aria-describedby` linking is properly wired.
- `tabIndex={0}` on trigger enables keyboard access.
- `cursor-help` is a nice UX affordance.
- CSS variables used consistently throughout all 6 files — no hardcoded colors.
- Both light and dark themes defined in `:root` / `.dark` — all tokens covered.
- `useId()` for tooltip IDs is correct (avoids SSR collisions if ever needed).
- `InfoTooltip` is small (<40 lines), single-responsibility, and well-structured.
- Progress bars in `score-component-breakdown` have proper `role="progressbar"` ARIA attributes.

---

## Recommended Actions

1. **[High]** Fix `focus-within` → `group-focus` in `info-tooltip.tsx` (keyboard UX broken without this).
2. **[High]** Fix `InfoTooltip` missing in the data-present branch of `liquidation-ratio-display-card.tsx` (line 104).
3. **[Medium]** Replace CSS-triangle arrow with rotated-div approach to avoid semi-transparent border rendering issue.
4. **[Low]** Verify `w-22` renders correctly; replace with `w-20` or inline style if not.
5. **[Low]** Consider changing `placement="right"` to `placement="top"` in `score-component-breakdown` for mobile safety.

---

## Unresolved Questions

- Is `w-22` intentionally used expecting a custom Tailwind theme extension, or accidental? No `tailwind.config` file found to confirm.
- Are there plans to support `"left"` placement? If not, remove from the type or add it to prevent future confusion.
