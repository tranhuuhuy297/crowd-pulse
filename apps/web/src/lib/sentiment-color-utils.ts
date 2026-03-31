/** Threshold tier for sentiment-based coloring across dashboard cards */
export interface SentimentTier {
  max: number;
  textClass: string;
  /** Badge classes — light-readable by default, dark: prefix for dark theme */
  badgeClass: string;
  label: string;
}

/** Returns text color class for a value given sentiment tiers */
export function sentimentTextColor(value: number, tiers: SentimentTier[]): string {
  for (const tier of tiers) {
    if (value <= tier.max) return tier.textClass;
  }
  return tiers[tiers.length - 1]!.textClass;
}

/** Returns badge classes + label for a value given sentiment tiers */
export function sentimentBadge(value: number, tiers: SentimentTier[]): { classes: string; label: string } {
  for (const tier of tiers) {
    if (value <= tier.max) return { classes: tier.badgeClass, label: tier.label };
  }
  const last = tiers[tiers.length - 1]!;
  return { classes: last.badgeClass, label: last.label };
}

// Badge color patterns: light uses -700 for readability, dark uses -400
const G_BADGE = "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30";
const G_BADGE_LIGHT = "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20";
const N_BADGE = "bg-neutral-500/20 text-neutral-700 dark:text-neutral-400 border-neutral-500/30";
const R_BADGE_LIGHT = "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20";
const R_BADGE = "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30";

/** Fear & Greed Index: 0-100, green=fear(buy) red=greed(sell) */
export const FEAR_GREED_TIERS: SentimentTier[] = [
  { max: 25, textClass: "text-green-600 dark:text-green-500", badgeClass: G_BADGE, label: "Extreme Fear" },
  { max: 45, textClass: "text-green-600 dark:text-green-400", badgeClass: G_BADGE_LIGHT, label: "Fear" },
  { max: 55, textClass: "text-neutral-500 dark:text-neutral-400", badgeClass: N_BADGE, label: "Neutral" },
  { max: 75, textClass: "text-red-600 dark:text-red-400", badgeClass: R_BADGE_LIGHT, label: "Greed" },
  { max: Infinity, textClass: "text-red-600 dark:text-red-500", badgeClass: R_BADGE, label: "Extreme Greed" },
];

/** Long/Short ratio: heavy long=red(greed), heavy short=green(fear) */
export const RATIO_TIERS: SentimentTier[] = [
  { max: 0.7, textClass: "text-green-600 dark:text-green-500", badgeClass: G_BADGE, label: "Heavy Short" },
  { max: 0.9, textClass: "text-green-600 dark:text-green-400", badgeClass: G_BADGE_LIGHT, label: "Short Bias" },
  { max: 1.1, textClass: "text-neutral-500 dark:text-neutral-400", badgeClass: N_BADGE, label: "Balanced" },
  { max: 1.5, textClass: "text-red-600 dark:text-red-400", badgeClass: R_BADGE_LIGHT, label: "Long Bias" },
  { max: Infinity, textClass: "text-red-600 dark:text-red-500", badgeClass: R_BADGE, label: "Heavy Long" },
];

/** Funding rate thresholds (raw decimal rate, not percentage) */
export const FUNDING_RATE_TIERS: SentimentTier[] = [
  { max: -0.0003, textClass: "text-green-600 dark:text-green-500", badgeClass: G_BADGE, label: "Shorts Pay" },
  { max: -0.0001, textClass: "text-green-600 dark:text-green-400", badgeClass: G_BADGE, label: "Shorts Pay" },
  { max: 0.0003, textClass: "text-neutral-500 dark:text-neutral-400", badgeClass: N_BADGE, label: "Neutral" },
  { max: 0.0007, textClass: "text-red-600 dark:text-red-400", badgeClass: R_BADGE, label: "Longs Pay" },
  { max: Infinity, textClass: "text-red-600 dark:text-red-500", badgeClass: R_BADGE, label: "Longs Pay" },
];

/** Futures basis thresholds (decimal fraction, e.g. 0.05 = 0.05%) */
export const BASIS_PCT_TIERS: SentimentTier[] = [
  { max: -0.05, textClass: "text-green-600 dark:text-green-500", badgeClass: G_BADGE, label: "Discount" },
  { max: -0.02, textClass: "text-green-600 dark:text-green-400", badgeClass: G_BADGE, label: "Discount" },
  { max: 0.05, textClass: "text-neutral-500 dark:text-neutral-400", badgeClass: N_BADGE, label: "Fair" },
  { max: 0.15, textClass: "text-red-600 dark:text-red-400", badgeClass: R_BADGE, label: "Premium" },
  { max: Infinity, textClass: "text-red-600 dark:text-red-500", badgeClass: R_BADGE, label: "Premium" },
];

/** Open interest change percentage thresholds */
export const OI_CHANGE_TIERS: SentimentTier[] = [
  { max: -15, textClass: "text-green-600 dark:text-green-500", badgeClass: G_BADGE, label: "Low Leverage" },
  { max: -10, textClass: "text-green-600 dark:text-green-400", badgeClass: G_BADGE, label: "Low Leverage" },
  { max: 5, textClass: "text-neutral-500 dark:text-neutral-400", badgeClass: N_BADGE, label: "Normal" },
  { max: 10, textClass: "text-neutral-500 dark:text-neutral-400", badgeClass: N_BADGE, label: "Normal" },
  { max: 15, textClass: "text-red-600 dark:text-red-400", badgeClass: R_BADGE, label: "High Leverage" },
  { max: Infinity, textClass: "text-red-600 dark:text-red-500", badgeClass: R_BADGE, label: "High Leverage" },
];

/** Top trader ratio thresholds (1.3 boundary vs RATIO_TIERS' 1.5) */
export const TOP_TRADER_RATIO_TIERS: SentimentTier[] = [
  { max: 0.7, textClass: "text-green-600 dark:text-green-500", badgeClass: G_BADGE, label: "Heavy Short" },
  { max: 0.9, textClass: "text-green-600 dark:text-green-400", badgeClass: G_BADGE_LIGHT, label: "Short Bias" },
  { max: 1.1, textClass: "text-neutral-500 dark:text-neutral-400", badgeClass: N_BADGE, label: "Balanced" },
  { max: 1.3, textClass: "text-red-600 dark:text-red-400", badgeClass: R_BADGE_LIGHT, label: "Long Bias" },
  { max: Infinity, textClass: "text-red-600 dark:text-red-500", badgeClass: R_BADGE, label: "Heavy Long" },
];
