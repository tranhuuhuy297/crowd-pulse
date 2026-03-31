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

export interface FuturesBasisData {
  symbol: string;
  markPrice: number;
  indexPrice: number;
  basisPct: number;
}

export interface TopTraderLongShortData {
  symbol: string;
  ratio: number;
  longPct: number;
  shortPct: number;
}

export interface TakerBuySellData {
  symbol: string;
  buySellRatio: number;
  buyVol: number;
  sellVol: number;
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

/** Per-asset dashboard data (filtered view for one symbol) */
export interface AssetDashboardData {
  crowdPulse: CrowdPulseData;
  price: PriceSnapshot | null;
  longShort: LongShortData | null;
  fundingRate: FundingRateData | null;
  openInterest: OpenInterestData | null;
  futuresBasis: FuturesBasisData | null;
  topTraderLongShort: TopTraderLongShortData | null;
  takerBuySell: TakerBuySellData | null;
  buyConclusion: BuyConclusionData | null;
}

/** Full dashboard data with all assets + shared data */
export interface DashboardData {
  /** Per-asset data keyed by display name (BTC, ETH, etc.) */
  assets: Record<string, AssetDashboardData>;
  /** Fear & Greed is shared across all assets (crypto-wide index) */
  fearGreed: FearGreedData;
  /** All prices for the top price grid */
  prices: PriceSnapshot[];
  dataSourceHealth: DataSourceHealth;
}
