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

/** Aggregated long/short ratios: global accounts + top trader accounts + top trader positions */
export interface LongShortAggregated {
  /** Global accounts long/short ratio per symbol */
  global: LongShortData[];
  /** Top traders account ratio per symbol */
  topTraderAccount: LongShortData[];
  /** Top traders position ratio per symbol */
  topTraderPosition: LongShortData[];
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

export interface DataSourceHealth {
  fearGreed: boolean;
  prices: boolean;
  klines: boolean;
  longShort: boolean;
}

export interface DashboardData {
  crowdPulse: CrowdPulseData;
  fearGreed: FearGreedData;
  prices: PriceSnapshot[];
  longShort: LongShortAggregated;
  dataSourceHealth: DataSourceHealth;
}
