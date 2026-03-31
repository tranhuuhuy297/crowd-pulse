# Code Review: Funding Rate & Open Interest Metrics

**Date:** 2026-03-31
**Scope:** 12 changed/new files for FR + OI dashboard integration

---

## Scope

- Files reviewed: 12 (all listed in request)
- Build: `bun run build` — PASSED (clean, 894ms)
- TypeScript: no tsc binary available, build-time type checking passed via Vite
- Plan file: none provided (no plan dir found)

---

## Overall Assessment

Solid implementation. The extraction of `fetchAllDashboardData` into a dedicated module, the adaptive weight redistribution, and the parallel-fetch pattern are all done correctly. Build passes clean. A few real issues to address below.

---

## Critical Issues

None.

---

## High Priority Findings

### 1. Volume normalization mismatch between score calculator and UI

**File:** `score-component-breakdown.tsx:15-16` vs `crowd-pulse-score-calculator.ts:74`

Score calculator uses `normalizeToHundred(val, -50, 50)` — maps range [-50, 50] → [0, 100].

UI uses its own `normalizeVolumeAnomaly`:
```ts
return Math.min(100, Math.max(0, (val + 100) / 3));
```
This maps [-100, 200] → [0, 100], which is a completely different scale.

The progress bar in `ScoreComponentBreakdown` will show a different value than what actually contributes to the score. If volume anomaly is +40%, the score uses 90/100, but the bar shows `(40+100)/3 = 46/100`.

**Fix:** Use the same normalization in both places. Either export `normalizeToHundred` and call it from the component with the same [-50, 50] bounds, or make the bounds a shared constant.

### 2. `fearGreed` fallback to 50 silently inflates score

**File:** `crowd-pulse-dashboard-data-fetcher.ts:97`
```ts
const fgValue = fearGreed?.value ?? 50;
```

If the Fear & Greed API fails, `fearGreed` is null, `dataSourceHealth.fearGreed` is false, but `fgValue` is set to 50 (neutral). The score calculator then treats `has.fearGreed = true` (it's always true because components.fearGreed is always a number). The weight for Fear & Greed (25%) is always applied regardless of health status — it just silently uses 50.

This is misleading: the health dot will pulse amber/red, but the 25% weight still counts with a neutral 50 score. Depending on the other components this could push the final score toward 50 artificially.

**Fix:** Either propagate `null` for fearGreed into components when the source fails (requires changing `CrowdPulseComponents.fearGreed` to `number | null`), or document the 50-fallback explicitly as intentional with a comment.

---

## Medium Priority Improvements

### 3. OI fetcher: `currentOI` not validated before use

**File:** `binance-futures-open-interest-fetcher.ts:33`

```ts
const currentOI = parseFloat(current.openInterest);
```

If `currentRes.ok` but the body is malformed (e.g., empty or unexpected JSON shape), `current.openInterest` will be `undefined`, and `parseFloat(undefined)` → `NaN`. The `changePercent` calculation will silently produce `NaN`, which propagates into `avgOIChange` and `normalizedOI` → score becomes `NaN`.

Same risk in the funding rate fetcher if `entries[0].fundingRate` is unexpectedly absent.

**Fix:** Add `isNaN` guards or validate the parsed values before returning.

### 4. `score-component-breakdown.tsx`: `getNormalizedValue` uses unchecked cast

**File:** `score-component-breakdown.tsx:21`
```ts
const raw = components[key as keyof CrowdPulseComponents];
```

`COMPONENT_CONFIG` keys (`"fearGreed"`, `"fundingRate"`, `"avgRsi"`, `"longShortRatio"`, `"openInterest"`, `"volumeAnomaly"`) all exist in `CrowdPulseComponents`, so this works — but the comment says `fearGreed, avgRsi, longShortRatio are already 0-100` when `fearGreed` actually is (0-100, direct from API), but `avgRsi` is a raw RSI value (0-100 by nature) and `longShortRatio` is `normalizeToHundred(ratio, 0.5, 2.0)` — so the comment is correct. Low risk.

### 5. `fetchAllDashboardData`: BTCUSDT assumed to be index 0

**File:** `crowd-pulse-dashboard-data-fetcher.ts:66,103`
```ts
if (i === 0) { btcKlineHighs = klineData.highs; ... }
const btcPrice = prices[0]?.price ?? null;
```

This silently relies on `TRACKED_SYMBOLS[0]` being BTC. If the symbols array order ever changes, or BTC fetch fails causing a partial ticker array, `prices[0]` could be a different coin. Not a crash, but produces wrong buy conclusion.

**Fix:** Look up by symbol name instead of index:
```ts
const btcIndex = prices.findIndex(p => p.symbol === "BTC");
```

### 6. `score-component-breakdown.tsx`: volume display shows raw anomaly value, not normalized

The bar displays `value.toFixed(0)` where value for volumeAnomaly comes from `normalizeVolumeAnomaly()`. The label reads "N/A" or "46" etc. without a unit or context. Since other components show actual 0-100 scores, this is visually consistent but the semantic difference between "volume anomaly %" and "score 0-100" is unclear to users. Minor UX concern.

---

## Low Priority Suggestions

### 7. Funding rate fallback endpoint redundancy

**File:** `binance-futures-funding-rate-fetcher.ts:15-22`

The fallback tries `/futures/data/fundingRate` which is not a documented Binance FAPI endpoint — it may not exist. This is probably cargo-culted from the OI historical endpoint. If the primary fails due to geo-block, the fallback will also fail. No harm but the fallback adds a needless second request that always fails in that scenario.

### 8. Missing `React` import in `score-component-breakdown.tsx`

Not needed in React 17+ JSX transform, and build passed, so this is fine.

### 9. `dashboard-loading-skeleton.tsx`: skeleton row count hardcoded to 6

`[1,2,3,4,5,6].map(...)` matches the 6 components, but there's no link to `COMPONENT_CONFIG.length`. If components change, the skeleton won't be updated. Low impact since skeletons are approximate.

---

## Positive Observations

- `Promise.allSettled` pattern used consistently — partial failures don't crash the dashboard.
- Adaptive weight redistribution in `calculateCrowdPulseScore` is correct: `scale = 1 / totalAvailable` properly renormalizes available weights to sum to 1.
- BASE_WEIGHTS sum to exactly 1.0 (0.25+0.20+0.15+0.15+0.15+0.10).
- `FundingRateDisplayCard` and `OpenInterestDisplayCard` follow existing card patterns faithfully (same border/background CSS vars, InfoTooltip, empty state).
- Funding rate normalization bounds `[-0.0005, 0.001]` are reasonable for BTC perpetuals (typical range ±0.01% to 0.1%, extreme up to 0.3%).
- OI normalization bounds `[-30%, +30%]` are reasonable for 14d change.
- Health dot threshold updated correctly to `ok === 6` for 6 sources.
- `fetchAllDashboardData` extraction is a clean separation of concerns from the React hook.
- Confidence adjustment for negative funding (+10 on BUY signals) is directionally correct.

---

## Recommended Actions

1. **[High]** Fix volume normalization mismatch — use `normalizeToHundred(val, -50, 50)` in `ScoreComponentBreakdown` instead of the custom formula.
2. **[High]** Add `isNaN` guard on `parseFloat` results in OI fetcher before computing `changePercent`.
3. **[Medium]** Document or fix the `fearGreed ?? 50` silent fallback behavior — at minimum add a comment explaining why 50 is used.
4. **[Medium]** Replace `prices[0]` BTC-by-index assumption with a symbol lookup.
5. **[Low]** Remove or comment out the dead fallback endpoint in the funding rate fetcher.

---

## Metrics

- Build: PASS
- Type errors: 0 (via build)
- Linting issues: not configured (no lint script in package.json)
- Critical security issues: 0
- All weights sum to 100%: confirmed

---

## Unresolved Questions

1. Is the `fearGreed ?? 50` silent fallback intentional policy (neutral assumption) or an oversight? If intentional, should it be treated as `has.fearGreed = false` so it doesn't consume 25% weight with a fabricated value?
2. What is `TRACKED_SYMBOLS` ordering — is BTC guaranteed at index 0? If so, a comment asserting this would prevent future bugs.
