# Phase 5: Dashboard API Endpoint

## Context Links
- [Plan Overview](./plan.md)
- [Phase 3: Price Crawler](./phase-03-price-crawler.md)
- [Phase 4: Fear & Greed](./phase-04-fear-greed-crawler.md)

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 2h
- **Description:** GET /api/dashboard returning Crowd Pulse Score with component breakdown. Score calculated from available data sources.

## Key Insights
- Phase 1 has 2 data sources: price indicators (RSI, volume) + Fear & Greed Index
- Crowd Pulse Score = weighted composite: Fear & Greed (40%) + avg RSI deviation (30%) + volume anomaly (30%)
- Score 0-100: 0=extreme bearish crowd, 100=extreme bullish crowd
- Contrarian signal: >80 = prepare sell, <20 = prepare buy

### Crowd Pulse Score Formula
```
fearGreedComponent = fearGreedValue  (already 0-100)
rsiComponent = avg(symbolRSIs)      (already 0-100, >70=overbought, <30=oversold)
volumeComponent = normalize(avgVolumeChangePct, -50, +50) -> 0-100

crowdPulseScore = (fearGreedComponent * 0.4) + (rsiComponent * 0.3) + (volumeComponent * 0.3)

signal:
  >= 80: STRONG_SELL (crowd too bullish)
  >= 65: SELL
  >= 35 and < 65: NEUTRAL
  >= 20 and < 35: BUY
  < 20: STRONG_BUY (crowd too bearish)
```

## Requirements

### Functional
- GET /api/dashboard returns:
  ```json
  {
    "crowdPulse": { "score": 62.5, "signal": "NEUTRAL", "updatedAt": "..." },
    "components": {
      "fearGreed": { "value": 55, "classification": "Greed", "change24h": 3, "weight": 0.4 },
      "rsi": { "avg": 58.2, "bySymbol": { "BTC": 62, "ETH": 55, ... }, "weight": 0.3 },
      "volume": { "avgChangePct": 12.5, "normalized": 62.5, "weight": 0.3 }
    },
    "signals": [ { "type": "RSI_OVERBOUGHT", "symbol": "BTC", "severity": "medium", ... } ],
    "prices": { "BTC": { "price": 67000, "change1h": 0.5, "rsi": 62 }, ... }
  }
  ```
- Zod schema validation for response
- Handle partial data gracefully (e.g., no fear & greed yet = use available components)

### Non-functional
- Response time < 100ms (simple DB queries)
- Structured error responses with Zod

## Architecture

```
apps/api/src/
  routes/
    dashboard-routes.ts     # GET /api/dashboard
  services/
    crowd-pulse-calculator.ts  # Score calculation logic
    dashboard-service.ts       # Aggregates data for response
```

## Related Code Files

### Create
- `apps/api/src/routes/dashboard-routes.ts`
- `apps/api/src/services/crowd-pulse-calculator.ts`
- `apps/api/src/services/dashboard-service.ts`

### Modify
- `apps/api/src/index.ts` - Mount dashboard routes
- `packages/shared/src/types/index.ts` - DashboardResponse type
- `packages/shared/src/schemas/index.ts` - Zod schema for response

## Implementation Steps

1. **Define shared types in packages/shared:**
   ```typescript
   export interface DashboardResponse {
     crowdPulse: { score: number; signal: SignalType; updatedAt: string }
     components: { fearGreed: FearGreedComponent; rsi: RSIComponent; volume: VolumeComponent }
     signals: Signal[]
     prices: Record<string, PriceSnapshot>
   }
   export type SignalType = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL'
   ```

2. **Create crowd-pulse-calculator.ts:**
   - `calculateCrowdPulse(fearGreed, rsiValues, volumeChanges): CrowdPulseResult`
   - Pure function, easy to test
   - Handles missing components (adjusts weights)
   - Generates signals (RSI_OVERBOUGHT, EXTREME_FEAR, etc.)

3. **Create dashboard-service.ts:**
   - `getDashboardData()`: Queries latest fear/greed, latest candle per symbol, calculates score
   - Uses single DB round-trip where possible (batch queries)

4. **Create dashboard-routes.ts:**
   ```typescript
   import { Hono } from 'hono'
   const dashboard = new Hono()
   dashboard.get('/dashboard', async (c) => {
     const data = await getDashboardData()
     return c.json(data)
   })
   export { dashboard }
   ```

5. **Mount in index.ts:**
   ```typescript
   app.route('/api', dashboard)
   ```

6. **Add Zod response schema** in packages/shared for frontend type safety

7. **Optionally store crowd_pulse snapshot** to DB on each calculation for historical tracking

## Todo List

- [ ] Shared types + Zod schemas
- [ ] crowd-pulse-calculator.ts (score + signals)
- [ ] dashboard-service.ts (data aggregation)
- [ ] dashboard-routes.ts (GET /api/dashboard)
- [ ] Mount routes in index.ts
- [ ] Handle partial data (missing sources)
- [ ] Test with curl after crawlers run

## Success Criteria
- GET /api/dashboard returns valid JSON matching schema
- Score is 0-100 when data available
- Signal is correct for given score
- Response < 100ms
- Graceful response when no data yet (score: null, message: "Collecting data...")

## Risk Assessment
- **No data on first load:** Return null score with status message
- **Stale data:** Include updatedAt so frontend can show staleness warning

## Security Considerations
- No auth in Phase 1 (skip per spec)
- Input validation via Zod (future: rate limiting)
