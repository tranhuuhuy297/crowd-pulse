# Phase 3: Score Calculator Update

## Context
- Parent: [plan.md](plan.md)
- Depends on: [Phase 1](phase-01-types-and-constants.md)
- File: `apps/web/src/lib/crowd-pulse-score-calculator.ts`

## Overview
- Priority: P1
- Status: pending
- Update score weights from 4 to 6 components, add normalization functions for funding rate and OI.

## Key Insights
- Existing calculator uses adaptive weight redistribution — missing components' weight redistributed proportionally to available ones
- Current BASE_WEIGHTS: { fearGreed: 35, rsi: 25, volume: 20, longShort: 20 }
- normalizeToHundred(value, min, max) already exists — reuse for new components

## Requirements
### New Weights
```
fearGreed:    25  (was 35)
fundingRate:  20  (NEW)
rsi:          15  (was 25)
longShort:    15  (was 20)
openInterest: 15  (NEW)
volume:       10  (was 20)
```

### Funding Rate Normalization (→ 0-100)
- Input: decimal rate (e.g., 0.0001 = 0.01%)
- Extreme negative (-0.05% = -0.0005) → 0 (fear)
- Neutral (0%) → ~33
- Extreme positive (+0.1% = +0.001) → 100 (greed)
- Formula: `normalizeToHundred(rate, -0.0005, 0.001)`

### Open Interest Normalization (→ 0-100)
- Input: changePercent from avg (e.g., +15% above 14d avg)
- Much below avg (-30%) → 0 (low leverage = fear)
- At avg (0%) → ~50
- Much above avg (+30%) → 100 (high leverage = greed)
- Formula: `normalizeToHundred(changePercent, -30, 30)`

## Related Code Files
- MODIFY: `apps/web/src/lib/crowd-pulse-score-calculator.ts`

## Implementation Steps
1. Update BASE_WEIGHTS to 6 components
2. Update `calculateCrowdPulseScore()` to accept 6-component CrowdPulseComponents
3. Add fundingRate and openInterest entries to the components array
4. Verify adaptive redistribution still works with 6 components (should — it's generic)
5. Add normalization helper exports if needed by data hook

## Todo
- [ ] BASE_WEIGHTS updated to 6 components
- [ ] calculateCrowdPulseScore handles fundingRate + openInterest
- [ ] Normalization ranges tuned for each new metric
- [ ] Adaptive redistribution verified with 6 components

## Success Criteria
- Score calculation with all 6 components returns valid 0-100
- Score calculation with some null components redistributes correctly
- Weights sum to 100

## Risk Assessment
- Low — additive changes to existing pattern
- Normalization thresholds may need tuning after real data observation

## Next Steps
→ Phase 4: Data Hook Integration
