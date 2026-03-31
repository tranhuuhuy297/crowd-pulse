# Phase 2: API Fetchers

## Context
- Parent: [plan.md](plan.md)
- Depends on: [Phase 1](phase-01-types-and-constants.md)
- Pattern ref: `apps/web/src/lib/api/binance-futures-long-short-ratio-fetcher.ts`

## Overview
- Priority: P1
- Status: pending
- Create two new fetcher modules for Binance Futures funding rate and open interest data.

## Key Insights
- Existing L/S ratio fetcher uses `/futures/data/` path (not `/fapi/v1/`) — likely geo-blocking workaround
- Funding rate: `GET /fapi/v1/fundingRate?symbol=BTCUSDT&limit=1` returns latest rate
- Open Interest current: `GET /fapi/v1/openInterest?symbol=BTCUSDT`
- Open Interest historical: `GET /futures/data/openInterestHist?symbol=BTCUSDT&period=1d&limit=14`
- Both are public endpoints, no API key needed
- Follow pattern: single-symbol fetch → batch via Promise.allSettled → main export

## Requirements
### Funding Rate Fetcher
- Fetch latest funding rate for each tracked symbol
- Return array of `FundingRateData` (symbol, rate as decimal, timestamp)
- Graceful failure: return null per symbol on error

### Open Interest Fetcher
- Fetch current OI + 14-day historical OI for each tracked symbol
- Calculate: avgOI from historical, changePercent = (current - avg) / avg * 100
- Return array of `OpenInterestData`
- Graceful failure: return null per symbol on error

## Architecture
```
binance-futures-funding-rate-fetcher.ts
  └─ fetchFundingRateForSymbol(symbol) → FundingRateData | null
  └─ fetchAllFundingRates(symbols) → FundingRateData[]

binance-futures-open-interest-fetcher.ts
  └─ fetchOpenInterestForSymbol(symbol) → OpenInterestData | null
  └─ fetchAllOpenInterest(symbols) → OpenInterestData[]
```

## Related Code Files
- NEW: `apps/web/src/lib/api/binance-futures-funding-rate-fetcher.ts`
- NEW: `apps/web/src/lib/api/binance-futures-open-interest-fetcher.ts`
- REF: `apps/web/src/lib/api/binance-futures-long-short-ratio-fetcher.ts`

## Implementation Steps

### Funding Rate Fetcher
1. Create `binance-futures-funding-rate-fetcher.ts`
2. Define Binance response interface: `{ symbol, fundingRate, fundingTime }`
3. `fetchFundingRateForSymbol(symbol)`: 
   - Fetch `${BINANCE_FUTURES_BASE_URL}/fapi/v1/fundingRate?symbol=${symbol}&limit=1`
   - If geo-blocked, fallback to `/futures/data/` path
   - Parse rate as float, return FundingRateData
   - Try/catch → null on error
4. `fetchAllFundingRates(symbols)`: Promise.allSettled batch, filter fulfilled non-null

### Open Interest Fetcher
1. Create `binance-futures-open-interest-fetcher.ts`
2. Define response interfaces for current + historical OI
3. `fetchOpenInterestForSymbol(symbol)`:
   - Fetch current: `${BINANCE_FUTURES_BASE_URL}/fapi/v1/openInterest?symbol=${symbol}`
   - Fetch historical: `${BINANCE_FUTURES_BASE_URL}/futures/data/openInterestHist?symbol=${symbol}&period=1d&limit=14`
   - Both in parallel via Promise.all
   - Compute avgOI from historical, changePercent
   - Return OpenInterestData
4. `fetchAllOpenInterest(symbols)`: Promise.allSettled batch

## Todo
- [ ] Funding rate fetcher with single + batch functions
- [ ] Open interest fetcher with current + historical + batch
- [ ] Error handling follows existing pattern (null on failure)
- [ ] Test with BTCUSDT manually (curl or browser console)

## Success Criteria
- Both fetchers return valid data for BTCUSDT
- Graceful null return on network/parse errors
- No CORS issues (same origin pattern as L/S ratio)

## Risk Assessment
- Medium: `/fapi/v1/` may be geo-blocked in some regions. Mitigation: try `/futures/data/` fallback path like L/S ratio fetcher uses
- Low: rate limit shared with existing calls — 6 total futures calls per refresh cycle should be fine

## Next Steps
→ Phase 3: Score Calculator Update
