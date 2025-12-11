import React, { RefObject } from 'react';
import { classNames } from '../../utils/format';
import FeaturedStockCard from '../stock/FeaturedStockCard';
import type { FrontendFeaturedStock } from '../../utils/apiMappers';

interface FeaturedStocksSectionProps {
  featuredSectionRef?: RefObject<HTMLDivElement>;
  featuredStocks: FrontendFeaturedStock[];
  featuredMarket: "US" | "KR";
  setFeaturedMarket: (market: "US" | "KR") => void;
  isLoadingFeatured: boolean;
  openStockDetail: (symbol: string, tab: "info" | "filings") => void;
  switchTab: (tab: string) => void;
  setUndervaluedMarket: (market: string) => void;
  favorites: Record<string, boolean>;
  toggleFavorite: (symbol: string) => void;
}

/**
 * FeaturedStocksSection - 오늘의 주목 종목 섹션
 * AI가 선정한 투자 가치가 높은 종목 표시
 */
export default function FeaturedStocksSection({
  featuredSectionRef,
  featuredStocks,
  featuredMarket,
  setFeaturedMarket,
  isLoadingFeatured,
  openStockDetail,
  switchTab,
  setUndervaluedMarket,
  favorites,
  toggleFavorite
}: FeaturedStocksSectionProps) {
  return (
    <section ref={featuredSectionRef}>
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-2 gap-2">
          <h2 className="text-base sm:text-xl font-extrabold text-gray-900 flex items-center gap-1 sm:gap-2">
            <span className="text-lg sm:text-2xl">💎</span>
            <span className="hidden sm:inline">오늘의 주목 종목</span>
            <span className="sm:hidden">주목 종목</span>
          </h2>
          <button
            onClick={() => {
              setUndervaluedMarket(featuredMarket === "US" ? "US" : "KR");
              switchTab("undervalued");
            }}
            className="rounded-lg bg-indigo-600 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 whitespace-nowrap"
          >
            <span className="hidden sm:inline">전체 보기 →</span>
            <span className="sm:hidden">전체</span>
          </button>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs sm:text-sm text-gray-600">AI가 선정한 투자 가치가 높은 종목</p>
          <div className="rounded-full border border-gray-200 bg-gray-50 p-0.5 sm:p-1 flex gap-0.5 sm:gap-1">
            <button
              onClick={() => setFeaturedMarket("US")}
              className={classNames("rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold transition-all whitespace-nowrap", featuredMarket === "US" ? "bg-indigo-600 text-white shadow" : "text-gray-700 hover:bg-gray-100")}
            >
              🇺🇸 미국
            </button>
            {/* KR 종목 지원 예정 - 현재 숨김 처리
            <button
              onClick={() => setFeaturedMarket("KR")}
              className={classNames("rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold transition-all whitespace-nowrap", featuredMarket === "KR" ? "bg-indigo-600 text-white shadow" : "text-gray-700 hover:bg-gray-100")}
            >
              🇰🇷 한국
            </button>
            */}
          </div>
        </div>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {isLoadingFeatured ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-gray-600 font-medium">데이터를 불러오는 중...</p>
          </div>
        ) : featuredStocks.filter(s => s.market === featuredMarket).length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-600 font-medium">데이터가 없습니다</p>
            <p className="text-sm text-gray-500 mt-2">백엔드 서버 연결을 확인해주세요</p>
          </div>
        ) : (
          featuredStocks.filter(s => s.market === featuredMarket).map((stock) => (
            <FeaturedStockCard
              key={stock.id}
              stock={stock}
              onClick={() => openStockDetail(stock.symbol, "info")}
              isFavorite={favorites[stock.symbol]}
              onToggleFavorite={() => toggleFavorite(stock.symbol)}
            />
          ))
        )}
      </div>
    </section>
  );
}
