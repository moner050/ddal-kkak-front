/**
 * 필터 및 정렬 Custom Hook
 *
 * 각 탭의 필터 및 정렬 상태를 관리합니다.
 * - 주식추천 탭 필터 (시장, 카테고리, 산업, 전략, 검색어, 정렬)
 * - 공시 분석 탭 필터 (시장, 카테고리, 산업, 감정, 검색어, 정렬)
 * - 관심 종목 탭 필터 (시장, 카테고리, 산업, 검색어)
 */

import { useState } from 'react';

export interface UseFiltersAndSortReturn {
  // 주식추천 페이지 필터
  undervaluedSearchQuery: string;
  setUndervaluedSearchQuery: (query: string) => void;
  undervaluedStrategies: Array<"undervalued_quality" | "value_basic" | "value_strict" | "growth_quality" | "momentum" | "swing">;
  setUndervaluedStrategies: (strategies: Array<"undervalued_quality" | "value_basic" | "value_strict" | "growth_quality" | "momentum" | "swing">) => void;
  undervaluedMarket: "전체" | "US" | "KR";
  setUndervaluedMarket: (market: "전체" | "US" | "KR") => void;
  undervaluedCategory: string;
  setUndervaluedCategory: (category: string) => void;
  undervaluedIndustry: string;
  setUndervaluedIndustry: (industry: string) => void;
  undervaluedPage: number;
  setUndervaluedPage: (page: number) => void;
  undervaluedCategoryPages: Record<string, number>;
  setUndervaluedCategoryPages: (pages: Record<string, number>) => void;
  undervaluedSortBy: string | null;
  setUndervaluedSortBy: (sortBy: string | null) => void;
  undervaluedSortDirection: "asc" | "desc";
  setUndervaluedSortDirection: (direction: "asc" | "desc") => void;

  // 공시 분석 페이지 필터
  filingsSearchQuery: string;
  setFilingsSearchQuery: (query: string) => void;
  filingsPage: number;
  setFilingsPage: (page: number) => void;
  filingsSortBy: string | null;
  setFilingsSortBy: (sortBy: string | null) => void;
  filingsSortDirection: "asc" | "desc";
  setFilingsSortDirection: (direction: "asc" | "desc") => void;
  filingsSentimentFilter: "ALL" | "POS" | "NEG" | "NEU";
  setFilingsSentimentFilter: (sentiment: "ALL" | "POS" | "NEG" | "NEU") => void;
  filingsMarketFilter: "전체" | "US" | "KR";
  setFilingsMarketFilter: (market: "전체" | "US" | "KR") => void;
  filingsCategory: string;
  setFilingsCategory: (category: string) => void;
  filingsIndustry: string;
  setFilingsIndustry: (industry: string) => void;

  // 관심 종목 페이지 필터
  watchlistSearchQuery: string;
  setWatchlistSearchQuery: (query: string) => void;
  watchlistMarket: "전체" | "US" | "KR";
  setWatchlistMarket: (market: "전체" | "US" | "KR") => void;
  watchlistCategory: string;
  setWatchlistCategory: (category: string) => void;
  watchlistIndustry: string;
  setWatchlistIndustry: (industry: string) => void;

  // 정렬 핸들러
  handleUndervaluedSort: (key: string) => void;
  handleFilingsSort: (key: string) => void;

  // 투자 전략 토글
  toggleStrategy: (strategy: "undervalued_quality" | "value_basic" | "value_strict" | "growth_quality" | "momentum" | "swing") => void;
}

/**
 * 필터 및 정렬 hook
 */
export function useFiltersAndSort(): UseFiltersAndSortReturn {
  // 주식추천 페이지 필터
  const [undervaluedSearchQuery, setUndervaluedSearchQuery] = useState("");
  const [undervaluedStrategies, setUndervaluedStrategies] = useState<Array<"undervalued_quality" | "value_basic" | "value_strict" | "growth_quality" | "momentum" | "swing">>([]); // 빈 배열 = 전체 표시
  const [undervaluedMarket, setUndervaluedMarket] = useState<"전체" | "US" | "KR">("전체");
  const [undervaluedCategory, setUndervaluedCategory] = useState("전체");
  const [undervaluedIndustry, setUndervaluedIndustry] = useState("전체");
  const [undervaluedPage, setUndervaluedPage] = useState(1);
  const [undervaluedCategoryPages, setUndervaluedCategoryPages] = useState<Record<string, number>>({}); // 섹터별 페이지 상태 저장
  const [undervaluedSortBy, setUndervaluedSortBy] = useState<string | null>("aiScore"); // 기본적으로 종합 점수 높은 순으로 정렬
  const [undervaluedSortDirection, setUndervaluedSortDirection] = useState<"asc" | "desc">("desc");

  // 공시 분석 페이지 필터
  const [filingsSearchQuery, setFilingsSearchQuery] = useState("");
  const [filingsPage, setFilingsPage] = useState(1);
  const [filingsSortBy, setFilingsSortBy] = useState<string | null>(null);
  const [filingsSortDirection, setFilingsSortDirection] = useState<"asc" | "desc">("desc");
  const [filingsSentimentFilter, setFilingsSentimentFilter] = useState<"ALL" | "POS" | "NEG" | "NEU">("ALL");
  const [filingsMarketFilter, setFilingsMarketFilter] = useState<"전체" | "US" | "KR">("전체");
  const [filingsCategory, setFilingsCategory] = useState("전체");
  const [filingsIndustry, setFilingsIndustry] = useState("전체");

  // 관심 종목 페이지 필터
  const [watchlistSearchQuery, setWatchlistSearchQuery] = useState("");
  const [watchlistMarket, setWatchlistMarket] = useState<"전체" | "US" | "KR">("전체");
  const [watchlistCategory, setWatchlistCategory] = useState("전체");
  const [watchlistIndustry, setWatchlistIndustry] = useState("전체");

  // 정렬 핸들러
  const handleUndervaluedSort = (key: string) => {
    if (undervaluedSortBy === key) {
      setUndervaluedSortDirection(undervaluedSortDirection === "asc" ? "desc" : "asc");
    } else {
      setUndervaluedSortBy(key);
      setUndervaluedSortDirection("desc");
    }
    setUndervaluedPage(1); // Reset to first page on sort
  };

  const handleFilingsSort = (key: string) => {
    if (filingsSortBy === key) {
      setFilingsSortDirection(filingsSortDirection === "asc" ? "desc" : "asc");
    } else {
      setFilingsSortBy(key);
      setFilingsSortDirection("desc");
    }
    setFilingsPage(1); // Reset to first page on sort
  };

  // 투자 전략 토글 핸들러
  const toggleStrategy = (strategy: "undervalued_quality" | "value_basic" | "value_strict" | "growth_quality" | "momentum" | "swing") => {
    setUndervaluedStrategies(prev => {
      if (prev.includes(strategy)) {
        // 이미 선택되어 있으면 제거
        return prev.filter(s => s !== strategy);
      } else {
        // 선택되어 있지 않으면 추가
        return [...prev, strategy];
      }
    });
    // 페이지는 1페이지로 초기화
    setUndervaluedPage(1);
  };

  return {
    // 주식추천 페이지 필터
    undervaluedSearchQuery,
    setUndervaluedSearchQuery,
    undervaluedStrategies,
    setUndervaluedStrategies,
    undervaluedMarket,
    setUndervaluedMarket,
    undervaluedCategory,
    setUndervaluedCategory,
    undervaluedIndustry,
    setUndervaluedIndustry,
    undervaluedPage,
    setUndervaluedPage,
    undervaluedCategoryPages,
    setUndervaluedCategoryPages,
    undervaluedSortBy,
    setUndervaluedSortBy,
    undervaluedSortDirection,
    setUndervaluedSortDirection,

    // 공시 분석 페이지 필터
    filingsSearchQuery,
    setFilingsSearchQuery,
    filingsPage,
    setFilingsPage,
    filingsSortBy,
    setFilingsSortBy,
    filingsSortDirection,
    setFilingsSortDirection,
    filingsSentimentFilter,
    setFilingsSentimentFilter,
    filingsMarketFilter,
    setFilingsMarketFilter,
    filingsCategory,
    setFilingsCategory,
    filingsIndustry,
    setFilingsIndustry,

    // 관심 종목 페이지 필터
    watchlistSearchQuery,
    setWatchlistSearchQuery,
    watchlistMarket,
    setWatchlistMarket,
    watchlistCategory,
    setWatchlistCategory,
    watchlistIndustry,
    setWatchlistIndustry,

    // 정렬 핸들러
    handleUndervaluedSort,
    handleFilingsSort,

    // 투자 전략 토글
    toggleStrategy,
  };
}
