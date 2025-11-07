import React from 'react';
import { formatNumber, getRelativeTime, classNames } from '../../utils/format';
import Sparkline from './Sparkline';

interface LineChartCardProps {
  title: string;
  unit: string;
  asOf?: string;
  data: number[];
}

export default function LineChartCard({ title, unit, asOf, data }: LineChartCardProps) {
  const last = data[data.length - 1];
  const first = data[0];
  const diff = last - first;
  const pct = first ? (diff / first) * 100 : 0;
  const up = diff >= 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {title} <span className="ml-1 text-xs text-gray-400">({getRelativeTime(new Date())})</span>
        </div>
        <div className={classNames(
          "rounded-full px-2 py-0.5 text-xs font-semibold ring-1",
          up ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-red-50 text-red-700 ring-red-200"
        )}>
          {up ? "+" : ""}{pct.toFixed(2)}%
        </div>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div className="text-2xl font-extrabold text-gray-900">
          {formatNumber(last, { decimals: 2 })} <span className="text-sm font-semibold text-gray-500">{unit}</span>
        </div>
      </div>
      <div className="mt-2">
        <Sparkline data={data} showTooltip={true} unit={unit} />
      </div>
    </div>
  );
}
