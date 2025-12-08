import React from 'react';
import AIScoreGauge from './AIScoreGauge';
import AnalysisStatusBadge from './AnalysisStatusBadge';

interface FeaturedStock {
  symbol: string;
  name: string;
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
  isFavorite?: boolean;           // 즐겨찾기 여부
  onToggleFavorite?: () => void;  // 즐겨찾기 토글 콜백
}

export default function FeaturedStockCard({ stock, onClick, isFavorite, onToggleFavorite }: FeaturedStockCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-3 sm:p-5 shadow-md hover:shadow-xl transition-all"
    >
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            {stock.logoUrl && (
              <img src={stock.logoUrl} alt={stock.name} className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex-shrink-0 object-contain bg-white p-0.5 sm:p-1" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm text-gray-600">{stock.symbol}</div>
              <div className="text-base sm:text-lg font-bold text-gray-900 truncate">{stock.name}</div>
            </div>
            {/* 즐겨찾기 버튼 */}
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className="flex-shrink-0 hover:scale-110 transition-transform"
                aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              >
                <span className="text-lg sm:text-xl">
                  {isFavorite ? '⭐' : '☆'}
                </span>
              </button>
            )}
          </div>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-700 line-clamp-2">{stock.reason}</p>
          <div className="mt-2 sm:mt-3 flex items-center gap-2 flex-wrap">
            <AnalysisStatusBadge sentiment={stock.sentiment} confidence={stock.confidence} />
            <span className="text-[10px] sm:text-xs text-gray-500">{stock.category}</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 sm:gap-2 flex-shrink-0">
          <AIScoreGauge score={stock.aiScore} sentiment={stock.sentiment} size="md" />
          <div className="text-[10px] sm:text-xs text-gray-600 font-semibold whitespace-nowrap">AI 분석</div>
        </div>
      </div>
    </div>
  );
}
