/**
 * Finance Info Shuttle - API Client
 * React Native Web (Expo) 프론트엔드용 API 클라이언트
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LoginRequest,
  SignupRequest,
  EmailSendRequest,
  EmailVerifyRequest,
  GoogleLoginRequest,
  NaverLoginRequest,
  KakaoLoginRequest,
  AuthResponse,
  CheckResponse,
  FavoriteStock,
  FavoriteStockRequest,
  FavoriteStockUpdateRequest,
  FavoriteCheckResponse,
  FavoriteMap,
  SecFiling,
  FilingWithScores,
  FilingType,
  StockInfo,
  MarketType,
  UndervaluedStock,
  FeaturedStock,
  LatestDateResponse,
  StockHistoryRangeResponse,
  ProfileCountResponse,
  StockStats,
  HealthResponse,
  BacktestResult,
  ScreeningStats,
  ProfilePerformance,
  TopScreenedStock,
  ExchangeRate,
  Page,
  InvestmentProfile,
  MessageResponse,
  EtfInfo,
  EtfListResponse,
  EtfHoldingsResponse,
  EtfSectorResponse,
  EtfCategoryResponse,
} from './types';

// ============================================
// Configuration
// ============================================

// 백엔드 API URL 설정
// 프로덕션(웹): 프록시를 통해 상대경로로 요청 (프론트엔드 서버의 /api 경로)
// 개발(네이티브): 직접 백엔드 서버에 연결

let API_BASE_URL = '';

// 런타임 환경 확인
if (typeof window !== 'undefined') {
  // 웹 환경
  const isLocalhost = window.location.origin === 'http://localhost:19006';
  if (!isLocalhost) {
    // 프로덕션: 상대경로 사용 (프록시 경로)
    API_BASE_URL = '';
    console.log('🌐 API Mode: Production (Proxy) - Using relative path: ""');
  } else {
    // 개발: 환경변수 또는 기본 HTTP URL
    API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://finance-mhb-api.kro.kr';
    console.log('🌐 API Mode: Development (Localhost) - Using:', API_BASE_URL);
  }
} else {
  // Node.js 환경 (빌드 스크립트)
  API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://finance-mhb-api.kro.kr';
  console.log('🌐 API Mode: Build Script (Node) - Using:', API_BASE_URL);
}

const AUTH_TOKEN_KEY = 'authToken';

// ============================================
// Axios Instance
// ============================================

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 600000, // 10분 (대용량 데이터 export를 위해)
});

// Request Interceptor - JWT 토큰 자동 추가 및 로깅
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Token retrieval error:', error);
    }

    // 요청 로깅 (디버깅용)
    const fullUrl = config.url;
    const method = config.method?.toUpperCase() || 'UNKNOWN';
    console.log(`📤 [${method}] ${fullUrl}`);

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - 에러 처리
apiClient.interceptors.response.use(
  (response: import('axios').AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

// ============================================
// Auth API
// ============================================

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', data);
    if (response.data.success && response.data.data?.token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.data.token);
    }
    return response.data;
  },

  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/signup', data);
    if (response.data.success && response.data.data?.token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.data.token);
    }
    return response.data;
  },

  sendVerificationEmail: async (data: EmailSendRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/api/v1/auth/signup/email/send', data);
    return response.data;
  },

  verifyEmail: async (data: EmailVerifyRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/api/v1/auth/signup/email/verify', data);
    return response.data;
  },

  checkUsername: async (username: string): Promise<CheckResponse> => {
    const response = await apiClient.get<CheckResponse>('/api/v1/auth/check/username', {
      params: { username },
    });
    return response.data;
  },

  checkEmail: async (email: string): Promise<CheckResponse> => {
    const response = await apiClient.get<CheckResponse>('/api/v1/auth/check/email', {
      params: { email },
    });
    return response.data;
  },

  googleLogin: async (data: GoogleLoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/google/login', data);
    if (response.data.success && response.data.data?.token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.data.token);
    }
    return response.data;
  },

  naverLogin: async (data: NaverLoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/naver/login', data);
    if (response.data.success && response.data.data?.token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.data.token);
    }
    return response.data;
  },

  kakaoLogin: async (data: KakaoLoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/kakao/login', data);
    if (response.data.success && response.data.data?.token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.data.token);
    }
    return response.data;
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  },

  isLoggedIn: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return !!token;
  },
};

// ============================================
// Favorites API
// ============================================

export const favoritesApi = {
  getAll: async (userId: string = 'default'): Promise<FavoriteStock[]> => {
    const response = await apiClient.get<FavoriteStock[]>('/api/v1/favorites', {
      params: { userId },
    });
    return response.data;
  },

  add: async (data: FavoriteStockRequest, userId: string = 'default'): Promise<FavoriteStock> => {
    const response = await apiClient.post<FavoriteStock>('/api/v1/favorites', data, {
      params: { userId },
    });
    return response.data;
  },

  delete: async (ticker: string, userId: string = 'default'): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(`/api/v1/favorites/${ticker}`, {
      params: { userId },
    });
    return response.data;
  },

  check: async (ticker: string, userId: string = 'default'): Promise<FavoriteCheckResponse> => {
    const response = await apiClient.get<FavoriteCheckResponse>(`/api/v1/favorites/check/${ticker}`, {
      params: { userId },
    });
    return response.data;
  },

  update: async (
    ticker: string,
    data: FavoriteStockUpdateRequest,
    userId: string = 'default'
  ): Promise<FavoriteStock> => {
    const response = await apiClient.patch<FavoriteStock>(`/api/v1/favorites/${ticker}`, data, {
      params: { userId },
    });
    return response.data;
  },

  getMap: async (userId: string = 'default'): Promise<FavoriteMap> => {
    const response = await apiClient.get<FavoriteMap>('/api/v1/favorites/map', {
      params: { userId },
    });
    return response.data;
  },

  toggle: async (ticker: string, userId: string = 'default'): Promise<FavoriteCheckResponse> => {
    const response = await apiClient.post<FavoriteCheckResponse>(`/api/v1/favorites/toggle/${ticker}`, null, {
      params: { userId },
    });
    return response.data;
  },
};

// ============================================
// SEC Filings API
// ============================================

export const filingsApi = {
  getWithScores: async (ticker: string): Promise<FilingWithScores> => {
    const response = await apiClient.get<FilingWithScores>(`/api/v1/sec-filings/${ticker}/with-scores`);
    return response.data;
  },

  getByTicker: async (ticker: string): Promise<SecFiling[]> => {
    const response = await apiClient.get<SecFiling[]>(`/api/v1/sec-filings/${ticker}`);
    return response.data;
  },

  getLatest: async (limit: number = 20): Promise<SecFiling[]> => {
    const response = await apiClient.get<SecFiling[]>('/api/v1/sec-filings/latest', {
      params: { limit },
    });
    return response.data;
  },

  getHighScore: async (minScore: number = 70, limit: number = 20): Promise<SecFiling[]> => {
    const response = await apiClient.get<SecFiling[]>('/api/v1/sec-filings/high-score', {
      params: { minScore, limit },
    });
    return response.data;
  },

  getPositive: async (daysAgo: number = 30, limit: number = 20): Promise<SecFiling[]> => {
    const response = await apiClient.get<SecFiling[]>('/api/v1/sec-filings/positive', {
      params: { daysAgo, limit },
    });
    return response.data;
  },

  getByType: async (filingType: FilingType, limit: number = 20): Promise<SecFiling[]> => {
    const response = await apiClient.get<SecFiling[]>(`/api/v1/sec-filings/by-type/${filingType}`, {
      params: { limit },
    });
    return response.data;
  },

  getAnnualReports: async (limit: number = 20): Promise<SecFiling[]> => {
    const response = await apiClient.get<SecFiling[]>('/api/v1/sec-filings/annual-reports', {
      params: { limit },
    });
    return response.data;
  },

  getQuarterlyReports: async (limit: number = 20): Promise<SecFiling[]> => {
    const response = await apiClient.get<SecFiling[]>('/api/v1/sec-filings/quarterly-reports', {
      params: { limit },
    });
    return response.data;
  },

  getBatch: async (tickers: string[]): Promise<Record<string, SecFiling>> => {
    const response = await apiClient.post<Record<string, SecFiling>>('/api/v1/sec-filings/batch', tickers);
    return response.data;
  },
};

// ============================================
// Stock Info API
// ============================================

export const stockInfoApi = {
  get: async (ticker: string): Promise<StockInfo> => {
    const response = await apiClient.get<StockInfo>(`/api/v1/stocks/${ticker}`);
    return response.data;
  },

  getByMarket: async (marketType: MarketType): Promise<StockInfo[]> => {
    const response = await apiClient.get<StockInfo[]>(`/api/v1/stocks/by-market/${marketType}`);
    return response.data;
  },

  getBySector: async (sector: string): Promise<StockInfo[]> => {
    const response = await apiClient.get<StockInfo[]>(`/api/v1/stocks/by-sector/${sector}`);
    return response.data;
  },
};

// ============================================
// Undervalued Stocks API
// ============================================

export const undervaluedStocksApi = {
  getLatestDate: async (): Promise<LatestDateResponse> => {
    const response = await apiClient.get<LatestDateResponse>('/api/undervalued-stocks/latest-date');
    return response.data;
  },

  getTop: async (limit: number = 100): Promise<UndervaluedStock[]> => {
    const response = await apiClient.get<UndervaluedStock[]>('/api/undervalued-stocks/top', {
      params: { limit },
    });
    return response.data;
  },

  get: async (ticker: string): Promise<UndervaluedStock> => {
    const response = await apiClient.get<UndervaluedStock>(`/api/undervalued-stocks/${ticker}`);
    return response.data;
  },

  getHistory: async (ticker: string, date: string): Promise<UndervaluedStock> => {
    const response = await apiClient.get<UndervaluedStock>(`/api/undervalued-stocks/${ticker}/history`, {
      params: { date },
    });
    return response.data;
  },

  getHistoryRange: async (ticker: string, startDate: string, endDate: string): Promise<StockHistoryRangeResponse> => {
    const response = await apiClient.get<StockHistoryRangeResponse>(
      `/api/undervalued-stocks/${ticker}/history/range`,
      {
        params: { startDate, endDate },
      }
    );
    return response.data;
  },

  getByProfile: async (profile: InvestmentProfile, limit: number = 50): Promise<UndervaluedStock[]> => {
    const response = await apiClient.get<UndervaluedStock[]>(`/api/undervalued-stocks/profile/${profile}`, {
      params: { limit },
    });
    return response.data;
  },

  getByProfilePaged: async (
    profile: InvestmentProfile,
    page: number = 0,
    size: number = 20,
    date?: string
  ): Promise<Page<UndervaluedStock>> => {
    const response = await apiClient.get<Page<UndervaluedStock>>(
      `/api/undervalued-stocks/profile/${profile}/paging`,
      { params: { page, size, date } }
    );
    return response.data;
  },

  getSectors: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/api/undervalued-stocks/sectors');
    return response.data;
  },

  getTopBySector: async (sector: string, limit: number = 20): Promise<UndervaluedStock[]> => {
    const response = await apiClient.get<UndervaluedStock[]>(`/api/undervalued-stocks/sector/${sector}/top`, {
      params: { limit },
    });
    return response.data;
  },

  filterByScore: async (
    minScore?: number,
    maxScore?: number,
    limit: number = 50
  ): Promise<UndervaluedStock[]> => {
    const response = await apiClient.get<UndervaluedStock[]>('/api/undervalued-stocks/filter/score', {
      params: { minScore, maxScore, limit },
    });
    return response.data;
  },

  filterByMarketCap: async (
    minMarketCap?: number,
    maxMarketCap?: number,
    limit: number = 50
  ): Promise<UndervaluedStock[]> => {
    const response = await apiClient.get<UndervaluedStock[]>('/api/undervalued-stocks/filter/market-cap', {
      params: { minMarketCap, maxMarketCap, limit },
    });
    return response.data;
  },

  getMostUndervalued: async (limit: number = 30): Promise<UndervaluedStock[]> => {
    const response = await apiClient.get<UndervaluedStock[]>('/api/undervalued-stocks/filter/most-undervalued', {
      params: { limit },
    });
    return response.data;
  },

  search: async (params: {
    profile?: InvestmentProfile;
    sector?: string;
    minScore?: number;
    page?: number;
    size?: number;
  }): Promise<Page<UndervaluedStock>> => {
    const response = await apiClient.get<Page<UndervaluedStock>>('/api/undervalued-stocks/search', {
      params,
    });
    return response.data;
  },

  getTopByGrowth: async (limit: number = 20): Promise<UndervaluedStock[]> => {
    const response = await apiClient.get<UndervaluedStock[]>('/api/undervalued-stocks/top/growth', {
      params: { limit },
    });
    return response.data;
  },

  getTopByQuality: async (limit: number = 20): Promise<UndervaluedStock[]> => {
    const response = await apiClient.get<UndervaluedStock[]>('/api/undervalued-stocks/top/quality', {
      params: { limit },
    });
    return response.data;
  },

  getTopByValue: async (limit: number = 20): Promise<UndervaluedStock[]> => {
    const response = await apiClient.get<UndervaluedStock[]>('/api/undervalued-stocks/top/value', {
      params: { limit },
    });
    return response.data;
  },

  getTopByMomentum: async (limit: number = 20): Promise<UndervaluedStock[]> => {
    const response = await apiClient.get<UndervaluedStock[]>('/api/undervalued-stocks/top/momentum', {
      params: { limit },
    });
    return response.data;
  },

  getStats: async (): Promise<StockStats> => {
    const response = await apiClient.get<StockStats>('/api/undervalued-stocks/stats');
    return response.data;
  },

  getProfileCount: async (profile: InvestmentProfile): Promise<ProfileCountResponse> => {
    const response = await apiClient.get<ProfileCountResponse>(
      `/api/undervalued-stocks/profile/${profile}/count`
    );
    return response.data;
  },

  getFeatured: async (limit: number = 5): Promise<FeaturedStock[]> => {
    const response = await apiClient.get<FeaturedStock[]>('/api/undervalued-stocks/featured', {
      params: { limit },
    });
    return response.data;
  },

  export: async (limit: number = 1000): Promise<{
    lastUpdated: string;
    dataDate: string;
    totalCount: number;
    stocks: UndervaluedStock[];
  }> => {
    const response = await apiClient.get('/api/undervalued-stocks/export', {
      params: { limit },
    });
    return response.data;
  },

  health: async (): Promise<HealthResponse> => {
    const response = await apiClient.get<HealthResponse>('/api/undervalued-stocks/health');
    return response.data;
  },
};

// ============================================
// Backtest API
// ============================================

export const backtestApi = {
  run: async (ticker: string, years: number = 3): Promise<BacktestResult> => {
    const response = await apiClient.get<BacktestResult>(`/api/v1/stock/backtest/${ticker}`, {
      params: { years },
    });
    return response.data;
  },

  runBatch: async (tickers: string[], years: number = 3): Promise<BacktestResult[]> => {
    const response = await apiClient.get<BacktestResult[]>('/api/v1/stock/backtest/batch', {
      params: { tickers: tickers.join(','), years },
    });
    return response.data;
  },

  getScreeningStats: async (ticker: string): Promise<ScreeningStats> => {
    const response = await apiClient.get<ScreeningStats>(`/api/v1/stock/backtest/screening-stats/${ticker}`);
    return response.data;
  },

  getProfilePerformance: async (
    profile: InvestmentProfile,
    years: number = 3
  ): Promise<ProfilePerformance> => {
    const response = await apiClient.get<ProfilePerformance>(
      `/api/v1/stock/backtest/profile-performance/${profile}`,
      { params: { years } }
    );
    return response.data;
  },

  getTopScreened: async (limit: number = 20): Promise<TopScreenedStock[]> => {
    const response = await apiClient.get<TopScreenedStock[]>('/api/v1/stock/backtest/top-screened', {
      params: { limit },
    });
    return response.data;
  },
};

// ============================================
// Exchange Rate API
// ============================================

export const exchangeRateApi = {
  get: async (symbol: string = 'KRW/USD'): Promise<ExchangeRate> => {
    const response = await apiClient.get<ExchangeRate>('/v1/api/finance/twelve-data/exchange-rate', {
      params: { symbol },
    });
    return response.data;
  },
};

// ============================================
// ETF API
// ============================================

export const etfApi = {
  // 전체 ETF 목록 조회 (AUM 기준 정렬)
  getAll: async (): Promise<EtfListResponse> => {
    const response = await apiClient.get<EtfListResponse>('/api/v1/etfs');
    return response.data;
  },

  // ETF 상세 조회 (보유 종목 Top 10, 섹터 비중 포함)
  get: async (ticker: string): Promise<EtfInfo> => {
    const response = await apiClient.get<EtfInfo>(`/api/v1/etfs/${ticker}`);
    return response.data;
  },

  // 섹터별 ETF 조회
  getBySector: async (sector: string): Promise<EtfSectorResponse> => {
    const response = await apiClient.get<EtfSectorResponse>(`/api/v1/etfs/sector/${sector}`);
    return response.data;
  },

  // 카테고리별 ETF 조회
  getByCategory: async (category: string): Promise<EtfCategoryResponse> => {
    const response = await apiClient.get<EtfCategoryResponse>(`/api/v1/etfs/category/${category}`);
    return response.data;
  },

  // 종목 → ETF 역방향 조회 (Simple) ⭐⭐⭐ 프론트엔드 추천
  getHoldingsSimple: async (symbol: string): Promise<EtfHoldingsResponse> => {
    const response = await apiClient.get<EtfHoldingsResponse>(`/api/v1/etfs/holdings/${symbol}/simple`);
    return response.data;
  },

  // 종목 → ETF 역방향 조회 (Full)
  getHoldings: async (symbol: string): Promise<{ symbol: string; count: number; etfs: EtfInfo[] }> => {
    const response = await apiClient.get<{ symbol: string; count: number; etfs: EtfInfo[] }>(
      `/api/v1/etfs/holdings/${symbol}`
    );
    return response.data;
  },
};

// ============================================
// Export All APIs
// ============================================

export const api = {
  auth: authApi,
  favorites: favoritesApi,
  filings: filingsApi,
  stockInfo: stockInfoApi,
  undervaluedStocks: undervaluedStocksApi,
  backtest: backtestApi,
  exchangeRate: exchangeRateApi,
  etf: etfApi,
};

export default api;
