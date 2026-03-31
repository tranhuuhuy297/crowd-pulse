import type { SignalType } from "./types";

export interface BuyConclusion {
  /** Overall recommendation */
  recommendation: "BUY_NOW" | "WAIT_FOR_DIP" | "HOLD_OFF" | "AVOID";
  /** Confidence 0-100 */
  confidence: number;
  /** Suggested entry price (nearest support) */
  suggestedEntry: number | null;
  /** Strong support level */
  strongSupport: number | null;
  /** Nearest resistance level */
  resistance: number | null;
  /** Human-readable summary */
  summary: string;
  /** Current price for reference */
  currentPrice: number;
}

/** Find swing lows from candle lows — local minima within a window */
function findSwingLows(lows: number[], windowSize = 3): number[] {
  const swings: number[] = [];
  for (let i = windowSize; i < lows.length - windowSize; i++) {
    let isSwingLow = true;
    for (let j = 1; j <= windowSize; j++) {
      if (lows[i]! >= lows[i - j]! || lows[i]! >= lows[i + j]!) {
        isSwingLow = false;
        break;
      }
    }
    if (isSwingLow) swings.push(lows[i]!);
  }
  return swings;
}

/** Find swing highs from candle highs */
function findSwingHighs(highs: number[], windowSize = 3): number[] {
  const swings: number[] = [];
  for (let i = windowSize; i < highs.length - windowSize; i++) {
    let isSwingHigh = true;
    for (let j = 1; j <= windowSize; j++) {
      if (highs[i]! <= highs[i - j]! || highs[i]! <= highs[i + j]!) {
        isSwingHigh = false;
        break;
      }
    }
    if (isSwingHigh) swings.push(highs[i]!);
  }
  return swings;
}

/**
 * Calculate buy conclusion from crowd pulse signal, price data, and kline levels.
 * Combines contrarian sentiment with technical support/resistance levels.
 */
export function calculateBuyConclusion(
  signal: SignalType,
  score: number,
  currentPrice: number,
  rsi: number | null,
  highs: number[],
  lows: number[],
  avgFundingRate: number | null = null,
): BuyConclusion {
  // Find support/resistance from swing levels
  const swingLows = findSwingLows(lows, 2);
  const swingHighs = findSwingHighs(highs, 2);

  // Absolute low as strong support fallback
  const absoluteLow = Math.min(...lows);
  const absoluteHigh = Math.max(...highs);

  // Nearest support: highest swing low below current price
  const supportsBelow = swingLows.filter((l) => l < currentPrice).sort((a, b) => b - a);
  const suggestedEntry = supportsBelow[0] ?? absoluteLow;
  const strongSupport = supportsBelow.length > 1 ? supportsBelow[1]! : absoluteLow;

  // Nearest resistance: lowest swing high above current price
  const resistancesAbove = swingHighs.filter((h) => h > currentPrice).sort((a, b) => a - b);
  const resistance = resistancesAbove[0] ?? absoluteHigh;

  // Distance from support as % of current price
  const distFromSupport = ((currentPrice - suggestedEntry) / currentPrice) * 100;

  // Calculate recommendation based on signal + RSI + price position
  let recommendation: BuyConclusion["recommendation"];
  let confidence: number;
  let summary: string;

  const rsiContext = rsi !== null
    ? rsi < 30 ? "oversold" : rsi > 70 ? "overbought" : "neutral"
    : "unknown";

  if (signal === "STRONG_BUY") {
    if (distFromSupport < 2 || rsiContext === "oversold") {
      recommendation = "BUY_NOW";
      confidence = 85;
      summary = `Extreme fear + price near support ($${suggestedEntry.toLocaleString()}). Strong buy zone.`;
    } else {
      recommendation = "BUY_NOW";
      confidence = 75;
      summary = `Extreme crowd fear — contrarian buy signal. Consider entries near $${suggestedEntry.toLocaleString()}.`;
    }
  } else if (signal === "BUY") {
    if (distFromSupport < 3) {
      recommendation = "BUY_NOW";
      confidence = 65;
      summary = `Crowd is fearful and price is near support. Good entry point around $${suggestedEntry.toLocaleString()}.`;
    } else {
      recommendation = "WAIT_FOR_DIP";
      confidence = 60;
      summary = `Sentiment favors buying, but price is ${distFromSupport.toFixed(1)}% above support. Wait for a dip to ~$${suggestedEntry.toLocaleString()}.`;
    }
  } else if (signal === "NEUTRAL") {
    recommendation = "HOLD_OFF";
    confidence = 50;
    summary = `No clear edge — crowd sentiment is balanced (score: ${score}). Wait for stronger signal.`;
  } else if (signal === "SELL") {
    recommendation = "AVOID";
    confidence = 65;
    summary = `Crowd is optimistic — not ideal to buy. If holding, consider trimming near $${resistance.toLocaleString()}.`;
  } else {
    // STRONG_SELL
    recommendation = "AVOID";
    confidence = 80;
    summary = `Extreme greed — high risk to buy now. Resistance at $${resistance.toLocaleString()}. Wait for correction.`;
  }

  // Adjust confidence based on RSI alignment
  if (rsiContext === "oversold" && (signal === "STRONG_BUY" || signal === "BUY")) {
    confidence = Math.min(confidence + 10, 95);
  } else if (rsiContext === "overbought" && (signal === "SELL" || signal === "STRONG_SELL")) {
    confidence = Math.min(confidence + 10, 95);
  }

  // Adjust confidence based on funding rate alignment
  if (avgFundingRate !== null) {
    const isNegativeFunding = avgFundingRate < -0.0001;
    const isPositiveFunding = avgFundingRate > 0.0005;

    if (isNegativeFunding && (signal === "STRONG_BUY" || signal === "BUY")) {
      confidence = Math.min(confidence + 10, 95);
      summary += " Funding negative — shorts paying longs.";
    } else if (isPositiveFunding && (signal === "SELL" || signal === "STRONG_SELL")) {
      confidence = Math.min(confidence + 5, 95);
      summary += " Funding elevated — longs paying shorts.";
    }
  }

  return {
    recommendation,
    confidence,
    suggestedEntry: signal === "STRONG_BUY" || signal === "BUY" ? suggestedEntry : null,
    strongSupport,
    resistance,
    summary,
    currentPrice,
  };
}
