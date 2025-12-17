import React from 'react';
import AIScoreGauge from './AIScoreGauge';
import AnalysisStatusBadge from './AnalysisStatusBadge';

interface FeaturedStock {
  symbol: string;
  name: string;
  market?: string;
  logoUrl?: string;
  aiScore: number;
  sentiment: "POS" | "NEG" | "NEU";
  reason: string;
  confidence: number;
  category: string;
}

interface FeaturedStockCardProps {
  stock: FeaturedStock;
  onClick: () => void;
  isFavorite?: boolean;           // 즈거찾기 여부
  onToggleFavorite?: () => void;  // 즈거찾기 토글 콜백
}

/**
 * FeaturedStockCard - 오늘의 주목 종목 카드
 * 🎯 티커 표시 개선: 로고, 티커 배지, 국가, 종목명
 */
export default function FeaturedStockCard({ stock, onClick, isFavorite, onToggleFavorite }: FeaturedStockCardProps) {
  // 국가 플래그 결정
  const countryFlag = stock.market === 'KR' ? '🇰🇷' : '🇺🇸';
  
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-3 sm:p-5 shadow-md hover:shadow-xl transition-all"
    >
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* 헤더: 로고 + 티커 + 국가 + 종목명 + 즉거찾기 */}
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* 로고 */}
            {stock.logoUrl && (
              <img
                src={stock.logoUrl}
                alt={stock.name}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex-shrink-0 object-contain bg-white p-1 sm:p-1.5 shadow-sm"
              />
            )}

            {/* 티커 + 종목명 */}
            <div className="min-w-0 flex-1">
              {/* 티커 + 국가 플래그 */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm sm:text-base font-bold text-gray-900">{stock.symbol}</span>
                <span className="text-base sm:text-lg">{countryFlag}</span>
              </div>

              {/* 종목 이름 */}
              <div className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-1">
                {stock.name}
              </div>
            </div>
          </div>

          {/* 즉거찾기 버튼 */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="flex-shrink-0 hover:scale-110 transition-transform"
              aria-label={isFavorite ? "즈거찾기 해제" : "즈거찾기 추가"}
            >
              <span className="text-lg sm:text-xl">
                {isFavorite ? '⭐' : '☆'}
              </span>
            </button>
          )}
        </div>

        {/* AI 점수 바 */}
        <div>
          <AIScoreGauge score={stock.aiScore} sentiment={stock.sentiment} variant="bar" />
        </div>

        {/* AI 분석 이유 */}
        <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">{stock.reason}</p>

        {/* 분석 상태 배지 */}
        <div className="flex items-center gap-2 flex-wrap">
          <AnalysisStatusBadge sentiment={stock.sentiment} confidence={stock.confidence} />
          <span className="text-[10px] sm:text-xs text-gray-500">{stock.category}</span>
        </div>
      </div>
    </div>
  );
}