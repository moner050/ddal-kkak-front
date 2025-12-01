import React from 'react';
import { classNames } from '../../utils/format';

interface PriceGuideBandProps {
  currentPrice: number;
  buyPrice?: number;
  targetPrice?: number;
  currency?: string;
}

export default function PriceGuideBand({
  currentPrice,
  buyPrice,
  targetPrice,
  currency = '$'
}: PriceGuideBandProps) {
  // 기본값 설정: buyPrice는 현재가의 95%, targetPrice는 현재가의 120%
  const buyPriceValue = buyPrice || currentPrice * 0.95;
  const targetPriceValue = targetPrice || currentPrice * 1.20;

  // 범위 계산
  const minPrice = Math.min(buyPriceValue, currentPrice, targetPriceValue);
  const maxPrice = Math.max(buyPriceValue, currentPrice, targetPriceValue);
  const range = maxPrice - minPrice;

  // 위치 계산 (0-100%)
  const buyPosition = ((buyPriceValue - minPrice) / range) * 100;
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
    if (currentPrice <= buyPriceValue) {
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
          <h3 className="text-xs sm:text-sm font-bold text-gray-900">매수/매도 가이드</h3>
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

      {/* 가격 밴드 시각화 */}
      <div className="mb-4">
        {/* 가격 정보 */}
        <div className="flex justify-between mb-2 text-[10px] sm:text-xs">
          <div className="text-center">
            <div className="text-gray-500 mb-1">매수가</div>
            <div className="font-bold text-emerald-600">{formatPrice(buyPriceValue)}</div>
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
        <div className="relative h-8 sm:h-10 bg-gradient-to-r from-emerald-100 via-amber-50 to-blue-100 rounded-full border-2 border-gray-200 overflow-hidden">
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

        {/* 수익률 표시 */}
        <div className="mt-3 flex justify-between text-[10px] sm:text-xs">
          <div className="text-gray-600">
            매수가 대비: <span className={classNames(
              "font-semibold ml-1",
              currentPrice >= buyPriceValue ? "text-red-600" : "text-emerald-600"
            )}>
              {currentPrice >= buyPriceValue ? '+' : ''}{(((currentPrice - buyPriceValue) / buyPriceValue) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="text-gray-600">
            목표가까지: <span className={classNames(
              "font-semibold ml-1",
              currentPrice >= targetPriceValue ? "text-blue-600" : "text-amber-600"
            )}>
              {(((targetPriceValue - currentPrice) / currentPrice) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* 가이드 메시지 */}
      <div className={classNames(
        "p-2 sm:p-3 rounded-lg text-[10px] sm:text-xs border",
        status.bgColor,
        status.borderColor
      )}>
        <p className="text-gray-700 leading-relaxed">
          {currentPrice <= buyPriceValue && (
            <span>💡 현재 <strong className="text-emerald-600">매수 적정가</strong> 이하입니다. 분할 매수를 고려해보세요.</span>
          )}
          {currentPrice > buyPriceValue && currentPrice < targetPriceValue && (
            <span>💡 적정 가격대에 있습니다. 추가 상승 여력을 확인하세요.</span>
          )}
          {currentPrice >= targetPriceValue && (
            <span>💡 목표가에 도달했습니다. 익절 타이밍을 고려하세요.</span>
          )}
        </p>
      </div>
    </div>
  );
}
