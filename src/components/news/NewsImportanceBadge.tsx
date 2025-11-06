import React from 'react';
import { classNames } from '../../utils/format';

interface NewsImportanceBadgeProps {
  score: number;
}

export default function NewsImportanceBadge({ score }: NewsImportanceBadgeProps) {
  const tone = score >= 8
    ? { c: "bg-rose-50 text-rose-700 ring-rose-200" }
    : score >= 5
    ? { c: "bg-amber-50 text-amber-800 ring-amber-200" }
    : { c: "bg-gray-50 text-gray-700 ring-gray-200" };

  return (
    <span className={classNames(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1",
      tone.c
    )}>
      중요도 {score}/10
    </span>
  );
}
