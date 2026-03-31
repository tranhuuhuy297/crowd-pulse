# Phase 4: Contrarian Signal Generator + Historical Accuracy Tracking

## Context Links
- [Score calculator](../../apps/api/src/services/crowd-pulse-score-calculator.ts)
- [CrowdPulse DB schema](../../apps/api/src/db/schema/sentiment-crowd-pulse-schema.ts)
- [Dashboard aggregator](../../apps/api/src/services/dashboard-data-aggregator.ts)
- [Dashboard types](../../packages/shared/src/types/dashboard-types.ts)

## Overview
- **Priority**: P1
- **Status**: pending
- **Effort**: 6h
- **Description**: Generate actionable contrarian signals when CrowdPulse score hits extremes. Track signal accuracy by comparing signal generation time price vs price 24h/72h/7d later. Display signal history + accuracy stats on dashboard.

## Key Insights

### Signal Generation Logic
Current system maps score to signal label but doesn't persist or act on signals. Phase 4 adds:
- **Signal Events**: Persisted records when score crosses thresholds with sustained duration
- **Debouncing**: Signal only fires when score stays in extreme zone for 2+ consecutive readings (prevent noise)
- **Cooldown**: Min 4h between signals of same type (avoid spam)

### Accuracy Tracking
- When signal fires, record BTC price at signal time
- BullMQ delayed job checks price at +24h, +72h, +7d
- Compare: did price move in the predicted direction?
- STRONG_BUY at extreme fear -> price should go UP -> accuracy = price went up
- Track hit rate as simple percentage

### Signal Confidence Levels
```
score 0-10  or 90-100: HIGH confidence (extreme zones)
score 10-20 or 80-90:  MEDIUM confidence
score 20-35 or 65-80:  LOW confidence
score 35-65:           No signal (neutral)
```

## Requirements

### Functional
- Generate signal events when CrowdPulse enters/stays in extreme zones
- Debounce: require 2 consecutive readings in zone (30min minimum at 15min crawl rate)
- Cooldown: 4h minimum between same-type signals
- Persist signals with: score, signal type, confidence, BTC price at time, component snapshot
- Schedule accuracy checks at +24h, +72h, +7d via BullMQ delayed jobs
- Compute running accuracy stats per signal type
- Expose signals + accuracy via API
- Display signal history + accuracy on dashboard

### Non-Functional
- Signal generation runs after every CrowdPulse score computation (not a separate crawler)
- Accuracy check is idempotent (can re-run safely)
- Historical data retained indefinitely for backtesting

## Architecture

```
Dashboard Request
  -> dashboard-data-aggregator.ts
    -> calculateCrowdPulse() (existing)
    -> contrarian-signal-evaluator.ts (NEW)
      -> Check debounce + cooldown
      -> If signal: persist + schedule accuracy checks
    -> signal-accuracy-checker.ts (delayed BullMQ jobs)
      -> Compare price at signal time vs current
      -> Update signal record with accuracy

API:
  GET /api/signals         -> recent signals with accuracy
  GET /api/signals/stats   -> accuracy stats per signal type
```

## Schema

### New: `contrarian_signals` table
```typescript
export const contrarianSignals = pgTable("contrarian_signals", {
  id: serial("id").primaryKey(),
  signal: varchar("signal", { length: 20 }).notNull(),        // STRONG_BUY, BUY, SELL, STRONG_SELL
  confidence: varchar("confidence", { length: 10 }).notNull(), // HIGH, MEDIUM, LOW
  score: numeric("score", { precision: 8, scale: 4 }).notNull(),
  priceAtSignal: numeric("price_at_signal", { precision: 20, scale: 8 }).notNull(), // BTC price
  componentSnapshot: jsonb("component_snapshot"),               // full component breakdown

  // Accuracy tracking (filled in later by delayed jobs)
  priceAfter24h: numeric("price_after_24h", { precision: 20, scale: 8 }),
  priceAfter72h: numeric("price_after_72h", { precision: 20, scale: 8 }),
  priceAfter7d: numeric("price_after_7d", { precision: 20, scale: 8 }),
  accurate24h: boolean("accurate_24h"),
  accurate72h: boolean("accurate_72h"),
  accurate7d: boolean("accurate_7d"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

## Related Code Files

### Files to Modify
- `apps/api/src/db/schema/index.ts` - export contrarianSignals
- `apps/api/src/services/dashboard-data-aggregator.ts` - call signal evaluator after score calc
- `apps/api/src/jobs/bullmq-queue-manager.ts` - add signal-accuracy queue
- `apps/api/src/index.ts` - register accuracy worker + shutdown
- `apps/api/src/routes/dashboard-api-routes.ts` - add /signals and /signals/stats routes
- `packages/shared/src/types/dashboard-types.ts` - add SignalEvent, SignalStats types, update DashboardResponse
- `apps/web/src/app.tsx` - add signals section to dashboard

### Files to Create
- `apps/api/src/db/schema/contrarian-signals-schema.ts` - table definition
- `apps/api/src/services/contrarian-signal-evaluator.ts` - debounce + cooldown + signal generation
- `apps/api/src/services/contrarian-signals-db-service.ts` - CRUD for signals table
- `apps/api/src/services/signal-accuracy-checker.ts` - compare prices, update accuracy
- `apps/api/src/jobs/signal-accuracy-checker-worker.ts` - BullMQ worker for delayed accuracy checks
- `apps/api/src/routes/signals-api-routes.ts` - signal history + stats endpoints
- `apps/web/src/components/contrarian-signal-history-card.tsx` - signal list UI
- `apps/web/src/components/signal-accuracy-stats-card.tsx` - accuracy stats UI

## Implementation Steps

### Step 1: Schema + DB Service (1h)
1. Create `contrarian-signals-schema.ts` with table definition above
2. Export from `schema/index.ts`
3. `make db-push`
4. Create `contrarian-signals-db-service.ts`:
   - `insertSignal(data)` - persist new signal
   - `getLastSignalByType(signalType)` - for cooldown check
   - `getRecentSignals(limit)` - for API/dashboard
   - `updateAccuracy(signalId, period, price, accurate)` - fill accuracy fields
   - `getAccuracyStats()` - aggregate hit rates per signal type

### Step 2: Signal Evaluator (1.5h)
1. Create `contrarian-signal-evaluator.ts`
2. State tracking: keep last N scores in memory (or query DB) for debounce
3. Logic:
   ```
   function evaluateSignal(score, currentBtcPrice, components):
     a. Map score to signal + confidence
     b. If neutral -> return null
     c. Check debounce: was previous score also in same zone? If not -> return null
     d. Check cooldown: last signal of same type < 4h ago? If yes -> return null
     e. Persist signal to DB
     f. Schedule accuracy check jobs (24h, 72h, 7d delays)
     g. Return signal event for dashboard response
   ```
4. Integrate call into `dashboard-data-aggregator.ts` after score calculation

### Step 3: Accuracy Checker (1h)
1. Create `signal-accuracy-checker.ts`:
   - Fetch current BTC price from latest price candle in DB
   - Compare with `priceAtSignal`
   - For BUY/STRONG_BUY: accurate if price went UP
   - For SELL/STRONG_SELL: accurate if price went DOWN
   - Update signal record
2. Create `signal-accuracy-checker-worker.ts`:
   - BullMQ worker processing delayed jobs
   - Job data: `{ signalId, period: '24h' | '72h' | '7d' }`
3. Add queue + worker to queue manager and index.ts

### Step 4: API Routes (45min)
1. Create `signals-api-routes.ts`:
   - `GET /api/signals` - returns last 20 signals with accuracy data
   - `GET /api/signals/stats` - returns accuracy percentages per signal type + confidence
2. Register in `index.ts`
3. Update `DashboardResponse` to include `signals: SignalEvent[]` (last 5 signals)

### Step 5: Frontend (1.5h)
1. Create `contrarian-signal-history-card.tsx`:
   - Table/list of recent signals
   - Color coded: green for BUY, red for SELL
   - Show accuracy checkmarks for 24h/72h/7d when available
   - Confidence badge (HIGH/MEDIUM/LOW)
2. Create `signal-accuracy-stats-card.tsx`:
   - Overall accuracy percentage
   - Breakdown by signal type
   - Sample size (total signals tracked)
3. Add both cards to `app.tsx` dashboard

### Step 6: Testing (30min)
1. Manually trigger extreme scores (or mock) to verify signal generation
2. Verify debounce prevents single-reading signals
3. Verify cooldown prevents spam
4. Check delayed jobs are scheduled in Redis
5. Verify API returns signals + stats

## Todo List

- [ ] Create contrarian-signals-schema.ts
- [ ] Create contrarian-signals-db-service.ts
- [ ] Implement contrarian-signal-evaluator.ts (debounce + cooldown)
- [ ] Integrate evaluator into dashboard-data-aggregator.ts
- [ ] Implement signal-accuracy-checker.ts
- [ ] Implement signal-accuracy-checker-worker.ts (BullMQ delayed jobs)
- [ ] Add signal-accuracy queue to bullmq-queue-manager.ts
- [ ] Register worker + shutdown in index.ts
- [ ] Create signals-api-routes.ts (GET /signals, GET /signals/stats)
- [ ] Update shared types (SignalEvent, SignalStats)
- [ ] Update DashboardResponse to include signals
- [ ] Create contrarian-signal-history-card.tsx
- [ ] Create signal-accuracy-stats-card.tsx
- [ ] Add signal cards to app.tsx
- [ ] Test signal generation + accuracy pipeline

## Success Criteria

- Signals generated only during sustained extreme readings (debounced)
- Cooldown prevents duplicate signals within 4h window
- Accuracy checks run at 24h/72h/7d via delayed BullMQ jobs
- API exposes signal history + accuracy stats
- Dashboard shows signal history with accuracy indicators
- Signal generation doesn't add latency to dashboard response (async persist)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Insufficient extreme readings for testing | High initially | Medium | Add /api/debug/trigger-signal endpoint (dev only) |
| BullMQ delayed jobs lost on restart | Medium | Low | Jobs persist in Redis; re-process on startup |
| Accuracy metric too simple (binary) | Medium | Low | Start simple; add % move magnitude later |
| Memory-based debounce lost on restart | Medium | Low | Query last 2 crowd_pulse records from DB as fallback |

## Security Considerations
- Debug/trigger endpoint only available in development mode
- No user-specific data; all signals are global/public
- Signal data is non-sensitive market analysis

## Next Steps
- Phase 5 uses signals for real-time alerts + Telegram notifications
- Consider adding backtesting against historical data in future
