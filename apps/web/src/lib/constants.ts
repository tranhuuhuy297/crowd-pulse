/** Binance trading pairs to track */
export const TRACKED_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"] as const;

/** Human-readable symbol names (used in UI and URL routing) */
export const SYMBOL_DISPLAY_NAMES: Record<string, string> = {
  BTCUSDT: "BTC",
  ETHUSDT: "ETH",
  SOLUSDT: "SOL",
  BNBUSDT: "BNB",
};

/** URL slug to Binance symbol mapping */
export const SLUG_TO_SYMBOL: Record<string, string> = {
  btc: "BTCUSDT",
  eth: "ETHUSDT",
  sol: "SOLUSDT",
  bnb: "BNBUSDT",
};

/** All valid asset slugs for routing */
export const ASSET_SLUGS = Object.keys(SLUG_TO_SYMBOL);

/** Default asset slug */
export const DEFAULT_ASSET_SLUG = "btc";

export const BINANCE_BASE_URL = "https://api.binance.com";
export const BINANCE_FUTURES_BASE_URL = "https://fapi.binance.com";
export const FEAR_GREED_API_URL = "https://api.alternative.me/fng";
