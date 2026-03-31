// eslint-disable-next-line @typescript-eslint/no-require-imports
const googleTrends = require("google-trends-api") as {
  interestOverTime: (opts: {
    keyword: string;
    startTime: Date;
    endTime: Date;
    granularTimeResolution: boolean;
  }) => Promise<string>;
};
import { GOOGLE_TRENDS_KEYWORDS } from "@crowdpulse/shared";
import { logger } from "../lib/logger-instance";

export interface TrendEntry {
  keyword: string;
  /** Interest value 0-100 from Google Trends */
  value: number;
  timestamp: Date;
}

/**
 * Fetches Google Trends interest-over-time for all crypto keywords.
 * Uses the most recent data point from the last 24h window.
 * Adds random jitter to avoid rate limiting.
 */
export async function fetchGoogleTrends(): Promise<TrendEntry[]> {
  // Random jitter 0-15s to avoid synchronized requests
  const jitterMs = Math.floor(Math.random() * 15_000);
  await new Promise((resolve) => setTimeout(resolve, jitterMs));

  const results: TrendEntry[] = [];
  const now = new Date();
  // Use 24h window to get recent hourly data
  const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  for (const keyword of GOOGLE_TRENDS_KEYWORDS) {
    try {
      const raw = await googleTrends.interestOverTime({
        keyword,
        startTime,
        endTime: now,
        granularTimeResolution: true,
      });

      const parsed = JSON.parse(raw) as {
        default?: {
          timelineData?: Array<{ value: number[]; formattedTime?: string }>;
        };
      };

      const timeline = parsed?.default?.timelineData ?? [];
      if (timeline.length === 0) {
        logger.warn({ keyword }, "Google Trends: no data returned");
        continue;
      }

      // Take the most recent data point
      const latest = timeline[timeline.length - 1];
      const value = latest?.value?.[0] ?? 0;

      results.push({ keyword, value, timestamp: now });
      logger.debug({ keyword, value }, "Google Trends data fetched");

      // Small delay between keywords to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    } catch (err) {
      logger.warn({ keyword, err }, "Google Trends fetch failed for keyword");
    }
  }

  return results;
}
