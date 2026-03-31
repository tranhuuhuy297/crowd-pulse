# Brainstorm: L/S Ratio Overhaul + Momentum Card

**Date:** 2026-03-31
**Status:** Agreed — proceed to implementation plan

## Problem Statement
Dashboard L/S Ratio card is too plain, lacks historical context, and is hard to read at a glance. Dashboard also underutilizes existing kline data — only RSI is surfaced.

## Evaluated Approaches

### L/S Ratio Redesign
| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| A: Tug-of-War + Sparkline | Instantly readable, shows trend, contrarian signal | Medium UI effort | **Selected** |
| B: Dial Gauge | Clean, dramatic | No trend history, less info density | Rejected |
| C: Liquid Fill | Memorable, playful | Gimmicky for serious trading tool | Rejected |

### New Metric
| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| Price Momentum (MACD) | Complements RSI, zero API cost, shows trend acceleration | 4h candles = slow-moving | **Selected** |
| Support/Resistance | Already computed, very useful | Complex UI for price ladder | Deferred |
| Volume Trend | Good signal | Overlaps with existing volume anomaly in CrowdPulse | Rejected |
| Skip | Less work | Missed opportunity | Rejected |

## Final Recommended Solution

### 1. L/S Tug-of-War Card (Full Width)
- Animated bulls-vs-bears bar (green/red gradient)
- Mini sparkline of last 24 data points (fetch `limit=24` from Binance Futures)
- Trend direction label ("Shifting Long", "Stabilizing", etc.)
- Crowding signal ("CROWDED LONG", "CROWDED SHORT", "BALANCED")
- Per-symbol ratio still shown (smaller, secondary)

### 2. Momentum Card (Compact)
- MACD from existing 100x 4h klines (EMA-12, EMA-26, Signal-9)
- Mini histogram bars (above/below zero)
- Signal label: Bullish/Bearish Crossover, Diverging, Converging
- Strength: Weak/Moderate/Strong

### Layout
```
Row 1: BTC Price Grid (full width)
Row 2: Buy Conclusion (full width)
Row 3: CrowdPulse (left) | Fear & Greed + Momentum (right stack)
Row 4: Long/Short Tug-of-War (full width)
```

## Implementation Considerations
- L/S API change: add `limit=24` param, store array instead of single value
- MACD: pure math on existing data, no API changes
- Sparkline: lightweight SVG, no charting library needed
- Tug-of-war animation: CSS transitions on width percentages

## Success Metrics
- L/S card communicates bias + direction in <2 seconds of glancing
- Momentum card adds non-redundant signal (distinct from RSI)
- No new API dependencies or keys
- Dashboard doesn't feel cluttered

## Risks
- Dashboard visual density increasing — mitigate with clean spacing and full-width L/S
- MACD on 4h candles is inherently slow — acceptable for contrarian (not scalping) use case
