/**
 * GICS 섹터별 시장 성과 카드
 * 오늘과 어제 비교하여 섹터별 변동률 표시
 */

import React from 'react';
import type { SectorPerformance } from '../../services/sectorPerformance';
import { getSectorColor, getSectorBgColor } from '../../services/sectorPerformance';
import { classNames } from '../../utils/format';

interface SectorPerformanceCardProps {
  performances: SectorPerformance[];
  onSectorClick?: (sector: string) => void;
  loading?: boolean;
  todayDate?: string;
  yesterdayDate?: string;
}

const SectorPerformanceCard: React.FC<SectorPerformanceCardProps> = ({
  performances,
  onSectorClick,
  loading = false,
  todayDate,
  yesterdayDate,
}) => {
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
        <h3 className="text-lg font-semibold">GICS 섹터별 동향</h3>
        <div className="flex flex-col items-start sm:items-end gap-1">
          <p className="text-xs text-gray-500">전일 대비 변동률</p>
          {todayDate && yesterdayDate && (
            <p className="text-[10px] text-gray-400">
              {new Date(yesterdayDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} → {new Date(todayDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </p>
          )}
        </div>
      </div>

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
