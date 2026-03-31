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
  rsi: number | null;
}

export interface LongShortData {
  symbol: string;
  ratio: number;
}

export interface FundingRateData {
  symbol: string;
  rate: number;
  timestamp: number;
}

export interface OpenInterestData {
  symbol: string;
  currentOI: number;
  avgOI: number;
  changePercent: number;
}

/** Global long/short account ratio per symbol from Binance Futures */
export type LongShortRatios = LongShortData[];

export interface CrowdPulseComponents {
  fearGreed: number;
  avgRsi: number | null;
  longShortRatio: number | null;
  fundingRate: number | null;
  openInterest: number | null;
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
  fundingRate: boolean;
  openInterest: boolean;
}

export interface BuyConclusionData {
  recommendation: "BUY_NOW" | "WAIT_FOR_DIP" | "HOLD_OFF" | "AVOID";
  confidence: number;
  suggestedEntry: number | null;
  strongSupport: number | null;
  resistance: number | null;
  summary: string;
  currentPrice: number;
}

export interface DashboardData {
  crowdPulse: CrowdPulseData;
  fearGreed: FearGreedData;
  prices: PriceSnapshot[];
  longShort: LongShortRatios;
  fundingRates: FundingRateData[];
  openInterest: OpenInterestData[];
  dataSourceHealth: DataSourceHealth;
  buyConclusion: BuyConclusionData | null;
}
