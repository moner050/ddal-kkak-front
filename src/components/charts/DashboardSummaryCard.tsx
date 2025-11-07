import React from 'react';
import { formatNumber, getRelativeTime } from '../../utils/format';

function classifyFG(index: number, variant: "US" | "KR" = "US") {
  const t = variant === "KR" ? { greed: 65, fear: 35 } : { greed: 70, fear: 40 };
  if (index >= t.greed) return { label: "탐욕", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  if (index < t.fear) return { label: "공포", cls: "bg-blue-50 text-blue-700 ring-blue-200" };
  return { label: "중립", cls: "bg-gray-100 text-gray-700 ring-gray-300" };
}

interface DashboardSummaryCardProps {
  usdkrw: number;
  gold: number;
  fearGreedUS: number;
  fearGreedKR: number;
  lastUpdate: Date;
}

export default function DashboardSummaryCard({
  usdkrw,
  gold,
  fearGreedUS,
  fearGreedKR,
  lastUpdate
}: DashboardSummaryCardProps) {
  const metrics = [
    { label: "USD/KRW", value: formatNumber(usdkrw, { decimals: 2 }), unit: "원", change: 0 },
    { label: "금 시세", value: formatNumber(gold, { decimals: 2 }), unit: "$/oz", change: 0 },
    { label: "US 공포·탐욕", value: fearGreedUS, unit: "", sentiment: classifyFG(fearGreedUS, "US").label },
    { label: "KR 공포·탐욕", value: fearGreedKR, unit: "", sentiment: classifyFG(fearGreedKR, "KR").label }
  ];

  return (
    <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-gray-900">📊 시장 현황 요약</h2>
        <span className="text-xs text-gray-600 flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          {getRelativeTime(lastUpdate)}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className="rounded-xl bg-white/80 backdrop-blur p-3 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="text-xs text-gray-600 mb-1">{m.label}</div>
            <div className="flex items-end gap-1">
              <div className="text-xl font-extrabold text-gray-900">
                {typeof m.value === "number" ? formatNumber(m.value) : m.value}
              </div>
              {m.unit && <div className="text-xs text-gray-500 pb-0.5">{m.unit}</div>}
            </div>
            {m.sentiment && (
              <div className="mt-1 text-xs text-gray-600">
                {m.sentiment}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
