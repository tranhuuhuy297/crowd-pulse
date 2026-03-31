# Phase 1: Create InfoTooltip Component

## Context
- Parent plan: [plan.md](./plan.md)
- Brainstorm: [brainstorm report](../reports/brainstorm-260331-1050-dashboard-tooltip-instructions.md)
- CSS variables: `apps/web/src/index.css`

## Overview
- **Priority:** High (blocks Phase 2)
- **Status:** Pending
- **Description:** Create reusable `<InfoTooltip>` React component with pure CSS positioning

## Key Insights
- Lucide React `Info` icon already in `package.json` — no install needed
- Tailwind v4 supports `group-hover` and `focus-within` natively
- Dashboard is single-page fixed layout — no smart repositioning needed
- Existing CSS vars: `--bg-card`, `--bg-card-border`, `--text-primary`, `--text-secondary`, `--text-muted`

## Requirements

### Functional
- Render small ⓘ icon inline with text
- Show tooltip on hover (desktop) and tap (mobile)
- Support `placement` prop: `top` (default), `bottom`, `right`
- Dismiss on mouse-leave / tap-outside (blur)

### Non-Functional
- < 50 lines of code
- Zero new dependencies
- GPU-friendly animation (opacity + transform)
- Accessible: `role="tooltip"`, `aria-describedby`

## Architecture
```
<span class="group/tip relative" tabindex="0">
  <Info size={14} />  ← Lucide icon
  <span role="tooltip" class="
    invisible opacity-0 group-hover/tip:visible group-hover/tip:opacity-100
    group-focus-within/tip:visible group-focus-within/tip:opacity-100
    absolute z-50 ...positioning...
    transition-all duration-150
  ">
    {content}
    <span class="arrow" />  ← CSS triangle
  </span>
</span>
```

## Related Code Files
- **Create:** `apps/web/src/components/info-tooltip.tsx`
- **Reference:** `apps/web/src/index.css` (CSS variables for theming)

## Implementation Steps

1. Create `apps/web/src/components/info-tooltip.tsx`
2. Define props: `content: string`, `placement?: 'top' | 'bottom' | 'right'`
3. Render Lucide `Info` icon (size 14, muted color)
4. Wrap in `span` with `group/tip`, `relative`, `tabindex="0"`, `outline-none`, `cursor-help`
5. Tooltip span: absolute positioned, `z-50`, themed bg/text/border
6. Placement logic via conditional classes:
   - `top`: `bottom-full left-1/2 -translate-x-1/2 mb-2`
   - `bottom`: `top-full left-1/2 -translate-x-1/2 mt-2`
   - `right`: `left-full top-1/2 -translate-y-1/2 ml-2`
7. Arrow/caret via CSS border trick matching placement
8. Visibility: `invisible opacity-0` → `group-hover/tip:visible group-hover/tip:opacity-100` + same for `focus-within`
9. Transition: `transition-all duration-150`
10. Add `role="tooltip"` and generate unique `id` for `aria-describedby`

## Todo
- [ ] Create `info-tooltip.tsx` with props interface
- [ ] Implement placement logic (top/bottom/right)
- [ ] Add hover + focus-within visibility toggling
- [ ] Theme with CSS variables (bg-card, text-primary, border)
- [ ] Add arrow/caret per placement direction
- [ ] Add accessibility attributes
- [ ] Verify light/dark theme rendering
- [ ] Test mobile tap behavior

## Success Criteria
- Component renders inline ⓘ icon without layout shift
- Tooltip appears on hover (desktop) with 150ms fade
- Tooltip appears on tap (mobile) via focus-within
- Tooltip dismisses on blur/mouse-leave
- Works in both light and dark theme
- Under 50 lines

## Risk Assessment
- **Tailwind v4 group naming:** `group/tip` syntax confirmed supported in Tailwind v4
- **Focus-within on mobile Safari:** Works on iOS 15+, acceptable for this project

## Security Considerations
- Tooltip content is hardcoded strings, not user input — no XSS risk

## Next Steps
- Phase 2: Integrate into all dashboard card components
