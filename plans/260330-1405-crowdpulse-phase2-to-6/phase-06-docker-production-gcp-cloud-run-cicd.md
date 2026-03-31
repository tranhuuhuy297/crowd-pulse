# Phase 6: Docker Production Setup + GCP Cloud Run Deploy + CI/CD

## Context Links
- [docker-compose.yml](../../docker-compose.yml)
- [Makefile](../../Makefile)
- [API entry](../../apps/api/src/index.ts)
- [Web Vite app](../../apps/web/src/main.tsx)
- [Root package.json](../../package.json)

## Overview
- **Priority**: P2
- **Status**: pending
- **Effort**: 5h
- **Description**: Production-ready Docker images for API + web, GCP Cloud Run deployment with Cloud SQL (Postgres) + Memorystore (Redis), and GitHub Actions CI/CD pipeline.

## Key Insights

### Bun.js Docker Image
- Official `oven/bun:1-alpine` image (small, ~150MB)
- Multi-stage build: install deps -> build -> runtime (copy only needed files)
- Bun compiles TS natively, no separate build step for API
- Web app needs `vite build` -> static files served by API or separate nginx

### GCP Cloud Run Architecture
```
Cloud Run (API)         -> Cloud SQL (Postgres)
  |                     -> Memorystore Redis
  |-- serves /api/*
  |-- serves SSE /api/sse/*
  |-- BullMQ workers (same container)

Cloud Run (Web)         -> serves static Vite build
  OR: API serves static files from /dist (simpler, one container)
```

**Recommendation**: Single container serving both API + static frontend. Simpler, cheaper, fewer moving parts. Hono can serve static files via `hono/serve-static`.

### GCP Free Tier / Cost
- Cloud Run: 2M requests/month free, 360K vCPU-seconds free
- Cloud SQL: No free tier, ~$7/month for db-f1-micro
- Memorystore: No free tier, ~$15/month for basic 1GB
- **Alternative**: Use Neon (free Postgres) + Upstash (free Redis) to stay free
- Cloud Run min instances=0 for dev (cold starts OK), min=1 for prod

### CI/CD Pipeline
- GitHub Actions: lint -> typecheck -> build -> push Docker image -> deploy to Cloud Run
- Use Artifact Registry for Docker images (GCP)
- Deploy via `gcloud run deploy` in CI
- Separate staging + production environments via Cloud Run services

## Requirements

### Functional
- Multi-stage Dockerfile for combined API + web build
- Production docker-compose with Postgres + Redis + app
- GCP Cloud Run deployment with env vars from Secret Manager
- GitHub Actions: PR checks (lint + typecheck) + deploy on merge to main
- Health check endpoint already exists (`/api/health`)

### Non-Functional
- Docker image size < 200MB
- Cold start < 5s on Cloud Run
- Secrets never in Docker image or git
- Zero-downtime deployments (Cloud Run handles this)
- Automatic HTTPS (Cloud Run provides)

## Architecture

### Production Container Layout
```
Dockerfile (multi-stage):
  Stage 1: bun install (deps only, cached layer)
  Stage 2: bun install + copy source (API)
  Stage 3: vite build (web static)
  Stage 4: runtime - oven/bun:1-alpine
    /app/apps/api/       (API source)
    /app/apps/web/dist/  (static build)
    /app/packages/shared/
    /app/node_modules/
    CMD: bun run apps/api/src/index.ts
```

### GCP Infrastructure
```
GitHub Actions
  -> Build Docker image
  -> Push to Artifact Registry
  -> gcloud run deploy

Cloud Run Service: crowdpulse
  -> Env vars from Secret Manager:
     DATABASE_URL, REDIS_URL, TELEGRAM_BOT_TOKEN,
     REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET
  -> Min instances: 1 (prod), 0 (staging)
  -> Max instances: 3
  -> Memory: 512MB
  -> CPU: 1

External Services:
  -> Neon Postgres (free tier) OR Cloud SQL
  -> Upstash Redis (free tier) OR Memorystore
```

## Related Code Files

### Files to Modify
- `apps/api/src/index.ts` - add static file serving for production
- `apps/api/package.json` - add start script
- `docker-compose.yml` - add app service for local production testing
- `Makefile` - add docker build/push/deploy commands
- `package.json` - add build:all script
- `.gitignore` - ensure dist/ excluded

### Files to Create
- `Dockerfile` - multi-stage production build
- `Dockerfile.dev` - development build (optional, for consistency)
- `.dockerignore` - exclude node_modules, .env, .git, dist
- `.github/workflows/ci-lint-and-typecheck.yml` - PR checks
- `.github/workflows/cd-deploy-to-cloud-run.yml` - deploy on merge to main
- `apps/api/src/middleware/static-file-serving-middleware.ts` - serve web dist in production
- `scripts/gcp-initial-setup.sh` - one-time GCP project setup commands
- `.env.production.example` - production env var template

## Implementation Steps

### Step 1: Dockerfile (1h)
1. Create `.dockerignore`:
   ```
   node_modules
   .env*
   .git
   dist
   plans
   docs
   *.md
   ```
2. Create `Dockerfile`:
   ```dockerfile
   # Stage 1: Install dependencies
   FROM oven/bun:1-alpine AS deps
   WORKDIR /app
   COPY package.json bun.lock ./
   COPY apps/api/package.json apps/api/
   COPY apps/web/package.json apps/web/
   COPY packages/shared/package.json packages/shared/
   RUN bun install --frozen-lockfile --production

   # Stage 2: Build web frontend
   FROM oven/bun:1-alpine AS web-build
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN cd apps/web && bunx vite build

   # Stage 3: Runtime
   FROM oven/bun:1-alpine AS runtime
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY apps/api/ ./apps/api/
   COPY packages/shared/ ./packages/shared/
   COPY --from=web-build /app/apps/web/dist ./apps/web/dist
   COPY package.json ./

   ENV NODE_ENV=production
   EXPOSE 4177
   CMD ["bun", "run", "apps/api/src/index.ts"]
   ```
3. Test locally: `docker build -t crowdpulse . && docker run -p 4177:4177 crowdpulse`

### Step 2: Static File Serving (30min)
1. Create `static-file-serving-middleware.ts`:
   - In production, serve `apps/web/dist/` at `/` for non-API routes
   - Use Hono's `serveStatic` from `hono/bun`
   - SPA fallback: serve `index.html` for all non-API, non-static routes
2. Register in `index.ts` (only when `NODE_ENV=production`)

### Step 3: Production Docker Compose (30min)
1. Update `docker-compose.yml` with optional `app` service profile:
   ```yaml
   app:
     build: .
     ports: ["4177:4177"]
     environment:
       DATABASE_URL: postgresql://postgres:postgres@postgres:5432/crowdpulse
       REDIS_URL: redis://redis:6379
     depends_on: [postgres, redis]
     profiles: ["production"]
   ```
2. Add Makefile targets:
   - `make docker-build` - build production image
   - `make docker-run` - run full stack locally via docker-compose
   - `make docker-push` - push to Artifact Registry

### Step 4: GitHub Actions CI (1h)
1. Create `.github/workflows/ci-lint-and-typecheck.yml`:
   ```yaml
   name: CI
   on: [pull_request]
   jobs:
     check:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: oven-sh/setup-bun@v2
         - run: bun install
         - run: cd apps/api && bunx tsc --noEmit
         - run: cd apps/web && bunx tsc --noEmit
         - run: cd apps/web && bunx vite build
   ```
2. Create `.github/workflows/cd-deploy-to-cloud-run.yml`:
   ```yaml
   name: Deploy
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       permissions:
         contents: read
         id-token: write
       steps:
         - uses: actions/checkout@v4
         - uses: google-github-actions/auth@v2
           with:
             workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
             service_account: ${{ secrets.WIF_SA }}
         - uses: google-github-actions/setup-gcloud@v2
         - run: gcloud auth configure-docker $REGION-docker.pkg.dev
         - run: docker build -t $REGION-docker.pkg.dev/$PROJECT/$REPO/crowdpulse:$GITHUB_SHA .
         - run: docker push $REGION-docker.pkg.dev/$PROJECT/$REPO/crowdpulse:$GITHUB_SHA
         - run: |
             gcloud run deploy crowdpulse \
               --image $REGION-docker.pkg.dev/$PROJECT/$REPO/crowdpulse:$GITHUB_SHA \
               --region $REGION \
               --platform managed \
               --allow-unauthenticated \
               --min-instances 1 \
               --max-instances 3 \
               --memory 512Mi \
               --set-secrets DATABASE_URL=DATABASE_URL:latest,REDIS_URL=REDIS_URL:latest
       env:
         REGION: us-central1
         PROJECT: ${{ secrets.GCP_PROJECT_ID }}
         REPO: crowdpulse
   ```

### Step 5: GCP Setup Script (30min)
1. Create `scripts/gcp-initial-setup.sh`:
   - Enable required APIs (Cloud Run, Artifact Registry, Secret Manager)
   - Create Artifact Registry repo
   - Create secrets in Secret Manager
   - Set up Workload Identity Federation for GitHub Actions
   - Document Neon + Upstash setup (free alternatives to Cloud SQL + Memorystore)
2. Create `.env.production.example` documenting all required env vars

### Step 6: Makefile Updates (30min)
1. Add targets:
   ```makefile
   docker-build:  ## Build production Docker image
   docker-run:    ## Run full stack in Docker
   docker-push:   ## Push image to Artifact Registry
   deploy:        ## Deploy to Cloud Run
   ```
2. Update `help` target

### Step 7: Testing (30min)
1. Build Docker image locally, verify size < 200MB
2. Run with docker-compose production profile
3. Verify API + frontend served from single container
4. Verify health check passes
5. Test CI workflow on a PR branch

## Todo List

- [ ] Create .dockerignore
- [ ] Create Dockerfile (multi-stage)
- [ ] Create static-file-serving-middleware.ts
- [ ] Integrate static serving in index.ts (production only)
- [ ] Update docker-compose.yml with app service
- [ ] Create .github/workflows/ci-lint-and-typecheck.yml
- [ ] Create .github/workflows/cd-deploy-to-cloud-run.yml
- [ ] Create scripts/gcp-initial-setup.sh
- [ ] Create .env.production.example
- [ ] Add docker/deploy targets to Makefile
- [ ] Test Docker build locally
- [ ] Test full stack in Docker
- [ ] Verify image size < 200MB
- [ ] Test CI workflow on PR

## Success Criteria

- Docker image builds successfully, size < 200MB
- Single container serves API + frontend
- docker-compose runs full stack locally (app + postgres + redis)
- GitHub Actions CI runs on PRs (typecheck + build)
- GitHub Actions CD deploys to Cloud Run on merge to main
- Health check passes in production
- SSE works through Cloud Run (requires HTTP/2)
- All env vars managed via Secret Manager (none in image)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Cloud Run SSE timeout (default 5min) | Medium | High | Set timeout to 3600s; client auto-reconnects |
| BullMQ workers in Cloud Run (scaling) | Medium | Medium | Single instance with min=1; workers run in-process |
| Cold start latency | Low | Medium | Min instances=1 for prod eliminates cold starts |
| GCP costs exceed budget | Medium | Medium | Use Neon + Upstash free tiers; Cloud Run free tier generous |
| Bun Docker image compatibility | Low | Low | Official oven/bun image well-maintained |

## Security Considerations
- No secrets in Docker image or git
- GCP Secret Manager for all credentials
- Workload Identity Federation (no service account key files)
- HTTPS automatic via Cloud Run
- `.dockerignore` excludes .env files, plans, docs
- Cloud Run IAM controls access

## Next Steps
- Monitor costs after deployment
- Add staging environment (separate Cloud Run service)
- Consider Cloud Run Jobs for heavy crawl tasks if needed
- Add monitoring/alerting via GCP Cloud Monitoring
