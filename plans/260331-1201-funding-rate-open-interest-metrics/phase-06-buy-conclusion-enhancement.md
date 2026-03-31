# Phase 6: Buy Conclusion Enhancement

## Context
- Parent: [plan.md](plan.md)
- Depends on: [Phase 4](phase-04-data-hook-integration.md)
- File: `apps/web/src/lib/price-level-calculator.ts`

## Overview
- Priority: P3 (nice-to-have)
- Status: pending
- Use funding rate as additional signal in buy conclusion confidence adjustment.

## Key Insights
- Currently adjusts confidence based on RSI alignment only
- Funding rate extremes provide strong confirmation/contradiction signal
- Negative funding + fear signal = extra confirmation to buy (crowd heavily short)
- Positive funding + greed signal = extra confirmation to avoid

## Requirements
- Accept avgFundingRate as optional parameter in calculateBuyConclusion
- Boost confidence +10 when funding rate aligns with signal direction
- Mention funding rate context in summary text when extreme

## Related Code Files
- MODIFY: `apps/web/src/lib/price-level-calculator.ts`
- MODIFY: `apps/web/src/hooks/use-crowd-pulse-client-side-data.ts` (pass funding rate to calculator)

## Implementation Steps
1. Add `avgFundingRate: number | null` parameter to `calculateBuyConclusion()`
2. Define extreme thresholds: negative < -0.0001, positive > 0.0005
3. After existing RSI adjustment block, add funding rate adjustment:
   - Negative funding + (STRONG_BUY | BUY) → confidence += 10
   - Positive funding + (SELL | STRONG_SELL) → confidence += 5
4. Add funding context to summary when extreme (e.g., "Funding negative — shorts paying longs")
5. Update caller in data hook to pass avgFundingRate

## Todo
- [ ] avgFundingRate parameter added
- [ ] Confidence adjustment logic
- [ ] Summary text includes funding context when extreme
- [ ] Caller updated

## Success Criteria
- Buy conclusion confidence adjusts when funding rate is extreme
- Summary mentions funding when relevant
- No change when funding rate is null or neutral

## Risk Assessment
- Low — optional enhancement, null-safe
- Confidence cap at 95 already exists

## Next Steps
- Test full flow end-to-end
- Monitor normalization thresholds with real data and tune if needed
