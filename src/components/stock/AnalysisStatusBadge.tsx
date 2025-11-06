import React from 'react';
import { Sentiment } from '../../types';
import { classNames } from '../../utils/format';

interface AnalysisStatusBadgeProps {
  sentiment: Sentiment;
  confidence?: number;
}

export default function AnalysisStatusBadge({ sentiment, confidence }: AnalysisStatusBadgeProps) {
  const map = {
    POS: { label: "긍정", emoji: "📈", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
    NEG: { label: "부정", emoji: "📉", bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200" },
    NEU: { label: "중립", emoji: "➡️", bg: "bg-gray-50", text: "text-gray-700", ring: "ring-gray-200" }
  };
  const s = map[sentiment];

  return (
    <div className={classNames(
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ring-1",
      s.bg,
      s.text,
      s.ring
    )}>
      <span>{s.emoji}</span>
      <span>{s.label}</span>
      {confidence !== undefined && (
        <span className="text-xs opacity-75">({(confidence * 100).toFixed(0)}%)</span>
      )}
    </div>
  );
}
