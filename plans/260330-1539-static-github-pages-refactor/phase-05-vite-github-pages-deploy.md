# Phase 5: Vite Config + GitHub Pages Deployment

## Context Links
- Current vite config: `apps/web/vite.config.ts`
- Current package.json: `apps/web/package.json`

## Overview
- **Priority:** Medium
- **Status:** pending
- **Description:** Configure Vite for static build with GitHub Pages base path. Create GitHub Actions workflow for automatic deployment.

## Key Insights
- GitHub Pages serves from `https://<user>.github.io/<repo>/` -- needs `base: "/<repo>/"` in Vite
- Remove proxy config (no backend)
- GitHub Actions `peaceiris/actions-gh-pages` is the standard action for gh-pages deployment
- Build output goes to `apps/web/dist/`
- Monorepo: workflow must install deps at root then build web app

## Requirements
**Functional:**
- Vite config: set `base` to repo name for GH Pages (configurable via env var)
- Remove server proxy config
- GitHub Actions workflow: checkout -> install -> build -> deploy to gh-pages branch
- 404.html for SPA routing (copy index.html as 404.html)

**Non-functional:**
- Build must work with `bun install && bun run build` from monorepo root
- Deploy only on push to main branch

## Architecture
```
.github/workflows/deploy-gh-pages.yml
apps/web/vite.config.ts (updated)
```

## Related Code Files
**Modify:**
- `apps/web/vite.config.ts` -- add base path, remove proxy
- `apps/web/package.json` -- remove `@crowdpulse/shared` dep if no longer needed

**Create:**
- `.github/workflows/deploy-gh-pages.yml`

## Implementation Steps

1. **Update `apps/web/vite.config.ts`:**
   ```ts
   export default defineConfig({
     base: process.env.VITE_BASE_PATH || "/contrarian-thinking/",
     plugins: [react(), tailwindcss()],
     server: { port: 5177 },
     build: { outDir: "dist" },
   });
   ```

2. **Create `.github/workflows/deploy-gh-pages.yml`:**
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
     workflow_dispatch:
   permissions:
     contents: read
     pages: write
     id-token: write
   concurrency:
     group: "pages"
     cancel-in-progress: true
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: oven-sh/setup-bun@v2
         - run: bun install
         - run: bun run --cwd apps/web build
         - run: cp apps/web/dist/index.html apps/web/dist/404.html
         - uses: actions/configure-pages@v4
         - uses: actions/upload-pages-artifact@v3
           with:
             path: apps/web/dist
         - uses: actions/deploy-pages@v4
   ```

3. **Add build script** to root `package.json` if not exists:
   ```json
   "scripts": { "build:web": "bun run --cwd apps/web build" }
   ```

## Todo List
- [ ] Update vite.config.ts (base path, remove proxy)
- [ ] Create GitHub Actions workflow
- [ ] Add 404.html copy step for SPA routing
- [ ] Test local build with `bun run build`
- [ ] Verify dist output is correct

## Success Criteria
- `bun run build` produces static files in `apps/web/dist/`
- GitHub Actions workflow deploys on push to main
- App loads at `https://<user>.github.io/contrarian-thinking/`
- SPA routing works (404.html fallback)

## Risk Assessment
- **Low.** Standard GitHub Pages deployment pattern.
- Base path issues: assets must use relative paths or respect `base` config.

## Security Considerations
- No secrets needed in workflow (public repo, public APIs)
- If private repo: needs `GITHUB_TOKEN` (auto-provided)

## Next Steps
- Phase 6 cleans up dead code and updates README
