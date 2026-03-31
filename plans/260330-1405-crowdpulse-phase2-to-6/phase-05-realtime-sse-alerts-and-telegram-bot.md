# Phase 5: Real-time SSE + Alerts + Telegram Bot

## Context Links
- [Hono app entry](../../apps/api/src/index.ts)
- [Dashboard polling hook](../../apps/web/src/hooks/use-dashboard-polling-data.ts)
- [User alerts schema](../../apps/api/src/db/schema/user-alerts-schema.ts)
- [Dashboard API routes](../../apps/api/src/routes/dashboard-api-routes.ts)
- [Contrarian signal evaluator](phase-04-contrarian-signal-generator-and-accuracy-tracking.md)

## Overview
- **Priority**: P2
- **Status**: pending
- **Effort**: 6h
- **Description**: Replace frontend polling with Server-Sent Events (SSE) for live score updates. Add user-configurable alerts (score thresholds, price levels). Build Telegram bot that pushes contrarian signals and responds to commands.

## Key Insights

### SSE in Hono.js
- Hono has built-in SSE helper: `import { streamSSE } from 'hono/streaming'`
- Server pushes events; client uses native `EventSource` API
- Much simpler than WebSocket for one-way data flow
- Reconnects automatically on disconnect
- Pattern: backend publishes to an in-memory event bus; SSE handler subscribes

### Telegram Bot API (Free)
- Create bot via @BotFather on Telegram (instant, free)
- `grammy` npm package: lightweight, TypeScript-first Telegram bot framework
- Works with Bun.js (uses standard fetch)
- Long polling mode (no webhook needed for dev); webhook for production
- Commands: `/status`, `/subscribe`, `/unsubscribe`, `/alerts`

### Alert Architecture
- `userAlerts` table already exists in schema with: userId, symbol, condition, threshold, channel
- Alert evaluation runs after each score computation
- Channels: `web` (SSE push), `telegram` (bot message)
- Keep alert checking lightweight — runs in same process, no separate queue needed

## Requirements

### Functional
- **SSE**: Live dashboard updates pushed every 60s (replacing client polling)
- **SSE**: Push immediate notification when contrarian signal fires
- **Alerts**: Users configure threshold alerts (score > X, price < Y)
- **Alerts**: Evaluate after each crawl cycle; fire via SSE or Telegram
- **Telegram**: Bot responds to `/status` (current score + signal)
- **Telegram**: `/subscribe` to auto-receive contrarian signals
- **Telegram**: `/unsubscribe` to stop receiving signals
- **Telegram**: `/help` command listing

### Non-Functional
- SSE connections cleaned up on client disconnect
- Telegram bot graceful shutdown (stop polling)
- Max 100 concurrent SSE connections (backpressure)
- Alert deduplication: don't re-fire same alert within 1h

## Architecture

```
Score Computation (after crawl)
  -> event-bus.ts (in-memory EventEmitter)
    -> SSE handler pushes to connected clients
    -> alert-evaluator.ts checks thresholds
      -> web alerts -> event-bus -> SSE
      -> telegram alerts -> telegram-notification-sender.ts

Telegram Bot (separate listener):
  -> grammy bot.start() long polling
  -> Command handlers -> query DB -> respond

Frontend:
  -> EventSource('/api/sse/dashboard')
  -> useDashboardSSE() hook replaces useDashboardData() polling
```

### Event Bus
Simple `EventEmitter` singleton. Events:
- `dashboard:update` — full dashboard data payload
- `signal:new` — contrarian signal fired
- `alert:triggered` — user alert threshold crossed

## Schema Changes

### Modify `user_alerts` table
Add columns for Telegram integration:
```typescript
telegramChatId: varchar("telegram_chat_id", { length: 50 }),
lastFiredAt: timestamp("last_fired_at", { withTimezone: true }), // for dedup
```

### New: `telegram_subscribers` table
```typescript
export const telegramSubscribers = pgTable("telegram_subscribers", {
  id: serial("id").primaryKey(),
  chatId: varchar("chat_id", { length: 50 }).notNull().unique(),
  username: varchar("username", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true }).notNull().defaultNow(),
});
```

## Related Code Files

### Files to Modify
- `apps/api/src/index.ts` - register SSE route, start Telegram bot, update shutdown
- `apps/api/src/db/schema/user-alerts-schema.ts` - add telegram columns
- `apps/api/src/db/schema/index.ts` - export telegramSubscribers
- `apps/api/src/services/dashboard-data-aggregator.ts` - emit events after computation
- `apps/api/src/jobs/bullmq-queue-manager.ts` - no changes (alerts are synchronous)
- `apps/api/package.json` - add grammy
- `apps/web/src/app.tsx` - switch from polling to SSE hook
- `apps/web/src/hooks/use-dashboard-polling-data.ts` - deprecate or keep as fallback
- `.env.example` - add TELEGRAM_BOT_TOKEN

### Files to Create
- `apps/api/src/lib/event-bus-instance.ts` - EventEmitter singleton
- `apps/api/src/routes/sse-dashboard-stream-route.ts` - SSE endpoint
- `apps/api/src/services/alert-threshold-evaluator.ts` - check alerts after score update
- `apps/api/src/services/alert-db-service.ts` - CRUD for user alerts
- `apps/api/src/services/telegram-bot-instance.ts` - grammy bot setup + command handlers
- `apps/api/src/services/telegram-notification-sender.ts` - push messages to subscribers
- `apps/api/src/services/telegram-subscribers-db-service.ts` - manage subscriber list
- `apps/api/src/db/schema/telegram-subscribers-schema.ts` - table definition
- `apps/api/src/routes/alerts-api-routes.ts` - CRUD endpoints for user alerts
- `apps/web/src/hooks/use-dashboard-sse-stream.ts` - EventSource hook replacing polling
- `apps/web/src/components/alert-configuration-panel.tsx` - alert setup UI

## Implementation Steps

### Step 1: Event Bus (30min)
1. Create `event-bus-instance.ts`
   - `EventEmitter` singleton with typed events
   - Methods: `emitDashboardUpdate(data)`, `emitNewSignal(signal)`, `emitAlert(alert)`
   - Max listeners set to 150 (100 SSE + buffer)
2. Integrate into `dashboard-data-aggregator.ts`:
   - After computing dashboard data, `eventBus.emitDashboardUpdate(data)`
   - After signal evaluator fires, `eventBus.emitNewSignal(signal)`

### Step 2: SSE Endpoint (1h)
1. Create `sse-dashboard-stream-route.ts`
   - `GET /api/sse/dashboard`
   - Use Hono's `streamSSE()` helper
   - Subscribe to event bus `dashboard:update` and `signal:new`
   - Track active connections count, reject if >100
   - Clean up listener on client disconnect
   - Send initial data immediately on connect (client doesn't wait for next cycle)
2. Register route in `index.ts`

### Step 3: Frontend SSE Hook (1h)
1. Create `use-dashboard-sse-stream.ts`
   - `EventSource` connection to `/api/sse/dashboard`
   - Parse incoming events, update React state
   - Auto-reconnect with exponential backoff
   - Fallback to polling if SSE fails (keep old hook as backup)
2. Update `app.tsx` to use SSE hook
3. Add connection status indicator (connected/reconnecting)

### Step 4: Telegram Bot (1.5h)
1. `cd apps/api && bun add grammy`
2. Create `telegram-bot-instance.ts`:
   - Initialize Bot with `TELEGRAM_BOT_TOKEN`
   - Command handlers:
     - `/start` - welcome message + instructions
     - `/status` - fetch current CrowdPulse score + signal
     - `/subscribe` - add chatId to `telegram_subscribers`
     - `/unsubscribe` - set `isActive = false`
     - `/help` - command listing
   - Start in long polling mode
3. Create `telegram-subscribers-db-service.ts`:
   - `addSubscriber(chatId, username)`
   - `removeSubscriber(chatId)`
   - `getActiveSubscribers()`
4. Create `telegram-subscribers-schema.ts`
5. Start bot in `index.ts`, add to shutdown handler

### Step 5: Telegram Signal Notifications (30min)
1. Create `telegram-notification-sender.ts`:
   - Subscribe to event bus `signal:new`
   - Fetch all active subscribers
   - Send formatted message: signal type, score, confidence, BTC price
   - Handle send failures gracefully (log, don't crash)
   - Rate limit: max 30 messages/sec (Telegram limit)
2. Initialize in `index.ts`

### Step 6: Alert System (1h)
1. Create `alert-threshold-evaluator.ts`:
   - After each dashboard update, check all active alerts
   - Conditions: `score_above`, `score_below`, `price_above`, `price_below`
   - Dedup: skip if `lastFiredAt` < 1h ago
   - Fire via appropriate channel (SSE event or Telegram message)
   - Update `lastFiredAt` in DB
2. Create `alert-db-service.ts`:
   - `createAlert(data)`, `getActiveAlerts()`, `updateAlert()`, `deleteAlert()`
3. Create `alerts-api-routes.ts`:
   - `POST /api/alerts` - create alert
   - `GET /api/alerts` - list user alerts
   - `DELETE /api/alerts/:id` - remove alert
4. Register routes in `index.ts`

### Step 7: Alert UI (30min)
1. Create `alert-configuration-panel.tsx`:
   - Simple form: condition dropdown + threshold input + channel selector
   - List existing alerts with delete button
   - No auth for now (single-user assumption; multi-user in future)
2. Add to dashboard layout

## Todo List

- [ ] Create event-bus-instance.ts
- [ ] Integrate event bus into dashboard-data-aggregator.ts
- [ ] Create sse-dashboard-stream-route.ts
- [ ] Create use-dashboard-sse-stream.ts hook
- [ ] Update app.tsx to use SSE (keep polling as fallback)
- [ ] Install grammy package
- [ ] Create telegram-subscribers-schema.ts
- [ ] Create telegram-bot-instance.ts with command handlers
- [ ] Create telegram-subscribers-db-service.ts
- [ ] Create telegram-notification-sender.ts
- [ ] Start Telegram bot in index.ts + shutdown handler
- [ ] Create alert-threshold-evaluator.ts
- [ ] Create alert-db-service.ts
- [ ] Create alerts-api-routes.ts
- [ ] Create alert-configuration-panel.tsx
- [ ] Add alert panel to app.tsx
- [ ] Test SSE live updates in browser
- [ ] Test Telegram bot commands
- [ ] Test signal push to Telegram subscribers
- [ ] Test alert threshold firing

## Success Criteria

- Dashboard updates via SSE without polling (60s server push)
- Contrarian signals appear in dashboard within seconds of generation
- Telegram bot responds to /status with current score
- Telegram subscribers receive signal notifications automatically
- Alerts fire when configured thresholds crossed
- Alert deduplication prevents spam (1h cooldown)
- SSE reconnects automatically on disconnect
- Graceful shutdown of bot + SSE connections

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SSE connection limits under load | Low (personal project) | Low | Cap at 100; fallback to polling |
| Telegram bot token management | Low | Medium | .env only, never committed |
| grammy Bun compatibility | Low | Medium | Uses standard fetch; widely tested |
| Event bus memory leak (listeners) | Medium | Medium | Cleanup on disconnect; max listeners cap |
| Telegram rate limits (30 msg/sec) | Low | Low | Batch sends with delays; few subscribers expected |

## Security Considerations
- Telegram bot token in `.env` (never committed)
- SSE endpoint public (no auth); acceptable for single-user MVP
- Alert API has no auth (single-user assumption); add auth before multi-user
- Telegram chatIds stored in DB; not sensitive but treated as private

## Next Steps
- Phase 6 deploys everything to production
- Future: add webhook mode for Telegram in production (more efficient than long polling)
- Future: add user authentication for multi-user alert management
