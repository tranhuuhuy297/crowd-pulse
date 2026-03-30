/** Contrarian signal types — high score = crowd greed = SELL */
export type SignalType = "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL";

export interface FearGreedData {
  value: number;
  classification: string;
  change24h: number | null;
}

export interface PriceSnapshot {
  symbol: string;
  price: number;
  change24hPct: number;
  volume24h: number;
  rsi: number | null;
}

export interface LongShortData {
  symbol: string;
  ratio: number;
}

export interface CrowdPulseComponents {
  fearGreed: number;
  avgRsi: number | null;
  volumeAnomaly: number | null;
  longShortRatio: number | null;
}

export interface CrowdPulseData {
  score: number | null;
  signal: SignalType;
  updatedAt: string;
  components: CrowdPulseComponents;
}

export interface DashboardData {
  crowdPulse: CrowdPulseData;
  fearGreed: FearGreedData;
  prices: PriceSnapshot[];
  longShort: LongShortData[];
}
