import { eventBus } from "../lib/event-bus-instance";
import { getActiveAlerts, updateAlertLastFiredAt } from "./alert-threshold-db-service";
import { logger } from "../lib/logger-instance";
import type { DashboardResponse } from "@crowdpulse/shared";

const ONE_HOUR_MS = 60 * 60 * 1000;

/** Check if 1h deduplication window has passed since last fire */
function isCooldownClear(lastFiredAt: Date | null): boolean {
  if (!lastFiredAt) return true;
  return Date.now() - lastFiredAt.getTime() >= ONE_HOUR_MS;
}

/** Evaluate a single alert condition against current dashboard values */
function isConditionMet(
  condition: string,
  threshold: number,
  score: number | null,
  btcPrice: number | null
): { met: boolean; actualValue: number | null } {
  switch (condition) {
    case "score_above":
      return { met: score !== null && score > threshold, actualValue: score };
    case "score_below":
      return { met: score !== null && score < threshold, actualValue: score };
    case "price_above":
      return { met: btcPrice !== null && btcPrice > threshold, actualValue: btcPrice };
    case "price_below":
      return { met: btcPrice !== null && btcPrice < threshold, actualValue: btcPrice };
    default:
      return { met: false, actualValue: null };
  }
}

/** Subscribe to dashboard updates and fire alerts when thresholds are crossed */
export function initAlertThresholdEvaluator(): void {
  eventBus.onDashboardUpdate(async (data: DashboardResponse) => {
    try {
      const score = data.crowdPulse.score;
      const btcPrice = data.prices["BTC"]?.price ?? null;
      const alerts = await getActiveAlerts();

      for (const alert of alerts) {
        if (!isCooldownClear(alert.lastFiredAt)) continue;

        const threshold = Number(alert.threshold);
        const { met, actualValue } = isConditionMet(
          alert.condition,
          threshold,
          score,
          btcPrice
        );

        if (!met || actualValue === null) continue;

        // Update dedup timestamp before firing to prevent concurrent double-fires
        await updateAlertLastFiredAt(alert.id);

        eventBus.emitAlert({
          alertId: alert.id,
          condition: alert.condition,
          threshold,
          actualValue,
          channel: alert.channel,
          telegramChatId: alert.telegramChatId,
        });

        logger.info(
          { alertId: alert.id, condition: alert.condition, threshold, actualValue },
          "Alert threshold triggered"
        );
      }
    } catch (err) {
      logger.warn({ err }, "Alert evaluation failed — non-critical");
    }
  });

  logger.info("Alert threshold evaluator initialized");
}
