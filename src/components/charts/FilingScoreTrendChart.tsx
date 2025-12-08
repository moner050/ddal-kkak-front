import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface FilingScoreTrendChartProps {
  scores: number[];
  labels?: string[];
}

export default function FilingScoreTrendChart({ scores, labels }: FilingScoreTrendChartProps) {
  // 데이터 포맷팅
  const chartData = scores.map((score, index) => ({
    name: labels?.[index] || `${scores.length - index}회 전`,
    score: score,
    index: index,
  }));

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">{data.name}</div>
          <div className="text-sm font-bold text-indigo-600">{data.score}점</div>
        </div>
      );
    }
    return null;
  };

  // 점수 색상 결정
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // emerald-500
    if (score >= 70) return '#3b82f6'; // blue-500
    if (score >= 60) return '#6b7280'; // gray-500
    if (score >= 50) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  // 평균 점수
  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-gray-600">
          평균: <span className="font-bold text-indigo-600">{avgScore.toFixed(1)}점</span>
        </div>
        <div className="text-xs text-gray-500">
          {scores.length}개 공시 이력
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10 }}
            stroke="#9ca3af"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
            stroke="#9ca3af"
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: '#6366f1', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* 점수 범례 */}
      <div className="flex flex-wrap gap-2 mt-3 justify-center">
        {[
          { label: '우수', min: 80, color: 'bg-emerald-500' },
          { label: '양호', min: 70, color: 'bg-blue-500' },
          { label: '보통', min: 60, color: 'bg-gray-500' },
          { label: '주의', min: 50, color: 'bg-orange-500' },
          { label: '위험', min: 0, color: 'bg-red-500' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
            <span className="text-[10px] text-gray-600">{item.label} ({item.min}+)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
