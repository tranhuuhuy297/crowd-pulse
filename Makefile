.PHONY: install dev dev-api dev-web up down kill db-push db-studio db-generate logs logs-api check build clean reset-db psql redis-cli health dashboard docker-build docker-run docker-stop docker-push

# ─── Setup ───────────────────────────────────────────────────────────
install: ## Install all dependencies
	bun install

up: ## Start Postgres + Redis containers
	docker-compose up -d

down: ## Stop Postgres + Redis containers
	docker-compose down

# ─── Development ─────────────────────────────────────────────────────
kill: ## Kill processes on API and Web ports
	-lsof -ti:4177 | xargs kill -9 2>/dev/null || true
	-lsof -ti:5177 | xargs kill -9 2>/dev/null || true

dev: kill up ## Start API + Web in parallel (also starts Docker)
	bun run dev:all

dev-api: kill up ## Start API only
	bun run dev:api

dev-web: ## Start Web only
	bun run dev:web

# ─── Database ────────────────────────────────────────────────────────
db-push: ## Push Drizzle schema to database
	bun run db:push

db-generate: ## Generate Drizzle migration files
	bun run db:generate

db-studio: ## Open Drizzle Studio (DB browser)
	bun run db:studio

psql: ## Open psql shell to crowdpulse database
	psql -d crowdpulse

reset-db: ## Drop and recreate database (DESTRUCTIVE)
	psql -d postgres -c "DROP DATABASE IF EXISTS crowdpulse;"
	psql -d postgres -c "CREATE DATABASE crowdpulse;"
	bun run db:push

# ─── Build & Check ──────────────────────────────────────────────────
check: ## Type-check all packages
	cd apps/api && bunx tsc --noEmit
	cd apps/web && bunx tsc --noEmit

build: ## Build frontend for production
	cd apps/web && bunx vite build

# ─── Monitoring ──────────────────────────────────────────────────────
health: ## Check API health endpoint
	@curl -s http://localhost:4177/api/health | bun -e "process.stdin.pipe(process.stdout)"

dashboard: ## Fetch dashboard data (pretty print)
	@curl -s http://localhost:4177/api/dashboard | bun -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.stringify(JSON.parse(d),null,2)))"

logs: ## Tail Docker container logs
	docker-compose logs -f

redis-cli: ## Open Redis CLI
	docker-compose exec redis redis-cli

# ─── Docker (Production) ─────────────────────────────────────────────────────
docker-build: ## Build production Docker image
	docker build -t crowdpulse .

docker-run: ## Run full production stack locally (app + postgres + redis)
	docker compose -f docker-compose.prod.yml up --build

docker-stop: ## Stop production Docker stack
	docker compose -f docker-compose.prod.yml down

docker-push: ## Push image to GCP Artifact Registry (requires GCP_PROJECT_ID and REGION env vars)
	docker tag crowdpulse $(REGION)-docker.pkg.dev/$(GCP_PROJECT_ID)/crowdpulse/crowdpulse:latest
	docker push $(REGION)-docker.pkg.dev/$(GCP_PROJECT_ID)/crowdpulse/crowdpulse:latest

# ─── Cleanup ─────────────────────────────────────────────────────────
clean: ## Remove build artifacts and node_modules
	rm -rf apps/web/dist apps/api/dist node_modules apps/*/node_modules packages/*/node_modules

# ─── Help ────────────────────────────────────────────────────────────
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
