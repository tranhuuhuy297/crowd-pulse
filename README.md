# CrowdPulse

Crypto crowd sentiment analysis tool based on contrarian trading principles. When the crowd is too bullish, prepare to sell. When too bearish, prepare to buy.

## How It Works

CrowdPulse aggregates data from multiple sources and computes a **Crowd Pulse Score (0-100)**:

| Score Range | Crowd Mood | Contrarian Signal |
|-------------|------------|-------------------|
| 80-100 | Extreme Greed | STRONG_SELL |
| 65-79 | Greed | SELL |
| 35-64 | Neutral | NEUTRAL |
| 20-34 | Fear | BUY |
| 0-19 | Extreme Fear | STRONG_BUY |

### Data Sources (Phase 1)

- **Binance** — OHLCV price data for BTC, ETH, SOL, BNB (every 60s)
- **Fear & Greed Index** — alternative.me API (every 1h, backfills 30 days)

### Crowd Pulse Score Formula

```
score = fearGreed × 0.4 + avgRSI × 0.3 + volumeAnomaly × 0.3
```

Weights redistribute automatically when data sources are unavailable.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun.js |
| Backend | Hono.js + TypeScript (strict) |
| Database | PostgreSQL + Drizzle ORM |
| Queue | Redis + BullMQ |
| Frontend | React 19 + Vite + TailwindCSS v4 |
| Monorepo | Bun workspaces |

## Project Structure

```
apps/
  api/                  # Hono.js backend (port 3001)
    src/
      db/schema/        # Drizzle ORM table definitions
      jobs/             # BullMQ workers (price crawler, fear & greed crawler)
      routes/           # API route handlers
      services/         # Business logic (score calculator, data fetchers)
      lib/              # Utilities (logger)
  web/                  # React frontend (port 5173)
    src/
      components/       # Dashboard UI components
      hooks/            # Custom React hooks
      lib/              # API client, formatting utilities
packages/
  shared/               # Shared types, constants, Zod schemas
```

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Docker](https://docker.com) (for Postgres + Redis)
- Or local PostgreSQL + Redis

### Setup

```bash
# Install dependencies
make install

# Start Postgres + Redis
make up

# Push database schema
make db-push

# Start API + frontend
make dev
```

The API runs on `http://localhost:4177` and the frontend on `http://localhost:5177`.

### Using Local PostgreSQL

If you have a local PostgreSQL instead of Docker, update `.env`:

```
DATABASE_URL=postgresql://youruser@localhost:5432/crowdpulse
```

Then create the database:

```bash
psql -d postgres -c "CREATE DATABASE crowdpulse;"
make db-push
```

## Available Commands

```
make help         # Show all commands
make dev          # Start everything (Docker + API + Web)
make dev-api      # Start API only
make dev-web      # Start frontend only
make db-push      # Push schema to database
make db-studio    # Open Drizzle Studio (DB browser)
make check        # Type-check all packages
make build        # Build frontend for production
make health       # Check API health
make dashboard    # Fetch dashboard data
make psql         # Open psql shell
make clean        # Remove build artifacts
make reset-db     # Drop and recreate database
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard` | Crowd Pulse Score + all components |

### Dashboard Response

```json
{
  "crowdPulse": { "score": 42.5, "signal": "NEUTRAL", "updatedAt": "..." },
  "components": {
    "fearGreed": { "value": 55, "classification": "Greed", "change24h": 3 },
    "rsi": { "avg": 58.2, "bySymbol": { "BTC": 62, "ETH": 55 } },
    "volume": { "avgChangePct": 12.5, "normalized": 62.5 }
  },
  "signals": [],
  "prices": { "BTC": { "price": 67000, "change1h": 0.5, "rsi": 62 } }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/crowdpulse` | PostgreSQL connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `API_PORT` | `4177` | API server port |

## Roadmap

- [x] Phase 1: Monorepo, price crawler, fear & greed, dashboard API, frontend skeleton
- [ ] Phase 2: Twitter + Reddit sentiment crawlers
- [ ] Phase 3: Google Trends, liquidation data, on-chain metrics
- [ ] Phase 4: Contrarian signal generator + historical accuracy tracking
- [ ] Phase 5: Real-time SSE, alerts, Telegram bot
- [ ] Phase 6: Docker production setup, GCP Cloud Run deploy, CI/CD
