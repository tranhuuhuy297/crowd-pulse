import { useState, useEffect } from "react";

interface GaugeChartProps {
  score: number;
  size?: number;
}

/** Returns arc color based on score bucket — green (fear/buy) to red (greed/sell) */
function getArcColor(score: number): string {
  if (score <= 20) return "#10b981"; // emerald-500 — extreme fear
  if (score <= 40) return "#34d399"; // emerald-400 — fear
  if (score <= 60) return "#a3a3a3"; // neutral-400 — neutral
  if (score <= 80) return "#fb7185"; // rose-400 — greed
  return "#f43f5e"; // rose-500 — extreme greed
}

/** SVG semicircle gauge showing score 0-100 with colored arc and needle */
export function SvgGaugeChart({ score, size = 200 }: GaugeChartProps) {
  // Animate from 0 to actual score on mount/change
  const [animatedScore, setAnimatedScore] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimatedScore(score), 50);
    return () => clearTimeout(t);
  }, [score]);

  const pad = size * 0.12;
  const cx = size / 2 + pad;
  const cy = size / 2;
  const r = size * 0.38;
  const strokeW = size * 0.07;
  const viewW = size + pad * 2;
  const viewH = size * 0.85;

  const trackD = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  // Use animatedScore for arc + needle position
  const scoreRad = Math.PI * (1 - animatedScore / 100);
  const fillEndX = cx + r * Math.cos(scoreRad);
  const fillEndY = cy - r * Math.sin(scoreRad);
  const largeArc = animatedScore > 50 ? 1 : 0;
  const fillD =
    animatedScore > 0
      ? `M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${fillEndX} ${fillEndY}`
      : "";

  const needleLen = r * 0.78;
  const nx = cx + needleLen * Math.cos(scoreRad);
  const ny = cy - needleLen * Math.sin(scoreRad);

  const color = getArcColor(animatedScore);

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
      {/* Score number — show real score, not animated */}
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
