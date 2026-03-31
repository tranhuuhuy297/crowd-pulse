# Brainstorm: Add Funding Rate & Open Interest Metrics

## Problem
CrowdPulse contrarian signal missing key leverage/positioning indicators. Current 4 inputs (F&G, RSI, Volume, L/S Ratio) don't capture crowd leverage behavior — the strongest contrarian signal in crypto.

## Evaluated Approaches

### Full metric suite (On-chain, Macro, Supply)
- **Rejected** — requires paid APIs (Glassnode, CryptoQuant), breaks "no API keys" philosophy
- Complexity explosion for marginal value

### Funding Rate + Open Interest only
- **Selected** — both free from Binance Futures API, directly measure crowd leverage
- Highest signal-to-noise ratio for contrarian trading
- Minimal implementation effort

### MA 50/200 + Halving cycle
- **Deferred** — trend context, not sentiment. Could enhance buy conclusion card later, but doesn't belong in crowd pulse score.

## Final Recommended Solution

### New Metrics
1. **Funding Rate** — `GET /fapi/v1/fundingRate` (Binance Futures, free)
   - Positive = longs pay shorts = bullish crowd = contrarian sell signal
   - Negative = shorts pay longs = bearish crowd = contrarian buy signal
   - Extreme thresholds: >0.05% very bullish, <-0.01% very bearish
   - Weight: 20% of Contrarian Signal

2. **Open Interest** — `GET /fapi/v1/openInterest` (Binance Futures, free)
   - Compare current OI vs recent average to detect leverage buildup
   - High OI + rising price = overleveraged longs = contrarian sell
   - Normalize as % change from average
   - Weight: 15% of Contrarian Signal

### New Score Formula
```
Market Sentiment (F&G):  25% (was 35%)
Funding Rate:            20% (NEW)
RSI:                     15% (was 25%)
L/S Ratio:               15% (was 20%)
Open Interest:           15% (NEW)
Volume Anomaly:          10% (was 20%)
```

### Also in this batch
- L/S ratio card: thicker bar, hero number, bolder colors (done)
- "Fear & Greed" → "Market Sentiment" label (done)
- "Crowd Pulse" → "Contrarian Signal" label (done)
- Kline interval: 4h/100 → 1d/30 (done)

## Implementation Considerations
- Both APIs are public, no CORS issues (same as existing L/S ratio fetcher)
- Funding rate updates every 8h on Binance — cache/refresh accordingly
- OI needs historical comparison — fetch recent values and compute anomaly
- UI: add 2 new rows in score breakdown + optional display cards
- Update CrowdPulseComponents type, score calculator, data hook

## Risks
- Binance Futures API rate limits (shared with L/S ratio calls)
- Funding rate only updates 3x/day — stale data between updates
- OI normalization needs tuning (what's "high" OI varies by market conditions)

## Success Criteria
- Funding rate + OI fetched and displayed on dashboard
- Both integrated into Contrarian Signal score with new weights
- Score breakdown shows 6 components instead of 4
- Buy conclusion logic considers funding rate extremes
