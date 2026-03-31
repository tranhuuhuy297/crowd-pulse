# Phase 4: Data Hook Integration

## Context
- Parent: [plan.md](plan.md)
- Depends on: [Phase 2](phase-02-api-fetchers.md), [Phase 3](phase-03-score-calculator-update.md)
- File: `apps/web/src/hooks/use-crowd-pulse-client-side-data.ts`

## Overview
- Priority: P1
- Status: pending
- Wire new fetchers into the main data hook, normalize values, pass to score calculator.

## Key Insights
- Hook uses `Promise.allSettled()` for graceful degradation — add 2 more promises
- Currently 4 parallel fetches → will be 6
- Funding rate normalization: rate decimal → 0-100 via normalizeToHundred
- OI normalization: changePercent → 0-100 via normalizeToHundred
- Must update DashboardData output to include raw data for display cards

## Requirements
- Fetch funding rates + OI in parallel with existing calls
- Extract results with graceful null handling
- Compute average funding rate across symbols
- Compute average OI change across symbols
- Normalize both to 0-100 for score calculator
- Update DataSourceHealth with new flags
- Pass raw data through DashboardData for UI cards

## Related Code Files
- MODIFY: `apps/web/src/hooks/use-crowd-pulse-client-side-data.ts`

## Implementation Steps
1. Import new fetchers: `fetchAllFundingRates`, `fetchAllOpenInterest`
2. Add to `Promise.allSettled()` array (index 4 and 5)
3. Extract results with `status === "fulfilled"` checks
4. Calculate average funding rate across symbols
5. Calculate average OI changePercent across symbols
6. Normalize: `normalizeToHundred(avgFundingRate, -0.0005, 0.001)`
7. Normalize: `normalizeToHundred(avgOIChange, -30, 30)`
8. Pass normalized values to `calculateCrowdPulseScore()` in components
9. Update `DataSourceHealth`: `fundingRate: boolean`, `openInterest: boolean`
10. Add raw funding rate + OI arrays to DashboardData output

## Todo
- [ ] Fetchers imported and called in parallel
- [ ] Results extracted and averaged
- [ ] Normalized values passed to score calculator
- [ ] DataSourceHealth updated
- [ ] Raw data passed to DashboardData for UI
- [ ] File stays under 200 lines (currently 170 — may need extraction)

## Success Criteria
- Dashboard loads with 6 data sources
- Partial failures don't break the dashboard
- Score reflects new components when data available

## Risk Assessment
- Medium: file is already 170 lines — adding ~30 lines may exceed 200. Consider extracting normalization helpers to separate module.
- Low: Promise.allSettled pattern already proven

## Next Steps
→ Phase 5: UI Components
