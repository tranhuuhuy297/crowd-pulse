# CrowdPulse Phase 1 - Research & Planning Report

## Research Findings

### Hono.js + Bun
- Native Bun support via `export default app` pattern
- `serveStatic` from `hono/bun` for static files
- Middleware via `app.use()` with `await next()` pattern
- Context object `c` provides `json()`, `text()`, `html()` response helpers

### Drizzle ORM + PostgreSQL
- Schema defined with `pgTable()` from `drizzle-orm/pg-core`
- Types auto-inferred via `$inferSelect` / `$inferInsert`
- `drizzle-kit push` for dev, `drizzle-kit generate` for production migrations
- Connection via `node-postgres` Pool (compatible with Bun)

### BullMQ + Bun
- Requires `ioredis` (not native Redis client)
- `upsertJobScheduler` replaces deprecated `repeat` option for repeatable jobs
- Worker + Queue share connection instance
- Exponential backoff via `backoff: { type: 'exponential', delay: 1000 }`

### React + Vite + TailwindCSS v4
- TailwindCSS v4 uses `@tailwindcss/vite` plugin (no postcss config)
- CSS entry: `@import "tailwindcss";`
- Bun works as drop-in replacement for npm in Vite projects

### Gauge Chart
- Recommend simple SVG semicircle gauge (no external dependency)
- Alternative: `react-gauge-chart` (~5KB) if SVG is too complex
- Avoid heavy charting libs for a single gauge component

## Plan Created

6 phases, ~12h total effort. See plan directory for details.

| Phase | File | Effort |
|-------|------|--------|
| Monorepo & Dev Environment | phase-01-monorepo-setup.md | 2h |
| Database Schema & Migrations | phase-02-database-schema.md | 2h |
| Price Crawler (Binance) | phase-03-price-crawler.md | 2.5h |
| Fear & Greed Crawler | phase-04-fear-greed-crawler.md | 1h |
| Dashboard API Endpoint | phase-05-dashboard-api.md | 2h |
| Frontend Dashboard Skeleton | phase-06-frontend-dashboard.md | 2.5h |

## Key Decisions
- **BullMQ workers in same process as API** (Phase 1 simplicity; split later if needed)
- **SVG gauge over charting library** (YAGNI; one gauge doesn't justify a dependency)
- **No React Query** (simple useState + setInterval for Phase 1; KISS)
- **Drizzle push for dev** (no migration files needed until production)
- **Crowd Pulse Score formula:** Fear/Greed 40% + RSI 30% + Volume 30%

## Unresolved Questions
- None blocking Phase 1 implementation
