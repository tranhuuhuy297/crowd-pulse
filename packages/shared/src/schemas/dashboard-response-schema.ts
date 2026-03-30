import { z } from "zod";

export const signalTypeSchema = z.enum([
  "STRONG_BUY",
  "BUY",
  "NEUTRAL",
  "SELL",
  "STRONG_SELL",
]);

export const dashboardResponseSchema = z.object({
  crowdPulse: z.object({
    score: z.number().nullable(),
    signal: signalTypeSchema,
    updatedAt: z.string(),
  }),
  components: z.object({
    fearGreed: z.object({
      value: z.number(),
      classification: z.string(),
      change24h: z.number().nullable(),
      weight: z.number(),
    }),
    rsi: z.object({
      avg: z.number().nullable(),
      bySymbol: z.record(z.number().nullable()),
      weight: z.number(),
    }),
    volume: z.object({
      avgChangePct: z.number().nullable(),
      normalized: z.number().nullable(),
      weight: z.number(),
    }),
  }),
  prices: z.record(
    z.object({
      price: z.number(),
      change1h: z.number().nullable(),
      rsi: z.number().nullable(),
    })
  ),
});
