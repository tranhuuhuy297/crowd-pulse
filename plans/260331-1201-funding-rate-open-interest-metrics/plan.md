---
title: "Add Funding Rate & Open Interest Metrics"
description: "Integrate Binance Futures funding rate and open interest into Contrarian Signal score and dashboard UI"
status: complete
priority: P1
effort: 3h
branch: main
tags: [metrics, funding-rate, open-interest, contrarian-signal, binance-futures]
created: 2026-03-31
---

# Add Funding Rate & Open Interest Metrics

## Goal
Add two high-value contrarian indicators (Funding Rate, Open Interest) to the CrowdPulse dashboard. Both are free from Binance Futures API and directly measure crowd leverage behavior — the strongest contrarian signal in crypto.

## New Score Formula
| Component | Old Weight | New Weight |
|-----------|-----------|------------|
| Market Sentiment (F&G) | 35% | 25% |
| **Funding Rate** | — | **20%** |
| RSI | 25% | 15% |
| L/S Ratio | 20% | 15% |
| **Open Interest** | — | **15%** |
| Volume Anomaly | 20% | 10% |

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Types & Constants](phase-01-types-and-constants.md) | complete | 15m |
| 2 | [API Fetchers](phase-02-api-fetchers.md) | complete | 30m |
| 3 | [Score Calculator Update](phase-03-score-calculator-update.md) | complete | 30m |
| 4 | [Data Hook Integration](phase-04-data-hook-integration.md) | complete | 45m |
| 5 | [UI Components](phase-05-ui-components.md) | complete | 45m |
| 6 | [Buy Conclusion Enhancement](phase-06-buy-conclusion-enhancement.md) | complete | 15m |

## Key Dependencies
- Binance Futures public API (no key required)
- Existing fetcher pattern in `binance-futures-long-short-ratio-fetcher.ts`
- Existing adaptive weight redistribution in score calculator

## References
- [Brainstorm Report](../reports/brainstorm-260331-1203-funding-rate-open-interest-metrics.md)
- [Binance Futures API Docs](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data)
