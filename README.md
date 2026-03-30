# CrowdPulse

Crypto crowd sentiment analysis tool based on contrarian trading principles. When the crowd is too bullish, prepare to sell. When too bearish, prepare to buy.

**Live:** [https://tranhuuhuy297.github.io/crowd-pulse/](https://tranhuuhuy297.github.io/crowd-pulse/)

## How It Works

CrowdPulse fetches data from free public APIs directly in your browser and computes a **Crowd Pulse Score (0-100)**:

| Score Range | Crowd Mood | Contrarian Signal |
|-------------|------------|-------------------|
| 80-100 | Extreme Greed | STRONG_SELL |
| 65-79 | Greed | SELL |
| 35-64 | Neutral | NEUTRAL |
| 20-34 | Fear | BUY |
| 0-19 | Extreme Fear | STRONG_BUY |

### Score Formula

```
score = fearGreed × 0.35 + avgRSI × 0.25 + volumeAnomaly × 0.20 + longShortRatio × 0.20
```

Weights auto-redistribute when data sources are unavailable.

### Data Sources (all free, no API keys)

| Source | Data | Refresh |
|--------|------|---------|
| [alternative.me](https://alternative.me/crypto/fear-and-greed-index/) | Fear & Greed Index (0-100) | 60s |
| [Binance Spot API](https://api.binance.com) | Price, 24h change, volume for BTC/ETH/SOL/BNB | 60s |
| [Binance Spot Klines](https://api.binance.com) | 50 hourly candles → RSI-14 + volume anomaly | 60s |
| [Binance Futures API](https://fapi.binance.com) | Global long/short account ratio | 60s |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript |
| Build | Vite 6 |
| Styling | TailwindCSS v4 |
| Deploy | GitHub Pages via GitHub Actions |

**No backend, no database, no API keys.** Everything runs client-side.

## Quick Start

```bash
bun install
cd apps/web && bun run dev
```

Open [http://localhost:5177](http://localhost:5177).

## Deployment

Push to `main` triggers automatic deployment to GitHub Pages via GitHub Actions.

Manual deploy:
```bash
cd apps/web && bun run build
# Output in apps/web/dist/
```

## Project Structure

```
apps/web/src/
  lib/
    api/                              # Browser-callable API fetchers
      fear-greed-index-fetcher.ts
      binance-spot-price-and-klines-fetcher.ts
      binance-futures-long-short-ratio-fetcher.ts
    crowd-pulse-score-calculator.ts   # Client-side score calculation
    rsi-wilder-smoothing-calculator.ts
    constants.ts                      # Tracked symbols, API URLs
    types.ts                          # TypeScript interfaces
  hooks/
    use-crowd-pulse-client-side-data.ts  # Main data hook (fetch + calculate)
  components/
    crowd-pulse-score-card.tsx        # Gauge + signal badge
    fear-greed-display-card.tsx       # Fear & Greed index card
    liquidation-ratio-display-card.tsx # Long/short ratio card
    symbol-price-grid.tsx             # Price cards grid
    svg-gauge-chart.tsx               # Score gauge visualization
```
