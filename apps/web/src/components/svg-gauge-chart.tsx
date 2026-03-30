interface GaugeChartProps {
  score: number;
  size?: number;
}

/** Returns arc color based on score bucket */
function getArcColor(score: number): string {
  if (score <= 20) return "#10b981"; // green — extreme fear
  if (score <= 40) return "#84cc16"; // lime — fear
  if (score <= 60) return "#eab308"; // yellow — neutral
  if (score <= 80) return "#f97316"; // orange — greed
  return "#ef4444"; // red — extreme greed
}

/** SVG semicircle gauge showing score 0-100 with colored arc and needle */
export function SvgGaugeChart({ score, size = 200 }: GaugeChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const strokeW = size * 0.07;
  const viewH = size * 0.75;

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
      width={size}
      height={viewH}
      viewBox={`0 0 ${size} ${viewH}`}
      aria-label={`Score: ${Math.round(score)}`}
    >
      {/* Background track */}
      <path
        d={trackD}
        fill="none"
        stroke="#1f2937"
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
        stroke="#e5e7eb"
        strokeWidth={2.5}
        strokeLinecap="round"
        style={{ transition: "x2 0.6s ease, y2 0.6s ease" }}
      />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={4} fill="#e5e7eb" />
      {/* Score number below arc */}
      <text
        x={cx}
        y={cy + 24}
        textAnchor="middle"
        fill="#f3f4f6"
        fontSize={size * 0.13}
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        {Math.round(score)}
      </text>
    </svg>
  );
}
