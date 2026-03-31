import { Bot } from "grammy";
import { addSubscriber, removeSubscriber } from "./telegram-subscribers-db-service";
import { getDashboardData } from "./dashboard-data-aggregator";
import { logger } from "../lib/logger-instance";

/** Format a score into a human-readable contrarian interpretation */
function formatScoreLabel(score: number | null): string {
  if (score === null) return "N/A";
  if (score <= 20) return `${score} — Extreme Fear (Strong Buy signal)`;
  if (score <= 35) return `${score} — Fear (Buy signal)`;
  if (score <= 65) return `${score} — Neutral`;
  if (score <= 80) return `${score} — Greed (Sell signal)`;
  return `${score} — Extreme Greed (Strong Sell signal)`;
}

/** Initialize bot with command handlers. Returns null if token is missing. */
export function createTelegramBot(): Bot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.warn("TELEGRAM_BOT_TOKEN not set — Telegram bot disabled");
    return null;
  }

  const bot = new Bot(token);

  bot.command("start", (ctx) =>
    ctx.reply(
      "Welcome to CrowdPulse!\n\n" +
        "I track crypto crowd sentiment and send contrarian signals.\n\n" +
        "Commands:\n" +
        "/status — current CrowdPulse score\n" +
        "/subscribe — get notified on new signals\n" +
        "/unsubscribe — stop notifications\n" +
        "/help — show this message"
    )
  );

  bot.command("help", (ctx) =>
    ctx.reply(
      "CrowdPulse Bot commands:\n\n" +
        "/status — current score + signal\n" +
        "/subscribe — receive signal alerts\n" +
        "/unsubscribe — stop alerts\n" +
        "/help — show this message"
    )
  );

  bot.command("status", async (ctx) => {
    try {
      const data = await getDashboardData();
      const { score, signal } = data.crowdPulse;
      const btcPrice = data.prices["BTC"]?.price ?? null;
      const priceStr = btcPrice ? `$${btcPrice.toLocaleString()}` : "N/A";

      await ctx.reply(
        `CrowdPulse Score: ${formatScoreLabel(score)}\n` +
          `Signal: ${signal ?? "NEUTRAL"}\n` +
          `BTC Price: ${priceStr}\n` +
          `Updated: ${new Date(data.crowdPulse.updatedAt).toUTCString()}`
      );
    } catch (err) {
      logger.warn({ err }, "Telegram /status command failed");
      await ctx.reply("Failed to fetch current data. Please try again later.");
    }
  });

  bot.command("subscribe", async (ctx) => {
    try {
      const chatId = String(ctx.chat.id);
      const username = ctx.from?.username;
      await addSubscriber(chatId, username);
      await ctx.reply("Subscribed! You will receive contrarian signal alerts.");
    } catch (err) {
      logger.warn({ err }, "Telegram /subscribe command failed");
      await ctx.reply("Failed to subscribe. Please try again.");
    }
  });

  bot.command("unsubscribe", async (ctx) => {
    try {
      const chatId = String(ctx.chat.id);
      await removeSubscriber(chatId);
      await ctx.reply("Unsubscribed. You will no longer receive signal alerts.");
    } catch (err) {
      logger.warn({ err }, "Telegram /unsubscribe command failed");
      await ctx.reply("Failed to unsubscribe. Please try again.");
    }
  });

  bot.catch((err) => {
    logger.error({ err: err.error }, "Telegram bot error");
  });

  return bot;
}
