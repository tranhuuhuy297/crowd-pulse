# Stage 1: Install dependencies (cached layer for faster rebuilds)
FROM oven/bun:1-alpine AS deps
WORKDIR /app

# Copy package manifests only for dependency install caching
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

# Install all deps (including dev — needed for vite build in next stage)
RUN bun install --frozen-lockfile

# Stage 2: Build web frontend (Vite)
FROM oven/bun:1-alpine AS web-build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source files needed for build
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY package.json ./

RUN cd apps/web && bunx vite build

# Stage 3: Production runtime — lean image with no dev deps
FROM oven/bun:1-alpine AS production
WORKDIR /app

# Copy workspace package manifests for bun to resolve workspace refs
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Copy production node_modules only
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy API and shared source
COPY apps/api/ ./apps/api/
COPY packages/shared/ ./packages/shared/

# Copy built frontend assets from web-build stage
COPY --from=web-build /app/apps/web/dist ./apps/web/dist

ENV NODE_ENV=production
EXPOSE 4177

CMD ["bun", "run", "apps/api/src/index.ts"]
