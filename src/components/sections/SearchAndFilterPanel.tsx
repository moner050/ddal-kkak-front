import React from 'react';
import { classNames } from '../../utils/format';
import CategoryChips from '../common/CategoryChips';
import { CATEGORIES, SECTOR_INDUSTRIES } from '../../constants/categories';

interface SearchAndFilterPanelProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  market: string;
  setMarket: (market: string) => void;
  category: string;
  setCategory: (category: string) => void;
  industry: string;
  setIndustry: (industry: string) => void;
  minScore: number;
  setMinScore: (score: number) => void;
  maxScore: number;
  setMaxScore: (score: number) => void;
  setPage: (page: number) => void;
  onReset: () => void;
}

/**
 * SearchAndFilterPanel - 검색 및 필터 패널
 * 종목 검색, 시장/섹터/산업군 필터, 점수 범위 필터 제공
 */
export default function SearchAndFilterPanel({
  searchQuery,
  setSearchQuery,
  market,
  setMarket,
  category,
  setCategory,
  industry,
  setIndustry,
  minScore,
  setMinScore,
  maxScore,
  setMaxScore,
  setPage,
  onReset
}: SearchAndFilterPanelProps) {
  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 space-y-4">
      {/* 필터 헤더 및 초기화 버튼 */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <div className="text-sm font-bold text-gray-900">🔍 검색 및 필터</div>
        <button
          onClick={onReset}
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold transition-colors flex items-center gap-1"
        >
          <span>🔄</span>
          <span>초기화</span>
        </button>
      </div>

      {/* 검색창 */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="종목명 또는 티커 검색 (예: 삼성전자, AAPL)"
        className="w-full rounded-lg border border-gray-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-200"
      />

      {/* 시장 선택 - KR 종목 지원 예정 */}
      <div>
        <div className="text-[10px] sm:text-xs text-gray-600 mb-2 font-semibold">시장</div>
        <div className="flex gap-1.5 sm:gap-2">
          {(["전체", "US"] as const).map((marketOption) => (
            <button
              key={marketOption}
              onClick={() => setMarket(marketOption)}
              className={classNames(
                "flex-1 sm:flex-initial rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all",
                market === marketOption
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              )}
            >
              {marketOption === "전체" ? "🌐 전체" : "🇺🇸 미국"}
            </button>
          ))}
        </div>
      </div>

      {/* 카테고리 선택 */}
      <div>
        <div className="text-[10px] sm:text-xs text-gray-600 mb-2 font-semibold">GICS 섹터</div>
        <CategoryChips
          value={category}
          onChange={setCategory}
          categories={[...CATEGORIES]}
        />
      </div>

      {/* 산업군 선택 */}
      {category !== "전체" && SECTOR_INDUSTRIES[category] && (
        <div>
          <div className="text-[10px] sm:text-xs text-gray-600 mb-2 font-semibold">산업군</div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {SECTOR_INDUSTRIES[category].map((industryOption) => (
              <button
                key={industryOption}
                onClick={() => setIndustry(industryOption)}
                className={classNames(
                  "rounded-lg px-2.5 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm font-semibold transition-all",
                  industry === industryOption
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                )}
              >
                {industryOption}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 종합 점수 범위 필터 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] sm:text-xs text-gray-600 font-semibold">종합 점수 범위</div>
          <div className="text-xs text-indigo-600 font-semibold">
            {minScore} - {maxScore}점
          </div>
        </div>

        <div className="space-y-3">
          {/* 최소 점수 슬라이더 */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-[10px] text-gray-500 min-w-[60px]">최소 점수</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minScore}
                onChange={(e) => {
                  const newMin = parseInt(e.target.value);
                  if (newMin <= maxScore) {
                    setMinScore(newMin);
                    setPage(1);
                  }
                }}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-xs font-semibold text-gray-700 min-w-[40px] text-right">
                {minScore}
              </span>
            </div>
          </div>

          {/* 최대 점수 슬라이더 */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-[10px] text-gray-500 min-w-[60px]">최대 점수</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={maxScore}
                onChange={(e) => {
                  const newMax = parseInt(e.target.value);
                  if (newMax >= minScore) {
                    setMaxScore(newMax);
                    setPage(1);
                  }
                }}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-xs font-semibold text-gray-700 min-w-[40px] text-right">
                {maxScore}
              </span>
            </div>
          </div>

          {/* 빠른 선택 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setMinScore(70);
                setMaxScore(100);
                setPage(1);
              }}
              className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold transition-colors"
            >
              우수 (70+)
            </button>
            <button
              onClick={() => {
                setMinScore(50);
                setMaxScore(100);
                setPage(1);
              }}
              className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold transition-colors"
            >
              양호 (50+)
            </button>
            <button
              onClick={() => {
                setMinScore(0);
                setMaxScore(100);
                setPage(1);
              }}
              className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 font-semibold transition-colors"
            >
              전체
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
