/**
 * 통합 GICS 섹터 성과 카드 컴포넌트
 *
 * 기능:
 * - 단기 성과 (1일, 1주일, 1개월 전 대비) - 바 차트
 * - 연간 성과 (연초 대비 수익률) - 카드 그리드
 * - 색상: 초록(상승), 빨강(하락)으로 단순화
 * - 탭 방식으로 단기/연간 뷰 전환
 * - 섹터 클릭 시 해당 섹터의 종목 추천으로 이동
 */

import React, { useState } from 'react';
import type {
  SectorPerformance,
  YearlySectorPerformanceResult,
  SectorYearlySummary,
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
 * 카드 형식의 섹터별 연간 성과 컴포넌트
 */
function SectorCardGrid({
  summaries,
  onSectorClick
}: {
  summaries: SectorYearlySummary[];
  onSectorClick?: (sector: string) => void;
}) {
  if (summaries.length === 0) {
    return <div className="text-center text-gray-500 py-8">데이터가 없습니다</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {summaries.map((summary) => {
        const isPositive = summary.ytdReturn >= 0;
        return (
          <div
            key={summary.sector}
            onClick={() => onSectorClick?.(summary.sectorKr)}
            className="cursor-pointer group"
          >
            <div
              className="rounded-lg p-4 transition-all hover:shadow-lg hover:scale-105"
              style={{
                backgroundColor: `${summary.color}15`,
                borderLeft: `4px solid ${summary.color}`,
              }}
            >
              <div className="text-sm font-semibold text-gray-800 mb-2 group-hover:text-gray-900">
                {summary.sectorKr}
              </div>
              <div
                className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
              >
                {isPositive ? '+' : ''}{summary.ytdReturn.toFixed(2)}%
              </div>
              <div className="text-xs text-gray-600 mt-2 space-y-1">
                <div>최고: +{summary.highestReturn.toFixed(2)}%</div>
                <div>최저: {summary.lowestReturn.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        );
      })}
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
            {activeTab === 'short' ? '섹터별 단기 성과' : '섹터별 연간 성과'}
          </h4>
          <p className="text-xs text-gray-500">
            💡 섹터 카드를 클릭하면 해당 섹터의 종목 목록을 볼 수 있습니다
          </p>
        </div>
        {activeTab === 'short' ? (
          <SimpleSectorBarChart
            data={currentData}
            onSectorClick={onSectorClick}
          />
        ) : (
          <SectorCardGrid
            summaries={yearlyData.summaries}
            onSectorClick={onSectorClick}
          />
        )}
      </div>

      {/* 설명 */}
      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200">
        <p className="mb-1">📌 <strong>GICS(Global Industry Classification Standard)</strong>는 S&P와 MSCI가 공동 개발한 글로벌 산업 분류 기준입니다.</p>
        <p>11개 섹터로 구성되어 있으며, 각 섹터의 성과를 통해 시장 전반의 흐름을 파악할 수 있습니다.</p>
      </div>
    </div>
  );
}
