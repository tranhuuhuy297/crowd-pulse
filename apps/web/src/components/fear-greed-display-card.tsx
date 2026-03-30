import { formatPercent } from "../lib/number-format-utils";

interface FearGreedDisplayCardProps {
  value: number;
  classification: string;
  change24h: number | null;
}

/** Returns progress bar color class based on fear/greed value */
function getBarColor(value: number): string {
  if (value <= 25) return "bg-emerald-500";
  if (value <= 45) return "bg-green-400";
  if (value <= 55) return "bg-yellow-400";
  if (value <= 75) return "bg-orange-400";
  return "bg-red-500";
}

/** Returns text color class based on fear/greed value */
function getValueColor(value: number): string {
  if (value <= 25) return "text-emerald-400";
  if (value <= 45) return "text-green-400";
  if (value <= 55) return "text-yellow-400";
  if (value <= 75) return "text-orange-400";
  return "text-red-400";
}

/** Card displaying Fear & Greed index value, classification, 24h change, and progress bar */
export function FearGreedDisplayCard({ value, classification, change24h }: FearGreedDisplayCardProps) {
  const barColor = getBarColor(value);
  const valueColor = getValueColor(value);
  const isPositiveChange = change24h !== null && change24h >= 0;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Fear & Greed Index</h2>

      <div className="flex items-end justify-between">
        <div>
          <span className={`text-5xl font-bold ${valueColor}`}>{value}</span>
          <span className="text-gray-500 text-sm ml-1">/ 100</span>
        </div>
        <div className="text-right">
          <p className={`text-lg font-semibold ${valueColor}`}>{classification}</p>
          {change24h !== null && (
            <p className={`text-sm flex items-center gap-1 justify-end ${isPositiveChange ? "text-green-400" : "text-red-400"}`}>
              <span>{isPositiveChange ? "▲" : "▼"}</span>
              <span>{formatPercent(Math.abs(change24h))} 24h</span>
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-600">
        <span>Extreme Fear</span>
        <span>Extreme Greed</span>
      </div>
    </div>
  );
}
