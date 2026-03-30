# Phase 1: Monorepo & Dev Environment

## Context Links
- [Plan Overview](./plan.md)
- [Bun Workspaces Docs](https://bun.sh/docs/install/workspaces)

## Overview
- **Priority:** P1 (blocking all other phases)
- **Status:** pending
- **Effort:** 2h
- **Description:** Scaffold Bun monorepo with apps/api, apps/web, packages/shared. Docker Compose for Postgres + Redis.

## Requirements

### Functional
- Bun workspaces with 3 packages
- Shared TypeScript config (strict mode)
- Docker Compose for Postgres 16 + Redis 7
- Environment variable management via .env
- Dev scripts: `bun dev:api`, `bun dev:web`, `bun dev:all`

### Non-functional
- All packages use same TypeScript strict config
- Hot reload for both api and web in dev

## Architecture

```
contrarian-thinking/
  package.json              # Root workspace config
  tsconfig.base.json        # Shared TS config (strict)
  docker-compose.yml        # Postgres + Redis
  .env.example              # Template
  .gitignore
  apps/
    api/
      package.json
      tsconfig.json          # Extends base
      src/
        index.ts             # Hono entry point
    web/
      package.json
      tsconfig.json
      vite.config.ts
      index.html
      src/
        main.tsx
        app.tsx
  packages/
    shared/
      package.json
      tsconfig.json
      src/
        index.ts
        types/
          index.ts           # Shared types
        constants/
          index.ts           # Symbols, intervals
        schemas/
          index.ts           # Zod schemas
```

## Related Code Files

### Create
- `/package.json` - root workspace
- `/tsconfig.base.json`
- `/docker-compose.yml`
- `.env.example`
- `.gitignore`
- `apps/api/package.json`
- `apps/api/tsconfig.json`
- `apps/api/src/index.ts`
- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/vite.config.ts`
- `apps/web/index.html`
- `apps/web/src/main.tsx`
- `apps/web/src/app.tsx`
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/index.ts`
- `packages/shared/src/types/index.ts`
- `packages/shared/src/constants/index.ts`
- `packages/shared/src/schemas/index.ts`

## Implementation Steps

1. **Create root package.json** with Bun workspaces:
   ```json
   {
     "name": "contrarian-thinking",
     "private": true,
     "workspaces": ["apps/*", "packages/*"],
     "scripts": {
       "dev:api": "bun --filter apps/api dev",
       "dev:web": "bun --filter apps/web dev",
       "dev:all": "bun run --parallel dev:api dev:web"
     }
   }
   ```

2. **Create tsconfig.base.json** with strict mode, paths, module resolution "bundler"

3. **Create docker-compose.yml:**
   - Postgres 16: port 5432, volume `pgdata`, db=crowdpulse
   - Redis 7: port 6379, volume `redisdata`

4. **Scaffold apps/api:**
   - Dependencies: `hono`, `drizzle-orm`, `pg`, `bullmq`, `ioredis`, `pino`, `zod`, `dotenv`
   - Dev: `drizzle-kit`, `@types/pg`
   - Entry: Hono app on port 3001 with health check `/api/health`

5. **Scaffold apps/web:**
   - `bun create vite apps/web --template react-ts`
   - Add TailwindCSS v4: `@tailwindcss/vite`, `tailwindcss`
   - Vite config: proxy `/api` to localhost:3001
   - Basic App component with "CrowdPulse" title

6. **Scaffold packages/shared:**
   - Export types: `CrowdPulseScore`, `PriceCandle`, `FearGreedEntry`, `Signal`
   - Export constants: `TRACKED_SYMBOLS`, `INTERVALS`
   - Export Zod schemas for API responses

7. **Create .env.example:**
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crowdpulse
   REDIS_URL=redis://localhost:6379
   API_PORT=3001
   ```

8. **Create .gitignore** (node_modules, .env, dist, drizzle)

9. **Run `bun install`**, verify workspaces resolve

10. **Run `docker compose up -d`**, verify Postgres + Redis

11. **Run `bun dev:api`** and `bun dev:web`**, verify health check + React app

## Todo List

- [ ] Root package.json with workspaces
- [ ] tsconfig.base.json (strict)
- [ ] docker-compose.yml (Postgres + Redis)
- [ ] apps/api scaffold (Hono entry)
- [ ] apps/web scaffold (Vite + React + Tailwind)
- [ ] packages/shared scaffold (types, constants, schemas)
- [ ] .env.example + .gitignore
- [ ] `bun install` succeeds
- [ ] Docker services start
- [ ] Health check responds 200
- [ ] React app renders

## Success Criteria
- `bun install` resolves all workspaces without errors
- `docker compose up -d` starts Postgres + Redis
- `bun dev:api` serves health check at localhost:3001/api/health
- `bun dev:web` serves React app at localhost:5173
- `packages/shared` types importable from both apps

## Risk Assessment
- **Bun workspace resolution**: Bun workspaces are stable; use `workspace:*` protocol for local deps
- **TailwindCSS v4**: New Vite plugin approach; use `@tailwindcss/vite` plugin (no postcss config needed)

## Security Considerations
- .env excluded from git
- Docker volumes for data persistence
- No secrets in docker-compose (dev only)
