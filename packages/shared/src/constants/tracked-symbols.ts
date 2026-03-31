/** Binance trading pairs to track */
export const TRACKED_SYMBOLS = ["BTCUSDT"] as const;

/** Human-readable symbol names */
export const SYMBOL_DISPLAY_NAMES: Record<string, string> = {
  BTCUSDT: "BTC",
};

export const BINANCE_BASE_URL = "https://api.binance.com";
export const BINANCE_FUTURES_BASE_URL = "https://fapi.binance.com";
export const BLOCKCHAIN_INFO_API_URL = "https://api.blockchain.info";
export const FEAR_GREED_API_URL = "https://api.alternative.me/fng";

/** Google Trends keywords to track for crypto interest */
export const GOOGLE_TRENDS_KEYWORDS = ["bitcoin", "crypto", "ethereum", "buy crypto", "sell crypto"] as const;

/** Reddit crypto subreddits to crawl for sentiment analysis */
export const REDDIT_SUBREDDITS = ["CryptoCurrency", "Bitcoin", "ethereum", "solana"] as const;
