import { FEAR_GREED_API_URL } from "@crowdpulse/shared";

export interface FearGreedData {
  value: number;
  valueClassification: string;
  timestamp: Date;
}

interface FearGreedApiEntry {
  value: string;
  value_classification: string;
  timestamp: string;
}

interface FearGreedApiResponse {
  data: FearGreedApiEntry[];
}

/**
 * Fetches Fear & Greed Index entries from alternative.me API.
 * @param limit - Number of entries to fetch (default 2: today + yesterday)
 */
export async function fetchFearGreed(limit = 2): Promise<FearGreedData[]> {
  const url = `${FEAR_GREED_API_URL}/?limit=${limit}&format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Fear & Greed API error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as FearGreedApiResponse;

  return json.data.map((entry) => ({
    value: parseInt(entry.value, 10),
    valueClassification: entry.value_classification,
    // API returns Unix timestamp in seconds — convert to Date
    timestamp: new Date(parseInt(entry.timestamp, 10) * 1000),
  }));
}
