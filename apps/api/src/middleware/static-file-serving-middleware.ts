/**
 * Static file serving middleware for production builds.
 * Serves the Vite-built frontend from apps/web/dist.
 * SPA fallback ensures React Router client-side routing works.
 * Only active when NODE_ENV=production.
 */
import type { Hono } from "hono";
import { serveStatic } from "hono/bun";

/**
 * Register static file serving routes on the given Hono app.
 * Must be called AFTER all /api/* routes to avoid shadowing them.
 *
 * In the Docker container layout:
 *   /app/apps/api/src/index.ts  (this file's runtime location)
 *   /app/apps/web/dist/         (built frontend assets)
 * Relative path from api working dir: ../../apps/web/dist -> ../web/dist
 */
export function registerStaticFileServingMiddleware(app: Hono): void {
  if (process.env.NODE_ENV !== "production") return;

  const distRoot = "../web/dist";

  // Serve static assets (JS, CSS, images, etc.)
  app.use("/*", serveStatic({ root: distRoot }));

  // SPA fallback — serve index.html for all unmatched routes
  // so client-side routing (React Router) works correctly
  app.get("*", serveStatic({ path: `${distRoot}/index.html` }));
}
