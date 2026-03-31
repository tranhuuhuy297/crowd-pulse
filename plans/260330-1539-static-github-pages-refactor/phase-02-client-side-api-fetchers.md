# Phase 2: Client-Side API Fetchers

## Context Links
- Binance constants: `packages/shared/src/constants/tracked-symbols.ts`
- Current API client: `apps/web/src/lib/dashboard-api-client.ts`

## Overview
- **Priority:** High
- **Status:** pending
- **Description:** Create browser-callable fetch functions for Fear & Greed, Binance spot, and Binance Futures.

## Key Insights
- All 3 APIs are CORS-friendly, no auth needed
- Binance klines endpoint returns OHLCV arrays; need close prices for RSI
- Binance `ticker/24hr` gives price + 24h change + volume in one call
- Binance Futures `globalLongShortAccountRatio` needs symbol + period params
- Keep fetchers as pure async functions, no React deps

## Requirements
**Functional:**
- `fetchFearGreed()` -- returns `{ value, classification, change24h }`
- `fetchPrices(symbols)` -- returns price + 24h % change for each symbol
- `fetchKlines(symbol, interval, limit)` -- returns close prices array for RSI calc
- `fetchLongShortRatio(symbol)` -- returns latest long/short ratio

**Non-functional:**
- Each fetcher handles errors gracefully (return null on failure)
- No external dependencies beyond `fetch()`
- Type-safe responses

## Architecture
```
apps/web/src/lib/api/
  fear-greed-fetcher.ts
  binance-spot-fetcher.ts
  binance-futures-fetcher.ts
```

## Related Code Files
**Create:**
- `apps/web/src/lib/api/fear-greed-fetcher.ts`
- `apps/web/src/lib/api/binance-spot-fetcher.ts`
- `apps/web/src/lib/api/binance-futures-fetcher.ts`

**Delete (later, phase 6):**
- `apps/web/src/lib/dashboard-api-client.ts`

## Implementation Steps

### 1. `fear-greed-fetcher.ts`
```ts
// GET https://api.alternative.me/fng/?limit=2
// Response: { data: [{ value: "73", value_classification: "Greed", timestamp: "..." }, ...] }
// Return: { value: number, classification: string, change24h: number | null }
// change24h = data[0].value - data[1].value (if limit=2)
```

### 2. `binance-spot-fetcher.ts`
```ts
// fetchTickers(symbols: string[])
// GET https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT",...]
// Returns: { symbol, price, change24hPct, volume24h } per symbol

// fetchKlineCloses(symbol: string, interval = "1h", limit = 50)
// GET https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=50
// Returns: number[] (close prices for RSI)
// Volume anomaly: compare latest volume vs avg of previous candles
```

### 3. `binance-futures-fetcher.ts`
```ts
// fetchGlobalLongShortRatio(symbol: string, period = "1h")
// GET https://fapi.binance.com/fapi/v1/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=1
// Returns: { ratio: number } (longAccount / shortAccount)
```

## Todo List
- [ ] Create `fear-greed-fetcher.ts`
- [ ] Create `binance-spot-fetcher.ts` with `fetchTickers` and `fetchKlineCloses`
- [ ] Create `binance-futures-fetcher.ts`
- [ ] Test each fetcher from browser console
- [ ] Handle network errors (return null, log warning)

## Success Criteria
- All 3 fetchers return typed data from browser
- No CORS errors
- Graceful null returns on failure

## Risk Assessment
- **Medium.** Binance rate limits: 1200 req weight/min. Ticker=40 weight, klines=2 weight each. At 60s polling with 4 symbols: ~56 weight/min -- well under limit.
- alternative.me has no documented rate limit but is stable.

## Security Considerations
- No API keys exposed (all public endpoints)
- No user data transmitted

## Next Steps
- Phase 3 combines fetchers + calculators in a React hook
