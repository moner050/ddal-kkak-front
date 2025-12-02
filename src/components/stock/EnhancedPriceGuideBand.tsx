import React from 'react';
import { classNames } from '../../utils/format';
import type { TargetPriceDto, BuyRangeDto, SellRangeDto } from '../../api/types';

interface EnhancedPriceGuideBandProps {
  currentPrice: number;
  targetPrice: TargetPriceDto;
  buyRange: BuyRangeDto;
  sellRange: SellRangeDto;
  currency?: string;
}

export default function EnhancedPriceGuideBand({
  currentPrice,
  targetPrice,
  buyRange,
  sellRange,
  currency = '$',
}: EnhancedPriceGuideBandProps) {
  // 가격 범위 계산
  const buyPrice = buyRange.recommended.idealBuyPrice;
  const targetPriceValue = targetPrice.analystConsensus.mean;
  const stopLoss = sellRange.stopLoss.price;

  const minPrice = Math.min(stopLoss, buyPrice, currentPrice, targetPriceValue);
  const maxPrice = Math.max(stopLoss, buyPrice, currentPrice, targetPriceValue);
  const range = maxPrice - minPrice;

  // 위치 계산 (0-100%)
  const stopLossPosition = ((stopLoss - minPrice) / range) * 100;
  const buyPosition = ((buyPrice - minPrice) / range) * 100;
  const currentPosition = ((currentPrice - minPrice) / range) * 100;
  const targetPosition = ((targetPriceValue - minPrice) / range) * 100;

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `${currency}${(price / 1000).toFixed(1)}K`;
    }
    return `${currency}${price.toFixed(2)}`;
  };

  // 현재가 상태 판단
  const getPriceStatus = () => {
    if (currentPrice <= buyPrice) {
      return { label: '매수 기회', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' };
    } else if (currentPrice >= targetPriceValue) {
      return { label: '목표 달성', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
    } else {
      return { label: '관망 구간', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' };
    }
  };

  const status = getPriceStatus();

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-3 sm:p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base">💰</span>
          <h3 className="text-xs sm:text-sm font-bold text-gray-900">매수/매도 가이드 (전문가 분석)</h3>
        </div>
        <div className={classNames(
          "px-2 py-1 rounded-lg text-[10px] sm:text-xs font-semibold border",
          status.color,
          status.bgColor,
          status.borderColor
        )}>
          {status.label}
        </div>
      </div>

      {/* 가격 정보 */}
      <div className="mb-4">
        <div className="grid grid-cols-4 gap-2 mb-2 text-[10px] sm:text-xs">
          <div className="text-center">
            <div className="text-gray-500 mb-1">손절가</div>
            <div className="font-bold text-red-600">{formatPrice(stopLoss)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 mb-1">매수가</div>
            <div className="font-bold text-emerald-600">{formatPrice(buyPrice)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 mb-1">현재가</div>
            <div className="font-bold text-gray-900 text-sm sm:text-base">{formatPrice(currentPrice)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 mb-1">목표가</div>
            <div className="font-bold text-blue-600">{formatPrice(targetPriceValue)}</div>
          </div>
        </div>

        {/* 프로그레스 바 */}
        <div className="relative h-8 sm:h-10 bg-gradient-to-r from-red-100 via-emerald-50 via-amber-50 to-blue-100 rounded-full border-2 border-gray-200 overflow-hidden">
          {/* 손절가 마커 */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-red-500"
            style={{ left: `${stopLossPosition}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md" />
          </div>

          {/* 매수가 마커 */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-emerald-500"
            style={{ left: `${buyPosition}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-md" />
          </div>

          {/* 목표가 마커 */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-blue-500"
            style={{ left: `${targetPosition}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-md" />
          </div>

          {/* 현재가 마커 (가장 위에) */}
          <div
            className="absolute top-0 bottom-0 z-10"
            style={{ left: `${currentPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-900 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
          <div className="text-gray-600">
            상승여력: <span className={classNames(
              "font-semibold ml-1",
              targetPriceValue > currentPrice ? "text-blue-600" : "text-gray-400"
            )}>
              {(((targetPriceValue - currentPrice) / currentPrice) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="text-gray-600 text-right">
            애널리스트 {targetPrice.analystConsensus.numberOfAnalysts}명 컨센서스
          </div>
        </div>
      </div>

      {/* 전략 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* 매수 전략 */}
        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
          <div className="text-[10px] sm:text-xs font-bold text-emerald-700 mb-1">매수 전략</div>
          <div className="text-[9px] sm:text-[10px] text-gray-600">
            {buyRange.recommended.reasoning}
          </div>
        </div>

        {/* 익절 전략 */}
        <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
          <div className="text-[10px] sm:text-xs font-bold text-blue-700 mb-1">익절 전략</div>
          <div className="text-[9px] sm:text-[10px] text-gray-600">
            {sellRange.takeProfitLevels[0]?.rationale || '목표가 도달 시 분할 익절'}
          </div>
        </div>

        {/* 손절 전략 */}
        <div className="p-2 rounded-lg bg-red-50 border border-red-100">
          <div className="text-[10px] sm:text-xs font-bold text-red-700 mb-1">손절 전략</div>
          <div className="text-[9px] sm:text-[10px] text-gray-600">
            {sellRange.stopLoss.rationale}
          </div>
        </div>
      </div>

      {/* 분할매수 전략 (선택사항) */}
      {buyRange.dcaStrategy && buyRange.dcaStrategy.length > 0 && (
        <div className="mt-3 p-2 sm:p-3 rounded-lg bg-gray-50 border border-gray-200">
          <div className="text-[10px] sm:text-xs font-bold text-gray-700 mb-2">분할매수 전략</div>
          <div className="space-y-1">
            {buyRange.dcaStrategy.map((dca, idx) => (
              <div key={idx} className="flex items-center justify-between text-[9px] sm:text-[10px] text-gray-600">
                <span>{dca.rationale}</span>
                <span className="font-semibold">{formatPrice(dca.priceLevel)} ({dca.allocation})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
