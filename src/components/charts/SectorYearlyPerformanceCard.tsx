/**
 * GICS 섹터 연간 성과 카드 컴포넌트
 *
 * 기능:
 * - 섹터별 연초 대비 수익률 바 차트
 * - 섹터별 월별 누적 수익률 라인 차트
 * - 주요 통계 (최고/최저 섹터, 평균 수익률)
 */

import React, { useState } from 'react';
import type {
  YearlySectorPerformanceResult,
  SectorYearlySummary,
  MonthlySectorData
} from '../../services/sectorPerformance';
import { formatNumber } from '../../utils/format';

interface SectorYearlyPerformanceCardProps {
  data: YearlySectorPerformanceResult;
  loading?: boolean;
}

/**
 * 바 차트 컴포넌트 - 섹터별 연초 대비 수익률
 */
function SectorBarChart({ summaries }: { summaries: SectorYearlySummary[] }) {
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  if (summaries.length === 0) {
    return <div className="text-center text-gray-500 py-8">데이터가 없습니다</div>;
  }

  // 최대 수익률 (차트 스케일링용)
  const maxReturn = Math.max(...summaries.map(s => Math.abs(s.ytdReturn)));
  const scale = maxReturn > 0 ? 100 / (maxReturn * 1.1) : 1; // 10% 여유 공간

  return (
    <div className="space-y-2">
      {summaries.map((summary) => {
        const isPositive = summary.ytdReturn >= 0;
        const width = Math.abs(summary.ytdReturn) * scale;
        const isHovered = hoveredSector === summary.sectorKr;

        return (
          <div
            key={summary.sector}
            className="relative group"
            onMouseEnter={() => setHoveredSector(summary.sectorKr)}
            onMouseLeave={() => setHoveredSector(null)}
          >
            <div className="flex items-center gap-3">
              {/* 섹터명 */}
              <div className="w-32 text-sm font-medium text-gray-700 truncate">
                {summary.sectorKr}
              </div>

              {/* 바 차트 */}
              <div className="flex-1 relative h-8">
                <div
                  className={`absolute top-0 bottom-0 left-0 rounded transition-all duration-300 ${
                    isHovered ? 'opacity-100' : 'opacity-90'
                  }`}
                  style={{
                    width: `${width}%`,
                    backgroundColor: summary.color,
                  }}
                />
                {/* 수익률 텍스트 */}
                <div className="absolute top-0 bottom-0 left-0 right-0 flex items-center px-2">
                  <span className={`text-sm font-bold ${width > 20 ? 'text-white' : 'text-gray-700 ml-2'}`}>
                    {isPositive ? '+' : ''}{summary.ytdReturn.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 호버 시 툴팁 */}
            {isHovered && (
              <div className="absolute left-32 top-10 z-10 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
                <div className="font-semibold mb-1">{summary.sectorKr}</div>
                <div className="space-y-0.5 text-gray-300">
                  <div>연초 대비: {isPositive ? '+' : ''}{summary.ytdReturn.toFixed(2)}%</div>
                  <div>최고: +{summary.highestReturn.toFixed(2)}%</div>
                  <div>최저: {summary.lowestReturn.toFixed(2)}%</div>
                  <div>변동성: {summary.volatility.toFixed(2)}%</div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * 라인 차트 컴포넌트 - 섹터별 월별 누적 수익률 추이
 */
function SectorLineChart({
  monthlyData,
  summaries
}: {
  monthlyData: MonthlySectorData[];
  summaries: SectorYearlySummary[];
}) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [selectedSectors, setSelectedSectors] = useState<Set<string>>(
    new Set(summaries.map(s => s.sectorKr))
  );

  if (monthlyData.length === 0 || summaries.length === 0) {
    return <div className="text-center text-gray-500 py-8">데이터가 없습니다</div>;
  }

  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Y축 범위 계산
  const allReturns = monthlyData.flatMap(d =>
    summaries
      .filter(s => selectedSectors.has(s.sectorKr))
      .map(s => d[s.sectorKr] as number)
      .filter(v => typeof v === 'number')
  );
  const minReturn = Math.min(0, ...allReturns);
  const maxReturn = Math.max(0, ...allReturns);
  const yRange = Math.max(Math.abs(minReturn), Math.abs(maxReturn)) * 1.1;

  // 좌표 변환 함수
  const xScale = (index: number) => padding.left + (index / (monthlyData.length - 1)) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight / 2 - (value / yRange) * (chartHeight / 2);

  // 섹터 선택/해제
  const toggleSector = (sectorKr: string) => {
    setSelectedSectors(prev => {
      const next = new Set(prev);
      if (next.has(sectorKr)) {
        next.delete(sectorKr);
      } else {
        next.add(sectorKr);
      }
      return next;
    });
  };

  // 라인 경로 생성
  const createLinePath = (sectorKr: string) => {
    const points = monthlyData
      .map((d, i) => {
        const value = d[sectorKr] as number;
        if (typeof value !== 'number') return null;
        return `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(value)}`;
      })
      .filter(p => p !== null)
      .join(' ');
    return points;
  };

  return (
    <div className="space-y-4">
      {/* 범례 */}
      <div className="flex flex-wrap gap-2">
        {summaries.map(s => {
          const isSelected = selectedSectors.has(s.sectorKr);
          return (
            <button
              key={s.sector}
              onClick={() => toggleSector(s.sectorKr)}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                isSelected
                  ? 'opacity-100 ring-2'
                  : 'opacity-30 hover:opacity-60'
              }`}
              style={{
                backgroundColor: isSelected ? `${s.color}20` : `${s.color}10`,
                color: s.color,
                ringColor: s.color,
              }}
            >
              <span
                className="inline-block w-3 h-3 rounded-full mr-1"
                style={{ backgroundColor: s.color }}
              />
              {s.sectorKr}
            </button>
          );
        })}
      </div>

      {/* 차트 */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = e.clientX - rect.left;
            const chartRelX = (relX / rect.width) * width - padding.left;
            const index = Math.round((chartRelX / chartWidth) * (monthlyData.length - 1));
            const clampedIndex = Math.max(0, Math.min(monthlyData.length - 1, index));
            setHoveredMonth(clampedIndex);
          }}
          onMouseLeave={() => setHoveredMonth(null)}
        >
          {/* 격자선 */}
          <g className="grid-lines">
            {/* Y축 격자선 */}
            {[-yRange, -yRange / 2, 0, yRange / 2, yRange].map((value, i) => (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={yScale(value)}
                  x2={width - padding.right}
                  y2={yScale(value)}
                  stroke="#e5e7eb"
                  strokeWidth={value === 0 ? 2 : 1}
                  strokeDasharray={value === 0 ? '0' : '4 2'}
                />
                <text
                  x={padding.left - 10}
                  y={yScale(value) + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                >
                  {value.toFixed(0)}%
                </text>
              </g>
            ))}
          </g>

          {/* X축 레이블 */}
          <g className="x-labels">
            {monthlyData.map((d, i) => {
              // 짝수 인덱스만 표시 (너무 많으면 겹침)
              if (i % 2 !== 0 && i !== monthlyData.length - 1) return null;
              return (
                <text
                  key={i}
                  x={xScale(i)}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {d.month}
                </text>
              );
            })}
          </g>

          {/* 라인들 */}
          {summaries
            .filter(s => selectedSectors.has(s.sectorKr))
            .map(s => (
              <path
                key={s.sector}
                d={createLinePath(s.sectorKr)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="transition-all"
              />
            ))}

          {/* 호버 라인 */}
          {hoveredMonth !== null && (
            <>
              <line
                x1={xScale(hoveredMonth)}
                y1={padding.top}
                x2={xScale(hoveredMonth)}
                y2={height - padding.bottom}
                stroke="#6b7280"
                strokeWidth={1}
                strokeDasharray="4 2"
              />
              {summaries
                .filter(s => selectedSectors.has(s.sectorKr))
                .map(s => {
                  const value = monthlyData[hoveredMonth][s.sectorKr] as number;
                  if (typeof value !== 'number') return null;
                  return (
                    <circle
                      key={s.sector}
                      cx={xScale(hoveredMonth)}
                      cy={yScale(value)}
                      r={4}
                      fill={s.color}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                })}
            </>
          )}
        </svg>

        {/* 툴팁 */}
        {hoveredMonth !== null && (
          <div
            className="absolute bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none z-10"
            style={{
              left: `${((hoveredMonth / (monthlyData.length - 1)) * 100)}%`,
              top: '10px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold mb-1">{monthlyData[hoveredMonth].month}</div>
            <div className="space-y-0.5">
              {summaries
                .filter(s => selectedSectors.has(s.sectorKr))
                .map(s => {
                  const value = monthlyData[hoveredMonth][s.sectorKr] as number;
                  if (typeof value !== 'number') return null;
                  return (
                    <div key={s.sector} className="flex items-center gap-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-gray-300">{s.sectorKr}:</span>
                      <span className="font-semibold">
                        {value >= 0 ? '+' : ''}{value.toFixed(2)}%
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 메인 컴포넌트
 */
export default function SectorYearlyPerformanceCard({
  data,
  loading = false
}: SectorYearlyPerformanceCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
          <div className="h-80 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const { summaries, monthlyData, startDate, endDate, bestSector, worstSector, avgReturn } = data;

  if (summaries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          📊 GICS 섹터별 연간 성과 ({startDate.substring(0, 4)}년)
        </h3>
        <div className="text-center text-gray-500 py-12">
          데이터를 불러올 수 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
      {/* 헤더 */}
      <div>
        <h3 className="text-lg font-bold text-gray-900">
          📊 GICS 섹터별 연간 성과 ({startDate.substring(0, 4)}년)
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          기간: {startDate} ~ {endDate}
        </p>
      </div>

      {/* 주요 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div className="text-xs font-medium text-green-700 mb-1">🏆 최고 성과 섹터</div>
          <div className="text-lg font-bold text-green-900">
            {bestSector?.sectorKr}
          </div>
          <div className="text-2xl font-extrabold text-green-600 mt-1">
            +{bestSector?.ytdReturn.toFixed(2)}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-1">📈 평균 수익률</div>
          <div className="text-lg font-bold text-gray-900">전체 섹터</div>
          <div className={`text-2xl font-extrabold mt-1 ${avgReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(2)}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border border-red-200">
          <div className="text-xs font-medium text-red-700 mb-1">📉 최저 성과 섹터</div>
          <div className="text-lg font-bold text-red-900">
            {worstSector?.sectorKr}
          </div>
          <div className="text-2xl font-extrabold text-red-600 mt-1">
            {worstSector?.ytdReturn && worstSector.ytdReturn >= 0 ? '+' : ''}{worstSector?.ytdReturn.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* 바 차트 - 섹터별 수익률 */}
      <div>
        <h4 className="text-md font-bold text-gray-800 mb-3">섹터별 연초 대비 수익률</h4>
        <SectorBarChart summaries={summaries} />
      </div>

      {/* 라인 차트 - 월별 추이 */}
      <div>
        <h4 className="text-md font-bold text-gray-800 mb-3">섹터별 월별 누적 수익률 추이</h4>
        <p className="text-xs text-gray-500 mb-3">
          💡 범례를 클릭하여 특정 섹터를 선택/해제할 수 있습니다
        </p>
        <SectorLineChart monthlyData={monthlyData} summaries={summaries} />
      </div>
    </div>
  );
}
