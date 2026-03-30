# Phase 6: Frontend Dashboard Skeleton

## Context Links
- [Plan Overview](./plan.md)
- [Phase 5: Dashboard API](./phase-05-dashboard-api.md)

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 2.5h
- **Description:** React dashboard with gauge chart for Crowd Pulse Score, price cards, fear/greed display. Auto-refresh every 60s.

## Key Insights
- **Gauge chart:** Use simple SVG gauge (no heavy library). A semicircle SVG with colored arc is sufficient for Phase 1. Alternatively, `react-gauge-chart` (lightweight, ~5KB) works well.
- Keep it simple: no routing needed in Phase 1 (single page)
- TailwindCSS v4 with Vite plugin (no postcss.config needed)
- Auto-polling via `setInterval` + fetch (no React Query needed in Phase 1; KISS)

## Requirements

### Functional
- Gauge chart showing Crowd Pulse Score (0-100) with color gradient (red=bearish, yellow=neutral, green=bullish)
- Signal badge: STRONG_BUY / BUY / NEUTRAL / SELL / STRONG_SELL with appropriate colors
- Fear & Greed component card
- Price cards per symbol (price, 1h change, RSI)
- Active signals list
- Auto-refresh every 60 seconds
- Loading state and error state

### Non-functional
- Responsive layout (mobile-first)
- Dark theme (crypto vibes)
- Accessible color contrast

## Architecture

```
apps/web/src/
  app.tsx                    # Main layout
  components/
    gauge-chart.tsx          # SVG semicircle gauge
    crowd-pulse-card.tsx     # Score + signal badge
    fear-greed-card.tsx      # Fear & Greed display
    price-card.tsx           # Single symbol price card
    price-grid.tsx           # Grid of price cards
    signal-list.tsx          # Active signals
    loading-skeleton.tsx     # Loading state
  hooks/
    use-dashboard-data.ts    # Fetch + auto-refresh hook
  lib/
    api-client.ts            # Typed fetch wrapper
    format-utils.ts          # Number/date formatting
```

## Related Code Files

### Create
- `apps/web/src/components/gauge-chart.tsx`
- `apps/web/src/components/crowd-pulse-card.tsx`
- `apps/web/src/components/fear-greed-card.tsx`
- `apps/web/src/components/price-card.tsx`
- `apps/web/src/components/price-grid.tsx`
- `apps/web/src/components/signal-list.tsx`
- `apps/web/src/components/loading-skeleton.tsx`
- `apps/web/src/hooks/use-dashboard-data.ts`
- `apps/web/src/lib/api-client.ts`
- `apps/web/src/lib/format-utils.ts`

### Modify
- `apps/web/src/app.tsx` - Dashboard layout
- `apps/web/index.html` - Dark theme meta, title
- `apps/web/src/index.css` - TailwindCSS v4 import + dark theme globals

## Implementation Steps

1. **Setup TailwindCSS v4 in Vite:**
   - `apps/web/src/index.css`: `@import "tailwindcss";`
   - `vite.config.ts`: add `@tailwindcss/vite` plugin
   - Set dark bg in index.html: `<body class="bg-gray-950 text-gray-100">`

2. **Create api-client.ts:**
   ```typescript
   const BASE_URL = '/api'
   export async function fetchDashboard(): Promise<DashboardResponse> {
     const res = await fetch(`${BASE_URL}/dashboard`)
     if (!res.ok) throw new Error(`API error: ${res.status}`)
     return res.json()
   }
   ```

3. **Create use-dashboard-data.ts:**
   ```typescript
   export function useDashboardData(refreshInterval = 60_000) {
     const [data, setData] = useState<DashboardResponse | null>(null)
     const [loading, setLoading] = useState(true)
     const [error, setError] = useState<string | null>(null)
     // fetch on mount + setInterval
   }
   ```

4. **Create gauge-chart.tsx:**
   - SVG semicircle (180 degrees)
   - Arc colored by score range: 0-20 green (contrarian buy), 20-40 light-green, 40-60 yellow, 60-80 orange, 80-100 red (contrarian sell)
   - Needle pointing to current score
   - Score number centered below arc
   - Props: `{ score: number; size?: number }`

5. **Create crowd-pulse-card.tsx:**
   - Contains GaugeChart + signal badge
   - Signal badge colors: STRONG_BUY=green, BUY=light-green, NEUTRAL=yellow, SELL=orange, STRONG_SELL=red
   - Contrarian messaging: "Crowd is greedy - consider selling" etc.

6. **Create fear-greed-card.tsx:**
   - Value (0-100) with classification text
   - 24h change with up/down arrow
   - Simple progress bar colored by value

7. **Create price-card.tsx:**
   - Symbol name, current price, 1h change (green/red), RSI value
   - RSI colored: <30 green (oversold), >70 red (overbought)

8. **Create price-grid.tsx:** 2x2 grid of PriceCards

9. **Create signal-list.tsx:**
   - List of active signals with severity badges
   - Empty state: "No signals - market is calm"

10. **Create loading-skeleton.tsx:** Pulse animation placeholder

11. **Compose in app.tsx:**
    ```
    <header>CrowdPulse - Crypto Crowd Sentiment</header>
    <main class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <CrowdPulseCard />           <!-- spans 1 col -->
      <FearGreedCard />            <!-- spans 1 col -->
      <SignalList />               <!-- spans 1 col -->
      <PriceGrid />                <!-- spans full width -->
    </main>
    <footer>Last updated: {timestamp} | Auto-refreshes every 60s</footer>
    ```

12. **Create format-utils.ts:**
    - `formatPrice(n)`: $67,000.00
    - `formatPercent(n)`: +1.23%
    - `formatDate(d)`: relative time ("2 min ago")

## Todo List

- [ ] TailwindCSS v4 setup + dark theme
- [ ] api-client.ts
- [ ] use-dashboard-data.ts hook
- [ ] gauge-chart.tsx (SVG)
- [ ] crowd-pulse-card.tsx
- [ ] fear-greed-card.tsx
- [ ] price-card.tsx + price-grid.tsx
- [ ] signal-list.tsx
- [ ] loading-skeleton.tsx
- [ ] format-utils.ts
- [ ] Compose in app.tsx
- [ ] Responsive layout tested

## Success Criteria
- Dashboard renders with live data from API
- Gauge shows correct score with needle
- Prices update every 60s
- Loading skeleton shown during initial fetch
- Error state shown on API failure
- Responsive: looks good on mobile and desktop
- Dark theme consistent

## Risk Assessment
- **SVG gauge complexity:** Keep simple semicircle; can enhance later
- **No data state:** Show "Collecting data..." with explanation on first load
- **CORS:** Handled by Vite proxy in dev; no issue

## Security Considerations
- No sensitive data displayed in Phase 1
- API client uses relative URLs (no hardcoded domains)
