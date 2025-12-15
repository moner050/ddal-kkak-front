import React from 'react';
import { Sentiment } from '../../types';
import { classNames } from '../../utils/format';

interface AIScoreGaugeProps {
  score: number;
  sentiment: Sentiment;
  size?: "sm" | "md" | "lg";
  variant?: "circle" | "bar";
}

export default function AIScoreGauge({ score, sentiment, size = "md", variant = "bar" }: AIScoreGaugeProps) {
  const colorMap = {
    POS: { stroke: "#10b981", bg: "#d1fae5", text: "text-emerald-700", barBg: "bg-emerald-500" },
    NEG: { stroke: "#ef4444", bg: "#fee2e2", text: "text-red-700", barBg: "bg-red-500" },
    NEU: { stroke: "#6b7280", bg: "#f3f4f6", text: "text-gray-700", barBg: "bg-gray-500" }
  };
  const color = colorMap[sentiment];

  // 바 형태 (기본값)
  if (variant === "bar") {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={classNames("h-full transition-all duration-500", color.barBg)}
              style={{ width: `${score}%` }}
            />
          </div>
          <div className={classNames("font-extrabold text-sm", color.text, "min-w-[2.5rem] text-right")}>
            {score}점
          </div>
        </div>
      </div>
    );
  }

  // 동그란 형태 (기존 스타일)
  const sizeMap = {
    sm: { container: "h-16 w-16", text: "text-lg", label: "text-[9px]" },
    md: { container: "h-24 w-24", text: "text-2xl", label: "text-xs" },
    lg: { container: "h-32 w-32", text: "text-3xl", label: "text-sm" }
  };
  const s = sizeMap[size];

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={classNames("relative", s.container)}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        {/* 배경 원 */}
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        {/* 점수 원 */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={classNames("font-extrabold", color.text, s.text)}>{score}</div>
        <div className={classNames("text-gray-500", s.label)}>점</div>
      </div>
    </div>
  );
}
