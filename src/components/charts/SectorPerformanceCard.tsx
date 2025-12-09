/**
 * GICS 섹터별 시장 성과 카드
 * 오늘과 어제 비교하여 섹터별 변동률 표시
 */

import React, { useState } from 'react';
import type { SectorPerformance, DateRangeType } from '../../services/sectorPerformance';
import { getSectorColor, getSectorBgColor } from '../../services/sectorPerformance';
import { classNames } from '../../utils/format';

interface SectorPerformanceCardProps {
  performances: SectorPerformance[];
  onSectorClick?: (sector: string) => void;
  loading?: boolean;
  todayDate?: string;
  yesterdayDate?: string;
  onRangeChange?: (rangeType: DateRangeType, startDate?: string, endDate?: string) => void;
}

const SectorPerformanceCard: React.FC<SectorPerformanceCardProps> = ({
  performances,
  onSectorClick,
  loading = false,
  todayDate,
  yesterdayDate,
  onRangeChange,
}) => {
  const [selectedRange, setSelectedRange] = useState<DateRangeType>('1day');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const handleRangeChange = (rangeType: DateRangeType) => {
    setSelectedRange(rangeType);
    if (rangeType === 'custom') {
      setShowDatePicker(true);
    } else {
      setShowDatePicker(false);
      onRangeChange?.(rangeType);
    }
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      onRangeChange?.('custom', customStartDate, customEndDate);
      setShowDatePicker(false);
    }
  };

  const getRangeLabel = () => {
    switch (selectedRange) {
      case '1day': return '전일 대비 변동률';
      case '1week': return '1주일 전 대비 변동률';
      case '1month': return '1개월 전 대비 변동률';
      case 'custom': return '기간 대비 변동률';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">GICS 섹터별 동향</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(11)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (performances.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">GICS 섹터별 동향</h3>
        <p className="text-gray-500 text-sm text-center py-8">
          섹터 데이터를 불러올 수 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">GICS 섹터별 동향</h3>
          {todayDate && yesterdayDate && (
            <p className="text-[10px] text-gray-400">
              {new Date(yesterdayDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} → {new Date(todayDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </p>
          )}
        </div>

        <div className="flex flex-col items-start lg:items-end gap-2 w-full lg:w-auto">
          <p className="text-xs text-gray-500">{getRangeLabel()}</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleRangeChange('1day')}
              className={classNames(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                selectedRange === '1day'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              하루 전
            </button>
            <button
              onClick={() => handleRangeChange('1week')}
              className={classNames(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                selectedRange === '1week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              일주일 전
            </button>
            <button
              onClick={() => handleRangeChange('1month')}
              className={classNames(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                selectedRange === '1month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              한달 전
            </button>
            <button
              onClick={() => handleRangeChange('custom')}
              className={classNames(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                selectedRange === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              기간 선택
            </button>
          </div>
        </div>
      </div>

      {/* 기간 선택 모달 */}
      {showDatePicker && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {performances.map((perf) => (
          <button
            key={perf.sector}
            onClick={() => onSectorClick?.(perf.sectorKr)}
            className={classNames(
              'p-3 rounded-lg border-2 transition-all duration-200',
              'hover:shadow-md hover:scale-105 cursor-pointer',
              'text-left',
              getSectorBgColor(perf.trend)
            )}
          >
            {/* 섹터명 */}
            <div className="font-medium text-sm mb-1 text-gray-800 line-clamp-2 min-h-[2.5rem]">
              {perf.sectorKr}
            </div>

            {/* 변동률 */}
            <div className={classNames('text-lg font-bold', getSectorColor(perf.trend))}>
              {perf.changePercent > 0 && '+'}
              {perf.changePercent.toFixed(2)}%
            </div>

            {/* 종목 수 */}
            <div className="text-xs text-gray-500 mt-1">{perf.stockCount}개 종목</div>
          </button>
        ))}
      </div>

      {/* 범례 */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">상승</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-600">하락</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-500 rounded"></div>
          <span className="text-gray-600">보합</span>
        </div>
      </div>
    </div>
  );
};

export default SectorPerformanceCard;
