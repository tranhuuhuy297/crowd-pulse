interface GaugeChartProps {
  score: number;
  size?: number;
}

/** Returns arc color based on score bucket — green (fear/buy) to red (greed/sell) */
function getArcColor(score: number): string {
  if (score <= 20) return "#22c55e"; // green-500 — extreme fear
  if (score <= 40) return "#4ade80"; // green-400 — fear
  if (score <= 60) return "#a3a3a3"; // neutral-400 — neutral
  if (score <= 80) return "#f87171"; // red-400 — greed
  return "#ef4444"; // red-500 — extreme greed
}

/** SVG semicircle gauge showing score 0-100 with colored arc and needle */
export function SvgGaugeChart({ score, size = 200 }: GaugeChartProps) {
  const pad = size * 0.12; // horizontal padding for Fear/Greed labels
  const cx = size / 2 + pad;
  const cy = size / 2;
  const r = size * 0.38;
  const strokeW = size * 0.07;
  const viewW = size + pad * 2;
  const viewH = size * 0.85;

  // Arc math: semicircle from left (180°) to right (0°) going over top
  // We use standard SVG arc going counterclockwise from (cx-r, cy) to (cx+r, cy)
  const trackD = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  // Score fill: 0 = left, 100 = right. Angle from PI to 0 (left to right over top)
  const scoreRad = Math.PI * (1 - score / 100);
  const fillEndX = cx + r * Math.cos(scoreRad);
  const fillEndY = cy - r * Math.sin(scoreRad);
  const largeArc = score > 50 ? 1 : 0;
  const fillD =
    score > 0
      ? `M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${fillEndX} ${fillEndY}`
      : "";

  // Needle points from center toward the score position on arc
  const needleLen = r * 0.78;
  const nx = cx + needleLen * Math.cos(scoreRad);
  const ny = cy - needleLen * Math.sin(scoreRad);

  const color = getArcColor(score);

  return (
    <svg
      width={viewW}
      height={viewH}
      viewBox={`0 0 ${viewW} ${viewH}`}
      aria-label={`Score: ${Math.round(score)}`}
    >
      {/* Background track */}
      <path
        d={trackD}
        fill="none"
        stroke="var(--gauge-track)"
        strokeWidth={strokeW}
        strokeLinecap="round"
      />
      {/* Colored fill arc */}
      {fillD && (
        <path
          d={fillD}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          style={{ transition: "d 0.6s ease" }}
        />
      )}
      {/* Needle line */}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke="var(--gauge-needle)"
        strokeWidth={2.5}
        strokeLinecap="round"
        style={{ transition: "x2 0.6s ease, y2 0.6s ease" }}
      />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={4} fill="var(--gauge-needle)" />
      {/* Score number below arc */}
      <text
        x={cx}
        y={cy + 24}
        textAnchor="middle"
        fill="var(--gauge-score-text)"
        fontSize={size * 0.13}
        fontWeight="bold"
        fontFamily="var(--font-body)"
      >
        {Math.round(score)}
      </text>
      {/* Fear/Greed labels at arc endpoints */}
      <text x={cx - r} y={cy + strokeW + 14} textAnchor="middle" fill="var(--gauge-label-text)" fontSize={size * 0.06} fontFamily="var(--font-body)">
        Fear
      </text>
      <text x={cx + r} y={cy + strokeW + 14} textAnchor="middle" fill="var(--gauge-label-text)" fontSize={size * 0.06} fontFamily="var(--font-body)">
        Greed
      </text>
    </svg>
  );
}
