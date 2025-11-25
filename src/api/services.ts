/**
 * API 서비스 - API 호출 + 데이터 변환을 통합 처리
 * 프론트엔드에서 직접 사용하는 서비스 레이어
 */

import { undervaluedStocksApi, filingsApi, favoritesApi } from './client';
import {
  toFrontendUndervaluedStock,
  toFrontendUndervaluedStocks,
  toFrontendFeaturedStock,
  toFrontendFeaturedStocks,
  toFrontendFiling,
  toFrontendFilings,
  filterUSOnlyFromApi,
  type FrontendUndervaluedStock,
  type FrontendFeaturedStock,
  type FrontendFiling,
} from '../utils/apiMappers';
import type { InvestmentProfile } from './types';

// ============================================
// 저평가 우량주 서비스
// ============================================

export const stockService = {
  /**
   * 전체 저평가 우량주 데이터 Export (정적 데이터용)
   * lastUpdated 타임스탬프 포함
   */
  exportAllStocks: async (limit: number = 1000): Promise<{
    lastUpdated: string;
    dataDate: string;
    totalCount: number;
    stocks: FrontendUndervaluedStock[];
  }> => {
    try {
      const response = await undervaluedStocksApi.export(limit);
      const usStocks = filterUSOnlyFromApi(response.stocks);
      return {
        lastUpdated: response.lastUpdated,
        dataDate: response.dataDate,
        totalCount: usStocks.length,
        stocks: toFrontendUndervaluedStocks(usStocks),
      };
    } catch (error) {
      console.error('Failed to export stocks:', error);
      return {
        lastUpdated: new Date().toISOString(),
        dataDate: new Date().toISOString().split('T')[0],
        totalCount: 0,
        stocks: [],
      };
    }
  },

  /**
   * Top N 저평가 우량주 조회 (US 종목만)
   * @deprecated exportAllStocks 사용 권장
   */
  getTopStocks: async (limit: number = 100): Promise<FrontendUndervaluedStock[]> => {
    try {
      const apiStocks = await undervaluedStocksApi.getTop(limit);
      const usStocks = filterUSOnlyFromApi(apiStocks);
      return toFrontendUndervaluedStocks(usStocks);
    } catch (error) {
      console.error('Failed to fetch top stocks:', error);
      return [];
    }
  },

  /**
   * 프로필별 저평가 우량주 조회 (US 종목만)
   */
  getStocksByProfile: async (
    profile: InvestmentProfile,
    limit: number = 50
  ): Promise<FrontendUndervaluedStock[]> => {
    try {
      const apiStocks = await undervaluedStocksApi.getByProfile(profile, limit);
      const usStocks = filterUSOnlyFromApi(apiStocks);
      return toFrontendUndervaluedStocks(usStocks);
    } catch (error) {
      console.error(`Failed to fetch stocks by profile ${profile}:`, error);
      return [];
    }
  },

  /**
   * 특정 종목 상세 조회
   */
  getStock: async (ticker: string): Promise<FrontendUndervaluedStock | null> => {
    try {
      const apiStock = await undervaluedStocksApi.get(ticker);
      return toFrontendUndervaluedStock(apiStock);
    } catch (error) {
      console.error(`Failed to fetch stock ${ticker}:`, error);
      return null;
    }
  },

  /**
   * 섹터별 Top 조회 (US 종목만)
   */
  getTopBySector: async (
    sector: string,
    limit: number = 20
  ): Promise<FrontendUndervaluedStock[]> => {
    try {
      const apiStocks = await undervaluedStocksApi.getTopBySector(sector, limit);
      const usStocks = filterUSOnlyFromApi(apiStocks);
      return toFrontendUndervaluedStocks(usStocks);
    } catch (error) {
      console.error(`Failed to fetch stocks by sector ${sector}:`, error);
      return [];
    }
  },

  /**
   * 점수 필터링 (US 종목만)
   */
  filterByScore: async (
    minScore?: number,
    maxScore?: number,
    limit: number = 50
  ): Promise<FrontendUndervaluedStock[]> => {
    try {
      const apiStocks = await undervaluedStocksApi.filterByScore(minScore, maxScore, limit);
      const usStocks = filterUSOnlyFromApi(apiStocks);
      return toFrontendUndervaluedStocks(usStocks);
    } catch (error) {
      console.error('Failed to filter stocks by score:', error);
      return [];
    }
  },

  /**
   * 카테고리별 Top N (US 종목만)
   */
  getTopByCategory: async (
    category: 'growth' | 'quality' | 'value' | 'momentum',
    limit: number = 20
  ): Promise<FrontendUndervaluedStock[]> => {
    try {
      let apiStocks;
      switch (category) {
        case 'growth':
          apiStocks = await undervaluedStocksApi.getTopByGrowth(limit);
          break;
        case 'quality':
          apiStocks = await undervaluedStocksApi.getTopByQuality(limit);
          break;
        case 'value':
          apiStocks = await undervaluedStocksApi.getTopByValue(limit);
          break;
        case 'momentum':
          apiStocks = await undervaluedStocksApi.getTopByMomentum(limit);
          break;
      }
      const usStocks = filterUSOnlyFromApi(apiStocks);
      return toFrontendUndervaluedStocks(usStocks);
    } catch (error) {
      console.error(`Failed to fetch top ${category} stocks:`, error);
      return [];
    }
  },

  /**
   * 통계 조회
   */
  getStats: async () => {
    try {
      return await undervaluedStocksApi.getStats();
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return null;
    }
  },
};

// ============================================
// 오늘의 주목 종목 서비스
// ============================================

export const featuredService = {
  /**
   * 오늘의 주목 종목 조회 (US 종목만)
   */
  getFeatured: async (limit: number = 5): Promise<FrontendFeaturedStock[]> => {
    try {
      const apiStocks = await undervaluedStocksApi.getFeatured(limit);
      const usStocks = filterUSOnlyFromApi(apiStocks);
      return toFrontendFeaturedStocks(usStocks);
    } catch (error) {
      console.error('Failed to fetch featured stocks:', error);
      return [];
    }
  },
};

// ============================================
// 공시 서비스
// ============================================

export const filingService = {
  /**
   * 최신 공시 조회
   */
  getLatest: async (limit: number = 20): Promise<FrontendFiling[]> => {
    try {
      const apiFilings = await filingsApi.getLatest(limit);
      return toFrontendFilings(apiFilings);
    } catch (error) {
      console.error('Failed to fetch latest filings:', error);
      return [];
    }
  },

  /**
   * 고득점 공시 조회
   */
  getHighScore: async (minScore: number = 70, limit: number = 20): Promise<FrontendFiling[]> => {
    try {
      const apiFilings = await filingsApi.getHighScore(minScore, limit);
      return toFrontendFilings(apiFilings);
    } catch (error) {
      console.error('Failed to fetch high score filings:', error);
      return [];
    }
  },

  /**
   * 긍정적 공시 조회
   */
  getPositive: async (daysAgo: number = 30, limit: number = 20): Promise<FrontendFiling[]> => {
    try {
      const apiFilings = await filingsApi.getPositive(daysAgo, limit);
      return toFrontendFilings(apiFilings);
    } catch (error) {
      console.error('Failed to fetch positive filings:', error);
      return [];
    }
  },

  /**
   * 특정 종목의 공시 조회 (점수 히스토리 포함)
   */
  getByTickerWithScores: async (ticker: string): Promise<FrontendFiling | null> => {
    try {
      const data = await filingsApi.getWithScores(ticker);
      return toFrontendFiling(data.currentFiling, data.scoreHistory);
    } catch (error) {
      console.error(`Failed to fetch filings for ${ticker}:`, error);
      return null;
    }
  },

  /**
   * 특정 종목의 모든 공시 조회
   */
  getByTicker: async (ticker: string): Promise<FrontendFiling[]> => {
    try {
      const apiFilings = await filingsApi.getByTicker(ticker);
      return toFrontendFilings(apiFilings);
    } catch (error) {
      console.error(`Failed to fetch filings for ${ticker}:`, error);
      return [];
    }
  },
};

// ============================================
// 즐겨찾기 서비스
// ============================================

export const favoriteService = {
  /**
   * 즐겨찾기 Map 조회
   */
  getMap: async (userId: string = 'default'): Promise<Record<string, boolean>> => {
    try {
      return await favoritesApi.getMap(userId);
    } catch (error) {
      console.error('Failed to fetch favorites map:', error);
      return {};
    }
  },

  /**
   * 즐겨찾기 토글
   */
  toggle: async (ticker: string, userId: string = 'default'): Promise<boolean> => {
    try {
      const result = await favoritesApi.toggle(ticker, userId);
      return result.isFavorite;
    } catch (error) {
      console.error(`Failed to toggle favorite for ${ticker}:`, error);
      return false;
    }
  },

  /**
   * 즐겨찾기 여부 확인
   */
  check: async (ticker: string, userId: string = 'default'): Promise<boolean> => {
    try {
      const result = await favoritesApi.check(ticker, userId);
      return result.isFavorite;
    } catch (error) {
      console.error(`Failed to check favorite for ${ticker}:`, error);
      return false;
    }
  },
};

// ============================================
// 통합 export
// ============================================

export const apiServices = {
  stock: stockService,
  featured: featuredService,
  filing: filingService,
  favorite: favoriteService,
};

export default apiServices;
