# Contrarian Thinking - Crowd Sentiment Calculation Exploration

## Executive Summary

The crowd sentiment is calculated through a **weighted multi-component scoring system called "Crowd Pulse"** that aggregates 7 different data sources into a single 0-100 score, which is then mapped to contrarian trading signals.

---

## 1. Crowd Pulse Score Calculation Architecture

### Main Calculation Engine
**File:** `/apps/api/src/services/crowd-pulse-score-calculator.ts`

The `calculateCrowdPulse()` function is the core sentiment engine that:
- Takes a `CrowdPulseInput` with 7 components (Fear/Greed, RSI, Volume, Sentiment, Trends, Liquidation, On-chain)
- Outputs a 0-100 score with component breakdowns
- Maps score to contrarian signals: STRONG_BUY, BUY, NEUTRAL, SELL, STRONG_SELL

### Base Weight Distribution
```
fearGreed:    0.25 (25%)
rsi:          0.15 (15%)
volume:       0.15 (15%)
sentiment:    0.20 (20%)  ← Reddit sentiment
trends:       0.10 (10%)  ← Google Trends
liquidation:  0.10 (10%)  ← Long/short ratio
onchain:      0.05 (5%)   ← BTC tx count
```

**Key Feature:** Weights are dynamically redistributed when components have missing data, ensuring no data source failure breaks the entire system.

### Score-to-Signal Mapping
```
Score >= 80:   STRONG_SELL (crowd too greedy)
Score 65-79:   SELL
Score 35-64:   NEUTRAL
Score 20-34:   BUY
Score < 20:    STRONG_BUY (crowd too fearful)
```

**Contrarian Logic:** High scores indicate crowd greed → Sell signal. Low scores indicate crowd fear → Buy signal.

---

## 2. The Seven Sentiment Components

### A. Fear & Greed Index (25% base weight)
**Source:** `alternative.me` free API
**File:** `/apps/api/src/services/fear-greed-api-fetcher.ts`

- **Range:** 0-100 (comes pre-normalized)
- **Update Frequency:** Fetched via `/api/dashboard` on-demand
- **Data:** Includes classification (e.g., "Extreme Fear", "Greed") and 24h change
- **Storage:** `sentiment_fear_greed` table
- **URL:** `https://api.alternative.me/fng/?limit=2&format=json`

### B. RSI (Relative Strength Index) (15% base weight)
**File:** `/apps/api/src/services/rsi-calculator.ts`

- **Implementation:** Wilder's smoothing (EMA) method
- **Period:** 14 candles
- **Range:** 0-100
- **Calculation Steps:**
  1. Calculate gains/losses over first 14 periods
  2. Apply Wilder's smoothing formula for remaining data
  3. RSI = 100 - 100/(1 + RS), where RS = avg_gain/avg_loss
- **Per Symbol:** Calculated for each tracked symbol (currently BTCUSDT)
- **Storage:** Stored in `market_price_candles` table with each candle

### C. Volume Anomaly (15% base weight)
**File:** `/apps/api/src/services/price-candles-db-service.ts`

- **Metric:** Volume change percentage vs rolling baseline
- **Normalization:** Maps volume change from [-50%, +50%] to [0, 100]
- **Interpretation:** +50% volume → score 100, -50% volume → score 0
- **Storage:** `volumeChangePct` field in price candles
- **Purpose:** Indicates retail participation intensity

### D. Reddit Sentiment (20% base weight)
**File:** `/apps/api/src/services/reddit-sentiment-score-aggregator.ts`

- **Source:** Reddit hot posts from tracked subreddits
- **Subreddits:** CryptoCurrency, Bitcoin, ethereum, solana
- **Method:**
  1. Fetch posts from last 4 hours
  2. Analyze each post's title+body with crypto-specific sentiment lexicon
  3. Apply time-weighted average (recent posts weighted higher)
  4. Range: 0-100 (50 = neutral)
- **Time Window:** 4-hour rolling window
- **Storage:** `sentiment_aggregates` table
- **Post Analysis:** Uses AFINN-165 lexicon with crypto word overrides (see below)

**Crypto Sentiment Word Overrides:**
```
Positive: moon(+3), hodl(+2), bullish(+3), pump(+2), rally(+2), accumulate(+2), breakout(+2), ath(+3)
Negative: dump(-3), rekt(-3), rug(-4), scam(-4), bearish(-3), fud(-3), crash(-3), liquidation(-2)
```

### E. Google Trends Interest (10% base weight)
**File:** `/apps/api/src/services/google-trends-api-fetcher.ts`

- **Keywords Tracked:** "bitcoin", "crypto", "ethereum", "buy crypto", "sell crypto"
- **Time Window:** Last 24 hours with granular (hourly) resolution
- **API:** `google-trends-api` npm package
- **Normalization:** Already 0-100 from Google, clamped for safety
- **Interpretation:** High search volume = retail FOMO = crowd greed
- **Update Frequency:** Every 15 minutes (via job queue)
- **Rate Limiting:** 1.5s delay between keywords, 0-15s jitter to avoid synchronized requests
- **Storage:** `google_trends_interest` table
- **Latest Value:** Always takes the most recent data point in the 24h window

### F. Binance Long/Short Ratio (10% base weight)
**File:** `/apps/api/src/services/binance-futures-long-short-ratio-fetcher.ts`

- **Source:** Binance Futures public API (no API key required)
- **API Endpoint:** `https://www.binance.com/futures/data/globalLongShortAccountRatio`
- **Symbols:** BTCUSDT, ETHUSDT (only liquid futures pairs)
- **Raw Normalization Formula:**
  ```
  score = clamp((ratio - 0.5) / 1.5 * 100, 0, 100)
  
  Interpretation:
  ratio 0.5 → score 0   (mostly shorts, bearish)
  ratio 1.0 → score 33  (balanced)
  ratio 2.0 → score 100 (heavily long, max greed)
  ```
- **Update Frequency:** Every 5 minutes
- **Storage:** `liquidation_long_short_ratio` table
- **Metric:** Global account ratio (how many traders are long vs short)

### G. On-Chain Activity Score (5% base weight)
**File:** `/apps/api/src/services/onchain-metrics-activity-score-normalizer.ts`

- **Metric:** BTC transaction count vs 30-day moving average
- **Source:** `blockchain.info` free public API
- **Fetcher:** `/apps/api/src/services/blockchain-info-onchain-stats-fetcher.ts`
- **API URL:** `https://api.blockchain.info/stats`
- **Normalization Formula:**
  ```
  score = clamp((current_tx_count / avg_30d - 0.5) * 100, 0, 100)
  
  Interpretation:
  current == avg_30d → score 50 (neutral)
  current == 1.5x avg_30d → score 100 (high activity)
  current == 0.5x avg_30d → score 0 (low activity)
  ```
- **Update Frequency:** Every 30 minutes
- **Storage:** `onchain_metrics` table
- **Interpretation:** High on-chain activity = crowd participation signal

---

## 3. Data Flow Pipeline

### Entry Point
**File:** `/apps/api/src/services/dashboard-data-aggregator.ts` - `getDashboardData()`

This function orchestrates all data fetching:

```
getDashboardData()
├─ fetchLatestFearGreed() → fear_greed_index table
├─ fetchLatestCandles() → market_price_candles (RSI, Volume)
├─ getLatestSentimentAggregate() → sentiment_aggregates (Reddit)
├─ getLatestTrendsScore() → google_trends_interest
├─ getLatestLiquidationScore() → liquidation_long_short_ratio
├─ getLatestOnchainScore() → onchain_metrics
└─ calculateCrowdPulse()
   └─ Aggregates all 7 components into final score
```

### Data Update Schedules (Job Queue)

**File:** `/apps/api/src/jobs/phase3-crawlers-queue-manager.ts`

| Component | Job | Frequency |
|-----------|-----|-----------|
| Fear & Greed | fear-greed-crawler | ~daily (source updates once/day) |
| Price/RSI | price-crawler | 1 minute |
| Reddit Sentiment | reddit-sentiment-crawler | 30 minutes |
| Google Trends | google-trends-crawler | 15 minutes |
| Long/Short Ratio | liquidation-crawler | 5 minutes |
| On-Chain Metrics | onchain-metrics-crawler | 30 minutes |

### Real-Time API Exposure
**File:** `/apps/api/src/routes/dashboard-api-routes.ts`

```
GET /api/dashboard
→ Returns DashboardResponse with:
  - crowdPulse score & signal
  - All 7 component breakdowns
  - Current BTC price
  - Recent signals (last 5)
```

---

## 4. Signal Generation & Feedback

### Contrarian Signal Evaluation
**File:** `/apps/api/src/services/contrarian-signal-evaluator.ts`

Once crowd pulse score calculated:

1. **Score→Signal Mapping** with confidence levels:
   ```
   score ≤ 10:   STRONG_BUY (HIGH confidence)
   score ≤ 20:   STRONG_BUY (MEDIUM confidence)
   score ≤ 35:   BUY (LOW confidence)
   score ≥ 90:   STRONG_SELL (HIGH confidence)
   score ≥ 80:   STRONG_SELL (MEDIUM confidence)
   score ≥ 65:   SELL (LOW confidence)
   35 < score < 65:  NO SIGNAL (neutral zone)
   ```

2. **Debounce:** Previous reading must also be in extreme zone (same direction)
   - Prevents false signals from momentary spikes
   - Requires sustained crowd sentiment

3. **Cooldown:** 4-hour minimum between same-type signals
   - Prevents overtrading the same signal
   - Allow time for market to react

4. **Signal Persistence:** Stored in `contrarian_signals` table with:
   - Signal type (BUY/SELL/etc)
   - Confidence level
   - Score at signal time
   - BTC price at signal time
   - Component snapshot (full breakdown)

5. **Accuracy Tracking:** Delayed jobs scheduled at 24h, 72h, 7d to check if signal was accurate
   - File: `/apps/api/src/jobs/signal-accuracy-delayed-checker-worker.ts`

---

## 5. Database Schema

### Core Sentiment Tables

1. **`sentiment_fear_greed`** - Fear & Greed Index entries
   - value: numeric(5,2)
   - valueClassification: text
   - change24h: numeric
   - timestamp: datetime

2. **`market_price_candles`** - OHLCV + calculated indicators
   - symbol: varchar
   - interval: varchar (e.g., "1m")
   - rsi: numeric (pre-calculated)
   - volumeChangePct: numeric
   - priceChangePct: numeric

3. **`sentiment_aggregates`** - Time-weighted Reddit sentiment
   - source: varchar (always "reddit")
   - avgScore: numeric (0-100)
   - postCount: integer
   - windowStart/windowEnd: datetime

4. **`google_trends_interest`** - Keyword interest data
   - keyword: varchar
   - interestValue: integer (0-100)
   - timestamp: datetime

5. **`liquidation_long_short_ratio`** - Binance futures sentiment
   - symbol: varchar
   - longShortRatio: numeric
   - longAccount: numeric
   - shortAccount: numeric
   - timestamp: datetime

6. **`onchain_metrics`** - BTC network activity
   - metricName: varchar (e.g., "tx_count", "hash_rate")
   - value: numeric
   - timestamp: datetime

7. **`crowd_pulse`** - Score snapshots
   - score: numeric(5,2)
   - signal: varchar
   - components: jsonb (full breakdown)
   - symbol: nullable
   - createdAt: timestamp

8. **`contrarian_signals`** - Generated trading signals
   - signal: varchar (BUY/SELL/etc)
   - confidence: varchar (HIGH/MEDIUM/LOW)
   - score: numeric
   - priceAtSignal: numeric
   - componentSnapshot: jsonb
   - accurate24h/72h/7d: boolean (filled later)

---

## 6. Frontend Integration

### Web Client Calculation
**File:** `/apps/web/src/lib/crowd-pulse-score-calculator.ts`

- **Subset Implementation:** Only 4 components (simplified version)
  ```
  fearGreed: 0.35 (35%)
  rsi: 0.25 (25%)
  volume: 0.20 (20%)
  longShort: 0.20 (20%)
  ```
- **Purpose:** Client-side score recalculation for quick feedback
- **Source:** Uses `/api/dashboard` data
- **Display Components:**
  - `crowd-pulse-score-card.tsx` - Main score display with gauge chart
  - `score-component-breakdown.tsx` - Component details breakdown
  - `fear-greed-display-card.tsx` - Fear & Greed visualization

---

## 7. Configuration & Constants

**File:** `/packages/shared/src/constants/tracked-symbols.ts`

```typescript
TRACKED_SYMBOLS: ["BTCUSDT"]
SYMBOL_DISPLAY_NAMES: { BTCUSDT: "BTC" }
GOOGLE_TRENDS_KEYWORDS: ["bitcoin", "crypto", "ethereum", "buy crypto", "sell crypto"]
REDDIT_SUBREDDITS: ["CryptoCurrency", "Bitcoin", "ethereum", "solana"]
```

---

## 8. Key Metrics Summary

| Metric | Weight | Source | Window | Range | Update |
|--------|--------|--------|--------|-------|--------|
| Fear/Greed | 25% | alternative.me | Daily | 0-100 | ~Daily |
| RSI | 15% | Binance klines | 14 periods | 0-100 | 1 min |
| Volume | 15% | Binance klines | vs baseline | 0-100* | 1 min |
| Sentiment | 20% | Reddit (4h avg) | 4 hours | 0-100 | 30 min |
| Trends | 10% | Google Trends | 24h latest | 0-100 | 15 min |
| Long/Short | 10% | Binance Futures | Current ratio | 0-100* | 5 min |
| On-Chain | 5% | blockchain.info | vs 30d avg | 0-100* | 30 min |

*Uses normalization formulas (not inherently 0-100)

---

## 9. System Resilience Features

1. **Graceful Degradation:** Missing components don't break the score
   - Weights automatically redistribute
   - System returns "NEUTRAL" only if all data unavailable

2. **Non-Blocking Operations:**
   - Signal evaluation runs async after score calculation
   - Accuracy checks scheduled as delayed jobs
   - Failed individual data fetches logged but don't block dashboard

3. **Error Handling:**
   - Reddit sentiment returns null if no recent posts
   - Google Trends continues with remaining keywords if one fails
   - Binance API timeout returns null, score redistributes
   - blockchain.info failure doesn't impact overall score

---

## 10. Unresolved Questions / Enhancement Opportunities

1. **Parameter Tuning:**
   - Are the current base weights optimal? (0.25, 0.15, 0.15, 0.20, 0.10, 0.10, 0.05)
   - Reddit 4-hour window vs trends 24-hour window - any mismatch issues?
   - Could sentiment window expand to 8-12 hours for more data points?

2. **Data Quality:**
   - Are crypto sentiment word overrides complete? (currently 30+ words)
   - Google Trends might have "buy crypto"/"sell crypto" keyword bias
   - Reddit post filtering - are we catching all relevant sentiment?

3. **Missing Metrics:**
   - No institutional flow data (whale transactions)
   - No derivative open interest tracking
   - No volatility/implied vol component
   - No correlation with traditional markets

4. **Signal Quality:**
   - Current 4h cooldown optimal or too aggressive?
   - Debounce logic (requires prev score in same zone) - right threshold?
   - Signal accuracy tracking: has sufficient data accumulated?

5. **Scalability:**
   - Currently only tracking BTCUSDT - ready for altcoins?
   - Database query performance with multi-year sentiment history?

