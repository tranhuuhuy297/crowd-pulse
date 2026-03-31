import type { AssetDashboardData, FearGreedData } from "../lib/types";
import {
  sentimentBadge,
  FEAR_GREED_TIERS,
  RATIO_TIERS,
  FUNDING_RATE_TIERS,
  OI_CHANGE_TIERS,
  BASIS_PCT_TIERS,
} from "../lib/sentiment-color-utils";

interface Props {
  asset: AssetDashboardData;
  fearGreed: FearGreedData;
}

/** Horizontal strip of colored chips summarizing key metrics for the selected asset */
export function MarketPulseSummaryBar({ asset, fearGreed }: Props) {
  const chips: { key: string; label: string; value: string; badge: { classes: string } }[] = [];

  // Fear & Greed (shared)
  const fgBadge = sentimentBadge(fearGreed.value, FEAR_GREED_TIERS);
  chips.push({ key: "fg", label: "F&G", value: String(fearGreed.value), badge: fgBadge });

  // L/S Ratio
  if (asset.longShort) {
    const lsBadge = sentimentBadge(asset.longShort.ratio, RATIO_TIERS);
    chips.push({ key: "ls", label: "L/S", value: asset.longShort.ratio.toFixed(2), badge: lsBadge });
  }

  // Funding Rate
  if (asset.fundingRate) {
    const frBadge = sentimentBadge(asset.fundingRate.rate, FUNDING_RATE_TIERS);
    chips.push({ key: "fr", label: "FR", value: `${(asset.fundingRate.rate * 100).toFixed(4)}%`, badge: frBadge });
  }

  // Open Interest
  if (asset.openInterest) {
    const oiBadge = sentimentBadge(asset.openInterest.changePercent, OI_CHANGE_TIERS);
    chips.push({ key: "oi", label: "OI", value: `${asset.openInterest.changePercent >= 0 ? "+" : ""}${asset.openInterest.changePercent.toFixed(1)}%`, badge: oiBadge });
  }

  // Basis
  if (asset.futuresBasis) {
    const bBadge = sentimentBadge(asset.futuresBasis.basisPct, BASIS_PCT_TIERS);
    chips.push({ key: "basis", label: "Basis", value: `${asset.futuresBasis.basisPct >= 0 ? "+" : ""}${asset.futuresBasis.basisPct.toFixed(2)}%`, badge: bBadge });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${chip.badge.classes}`}
        >
          {chip.label}: {chip.value}
        </span>
      ))}
    </div>
  );
}
