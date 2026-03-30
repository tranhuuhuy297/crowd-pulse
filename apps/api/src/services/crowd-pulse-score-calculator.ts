import type { SignalType, FearGreedComponent, RSIComponent, VolumeComponent } from "@crowdpulse/shared";

export interface CrowdPulseInput {
  fearGreedValue: number | null;
  fearGreedClassification: string;
  fearGreedChange24h: number | null;
  rsiValues: Record<string, number | null>;
  volumeChanges: Record<string, number | null>;
}

export interface CrowdPulseResult {
  score: number | null;
  signal: SignalType;
  components: {
    fearGreed: FearGreedComponent;
    rsi: RSIComponent;
    volume: VolumeComponent;
  };
}

/** Clamp value between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Normalize a value from range [inMin, inMax] to [0, 100] */
function normalizeToHundred(value: number, inMin: number, inMax: number): number {
  return clamp(((value - inMin) / (inMax - inMin)) * 100, 0, 100);
}

/** Map crowd pulse score to contrarian signal (high score = crowd too bullish = SELL) */
function scoreToSignal(score: number): SignalType {
  if (score >= 80) return "STRONG_SELL";
  if (score >= 65) return "SELL";
  if (score >= 35) return "NEUTRAL";
  if (score >= 20) return "BUY";
  return "STRONG_BUY";
}

/** Calculate average of non-null values from a record */
function avgNonNull(values: Record<string, number | null>): number | null {
  const valid = Object.values(values).filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

/**
 * Calculate CrowdPulse score from sentiment inputs.
 * Redistributes weights when components are missing.
 */
export function calculateCrowdPulse(input: CrowdPulseInput): CrowdPulseResult {
  const BASE_WEIGHTS = { fearGreed: 0.4, rsi: 0.3, volume: 0.3 };

  const hasFearGreed = input.fearGreedValue !== null;
  const avgRsi = avgNonNull(input.rsiValues);
  const hasRsi = avgRsi !== null;
  const avgVolChange = avgNonNull(input.volumeChanges);
  const hasVolume = avgVolChange !== null;

  // Redistribute weights among available components
  const available = [
    hasFearGreed ? BASE_WEIGHTS.fearGreed : 0,
    hasRsi ? BASE_WEIGHTS.rsi : 0,
    hasVolume ? BASE_WEIGHTS.volume : 0,
  ];
  const totalAvailable = available.reduce((s, w) => s + w, 0);

  let score: number | null = null;

  if (totalAvailable > 0) {
    const scale = 1 / totalAvailable;
    let weighted = 0;

    if (hasFearGreed) {
      weighted += input.fearGreedValue! * (BASE_WEIGHTS.fearGreed * scale);
    }
    if (hasRsi) {
      weighted += avgRsi! * (BASE_WEIGHTS.rsi * scale);
    }
    if (hasVolume) {
      const normalizedVol = normalizeToHundred(avgVolChange!, -50, 50);
      weighted += normalizedVol * (BASE_WEIGHTS.volume * scale);
    }

    score = Math.round(weighted * 100) / 100;
  }

  const signal: SignalType = score !== null ? scoreToSignal(score) : "NEUTRAL";

  // Build component breakdown objects
  const rsiBySymbol: Record<string, number | null> = {};
  for (const [sym, val] of Object.entries(input.rsiValues)) {
    rsiBySymbol[sym] = val;
  }

  const normalizedVol = hasVolume
    ? normalizeToHundred(avgVolChange!, -50, 50)
    : null;

  const components = {
    fearGreed: {
      value: input.fearGreedValue ?? 0,
      classification: input.fearGreedClassification,
      change24h: input.fearGreedChange24h,
      weight: hasFearGreed ? BASE_WEIGHTS.fearGreed : 0,
    } satisfies FearGreedComponent,
    rsi: {
      avg: avgRsi,
      bySymbol: rsiBySymbol,
      weight: hasRsi ? BASE_WEIGHTS.rsi : 0,
    } satisfies RSIComponent,
    volume: {
      avgChangePct: avgVolChange,
      normalized: normalizedVol,
      weight: hasVolume ? BASE_WEIGHTS.volume : 0,
    } satisfies VolumeComponent,
  };

  return {
    score,
    signal,
    components,
  };
}
