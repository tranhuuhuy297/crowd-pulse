# Phase 1: Types & Constants

## Context
- Parent: [plan.md](plan.md)
- Docs: `apps/web/src/lib/types.ts`, `apps/web/src/lib/constants.ts`

## Overview
- Priority: P1 (blocks all other phases)
- Status: pending
- Add TypeScript types for funding rate and open interest data, update CrowdPulseComponents and DataSourceHealth, add API URL constant.

## Key Insights
- Follow existing pattern: LongShortData has `symbol` + numeric value
- CrowdPulseComponents currently has 4 nullable number fields — add 2 more
- DataSourceHealth has 4 boolean flags — add 2 more

## Requirements
- FundingRateData type: symbol, rate (decimal), timestamp
- OpenInterestData type: symbol, currentOI (number), avgOI (number), changePercent (number)
- Update CrowdPulseComponents: add `fundingRate: number | null`, `openInterest: number | null`
- Update DataSourceHealth: add `fundingRate: boolean`, `openInterest: boolean`
- BINANCE_FUTURES_DATA_URL already exists in constants — verify it works for new endpoints

## Related Code Files
- MODIFY: `apps/web/src/lib/types.ts`
- MODIFY: `apps/web/src/lib/constants.ts` (if new URL needed)

## Implementation Steps
1. Add `FundingRateData` interface to types.ts (symbol, rate, timestamp)
2. Add `OpenInterestData` interface to types.ts (symbol, currentOI, avgOI, changePercent)
3. Add `fundingRate: number | null` and `openInterest: number | null` to CrowdPulseComponents
4. Add `fundingRate: boolean` and `openInterest: boolean` to DataSourceHealth
5. Update DashboardData if needed to include raw funding/OI data for display cards
6. Verify BINANCE_FUTURES_BASE_URL constant exists and works for `/fapi/v1/` endpoints

## Todo
- [ ] FundingRateData interface
- [ ] OpenInterestData interface
- [ ] CrowdPulseComponents updated
- [ ] DataSourceHealth updated
- [ ] DashboardData updated
- [ ] Constants verified/added

## Success Criteria
- All new types compile without errors
- No breaking changes to existing type consumers

## Risk Assessment
- Low risk — additive type changes only
- Nullable fields ensure backward compatibility

## Next Steps
→ Phase 2: API Fetchers
