import { desc } from "drizzle-orm";
import { db } from "../db/database-connection";
import { crowdPulse } from "../db/schema/sentiment-crowd-pulse-schema";
import { insertSignal, getLastSignalByType } from "./contrarian-signals-db-service";
import { signalAccuracyQueue } from "../jobs/bullmq-queue-manager";
import { logger } from "../lib/logger-instance";
import type { SignalEvent } from "@crowdpulse/shared";

const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

type SignalLabel = "STRONG_BUY" | "BUY" | "SELL" | "STRONG_SELL";
type ConfidenceLabel = "HIGH" | "MEDIUM" | "LOW";

interface SignalMapping {
  signal: SignalLabel;
  confidence: ConfidenceLabel;
}

/** Map score to contrarian signal + confidence level. Returns null if neutral zone. */
function mapScoreToSignal(score: number): SignalMapping | null {
  if (score <= 10) return { signal: "STRONG_BUY", confidence: "HIGH" };
  if (score <= 20) return { signal: "STRONG_BUY", confidence: "MEDIUM" };
  if (score <= 35) return { signal: "BUY", confidence: "LOW" };
  if (score >= 90) return { signal: "STRONG_SELL", confidence: "HIGH" };
  if (score >= 80) return { signal: "STRONG_SELL", confidence: "MEDIUM" };
  if (score >= 65) return { signal: "SELL", confidence: "LOW" };
  return null; // neutral zone 35–65
}

/** Query last 2 crowd_pulse rows from DB to check sustained zone for debounce */
async function getPreviousScore(): Promise<number | null> {
  const rows = await db
    .select({ score: crowdPulse.score })
    .from(crowdPulse)
    .orderBy(desc(crowdPulse.createdAt))
    .limit(1);
  const prev = rows[0];
  return prev ? Number(prev.score) : null;
}

/** Check if cooldown has elapsed since last signal of same type */
async function isCooldownClear(signalType: string): Promise<boolean> {
  const last = await getLastSignalByType(signalType);
  if (!last) return true;
  const elapsed = Date.now() - new Date(last.createdAt).getTime();
  return elapsed >= COOLDOWN_MS;
}

/** Schedule delayed BullMQ jobs for accuracy checks at 24h, 72h, 7d */
async function scheduleAccuracyChecks(signalId: number): Promise<void> {
  const delays: Array<{ period: string; delayMs: number }> = [
    { period: "24h", delayMs: 24 * 60 * 60 * 1000 },
    { period: "72h", delayMs: 72 * 60 * 60 * 1000 },
    { period: "7d", delayMs: 7 * 24 * 60 * 60 * 1000 },
  ];

  for (const { period, delayMs } of delays) {
    await signalAccuracyQueue.add(
      "check-accuracy",
      { signalId, period },
      { delay: delayMs, removeOnComplete: 50, removeOnFail: 20 }
    );
  }
}

/**
 * Evaluate current score for contrarian signal.
 * Applies debounce (must also be extreme on previous reading) and cooldown (4h between same type).
 * If all checks pass: persists signal and schedules accuracy jobs.
 * Returns SignalEvent for dashboard or null if no signal fired.
 */
export async function evaluateSignal(
  score: number,
  btcPrice: number,
  components: unknown
): Promise<SignalEvent | null> {
  const mapping = mapScoreToSignal(score);
  if (!mapping) return null;

  // Debounce: previous reading must also be in an extreme zone (same direction)
  const prevScore = await getPreviousScore();
  if (prevScore === null) return null;
  const prevMapping = mapScoreToSignal(prevScore);
  if (!prevMapping || prevMapping.signal !== mapping.signal) return null;

  // Cooldown: min 4h between same-type signals
  const cooldownClear = await isCooldownClear(mapping.signal);
  if (!cooldownClear) {
    logger.debug({ signal: mapping.signal }, "Signal suppressed by cooldown");
    return null;
  }

  // Persist signal
  const signalId = await insertSignal({
    signal: mapping.signal,
    confidence: mapping.confidence,
    score: String(score),
    priceAtSignal: String(btcPrice),
    componentSnapshot: components as Record<string, unknown>,
  });

  // Schedule accuracy checks (best-effort, non-blocking)
  scheduleAccuracyChecks(signalId).catch((err) =>
    logger.warn({ err, signalId }, "Failed to schedule accuracy checks")
  );

  logger.info({ signalId, signal: mapping.signal, confidence: mapping.confidence, score }, "Contrarian signal fired");

  return {
    id: signalId,
    signal: mapping.signal,
    confidence: mapping.confidence,
    score,
    priceAtSignal: btcPrice,
    accurate24h: null,
    accurate72h: null,
    accurate7d: null,
    createdAt: new Date().toISOString(),
  };
}
