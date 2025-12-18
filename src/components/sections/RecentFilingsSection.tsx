import React from 'react';
import { classNames } from '../../utils/format';
import FilingAnalysisCard from '../stock/FilingAnalysisCard';
import type { FrontendFiling } from '../../utils/apiMappers';

interface RecentFilingsSectionProps {
  filings: FrontendFiling[];
  filingsMarket: "US" | "KR";
  setFilingsMarket: (market: "US" | "KR") => void;
  isLoadingFilings: boolean;
  openStockDetail: (symbol: string, tab: "info" | "filings") => void;
  switchTab: (tab: string) => void;
  setFilingsMarketFilter: (market: string) => void;
  favorites: Record<string, boolean>;
  toggleFavorite: (symbol: string) => void;
}

/**
 * RecentFilingsSection - 최근 공시 분석 섹션
 * AI가 분석한 최신 기업 공시 및 보고서 표시
 */
export default function RecentFilingsSection({
  filings,
  filingsMarket,
  setFilingsMarket,
  isLoadingFilings,
  openStockDetail,
  switchTab,
  setFilingsMarketFilter,
  favorites,
  toggleFavorite
}: RecentFilingsSectionProps) {
  return (
    <section>
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-2 gap-2">
          <h2 className="text-base sm:text-xl font-extrabold text-gray-900 flex items-center gap-1 sm:gap-2">
            <span className="text-lg sm:text-2xl">📊</span>
            <span className="hidden sm:inline">최근 공시 분석</span>
            <span className="sm:hidden">공시 분석</span>
          </h2>
          <button
            onClick={() => {
              setFilingsMarketFilter(filingsMarket === "US" ? "US" : "KR");
              switchTab("filings");
            }}
            className="rounded-lg bg-indigo-600 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 whitespace-nowrap"
          >
            <span className="hidden sm:inline">전체 보기 →</span>
            <span className="sm:hidden">전체</span>
          </button>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs sm:text-sm text-gray-600">AI가 분석한 최신 기업 공시 및 보고서</p>
          <div className="rounded-full border border-gray-200 bg-gray-50 p-0.5 sm:p-1 flex gap-0.5 sm:gap-1">
            <button
              onClick={() => setFilingsMarket("US")}
              className={classNames("rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold transition-all whitespace-nowrap", filingsMarket === "US" ? "bg-indigo-600 text-white shadow" : "text-gray-700 hover:bg-gray-100")}
            >
              🇺🇸 미국
            </button>
            {/* ✨ KR 종목 지원 활성화 */}
            <button
              onClick={() => setFilingsMarket("KR")}
              className={classNames("rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold transition-all whitespace-nowrap", filingsMarket === "KR" ? "bg-indigo-600 text-white shadow" : "text-gray-700 hover:bg-gray-100")}
            >
              🇰🇷 한국
            </button>
          </div>
        </div>
      </div>
      <div className="grid gap-2 sm:gap-3 md:grid-cols-2">
        {isLoadingFilings ? (
          <div className="col-span-2 text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-gray-600 font-medium">데이터를 불러오는 중...</p>
          </div>
        ) : filings.filter(f => f.market === filingsMarket).length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-600 font-medium">데이터가 없습니다</p>
            <p className="text-sm text-gray-500 mt-2">백엔드 서버 연결을 확인해주세요</p>
          </div>
        ) : (
          filings.filter(f => f.market === filingsMarket).slice(0, 4).map((filing) => (
            <FilingAnalysisCard
              key={filing.id}
              filing={filing}
              onClick={() => openStockDetail(filing.symbol, "filings")}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />
          ))
        )}
      </div>
    </section>
  );
}
