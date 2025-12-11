import React from 'react';
import { classNames } from '../../utils/format';
import { INVESTMENT_STRATEGIES } from '../../constants/investmentStrategies';
import type { ProfilePerformance } from '../../api/types';

interface BacktestingPerformanceSectionProps {
  undervaluedStrategies: string[];
  backtestPerformances: Record<string, ProfilePerformance>;
  backtestLoading: Record<string, boolean>;
}

/**
 * BacktestingPerformanceSection - 백테스팅 성과 섹션
 * 선택된 투자 전략별 과거 3년간 성과 데이터 표시
 */
export default function BacktestingPerformanceSection({
  undervaluedStrategies,
  backtestPerformances,
  backtestLoading
}: BacktestingPerformanceSectionProps) {
  if (undervaluedStrategies.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base sm:text-lg font-bold text-gray-900">📊 백테스팅 성과 (최근 3년)</h3>
        <div className="text-xs text-gray-500">과거 성과는 미래 수익을 보장하지 않습니다</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {undervaluedStrategies.map((strategyKey) => {
          const strategy = INVESTMENT_STRATEGIES[strategyKey];
          const performance = backtestPerformances[strategyKey];
          const loading = backtestLoading[strategyKey];

          return (
            <div
              key={strategyKey}
              className="rounded-xl bg-white p-4 border-2 border-purple-200 shadow-sm"
            >
              <div className="text-sm font-bold text-purple-900 mb-3">{strategy.name}</div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : performance ? (
                <div className="space-y-3">
                  {/* 평균 수익률 */}
                  <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                    <div className="text-xs text-gray-600 mb-1">평균 수익률</div>
                    <div className={classNames(
                      "text-2xl font-bold",
                      performance.averageReturn > 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {performance.averageReturn > 0 ? "+" : ""}{performance.averageReturn.toFixed(1)}%
                    </div>
                  </div>

                  {/* 주요 지표 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-gray-50">
                      <div className="text-[10px] text-gray-500 mb-1">성공률</div>
                      <div className="text-sm font-bold text-gray-900">
                        {(performance.successRate * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-50">
                      <div className="text-[10px] text-gray-500 mb-1">분석 종목</div>
                      <div className="text-sm font-bold text-gray-900">
                        {performance.stocksAnalyzed}개
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-50">
                      <div className="text-[10px] text-gray-500 mb-1">최대 수익</div>
                      <div className="text-sm font-bold text-emerald-600">
                        +{performance.maxReturn.toFixed(1)}%
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-50">
                      <div className="text-[10px] text-gray-500 mb-1">최대 손실</div>
                      <div className="text-sm font-bold text-red-600">
                        {performance.minReturn.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* 중앙값 */}
                  <div className="text-xs text-gray-600 text-center pt-2 border-t border-gray-200">
                    중앙값: <span className="font-semibold">{performance.medianReturn.toFixed(1)}%</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  데이터를 불러올 수 없습니다
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
