import React from 'react';
import { classNames } from '../../utils/format';

interface ImpactBadgeProps {
  direction: "POS" | "NEG" | "NEU";
  confidence?: number;
}

export default function ImpactBadge({ direction, confidence = 0.7 }: ImpactBadgeProps) {
  const map = {
    POS: { label: "긍정", ring: "ring-green-500/30", bg: "bg-green-50", text: "text-green-700" },
    NEG: { label: "부정", ring: "ring-red-500/30", bg: "bg-red-50", text: "text-red-700" },
    NEU: { label: "횡보", ring: "ring-gray-500/30", bg: "bg-gray-50", text: "text-gray-700" },
  } as const;

  const s = map[direction] || map.NEU;

  return (
    <span className={classNames(
      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ring-1",
      s.bg,
      s.text,
      s.ring
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label} · {(confidence * 100).toFixed(0)}%
    </span>
  );
}
