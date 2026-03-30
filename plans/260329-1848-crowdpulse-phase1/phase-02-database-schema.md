# Phase 2: Database Schema & Migrations

## Context Links
- [Plan Overview](./plan.md)
- [Phase 1: Monorepo](./phase-01-monorepo-setup.md)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/get-started/postgresql-new)

## Overview
- **Priority:** P1 (blocks crawlers + API)
- **Status:** pending
- **Effort:** 2h
- **Description:** Drizzle ORM schema for all Phase 1 tables. Generate and run migrations.

## Requirements

### Functional
- Tables: price_candles, fear_greed_index, crowd_pulse, signals
- Placeholder tables (empty for Phase 1): users, social_posts, google_trends, liquidation_data, onchain_metrics, user_alerts
- Indexes on timestamp + symbol columns for query performance
- Type-safe schema with inferred TypeScript types

### Non-functional
- Migrations via drizzle-kit
- Connection pooling via pg Pool
- Schema modularized by domain (market, sentiment, user)

## Architecture

### Table Design

**price_candles** (core - Phase 1 active)
| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| symbol | varchar(20) | BTC, ETH, SOL, BNB |
| interval | varchar(10) | 1m, 5m, 1h, 1d |
| open_time | timestamp | Candle open time |
| open | numeric(18,8) | |
| high | numeric(18,8) | |
| low | numeric(18,8) | |
| close | numeric(18,8) | |
| volume | numeric(24,8) | |
| close_time | timestamp | |
| rsi | numeric(8,4) | Calculated RSI-14 |
| volume_change_pct | numeric(8,4) | vs prev candle |
| price_change_pct | numeric(8,4) | vs prev candle |
| created_at | timestamp | default now() |

**fear_greed_index** (core - Phase 1 active)
| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| value | integer | 0-100 |
| value_classification | varchar(50) | "Extreme Fear", etc |
| timestamp | timestamp | API timestamp |
| change_24h | numeric(8,4) | Calculated |
| created_at | timestamp | default now() |

**crowd_pulse** (core - Phase 1 active)
| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| symbol | varchar(20) | nullable (overall) |
| score | numeric(5,2) | 0-100 |
| components | jsonb | Breakdown of inputs |
| signal | varchar(20) | STRONG_BUY to STRONG_SELL |
| created_at | timestamp | default now() |

**signals** (core - Phase 1 active)
| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| symbol | varchar(20) | |
| type | varchar(50) | RSI_OVERSOLD, EXTREME_FEAR, etc |
| severity | varchar(20) | low, medium, high, critical |
| message | text | Human-readable |
| metadata | jsonb | Supporting data |
| is_active | boolean | default true |
| created_at | timestamp | default now() |
| resolved_at | timestamp | nullable |

**Placeholder tables** (schema only, no data in Phase 1):
- users, social_posts, google_trends, liquidation_data, onchain_metrics, user_alerts

## Related Code Files

### Create
- `apps/api/src/db/connection.ts` - Pool + drizzle instance
- `apps/api/src/db/schema/market-schema.ts` - price_candles
- `apps/api/src/db/schema/sentiment-schema.ts` - fear_greed_index, crowd_pulse, signals
- `apps/api/src/db/schema/user-schema.ts` - users, user_alerts (placeholder)
- `apps/api/src/db/schema/social-schema.ts` - social_posts, google_trends, liquidation_data, onchain_metrics (placeholder)
- `apps/api/src/db/schema/index.ts` - Re-export all schemas
- `apps/api/drizzle.config.ts` - Drizzle kit config

## Implementation Steps

1. **Create db/connection.ts:**
   ```typescript
   import { drizzle } from 'drizzle-orm/node-postgres'
   import { Pool } from 'pg'
   import * as schema from './schema'

   const pool = new Pool({ connectionString: process.env.DATABASE_URL })
   export const db = drizzle(pool, { schema, logger: process.env.NODE_ENV === 'development' })
   ```

2. **Create market-schema.ts:** price_candles with composite unique index on (symbol, interval, open_time)

3. **Create sentiment-schema.ts:** fear_greed_index (unique on timestamp), crowd_pulse, signals

4. **Create user-schema.ts:** Minimal users table (id, email, name, google_id, created_at). user_alerts (id, user_id, symbol, condition, threshold, is_active, created_at)

5. **Create social-schema.ts:** Placeholder tables with basic structure

6. **Create schema/index.ts:** Re-export all tables

7. **Create drizzle.config.ts:**
   ```typescript
   import { defineConfig } from 'drizzle-kit'
   export default defineConfig({
     schema: './src/db/schema/index.ts',
     out: './drizzle',
     dialect: 'postgresql',
     dbCredentials: { url: process.env.DATABASE_URL! },
   })
   ```

8. **Generate migration:** `bunx drizzle-kit generate --name initial-schema`

9. **Create migration runner:** `apps/api/src/db/migrate.ts`

10. **Run migration:** `bunx drizzle-kit push` (dev) or run migrate.ts

## Todo List

- [ ] db/connection.ts with Pool
- [ ] market-schema.ts (price_candles)
- [ ] sentiment-schema.ts (fear_greed, crowd_pulse, signals)
- [ ] user-schema.ts (placeholder)
- [ ] social-schema.ts (placeholder)
- [ ] schema/index.ts re-exports
- [ ] drizzle.config.ts
- [ ] Generate initial migration
- [ ] Push schema to dev DB
- [ ] Verify tables exist via psql

## Success Criteria
- `bunx drizzle-kit push` creates all tables without errors
- `\dt` in psql shows all tables
- TypeScript types inferred correctly from schema
- Unique indexes prevent duplicate candles

## Risk Assessment
- **numeric precision:** Using numeric(18,8) for prices handles crypto precision
- **jsonb for components:** Flexible for evolving crowd pulse calculation; avoid over-querying

## Security Considerations
- DATABASE_URL from env, never hardcoded
- Connection pooling limits prevent exhaustion
