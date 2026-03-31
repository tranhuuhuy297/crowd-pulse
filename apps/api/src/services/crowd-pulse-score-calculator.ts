import type {
  SignalType, FearGreedComponent, RSIComponent, VolumeComponent,
  SentimentComponent, TrendsComponent, LiquidationComponent, OnchainComponent,
} from "@crowdpulse/shared";

export interface CrowdPulseInput {
  fearGreedValue: number | null;
  fearGreedClassification: string;
  fearGreedChange24h: number | null;
  rsiValues: Record<string, number | null>;
  volumeChanges: Record<string, number | null>;
  sentimentScore: number | null;
  sentimentPostCount: number;
  trendsScore: number | null;
  trendsKeywords: Record<string, number>;
  liquidationScore: number | null;
  liquidationRatio: number | null;
  onchainScore: number | null;
}

export interface CrowdPulseResult {
  score: number | null;
  signal: SignalType;
  components: {
    fearGreed: FearGreedComponent;
    rsi: RSIComponent;
    volume: VolumeComponent;
    sentiment: SentimentComponent;
    trends: TrendsComponent;
    liquidation: LiquidationComponent;
    onchain: OnchainComponent;
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
 * Active weights: fearGreed 0.30, rsi 0.25, volume 0.25, sentiment 0.20
 */
export function calculateCrowdPulse(input: CrowdPulseInput): CrowdPulseResult {
  const BASE_WEIGHTS = {
    fearGreed: 0.25, rsi: 0.15, volume: 0.15,
    sentiment: 0.20, trends: 0.10, liquidation: 0.10, onchain: 0.05,
  };

  const hasFearGreed = input.fearGreedValue !== null;
  const avgRsi = avgNonNull(input.rsiValues);
  const hasRsi = avgRsi !== null;
  const avgVolChange = avgNonNull(input.volumeChanges);
  const hasVolume = avgVolChange !== null;
  const hasSentiment = input.sentimentScore !== null;
  const hasTrends = input.trendsScore !== null;
  const hasLiquidation = input.liquidationScore !== null;
  const hasOnchain = input.onchainScore !== null;

  // Redistribute weights among available components
  const totalAvailable =
    (hasFearGreed ? BASE_WEIGHTS.fearGreed : 0) +
    (hasRsi ? BASE_WEIGHTS.rsi : 0) +
    (hasVolume ? BASE_WEIGHTS.volume : 0) +
    (hasSentiment ? BASE_WEIGHTS.sentiment : 0) +
    (hasTrends ? BASE_WEIGHTS.trends : 0) +
    (hasLiquidation ? BASE_WEIGHTS.liquidation : 0) +
    (hasOnchain ? BASE_WEIGHTS.onchain : 0);

  let score: number | null = null;

  if (totalAvailable > 0) {
    const scale = 1 / totalAvailable;
    let weighted = 0;

    if (hasFearGreed) weighted += input.fearGreedValue! * (BASE_WEIGHTS.fearGreed * scale);
    if (hasRsi) weighted += avgRsi! * (BASE_WEIGHTS.rsi * scale);
    if (hasVolume) {
      const normalizedVol = normalizeToHundred(avgVolChange!, -50, 50);
      weighted += normalizedVol * (BASE_WEIGHTS.volume * scale);
    }
    if (hasSentiment) weighted += input.sentimentScore! * (BASE_WEIGHTS.sentiment * scale);
    if (hasTrends) weighted += input.trendsScore! * (BASE_WEIGHTS.trends * scale);
    if (hasLiquidation) weighted += input.liquidationScore! * (BASE_WEIGHTS.liquidation * scale);
    if (hasOnchain) weighted += input.onchainScore! * (BASE_WEIGHTS.onchain * scale);

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
    sentiment: {
      score: input.sentimentScore,
      postCount: input.sentimentPostCount,
      source: "reddit",
      weight: hasSentiment ? BASE_WEIGHTS.sentiment : 0,
    } satisfies SentimentComponent,
    trends: {
      avgInterest: input.trendsScore,
      keywords: input.trendsKeywords,
      weight: hasTrends ? BASE_WEIGHTS.trends : 0,
    } satisfies TrendsComponent,
    liquidation: {
      longShortRatio: input.liquidationRatio,
      normalized: input.liquidationScore,
      weight: hasLiquidation ? BASE_WEIGHTS.liquidation : 0,
    } satisfies LiquidationComponent,
    onchain: {
      hashRate: null,
      txCount: null,
      normalized: input.onchainScore,
      weight: hasOnchain ? BASE_WEIGHTS.onchain : 0,
    } satisfies OnchainComponent,
  };

  return {
    score,
    signal,
    components,
  };
}
