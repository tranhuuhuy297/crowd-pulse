import type { DashboardData } from "../lib/types";
import {
  sentimentBadge,
  FEAR_GREED_TIERS,
  RATIO_TIERS,
  FUNDING_RATE_TIERS,
  OI_CHANGE_TIERS,
  BASIS_PCT_TIERS,
} from "../lib/sentiment-color-utils";

interface Props {
  data: DashboardData;
}

/** Horizontal strip of colored chips summarizing 5 key dashboard metrics at a glance */
export function MarketPulseSummaryBar({ data }: Props) {
  const avgLsRatio = data.longShort.length > 0
    ? data.longShort.reduce((s, d) => s + d.ratio, 0) / data.longShort.length
    : null;
  const avgFundingRate = data.fundingRates.length > 0
    ? data.fundingRates.reduce((s, fr) => s + fr.rate, 0) / data.fundingRates.length
    : null;
  const avgOiChange = data.openInterest.length > 0
    ? data.openInterest.reduce((s, oi) => s + oi.changePercent, 0) / data.openInterest.length
    : null;
  const avgBasis = data.futuresBasis.length > 0
    ? data.futuresBasis.reduce((s, b) => s + b.basisPct, 0) / data.futuresBasis.length
    : null;

  const chips: { key: string; label: string; value: string; badge: { classes: string } }[] = [];

  // Fear & Greed
  const fgBadge = sentimentBadge(data.fearGreed.value, FEAR_GREED_TIERS);
  chips.push({ key: "fg", label: "F&G", value: String(data.fearGreed.value), badge: fgBadge });

  // L/S Ratio
  if (avgLsRatio !== null) {
    const lsBadge = sentimentBadge(avgLsRatio, RATIO_TIERS);
    chips.push({ key: "ls", label: "L/S", value: avgLsRatio.toFixed(2), badge: lsBadge });
  }

  // Funding Rate
  if (avgFundingRate !== null) {
    const frBadge = sentimentBadge(avgFundingRate, FUNDING_RATE_TIERS);
    chips.push({ key: "fr", label: "FR", value: `${(avgFundingRate * 100).toFixed(4)}%`, badge: frBadge });
  }

  // Open Interest
  if (avgOiChange !== null) {
    const oiBadge = sentimentBadge(avgOiChange, OI_CHANGE_TIERS);
    chips.push({ key: "oi", label: "OI", value: `${avgOiChange >= 0 ? "+" : ""}${avgOiChange.toFixed(1)}%`, badge: oiBadge });
  }

  // Basis
  if (avgBasis !== null) {
    const bBadge = sentimentBadge(avgBasis, BASIS_PCT_TIERS);
    chips.push({ key: "basis", label: "Basis", value: `${avgBasis >= 0 ? "+" : ""}${avgBasis.toFixed(2)}%`, badge: bBadge });
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
