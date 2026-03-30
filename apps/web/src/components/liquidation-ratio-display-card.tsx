import type { LongShortData } from "../lib/types";

interface Props {
  longShort: LongShortData[];
}

/** Classify long/short ratio bias */
function classifyRatio(ratio: number): { label: string; color: string } {
  if (ratio >= 1.5) return { label: "Heavy Longs", color: "text-red-400" };
  if (ratio >= 1.1) return { label: "Long Bias", color: "text-orange-400" };
  if (ratio >= 0.9) return { label: "Balanced", color: "text-gray-400" };
  if (ratio >= 0.7) return { label: "Short Bias", color: "text-green-400" };
  return { label: "Heavy Shorts", color: "text-emerald-400" };
}

export function LiquidationRatioDisplayCard({ longShort }: Props) {
  if (longShort.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Long/Short Ratio</h3>
        <p className="text-gray-600 text-sm mt-3">No data available</p>
      </div>
    );
  }

  const avgRatio = longShort.reduce((s, r) => s + r.ratio, 0) / longShort.length;
  const classification = classifyRatio(avgRatio);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Long/Short Ratio</h3>
        <span className={`text-xs font-medium ${classification.color}`}>{classification.label}</span>
      </div>

      <p className="text-3xl font-bold">{avgRatio.toFixed(2)}</p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {longShort.map((ls) => {
          const cls = classifyRatio(ls.ratio);
          return (
            <div key={ls.symbol} className="bg-gray-800 rounded-lg px-3 py-2">
              <span className="text-xs text-gray-400">{ls.symbol}</span>
              <p className={`text-sm font-semibold ${cls.color}`}>{ls.ratio.toFixed(2)}</p>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500">
        {avgRatio > 1 ? "More longs than shorts" : "More shorts than longs"} (Binance Futures)
      </p>
    </div>
  );
}
