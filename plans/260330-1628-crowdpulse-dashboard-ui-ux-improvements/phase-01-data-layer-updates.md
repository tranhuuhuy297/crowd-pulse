# Phase 1: Data Layer Updates

## Context Links
- [Plan overview](./plan.md)
- Hook: `apps/web/src/hooks/use-crowd-pulse-client-side-data.ts`
- Types: `apps/web/src/lib/types.ts`

## Overview
- **Priority:** High (blocks Phases 2, 4, 5)
- **Status:** pending
- **Description:** Expose data source health, score components, and score delta from the data hook so downstream UI components can render breakdown bars and health indicators.

## Key Insights
- `fetchAllData()` already uses `Promise.allSettled` with 4 sources -- health status extractable from result statuses
- `CrowdPulseComponents` type already exists with `fearGreed`, `avgRsi`, `volumeAnomaly`, `longShortRatio`
- Score delta needs a `useRef` to store previous score between refreshes

## Requirements
### Functional
- Track which of 4 API sources succeeded/failed per fetch cycle
- Compute `scoreDelta = currentScore - previousScore` (null on first load)
- Expose `dataSourceHealth` in returned data

### Non-functional
- Zero re-renders from health tracking (use ref or derive inline)

## Architecture
```
fetchAllData() -> returns DashboardData with dataSourceHealth
useCrowdPulseData() -> tracks previousScore via useRef -> returns scoreDelta
```

## Related Code Files
| Action | File |
|--------|------|
| Modify | `apps/web/src/lib/types.ts` |
| Modify | `apps/web/src/hooks/use-crowd-pulse-client-side-data.ts` |

## Implementation Steps

### 1. Add types to `types.ts`
Add after `DashboardData`:
```ts
export interface DataSourceHealth {
  fearGreed: boolean;
  prices: boolean;
  klines: boolean;
  longShort: boolean;
}
```
Add `dataSourceHealth: DataSourceHealth` field to `DashboardData` interface.

### 2. Populate health in `fetchAllData()`
After `Promise.allSettled`, derive:
```ts
const dataSourceHealth: DataSourceHealth = {
  fearGreed: fearGreedResult.status === "fulfilled",
  prices: tickersResult.status === "fulfilled",
  klines: klinesResult.status === "fulfilled",
  longShort: longShortResult.status === "fulfilled",
};
```
Include in return object.

### 3. Add `scoreDelta` to hook return
In `useCrowdPulseData()`:
- Add `const prevScoreRef = useRef<number | null>(null);`
- Add `const [scoreDelta, setScoreDelta] = useState<number | null>(null);`
- In `refresh()` callback, after `setData(result)`:
  ```ts
  if (result.crowdPulse.score !== null && prevScoreRef.current !== null) {
    setScoreDelta(result.crowdPulse.score - prevScoreRef.current);
  }
  prevScoreRef.current = result.crowdPulse.score;
  ```
- Return `{ data, loading, error, scoreDelta }`

## Todo List
- [ ] Add `DataSourceHealth` interface to `types.ts`
- [ ] Add `dataSourceHealth` to `DashboardData`
- [ ] Derive health from `Promise.allSettled` statuses in `fetchAllData()`
- [ ] Add `prevScoreRef` and `scoreDelta` state to hook
- [ ] Compute delta in `refresh()` callback
- [ ] Return `scoreDelta` from hook

## Success Criteria
- `data.dataSourceHealth` reflects actual API call outcomes
- `scoreDelta` is `null` on first load, numeric on subsequent refreshes
- No additional API calls or re-renders introduced
- File stays under 200 lines

## Risk Assessment
- Low risk -- additive changes only, no breaking changes to existing consumers
- `scoreDelta` flicker: mitigated by only setting after second fetch

## Security Considerations
- None -- no new external calls, no user input

## Next Steps
- Phase 2 consumes `components` and `scoreDelta`
- Phase 5 consumes `dataSourceHealth`
