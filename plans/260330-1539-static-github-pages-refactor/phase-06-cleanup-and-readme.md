# Phase 6: Cleanup & README

## Context Links
- Plan overview: `./plan.md`
- All previous phases

## Overview
- **Priority:** Low
- **Status:** pending
- **Description:** Remove dead code, unused deps, old hooks/clients. Update README for static deployment.

## Key Insights
- `apps/api/` becomes entirely unused -- don't delete yet (separate decision), but remove from build scripts
- `@crowdpulse/shared` package may still be useful for constants (TRACKED_SYMBOLS, API URLs)
- Old hooks, API client, and deleted components should be confirmed gone

## Requirements
**Functional:**
- Remove old hooks: `use-dashboard-sse-stream.ts`, `use-dashboard-polling-data.ts`
- Remove old API client: `dashboard-api-client.ts`
- Remove `@crowdpulse/shared` dependency from web package.json if unused
- Copy needed constants (TRACKED_SYMBOLS, BINANCE_BASE_URL, etc.) to `apps/web/src/lib/constants.ts`
- Update README with: what it does, how to run locally, how deployment works

**Non-functional:**
- No unused imports, no dead files
- Clean TypeScript compilation

## Related Code Files
**Delete:**
- `apps/web/src/hooks/use-dashboard-sse-stream.ts`
- `apps/web/src/hooks/use-dashboard-polling-data.ts`
- `apps/web/src/lib/dashboard-api-client.ts`

**Create:**
- `apps/web/src/lib/constants.ts` (copy from shared)

**Modify:**
- `apps/web/package.json` -- remove `@crowdpulse/shared` dep
- `README.md` -- update for static app

## Implementation Steps

1. Delete old hook files and API client
2. Copy constants from `packages/shared/src/constants/tracked-symbols.ts` to `apps/web/src/lib/constants.ts`
3. Update all imports across web app: `@crowdpulse/shared` -> local imports
4. Remove `@crowdpulse/shared` from `apps/web/package.json`
5. Run `tsc --noEmit` to verify clean compilation
6. Run `bun run build` to verify build works
7. Update README.md:
   - What CrowdPulse is
   - Data sources (Fear & Greed, Binance spot, Binance Futures)
   - Score formula
   - How to run locally (`bun install && bun run dev`)
   - How deployment works (push to main -> GitHub Actions -> gh-pages)

## Todo List
- [ ] Delete old hooks and API client
- [ ] Create local constants file
- [ ] Update all imports from shared to local
- [ ] Remove shared dependency
- [ ] Verify TypeScript compilation
- [ ] Verify build output
- [ ] Update README

## Success Criteria
- Zero references to `@crowdpulse/shared` in web app
- Zero references to `/api/` endpoints in web app
- Clean `tsc --noEmit` and `bun run build`
- README accurately describes static app

## Risk Assessment
- **Low.** Cleanup only, no logic changes.

## Security Considerations
- Ensure no API keys or secrets accidentally remain in codebase

## Next Steps
- Deploy and verify live site
- Consider future: add localStorage caching, PWA support, dark/light theme
