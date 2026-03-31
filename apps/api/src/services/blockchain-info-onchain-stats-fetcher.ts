import { BLOCKCHAIN_INFO_API_URL } from "@crowdpulse/shared";
import { logger } from "../lib/logger-instance";

export interface BlockchainStats {
  hashRate: number;
  txCount: number;
  tradeVolumeBtc: number;
  difficulty: number;
  timestamp: Date;
}

interface BlockchainInfoApiResponse {
  hash_rate: number;
  n_tx: number;
  trade_volume_btc: number;
  difficulty: number;
}

/**
 * Fetches BTC network stats from blockchain.info free public API.
 * No API key required. Returns null on error for graceful degradation.
 */
export async function fetchBlockchainStats(): Promise<BlockchainStats | null> {
  const url = `${BLOCKCHAIN_INFO_API_URL}/stats`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      logger.warn({ status: response.status }, "blockchain.info stats request failed");
      return null;
    }

    const data = (await response.json()) as BlockchainInfoApiResponse;

    return {
      hashRate: data.hash_rate ?? 0,
      txCount: data.n_tx ?? 0,
      tradeVolumeBtc: data.trade_volume_btc ?? 0,
      difficulty: data.difficulty ?? 0,
      timestamp: new Date(),
    };
  } catch (err) {
    logger.warn({ err }, "blockchain.info stats fetch error");
    return null;
  }
}
