import React, { useState } from 'react';
import { formatNumber } from '../../utils/format';

interface SparklineProps {
  data?: number[];
  height?: number;
  stroke?: string;
  fill?: string;
  showTooltip?: boolean;
  unit?: string;
}

export default function Sparkline({
  data = [],
  height = 120,
  stroke = "#4338ca",
  fill = "rgba(99,102,241,0.15)",
  showTooltip = false,
  unit = ""
}: SparklineProps) {
  const width = 500;
  const n = data.length;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (n === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);

  const y = (v: number) => {
    if (max === min) return height / 2;
    return height - ((v - min) / (max - min)) * height;
  };

  const x = (i: number) => (i / (n - 1)) * width;
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
  const area = `${d} L ${width} ${height} L 0 ${height} Z`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!showTooltip) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const pct = relX / rect.width;
    const idx = Math.round(pct * (n - 1));
    const clampedIdx = Math.max(0, Math.min(n - 1, idx));
    setHoveredIndex(clampedIdx);
    setTooltipPos({ x: relX, y: e.clientY - rect.top });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-28 w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <path d={area} fill={fill} />
        <path d={d} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {showTooltip && hoveredIndex !== null && (
          <>
            <line
              x1={x(hoveredIndex)}
              y1={0}
              x2={x(hoveredIndex)}
              y2={height}
              stroke="#6b7280"
              strokeWidth={1}
              strokeDasharray="4 2"
            />
            <circle
              cx={x(hoveredIndex)}
              cy={y(data[hoveredIndex])}
              r={4}
              fill={stroke}
              stroke="white"
              strokeWidth={2}
            />
          </>
        )}
      </svg>
      {showTooltip && hoveredIndex !== null && (
        <div
          className="absolute z-10 rounded-lg bg-gray-900 px-2 py-1 text-xs text-white shadow-lg pointer-events-none"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 30,
            transform: "translateX(-50%)"
          }}
        >
          {formatNumber(data[hoveredIndex], { decimals: 2 })} {unit}
        </div>
      )}
    </div>
  );
}
