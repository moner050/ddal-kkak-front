/**
 * 통합 GICS 섹터 성과 카드 컴포넌트
 *
 * 기능:
 * - 단기 성과 (1일, 1주일, 1개월 전 대비)
 * - 연간 성과 (연초 대비 수익률) - 바 차트와 라인 차트 포함
 * - 색상: 초록(상승), 빨강(하락)으로 단순화
 * - 탭 방식으로 단기/연간 뷰 전환
 */

import React, { useState } from 'react';
import type {
  SectorPerformance,
  YearlySectorPerformanceResult,
  SectorYearlySummary,
  MonthlySectorData,
  DateRangeType
} from '../../services/sectorPerformance';
import { classNames } from '../../utils/format';

interface UnifiedSectorPerformanceCardProps {
  // 단기 성과 데이터
  performances: SectorPerformance[];
  todayDate?: string;
  yesterdayDate?: string;
  onShortTermRangeChange?: (rangeType: DateRangeType, startDate?: string, endDate?: string) => void;
  onSectorClick?: (sector: string) => void;
  loadingShortTerm?: boolean;

  // 연간 성과 데이터
  yearlyData: YearlySectorPerformanceResult;
  onYearlyRangeChange?: (rangeType: DateRangeType, startDate?: string, endDate?: string) => void;
  loadingYearly?: boolean;
}

/**
 * 바 차트 컴포넌트 - 단순화된 버전 (초록/빨강만 사용)
 */
function SimpleSectorBarChart({
  data,
  onSectorClick
}: {
  data: Array<{ name: string; value: number }>;
  onSectorClick?: (sector: string) => void;
}) {
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  if (data.length === 0) {
    return <div className="text-center text-gray-500 py-8">데이터가 없습니다</div>;
  }

  // 최대 절댓값 (차트 스케일링용)
  const maxAbsValue = Math.max(...data.map(d => Math.abs(d.value)));
  const scale = maxAbsValue > 0 ? 100 / (maxAbsValue * 1.1) : 1;

  return (
    <div className="space-y-2">
      {data.map((item) => {
        const isPositive = item.value >= 0;
        const width = Math.abs(item.value) * scale;
        const isHovered = hoveredSector === item.name;
        const color = isPositive ? '#10b981' : '#ef4444'; // green-500 : red-500

        return (
          <div
            key={item.name}
            className="relative group cursor-pointer"
            onMouseEnter={() => setHoveredSector(item.name)}
            onMouseLeave={() => setHoveredSector(null)}
            onClick={() => onSectorClick?.(item.name)}
          >
            <div className="flex items-center gap-3">
              {/* 섹터명 */}
              <div className="w-32 text-sm font-medium text-gray-700 truncate">
                {item.name}
              </div>

              {/* 바 차트 */}
              <div className="flex-1 relative h-8">
                <div
                  className={`absolute top-0 bottom-0 left-0 rounded transition-all duration-300 ${
                    isHovered ? 'opacity-100 scale-y-110' : 'opacity-90'
                  }`}
                  style={{
                    width: `${width}%`,
                    backgroundColor: color,
                  }}
                />
                {/* 수익률 텍스트 */}
                <div className="absolute top-0 bottom-0 left-0 right-0 flex items-center px-2">
                  <span className={`text-sm font-bold ${
                    width > 20 ? 'text-white' : isPositive ? 'text-green-600' : 'text-red-600'
                  } ml-2`}>
                    {isPositive ? '+' : ''}{item.value.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 호버 시 툴팁 */}
            {isHovered && (
              <div className="absolute left-32 top-10 z-10 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none whitespace-nowrap">
                <div className="font-semibold">{item.name}</div>
                <div className={isPositive ? 'text-green-400' : 'text-red-400'}>
                  {isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}{item.value.toFixed(2)}%
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
 * 컬러 바 차트 컴포넌트 - 섹터별 연초 대비 수익률 (섹터별 색상 적용)
 */
function SectorBarChart({
  summaries,
  onSectorClick
}: {
  summaries: SectorYearlySummary[];
  onSectorClick?: (sector: string) => void;
}) {
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
            className="relative group cursor-pointer"
            onMouseEnter={() => setHoveredSector(summary.sectorKr)}
            onMouseLeave={() => setHoveredSector(null)}
            onClick={() => onSectorClick?.(summary.sectorKr)}
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
  summaries,
  onSectorClick
}: {
  monthlyData: MonthlySectorData[];
  summaries: SectorYearlySummary[];
  onSectorClick?: (sector: string) => void;
}) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  // 기본적으로 상위 5개 섹터만 선택되도록 변경
  const [selectedSectors, setSelectedSectors] = useState<Set<string>>(
    new Set(summaries.slice(0, 5).map(s => s.sectorKr))
  );

  if (monthlyData.length === 0 || summaries.length === 0) {
    return <div className="text-center text-gray-500 py-8">데이터가 없습니다</div>;
  }

  const width = 1000;
  const height = 400;
  const padding = { top: 30, right: 30, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Y축 범위 계산
  const allReturns = monthlyData.flatMap(d =>
    summaries
      .filter(s => selectedSectors.has(s.sectorKr))
      .map(s => d[s.sectorKr] as number)
      .filter(v => typeof v === 'number' && !isNaN(v))
  );

  // allReturns가 비어있거나 유효한 데이터가 없는 경우
  if (allReturns.length === 0) {
    return <div className="text-center text-gray-500 py-8">유효한 데이터가 없습니다</div>;
  }

  const minReturn = Math.min(0, ...allReturns);
  const maxReturn = Math.max(0, ...allReturns);
  const yRange = Math.max(Math.abs(minReturn), Math.abs(maxReturn)) * 1.1 || 1; // 0으로 나누기 방지

  // 좌표 변환 함수
  const xScale = (index: number) => {
    // monthlyData가 1개만 있는 경우 중앙에 표시
    if (monthlyData.length === 1) {
      return padding.left + chartWidth / 2;
    }
    return padding.left + (index / (monthlyData.length - 1)) * chartWidth;
  };
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

  // 라인 경로 생성 (부드러운 곡선)
  const createLinePath = (sectorKr: string) => {
    const points = monthlyData
      .map((d, i) => {
        const value = d[sectorKr] as number;
        // NaN이나 유효하지 않은 값 체크
        if (typeof value !== 'number' || isNaN(value)) return null;
        const x = xScale(i);
        const y = yScale(value);
        // x, y가 유효한 숫자인지 체크
        if (isNaN(x) || isNaN(y)) return null;
        return { x, y, i };
      })
      .filter(p => p !== null) as { x: number; y: number; i: number }[];

    if (points.length === 0) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    // Catmull-Rom 스플라인을 사용한 부드러운 곡선
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      // 제어점 계산
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  const toggleAllSectors = () => {
    if (selectedSectors.size === summaries.length) {
      // 전체 선택 해제 -> 상위 5개만 선택
      setSelectedSectors(new Set(summaries.slice(0, 5).map(s => s.sectorKr)));
    } else {
      // 전체 선택
      setSelectedSectors(new Set(summaries.map(s => s.sectorKr)));
    }
  };

  return (
    <div className="space-y-4">
      {/* 범례 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">
            섹터 선택 ({selectedSectors.size}/{summaries.length})
          </p>
          <button
            onClick={toggleAllSectors}
            className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          >
            {selectedSectors.size === summaries.length ? '기본 선택' : '전체 선택'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {summaries.map(s => {
            const isSelected = selectedSectors.has(s.sectorKr);
            return (
              <button
                key={s.sector}
                onClick={() => toggleSector(s.sectorKr)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border-2 ${
                  isSelected
                    ? 'opacity-100 shadow-sm'
                    : 'opacity-40 hover:opacity-70'
                }`}
                style={{
                  backgroundColor: isSelected ? `${s.color}15` : 'transparent',
                  borderColor: isSelected ? s.color : '#e5e7eb',
                  color: isSelected ? s.color : '#6b7280',
                }}
              >
                <span
                  className="inline-block w-3 h-3 rounded-full mr-1.5"
                  style={{ backgroundColor: s.color }}
                />
                {s.sectorKr}
                {isSelected && (
                  <span className="ml-1.5 text-[10px]">
                    {s.ytdReturn >= 0 ? '+' : ''}{s.ytdReturn.toFixed(1)}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
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
                strokeWidth={3}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="transition-all hover:stroke-[4] cursor-pointer"
                style={{ opacity: 0.9 }}
                onClick={() => onSectorClick?.(s.sectorKr)}
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
              {/* 호버 시 값 표시 */}
              <g className="hover-values">
                {summaries
                  .filter(s => selectedSectors.has(s.sectorKr))
                  .map(s => {
                    const value = monthlyData[hoveredMonth]?.[s.sectorKr];
                    if (typeof value !== 'number' || isNaN(value)) return null;
                    return (
                      <circle
                        key={`circle-${s.sector}`}
                        cx={xScale(hoveredMonth)}
                        cy={yScale(value)}
                        r={4}
                        fill={s.color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    );
                  })}
              </g>
            </>
          )}

          {/* 호버 정보 텍스트 */}
          {hoveredMonth !== null && (
            <foreignObject x={10} y={10} width={200} height={200}>
              <div className="bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg space-y-1">
                <div className="font-semibold text-gray-100">{monthlyData[hoveredMonth]?.month}</div>
                {summaries
                  .filter(s => selectedSectors.has(s.sectorKr))
                  .map(s => {
                    const value = monthlyData[hoveredMonth]?.[s.sectorKr];
                    if (typeof value !== 'number' || isNaN(value)) return null;
                    return (
                      <div key={s.sector} className="flex items-center gap-1.5">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="text-gray-300 text-xs">{s.sectorKr}</span>
                        <span className={`font-bold ${value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {value >= 0 ? '+' : ''}{value.toFixed(2)}%
                        </span>
                      </div>
                    );
                  })}
              </div>
            </foreignObject>
          )}
        </svg>
      </div>
    </div>
  );
}

/**
 * 메인 컴포넌트
 */
export default function UnifiedSectorPerformanceCard({
  performances,
  todayDate,
  yesterdayDate,
  onShortTermRangeChange,
  onSectorClick,
  loadingShortTerm = false,
  yearlyData,
  onYearlyRangeChange,
  loadingYearly = false,
}: UnifiedSectorPerformanceCardProps) {
  const [activeTab, setActiveTab] = useState<'short' | 'yearly'>('short');
  const [shortTermRange, setShortTermRange] = useState<DateRangeType>('1day');
  const [yearlyRange, setYearlyRange] = useState<DateRangeType>('1month');
  
  // 기간 선택 모달 상태
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const handleShortTermRangeChange = (rangeType: DateRangeType) => {
    setShortTermRange(rangeType);
    if (rangeType === 'custom') {
      setShowDatePicker(true);
    } else {
      setShowDatePicker(false);
      onShortTermRangeChange?.(rangeType);
    }
  };

  const handleYearlyRangeChange = (rangeType: DateRangeType) => {
    setYearlyRange(rangeType);
    if (rangeType === 'custom') {
      setShowDatePicker(true);
    } else {
      setShowDatePicker(false);
      onYearlyRangeChange?.(rangeType);
    }
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      if (activeTab === 'short') {
        onShortTermRangeChange?.('custom', customStartDate, customEndDate);
      } else {
        onYearlyRangeChange?.('custom', customStartDate, customEndDate);
      }
      setShowDatePicker(false);
    }
  };

  const getRangeLabel = () => {
    const range = activeTab === 'short' ? shortTermRange : yearlyRange;
    switch (range) {
      case '1day': return '하루 전 대비';
      case '1week': return '1주일 전 대비';
      case '1month': return '1개월 전 대비';
      case 'custom': return '기간 대비';
    }
  };

  const isLoading = activeTab === 'short' ? loadingShortTerm : loadingYearly;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // 단기 성과 데이터 준비
  const shortTermData = performances.map(p => ({
    name: p.sectorKr,
    value: p.changePercent
  })).sort((a, b) => b.value - a.value);

  // 연간 성과 데이터 준비
  const yearlyDataSorted = yearlyData.summaries
    .map(s => ({
      name: s.sectorKr,
      value: s.ytdReturn
    }))
    .sort((a, b) => b.value - a.value);

  // 통계 계산
  const currentData = activeTab === 'short' ? shortTermData : yearlyDataSorted;
  const bestSector = currentData[0];
  const worstSector = currentData[currentData.length - 1];
  const avgReturn = currentData.reduce((sum, d) => sum + d.value, 0) / currentData.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            📊 GICS 섹터별 동향
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === 'short'
              ? `기준일: ${todayDate || '-'} (대비: ${yesterdayDate || '-'})`
              : `기간: ${yearlyData.startDate} ~ ${yearlyData.endDate}`
            }
          </p>
        </div>

        {/* 탭 전환 */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('short')}
            className={classNames(
              'px-4 py-2 text-sm font-semibold rounded-lg transition-all',
              activeTab === 'short'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            단기 성과
          </button>
          <button
            onClick={() => setActiveTab('yearly')}
            className={classNames(
              'px-4 py-2 text-sm font-semibold rounded-lg transition-all',
              activeTab === 'yearly'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            연간 성과
          </button>
        </div>
      </div>

      {/* 기간 선택 버튼 */}
      <div className="flex flex-col items-start gap-2">
        <p className="text-xs text-gray-500">{getRangeLabel()}</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => activeTab === 'short' ? handleShortTermRangeChange('1day') : handleYearlyRangeChange('1day')}
            className={classNames(
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              (activeTab === 'short' ? shortTermRange : yearlyRange) === '1day'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            하루 전
          </button>
          <button
            onClick={() => activeTab === 'short' ? handleShortTermRangeChange('1week') : handleYearlyRangeChange('1week')}
            className={classNames(
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              (activeTab === 'short' ? shortTermRange : yearlyRange) === '1week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            일주일 전
          </button>
          <button
            onClick={() => activeTab === 'short' ? handleShortTermRangeChange('1month') : handleYearlyRangeChange('1month')}
            className={classNames(
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              (activeTab === 'short' ? shortTermRange : yearlyRange) === '1month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            한달 전
          </button>
          <button
            onClick={() => activeTab === 'short' ? handleShortTermRangeChange('custom') : handleYearlyRangeChange('custom')}
            className={classNames(
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              (activeTab === 'short' ? shortTermRange : yearlyRange) === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            기간 선택
          </button>
        </div>
      </div>

      {/* 기간 선택 모달 */}
      {showDatePicker && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">시작 날짜</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">종료 날짜</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleCustomDateApply}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              적용
            </button>
          </div>
        </div>
      )}

      {/* 주요 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div className="text-xs font-medium text-green-700 mb-1">🏆 최고 성과 섹터</div>
          <div className="text-lg font-bold text-green-900">
            {bestSector?.name}
          </div>
          <div className="text-2xl font-extrabold text-green-600 mt-1">
            +{bestSector?.value.toFixed(2)}%
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
            {worstSector?.name}
          </div>
          <div className="text-2xl font-extrabold text-red-600 mt-1">
            {worstSector?.value >= 0 ? '+' : ''}{worstSector?.value.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* 차트 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-md font-bold text-gray-800">
            {activeTab === 'short' ? '섹터별 단기 성과' : '섹터별 연간 성과 - 바 차트'}
          </h4>
          <p className="text-xs text-gray-500">
            💡 섹터를 클릭하면 해당 섹터의 종목 목록을 볼 수 있습니다
          </p>
        </div>
        {activeTab === 'short' ? (
          <SimpleSectorBarChart
            data={currentData}
            onSectorClick={onSectorClick}
          />
        ) : (
          <SectorBarChart
            summaries={yearlyData.summaries}
            onSectorClick={onSectorClick}
          />
        )}
      </div>

      {/* 월별 누적 수익률 라인 차트 (연간 성과 탭에서만 표시) */}
      {activeTab === 'yearly' && yearlyData.monthlyData && yearlyData.monthlyData.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-bold text-gray-800">
              월별 누적 수익률 추이
            </h4>
            <p className="text-xs text-gray-500">
              💡 라인을 클릭하거나 섹터를 선택하여 필터링할 수 있습니다
            </p>
          </div>
          <SectorLineChart
            monthlyData={yearlyData.monthlyData}
            summaries={yearlyData.summaries}
            onSectorClick={onSectorClick}
          />
        </div>
      )}

      {/* 설명 */}
      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200">
        <p className="mb-1">📌 <strong>GICS(Global Industry Classification Standard)</strong>는 S&P와 MSCI가 공동 개발한 글로벌 산업 분류 기준입니다.</p>
        <p>11개 섹터로 구성되어 있으며, 각 섹터의 성과를 통해 시장 전반의 흐름을 파악할 수 있습니다.</p>
      </div>
    </div>
  );
}
