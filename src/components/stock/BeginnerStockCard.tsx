import React from 'react';
import AIScoreGauge from './AIScoreGauge';

interface BeginnerStockCardProps {
  stock: {
    symbol: string;
    name: string;
    market: string;
    category: string;
    industry: string;
    logoUrl?: string;
    aiScore: number;
    sentiment: 'POS' | 'NEG' | 'NEU';
    price?: number;
    ROE: number;
    PER: number;
    PEG: number;
    PBR: number;
    PSR: number;
    RevYoY: number;
    EPS_Growth_3Y: number;
    OpMarginTTM: number;
    FCF_Yield: number;
  };
  onClick: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  logoError?: boolean;
  onLogoError?: () => void;
}

export default function BeginnerStockCard({
  stock,
  onClick,
  onToggleFavorite,
  isFavorite,
  logoError,
  onLogoError
}: BeginnerStockCardProps) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl border-2 border-gray-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all"
    >
      {/* 헤더: 종목 정보 */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {stock.logoUrl && !logoError ? (
            <img
              src={stock.logoUrl}
              alt={stock.name}
              className="h-12 w-12 rounded-xl flex-shrink-0 object-contain bg-white p-1"
              onError={onLogoError}
            />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0">
              <span className="text-xl text-gray-400">?</span>
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{stock.symbol} · {stock.market === 'US' ? '🇺🇸 미국' : '🇰🇷 한국'}</span>
              {onToggleFavorite && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite();
                  }}
                  className="hover:scale-110 transition-transform"
                >
                  <span className="text-sm">{isFavorite ? '❤️' : '🤍'}</span>
                </button>
              )}
            </div>
            <div className="text-base sm:text-lg font-bold text-gray-900 truncate">{stock.name}</div>
          </div>
        </div>
      </div>

      {/* 종합 점수 - 가로 바 형태 */}
      <div className="mb-4">
        <AIScoreGauge score={stock.aiScore} sentiment={stock.sentiment} variant="bar" />
      </div>

      {/* 클릭 유도 */}
      <div className="text-center">
        <span className="text-xs text-indigo-600 font-medium">
          클릭하여 상세 분석 보기 →
        </span>
      </div>
    </div>
  );
}
