import React from 'react';
import { getRelativeTime, classNames } from '../../utils/format';
import Sparkline from './Sparkline';

interface BuffettCardProps {
  title: string;
  asOf?: string;
  data: number[];
}

export default function BuffettCard({ title, asOf, data }: BuffettCardProps) {
  const last = data[data.length - 1];
  const pct = last * 100;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {title} <span className="ml-1 text-xs text-gray-400">({getRelativeTime(new Date())})</span>
        </div>
        <div className={classNames(
          "rounded-full px-2 py-0.5 text-xs font-semibold ring-1",
          pct >= 100 ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"
        )}>
          {pct.toFixed(0)}%
        </div>
      </div>
      <div className="mt-2">
        <Sparkline data={data} stroke="#0f766e" fill="rgba(16,185,129,0.15)" showTooltip={true} unit="%" />
      </div>
      <div className="mt-1 text-[11px] text-gray-500">
        (총시가총액 / GDP 비율, 100% 초과 시 상대적 고평가 경향)
      </div>
    </div>
  );
}
