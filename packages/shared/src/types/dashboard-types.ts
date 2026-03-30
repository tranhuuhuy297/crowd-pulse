export type SignalType = "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL";

export interface FearGreedComponent {
  value: number;
  classification: string;
  change24h: number | null;
  weight: number;
}

export interface RSIComponent {
  avg: number | null;
  bySymbol: Record<string, number | null>;
  weight: number;
}

export interface VolumeComponent {
  avgChangePct: number | null;
  normalized: number | null;
  weight: number;
}

export interface CrowdPulseScore {
  score: number | null;
  signal: SignalType;
  updatedAt: string;
}

export interface PriceSnapshot {
  price: number;
  change1h: number | null;
  rsi: number | null;
}

export interface DashboardResponse {
  crowdPulse: CrowdPulseScore;
  components: {
    fearGreed: FearGreedComponent;
    rsi: RSIComponent;
    volume: VolumeComponent;
  };
  prices: Record<string, PriceSnapshot>;
}
