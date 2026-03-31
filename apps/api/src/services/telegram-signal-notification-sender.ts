import type { Bot } from "grammy";
import { eventBus } from "../lib/event-bus-instance";
import { getActiveSubscribers } from "./telegram-subscribers-db-service";
import { logger } from "../lib/logger-instance";
import type { SignalEvent } from "@crowdpulse/shared";

/** Format a signal event into a readable Telegram message */
function formatSignalMessage(signal: SignalEvent): string {
  const price = signal.priceAtSignal
    ? `$${Number(signal.priceAtSignal).toLocaleString()}`
    : "N/A";
  return (
    `CrowdPulse Signal Fired!\n\n` +
    `Signal: ${signal.signal}\n` +
    `Confidence: ${signal.confidence}\n` +
    `Score: ${signal.score}\n` +
    `BTC Price: ${price}\n` +
    `Time: ${new Date(signal.createdAt).toUTCString()}`
  );
}

/** Telegram rate limit: max 30 messages/sec — add small delay between sends */
async function sendWithDelay(
  bot: Bot,
  chatId: string,
  text: string
): Promise<void> {
  await bot.api.sendMessage(chatId, text);
  await new Promise((r) => setTimeout(r, 40)); // ~25 msg/sec
}

/** Subscribe to signal:new events and push messages to all active Telegram subscribers */
export function initTelegramSignalNotificationSender(bot: Bot): void {
  eventBus.onNewSignal(async (signal: SignalEvent) => {
    try {
      const subscribers = await getActiveSubscribers();
      if (subscribers.length === 0) return;

      const message = formatSignalMessage(signal);

      for (const subscriber of subscribers) {
        try {
          await sendWithDelay(bot, subscriber.chatId, message);
        } catch (err) {
          logger.warn(
            { err, chatId: subscriber.chatId },
            "Failed to send Telegram signal notification to subscriber"
          );
        }
      }

      logger.info(
        { signalId: signal.id, recipientCount: subscribers.length },
        "Telegram signal notifications sent"
      );
    } catch (err) {
      logger.warn({ err }, "Telegram notification sender failed — non-critical");
    }
  });

  logger.info("Telegram signal notification sender initialized");
}
