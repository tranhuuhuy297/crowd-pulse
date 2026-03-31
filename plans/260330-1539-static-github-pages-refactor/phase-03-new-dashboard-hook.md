# Phase 3: New Dashboard Hook

## Context Links
- Current SSE hook: `apps/web/src/hooks/use-dashboard-sse-stream.ts`
- Current polling hook: `apps/web/src/hooks/use-dashboard-polling-data.ts`
- Phase 1 types: `apps/web/src/lib/types.ts`
- Phase 2 fetchers: `apps/web/src/lib/api/`

## Overview
- **Priority:** High
- **Status:** pending
- **Description:** Replace SSE/polling hooks with a single hook that fetches from public APIs directly and calculates score client-side.

## Key Insights
- Current hooks fetch pre-computed data from backend; new hook must orchestrate raw API calls + computation
- Use `Promise.allSettled()` for parallel API calls -- partial data is OK
- Score calculation happens synchronously after all fetches complete
- 60s refresh interval via `setInterval`

## Requirements
**Functional:**
- `useCrowdPulseData(refreshMs = 60_000)` returns `{ data: DashboardData | null; loading: boolean; error: string | null }`
- Fetches all data sources in parallel on mount and every 60s
- Calculates RSI per symbol from kline closes
- Calculates volume anomaly from kline volumes
- Calculates CrowdPulse score from all components
- Handles partial failures (some APIs down = partial score)

**Non-functional:**
- No backend dependency
- Clean cleanup on unmount

## Architecture
```
Hook flow:
1. Promise.allSettled([fetchFearGreed(), fetchTickers(), fetchKlines(x4), fetchLongShort(x4)])
2. Calculate RSI per symbol from klines
3. Calculate volume anomaly from klines
4. Calculate avg long/short ratio
5. Run calculateCrowdPulseScore()
6. Return DashboardData
```

## Related Code Files
**Create:**
- `apps/web/src/hooks/use-crowd-pulse-data.ts`

**Delete (later, phase 6):**
- `apps/web/src/hooks/use-dashboard-sse-stream.ts`
- `apps/web/src/hooks/use-dashboard-polling-data.ts`

## Implementation Steps

1. Create `apps/web/src/hooks/use-crowd-pulse-data.ts`

2. Inside the hook's `fetchAll()` function:
   ```
   a. const [fearGreedResult, tickersResult, ...klinesResults, ...longShortResults]
        = await Promise.allSettled([...])
   b. Extract kline close prices -> calculateRSI() per symbol
   c. Extract kline volumes -> compute volume anomaly (latest vs avg)
   d. Average all longShort ratios -> normalize to [0, 100]
   e. Call calculateCrowdPulseScore({ fearGreedValue, avgRsi, volumeAnomaly, longShortRatio })
   f. Build DashboardData object
   ```

3. Volume anomaly calculation:
   ```
   volumes = kline candle volumes (last 50 1h candles)
   avgVol = mean(volumes[0..n-2])
   latestVol = volumes[n-1]
   anomalyPct = ((latestVol - avgVol) / avgVol) * 100
   ```

4. Long/short normalization:
   ```
   avgRatio = mean of all symbols' ratios
   normalized = map [0.5, 2.0] -> [0, 100]
   ```

5. State management: `useState` for data/loading/error, `useRef` for interval

6. Cleanup: clear interval on unmount

## Todo List
- [ ] Create `use-crowd-pulse-data.ts` hook
- [ ] Implement parallel fetch with `Promise.allSettled`
- [ ] Integrate RSI calculator
- [ ] Implement volume anomaly calculation
- [ ] Implement long/short ratio normalization
- [ ] Wire up 60s polling interval
- [ ] Handle partial failures gracefully

## Success Criteria
- Hook returns valid DashboardData when all APIs respond
- Hook returns partial data when some APIs fail
- No memory leaks (intervals cleaned up)
- Score matches expected formula

## Risk Assessment
- **Low.** Main risk is API response shape changes; mitigate with defensive parsing.

## Security Considerations
- None. All public API calls, no secrets.

## Next Steps
- Phase 4 updates the UI to consume the new hook's data shape
