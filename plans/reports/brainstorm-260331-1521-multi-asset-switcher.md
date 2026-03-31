# Brainstorm: Multi-Asset Switcher (ETH, SOL, BNB)

## Decisions
- **Switcher:** Dropdown `<select>` in header
- **URL:** `/btc`, `/eth`, `/sol`, `/bnb` — root `/` redirects to `/btc`
- **Data:** Fetch all 4 assets upfront, instant switching
- **Router:** `wouter` (~1.5KB)
- **Scoring:** Per-asset CrowdPulse score; Fear & Greed shared

## Changes Required
1. `constants.ts` — add ETH, SOL, BNB to TRACKED_SYMBOLS
2. Data fetcher — already iterates TRACKED_SYMBOLS, minimal changes
3. Score calculator — per-asset score from own L/S, funding, OI
4. Hook — return all assets, UI filters by route param
5. App — add wouter routing, dropdown in header
6. Buy conclusion — generalize or BTC-only initially

## Risk
- buyConclusion uses BTC-specific klines — disable for non-BTC or generalize
