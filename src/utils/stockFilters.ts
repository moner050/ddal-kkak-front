/**
 * 주식 필터링 유틸리티 함수들
 */

import type { FrontendUndervaluedStock, FrontendFiling } from './apiMappers';
import { matchesInvestmentStrategy } from './stockMetrics';

/**
 * 주식 필터링 (시장, 카테고리, 산업, 검색어, 투자전략)
 */
export function filterStocks(
  stocks: FrontendUndervaluedStock[],
  filters: {
    market?: "전체" | "US" | "KR";
    category?: string;
    industry?: string;
    searchQuery?: string;
    strategies?: Array<string>;
  }
): FrontendUndervaluedStock[] {
  const { market, category, industry, searchQuery, strategies } = filters;

  return stocks.filter((stock) => {
    // 시장 필터
    if (market && market !== "전체" && stock.market !== market) {
      return false;
    }

    // 카테고리 필터
    if (category && category !== "전체" && stock.category !== category) {
      return false;
    }

    // 산업 필터
    if (industry && industry !== "전체" && stock.industry !== industry) {
      return false;
    }

    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        stock.symbol?.toLowerCase().includes(query) ||
        stock.name?.toLowerCase().includes(query) ||
        stock.category?.toLowerCase().includes(query) ||
        stock.industry?.toLowerCase().includes(query);

      if (!matchesSearch) return false;
    }

    // 투자전략 필터
    if (strategies && strategies.length > 0) {
      const matchesAnyStrategy = strategies.some((strategy) =>
        matchesInvestmentStrategy(stock, strategy as any)
      );
      if (!matchesAnyStrategy) return false;
    }

    return true;
  });
}

/**
 * 공시 필터링 (시장, 카테고리, 산업, 감정, 검색어)
 */
export function filterFilings(
  filings: FrontendFiling[],
  filters: {
    market?: "전체" | "US" | "KR";
    category?: string;
    industry?: string;
    sentiment?: "ALL" | "POS" | "NEG" | "NEU";
    searchQuery?: string;
  }
): FrontendFiling[] {
  const { market, category, industry, sentiment, searchQuery } = filters;

  return filings.filter((filing) => {
    // 시장 필터
    if (market && market !== "전체" && filing.market !== market) {
      return false;
    }

    // 카테고리 필터
    if (category && category !== "전체" && filing.category !== category) {
      return false;
    }

    // 산업 필터
    if (industry && industry !== "전체" && filing.industry !== industry) {
      return false;
    }

    // 감정 필터
    if (sentiment && sentiment !== "ALL" && filing.sentiment !== sentiment) {
      return false;
    }

    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        filing.symbol?.toLowerCase().includes(query) ||
        filing.company?.toLowerCase().includes(query) ||
        filing.summary?.toLowerCase().includes(query) ||
        filing.formType?.toLowerCase().includes(query);

      if (!matchesSearch) return false;
    }

    return true;
  });
}

/**
 * 정렬 함수
 */
export function sortItems<T>(
  items: T[],
  sortBy: string | null,
  sortDirection: "asc" | "desc"
): T[] {
  if (!sortBy) return items;

  return [...items].sort((a, b) => {
    const aVal = (a as any)[sortBy];
    const bVal = (b as any)[sortBy];

    // null/undefined 처리
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return sortDirection === "asc" ? 1 : -1;
    if (bVal == null) return sortDirection === "asc" ? -1 : 1;

    // 숫자 비교
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }

    // 문자열 비교
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();

    if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
    if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });
}

/**
 * 페이지네이션
 */
export function paginateItems<T>(
  items: T[],
  page: number,
  itemsPerPage: number
): { items: T[]; totalPages: number } {
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedItems = items.slice(start, end);

  return {
    items: paginatedItems,
    totalPages,
  };
}
