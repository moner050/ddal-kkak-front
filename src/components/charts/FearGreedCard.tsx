import React from 'react';
import { classNames } from '../../utils/format';

function classifyFG(index: number, variant: "US" | "KR" = "US") {
  const t = variant === "KR" ? { greed: 65, fear: 35 } : { greed: 70, fear: 40 };
  if (index >= t.greed) return { label: "탐욕", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  if (index < t.fear) return { label: "공포", cls: "bg-blue-50 text-blue-700 ring-blue-200" };
  return { label: "중립", cls: "bg-gray-100 text-gray-700 ring-gray-300" };
}

function calcDeltaAndMA(series: number[], window = 7) {
  if (!series || series.length < 2) return { delta: 0, ma: series?.[series.length - 1] ?? 0 };
  const delta = series[series.length - 1] - series[series.length - 2];
  const start = Math.max(0, series.length - window);
  const arr = series.slice(start);
  const ma = arr.reduce((a, b) => a + b, 0) / arr.length;
  return { delta, ma };
}

interface FearGreedCardProps {
  title?: string;
  index?: number;
  asOf?: string;
  variant?: "US" | "KR";
  series: number[];
}

export default function FearGreedCard({
  title = "공포·탐욕 지수",
  index = 62,
  asOf,
  variant = "US",
  series
}: FearGreedCardProps) {
  const { label, cls } = classifyFG(index, variant);
  const barPct = Math.max(0, Math.min(100, index));
  const { delta, ma } = calcDeltaAndMA(series || [index]);
  const sign = delta > 0 ? "+" : delta < 0 ? "" : "";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-600">
        {title} {asOf ? <span className="ml-1 text-xs text-gray-400">({asOf})</span> : null}
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div className="text-4xl font-extrabold text-gray-900">{index}</div>
        <div className={classNames("rounded-full border px-2 py-1 text-xs font-semibold ring-1", cls)}>
          {label}
          {variant === "KR" && <span className="ml-1 text-[11px] text-gray-500">KOSPI 심리</span>}
        </div>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-yellow-400 to-red-600"
          style={{ width: `${barPct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-gray-500">
        <span>공포</span>
        <span>중립</span>
        <span>탐욕</span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px]">
        <span className={classNames(
          "rounded-full px-2 py-0.5 ring-1",
          delta >= 0 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-red-50 text-red-700 ring-red-200"
        )}>
          Δ {sign}{delta.toFixed(1)}
        </span>
        <span className="rounded-full bg-gray-50 px-2 py-0.5 text-gray-700 ring-1 ring-gray-200">
          MA(7) {ma.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
