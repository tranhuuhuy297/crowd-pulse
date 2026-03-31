import type { SignalType, CrowdPulseComponents } from "./types";

const BASE_WEIGHTS = {
  fearGreed: 0.25,
  fundingRate: 0.25,
  rsi: 0.15,
  longShort: 0.15,
  openInterest: 0.20,
};

/** Clamp value between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Normalize a value from [inMin, inMax] to [0, 100] */
export function normalizeToHundred(value: number, inMin: number, inMax: number): number {
  return clamp(((value - inMin) / (inMax - inMin)) * 100, 0, 100);
}

/** Map score to contrarian signal (high score = crowd greedy = SELL) */
export function scoreToSignal(score: number): SignalType {
  if (score >= 80) return "STRONG_SELL";
  if (score >= 65) return "SELL";
  if (score >= 35) return "NEUTRAL";
  if (score >= 20) return "BUY";
  return "STRONG_BUY";
}

/**
 * Calculate CrowdPulse score from 5 components.
 * Redistributes weights when components are null.
 */
export function calculateCrowdPulseScore(components: CrowdPulseComponents): {
  score: number | null;
  signal: SignalType;
} {
  const has = {
    fearGreed: true,
    fundingRate: components.fundingRate !== null,
    rsi: components.avgRsi !== null,
    longShort: components.longShortRatio !== null,
    openInterest: components.openInterest !== null,
  };

  const totalAvailable =
    (has.fearGreed ? BASE_WEIGHTS.fearGreed : 0) +
    (has.fundingRate ? BASE_WEIGHTS.fundingRate : 0) +
    (has.rsi ? BASE_WEIGHTS.rsi : 0) +
    (has.longShort ? BASE_WEIGHTS.longShort : 0) +
    (has.openInterest ? BASE_WEIGHTS.openInterest : 0);

  if (totalAvailable === 0) return { score: null, signal: "NEUTRAL" };

  const scale = 1 / totalAvailable;
  let weighted = components.fearGreed * (BASE_WEIGHTS.fearGreed * scale);

  if (has.fundingRate) {
    weighted += components.fundingRate! * (BASE_WEIGHTS.fundingRate * scale);
  }
  if (has.rsi) {
    weighted += components.avgRsi! * (BASE_WEIGHTS.rsi * scale);
  }
  if (has.longShort) {
    weighted += components.longShortRatio! * (BASE_WEIGHTS.longShort * scale);
  }
  if (has.openInterest) {
    weighted += components.openInterest! * (BASE_WEIGHTS.openInterest * scale);
  }

  const score = Math.round(weighted * 100) / 100;
  return { score, signal: scoreToSignal(score) };
}
