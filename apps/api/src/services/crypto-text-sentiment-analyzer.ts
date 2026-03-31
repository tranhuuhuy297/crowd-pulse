import Sentiment from "sentiment";

const analyzer = new Sentiment();

/** Crypto-specific word score overrides for the AFINN lexicon */
const CRYPTO_WORD_OVERRIDES: Record<string, number> = {
  moon: 3,
  mooning: 3,
  moonshot: 3,
  hodl: 2,
  "diamond hands": 2,
  "diamond hand": 2,
  dip: -1,
  dump: -3,
  dumping: -3,
  rug: -4,
  "rug pull": -4,
  rekt: -3,
  "to the moon": 3,
  bullish: 3,
  bearish: -3,
  pump: 2,
  pumping: 2,
  scam: -4,
  fraud: -4,
  crash: -3,
  crashing: -3,
  fud: -3,
  fomo: 2,
  whale: 1,
  accumulate: 2,
  accumulating: 2,
  capitulation: -2,
  recovery: 2,
  rally: 2,
  surging: 3,
  plunge: -3,
  plunging: -3,
  liquidated: -3,
  liquidation: -2,
  breakout: 2,
  "all time high": 3,
  ath: 3,
  bottom: -1,
  "buy the dip": 2,
  btd: 2,
};

export interface SentimentResult {
  /** Raw AFINN score sum */
  score: number;
  /** Score per word: range roughly -1.0 to +1.0 */
  comparative: number;
  /** Normalized 0–100 (50 = neutral, >50 bullish, <50 bearish) */
  normalized: number;
  /** Number of tokens analyzed */
  tokenCount: number;
}

/** Normalize comparative score (-1..+1) to 0-100 scale */
function normalizeComparative(comparative: number): number {
  // Clamp to [-1, 1] then map to [0, 100]
  const clamped = Math.min(1, Math.max(-1, comparative));
  return Math.round((clamped + 1) * 50 * 100) / 100;
}

/**
 * Analyze sentiment of a text string using AFINN-165 lexicon
 * with crypto-specific word score overrides.
 * Returns a normalized 0-100 score (50 = neutral).
 */
export function analyzeTextSentiment(text: string): SentimentResult {
  if (!text || text.trim().length === 0) {
    return { score: 0, comparative: 0, normalized: 50, tokenCount: 0 };
  }

  const result = analyzer.analyze(text, { extras: CRYPTO_WORD_OVERRIDES });

  return {
    score: result.score,
    comparative: result.comparative,
    normalized: normalizeComparative(result.comparative),
    tokenCount: result.tokens.length,
  };
}
