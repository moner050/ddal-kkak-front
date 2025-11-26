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
   * 정적 JSON 파일에서 저평가 우량주 데이터 로드
   * 빌드 타임에 생성된 static JSON 파일 사용
   */
  exportAllStocks: async (limit: number = 1000): Promise<{
    lastUpdated: string;
    dataDate: string;
    totalCount: number;
    stocks: FrontendUndervaluedStock[];
  }> => {
    try {
      // static JSON 파일에서 로드
      const response = await fetch('/data/undervalued-stocks.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // API 응답 형식과 동일하게 변환
      const usStocks = filterUSOnlyFromApi(data.stocks);
      return {
        lastUpdated: data.lastUpdated,
        dataDate: data.dataDate,
        totalCount: usStocks.length,
        stocks: toFrontendUndervaluedStocks(usStocks),
      };
    } catch (error) {
      console.error('Failed to load stocks from static JSON:', error);
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

  /**
   * 최신 데이터 기준일 조회
   */
  getLatestDataDate: async (): Promise<string | null> => {
    try {
      const response = await undervaluedStocksApi.getLatestDate();
      return response.latestDate;
    } catch (error) {
      console.error('Failed to fetch latest data date:', error);
      return null;
    }
  },

  /**
   * 특정 날짜의 종목 히스토리 조회
   */
  getStockHistory: async (
    ticker: string,
    date: string
  ): Promise<FrontendUndervaluedStock | null> => {
    try {
      const apiStock = await undervaluedStocksApi.getHistory(ticker, date);
      return toFrontendUndervaluedStock(apiStock);
    } catch (error) {
      console.error(`Failed to fetch stock history for ${ticker} on ${date}:`, error);
      return null;
    }
  },

  /**
   * 날짜 범위의 종목 히스토리 조회
   * @param ticker 종목 심볼
   * @param dates 조회할 날짜 배열 (YYYY-MM-DD 형식)
   */
  getStockHistoryRange: async (
    ticker: string,
    dates: string[]
  ): Promise<FrontendUndervaluedStock[]> => {
    try {
      const historyPromises = dates.map((date) =>
        undervaluedStocksApi.getHistory(ticker, date).catch((err) => {
          console.warn(`Failed to fetch history for ${ticker} on ${date}:`, err);
          return null;
        })
      );

      const results = await Promise.all(historyPromises);
      const validResults = results.filter((r) => r !== null);
      return toFrontendUndervaluedStocks(validResults);
    } catch (error) {
      console.error(`Failed to fetch stock history range for ${ticker}:`, error);
      return [];
    }
  },

  /**
   * 날짜 범위 생성 유틸리티 (최근 N개월)
   * @param endDate 종료일 (YYYY-MM-DD)
   * @param months 개월 수
   * @param interval 간격 (일 단위, 기본 7일)
   */
  generateDateRange: (
    endDate: string,
    months: number,
    interval: number = 7
  ): string[] => {
    const end = new Date(endDate);
    const start = new Date(endDate);
    start.setMonth(start.getMonth() - months);

    const dates: string[] = [];
    const current = new Date(start);

    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + interval);
    }

    // 마지막 날짜가 endDate가 아니면 추가
    if (dates[dates.length - 1] !== endDate) {
      dates.push(endDate);
    }

    return dates;
  },

  /**
   * 정적 JSON 파일에서 종목 히스토리 데이터 로드
   * 빌드 타임에 생성된 stock-histories.json 파일 사용
   */
  loadStaticHistories: async (): Promise<{
    lastUpdated: string;
    latestDate: string | null;
    stocks: Record<string, {
      ticker: string;
      name: string;
      dataPoints: number;
      history: any[];
    }>;
  }> => {
    try {
      const response = await fetch('/data/stock-histories.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return {
        lastUpdated: data.lastUpdated,
        latestDate: data.latestDate,
        stocks: data.stocks || {},
      };
    } catch (error) {
      console.error('Failed to load stock histories from static JSON:', error);
      return {
        lastUpdated: new Date().toISOString(),
        latestDate: null,
        stocks: {},
      };
    }
  },

  /**
   * 특정 종목의 히스토리 데이터를 정적 JSON에서 조회
   * @param ticker 종목 심볼
   */
  getStaticHistory: async (ticker: string): Promise<FrontendUndervaluedStock[]> => {
    try {
      const historyData = await stockService.loadStaticHistories();
      const stockHistory = historyData.stocks[ticker];

      if (!stockHistory || !stockHistory.history) {
        console.warn(`No static history found for ${ticker}`);
        return [];
      }

      return toFrontendUndervaluedStocks(stockHistory.history);
    } catch (error) {
      console.error(`Failed to get static history for ${ticker}:`, error);
      return [];
    }
  },
};

// ============================================
// 오늘의 주목 종목 서비스
// ============================================

export const featuredService = {
  /**
   * 정적 JSON 파일에서 오늘의 주목 종목 로드
   */
  getFeatured: async (limit: number = 5): Promise<FrontendFeaturedStock[]> => {
    try {
      // static JSON 파일에서 로드
      const response = await fetch('/data/featured-stocks.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      const usStocks = filterUSOnlyFromApi(data.stocks);
      return toFrontendFeaturedStocks(usStocks.slice(0, limit));
    } catch (error) {
      console.error('Failed to load featured stocks from static JSON:', error);
      return [];
    }
  },
};

// ============================================
// 공시 서비스
// ============================================

export const filingService = {
  /**
   * 정적 JSON 파일에서 최신 공시 로드
   */
  getLatest: async (limit: number = 20): Promise<FrontendFiling[]> => {
    try {
      // static JSON 파일에서 로드
      const response = await fetch('/data/filings.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      return toFrontendFilings(data.filings.slice(0, limit));
    } catch (error) {
      console.error('Failed to load filings from static JSON:', error);
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
