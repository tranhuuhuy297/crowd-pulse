/** Binance trading pairs to track */
export const TRACKED_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"] as const;

/** Human-readable symbol names */
export const SYMBOL_DISPLAY_NAMES: Record<string, string> = {
  BTCUSDT: "BTC",
  ETHUSDT: "ETH",
  SOLUSDT: "SOL",
  BNBUSDT: "BNB",
};

export const BINANCE_BASE_URL = "https://api.binance.com";
export const FEAR_GREED_API_URL = "https://api.alternative.me/fng";
