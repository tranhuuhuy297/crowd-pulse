# Phase 1: Simplify Types & Score Calculator

## Context Links
- Current types: `packages/shared/src/types/dashboard-types.ts`
- Current score calculator: `apps/api/src/services/crowd-pulse-score-calculator.ts`
- Current RSI calculator: `apps/api/src/services/rsi-calculator.ts`

## Overview
- **Priority:** High (foundation for all other phases)
- **Status:** pending
- **Description:** Slim down shared types to 4 components only. Move score + RSI calculators from `apps/api` to `apps/web/src/lib/`.

## Key Insights
- Current score calculator handles 7 components with dynamic weight redistribution
- New version only needs 4 fixed components: fearGreed, RSI, volume, longShort
- RSI calculator is pure function, zero deps -- just copy it
- Score calculator needs rewrite to match new formula: `fearGreed*0.35 + avgRSI*0.25 + volumeAnomaly*0.20 + longShortRatio*0.20`

## Requirements
**Functional:**
- Simplified `DashboardData` type with only 4 score components
- Client-side `calculateCrowdPulseScore()` with 4-component formula
- Client-side `calculateRSI()` (copy from API)
- `SignalType` and `scoreToSignal()` mapping retained

**Non-functional:**
- No server-side imports remain in web app

## Architecture
```
apps/web/src/lib/
  crowd-pulse-score-calculator.ts  -- simplified 4-component version
  rsi-calculator.ts                -- copied from apps/api
  types.ts                         -- simplified dashboard types
```

## Related Code Files
**Modify:**
- `packages/shared/src/types/dashboard-types.ts` (simplify or bypass)

**Create:**
- `apps/web/src/lib/crowd-pulse-score-calculator.ts`
- `apps/web/src/lib/rsi-calculator.ts`
- `apps/web/src/lib/types.ts`

## Implementation Steps
1. Create `apps/web/src/lib/types.ts` with simplified types:
   - `SignalType` (keep as-is)
   - `FearGreedData { value: number; classification: string; change24h: number | null }`
   - `PriceSnapshot { symbol: string; price: number; change24h: number; rsi: number | null }`
   - `LongShortData { symbol: string; ratio: number }`
   - `CrowdPulseData { score: number | null; signal: SignalType; updatedAt: string; components: { fearGreed: number; avgRsi: number | null; volumeAnomaly: number | null; longShortRatio: number | null } }`
   - `DashboardData { crowdPulse: CrowdPulseData; fearGreed: FearGreedData; prices: PriceSnapshot[]; longShort: LongShortData[] }`

2. Copy `apps/api/src/services/rsi-calculator.ts` to `apps/web/src/lib/rsi-calculator.ts` (no changes needed)

3. Create `apps/web/src/lib/crowd-pulse-score-calculator.ts`:
   - Input: `{ fearGreedValue: number; avgRsi: number | null; volumeAnomaly: number | null; longShortRatio: number | null }`
   - Fixed weights: `0.35, 0.25, 0.20, 0.20`
   - Redistribute weights when components are null (same pattern as current)
   - `normalizeToHundred()` and `scoreToSignal()` kept
   - longShortRatio normalized: ratio > 1 = bullish crowd, map [0.5, 2.0] to [0, 100]
   - volumeAnomaly normalized: map [-50, 50] pct change to [0, 100]

## Todo List
- [ ] Create `apps/web/src/lib/types.ts`
- [ ] Copy RSI calculator to web app
- [ ] Create simplified score calculator
- [ ] Verify no imports from `@crowdpulse/shared` types remain (except constants)

## Success Criteria
- New types compile without errors
- Score calculator produces correct output for test inputs
- RSI calculator works identically to API version

## Risk Assessment
- **Low risk.** Pure function refactoring, no external dependencies.

## Security Considerations
- None. Pure computation, no secrets.

## Next Steps
- Phase 2 uses these types for API fetcher return values
