import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface EtfSectorPieChartProps {
  sectorWeightings: Record<string, number>;
  topN?: number;
}

// 섹터별 색상 팔레트
const SECTOR_COLORS: Record<string, string> = {
  'Technology': '#6366f1', // indigo
  'Healthcare': '#10b981', // emerald
  'Financial Services': '#f59e0b', // amber
  'Consumer Cyclical': '#ec4899', // pink
  'Communication Services': '#8b5cf6', // purple
  'Industrials': '#3b82f6', // blue
  'Consumer Defensive': '#14b8a6', // teal
  'Energy': '#ef4444', // red
  'Utilities': '#6b7280', // gray
  'Real Estate': '#84cc16', // lime
  'Basic Materials': '#f97316', // orange
};

const DEFAULT_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6',
  '#3b82f6', '#14b8a6', '#ef4444', '#6b7280', '#84cc16',
];

export default function EtfSectorPieChart({ sectorWeightings, topN = 5 }: EtfSectorPieChartProps) {
  // 섹터 데이터를 비중 순으로 정렬
  const sortedSectors = Object.entries(sectorWeightings)
    .sort((a, b) => b[1] - a[1]);

  // Top N만 표시하고 나머지는 "기타"로 묶음
  const topSectors = sortedSectors.slice(0, topN);
  const otherSectors = sortedSectors.slice(topN);
  const otherWeight = otherSectors.reduce((sum, [_, weight]) => sum + weight, 0);

  // 차트 데이터 생성
  const chartData = [
    ...topSectors.map(([name, value]) => ({ name, value })),
    ...(otherWeight > 0 ? [{ name: '기타', value: otherWeight }] : []),
  ];

  // 색상 결정
  const getColor = (sectorName: string, index: number) => {
    if (sectorName === '기타') return '#9ca3af'; // gray-400
    return SECTOR_COLORS[sectorName] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  };

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
          <div className="text-xs font-semibold text-gray-900 mb-1">{data.name}</div>
          <div className="text-sm font-bold text-indigo-600">{data.value.toFixed(2)}%</div>
        </div>
      );
    }
    return null;
  };

  // 커스텀 라벨
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // 5% 미만은 라벨 생략

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.name, index)} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* 범례 */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {chartData.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: getColor(entry.name, index) }}
            ></div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-900 truncate font-medium">{entry.name}</div>
              <div className="text-[10px] text-gray-500">{entry.value.toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
