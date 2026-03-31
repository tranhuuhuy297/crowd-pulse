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

export interface SentimentComponent {
  score: number | null;
  postCount: number;
  source: string;
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

export interface TrendsComponent {
  avgInterest: number | null;
  keywords: Record<string, number>;
  weight: number;
}

export interface LiquidationComponent {
  longShortRatio: number | null;
  normalized: number | null;
  weight: number;
}

export interface OnchainComponent {
  hashRate: number | null;
  txCount: number | null;
  normalized: number | null;
  weight: number;
}

export interface SignalEvent {
  id: number;
  signal: string;
  confidence: string;
  score: number;
  priceAtSignal: number;
  accurate24h: boolean | null;
  accurate72h: boolean | null;
  accurate7d: boolean | null;
  createdAt: string;
}

export interface SignalAccuracyStats {
  signalType: string;
  totalCount: number;
  accurate24h: number;
  accurate72h: number;
  accurate7d: number;
}

export interface DashboardResponse {
  crowdPulse: CrowdPulseScore;
  components: {
    fearGreed: FearGreedComponent;
    rsi: RSIComponent;
    volume: VolumeComponent;
    sentiment: SentimentComponent;
    trends: TrendsComponent;
    liquidation: LiquidationComponent;
    onchain: OnchainComponent;
  };
  prices: Record<string, PriceSnapshot>;
  signals: SignalEvent[];
}
