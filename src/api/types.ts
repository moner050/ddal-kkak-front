/**
 * Finance Info Shuttle - TypeScript Type Definitions
 * React Native Web (Expo) 프론트엔드 연동용 타입 정의
 * 백엔드 API와 동일한 타입 정의 사용
 */

// ============================================
// Enums & Constants
// ============================================

export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

export type FilingType = 'FORM_10K' | 'FORM_10Q' | 'FORM_8K';

export type MarketType = 'US' | 'KR';

export type UserRole = 'ROLE_USER' | 'ROLE_PREMIUM' | 'ROLE_MANAGER' | 'ROLE_ADMIN';

export type InvestmentProfile =
  | 'undervalued_quality'
  | 'value_basic'
  | 'value_strict'
  | 'growth_quality'
  | 'momentum'
  | 'swing';

export type GicsSector =
  | 'Information Technology'
  | 'Healthcare'
  | 'Financials'
  | 'Consumer Discretionary'
  | 'Communication Services'
  | 'Industrials'
  | 'Consumer Staples'
  | 'Energy'
  | 'Utilities'
  | 'Real Estate'
  | 'Materials';

// ============================================
// Auth DTOs
// ============================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  password: string;
  email: string;
  verificationCode: string;
}

export interface EmailSendRequest {
  email: string;
}

export interface EmailVerifyRequest {
  email: string;
  verificationCode: string;
}

export interface GoogleLoginRequest {
  code: string;
  redirectUri: string;
}

export interface NaverLoginRequest {
  code: string;
  state: string;
  redirectUri: string;
}

export interface KakaoLoginRequest {
  code: string;
  redirectUri: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    username: string;
    email: string;
    role: UserRole;
    message?: string;
  };
  message?: string;
}

export interface CheckResponse {
  success: boolean;
  exists: boolean;
  message: string;
}

// ============================================
// Stock Info DTOs
// ============================================

export interface StockInfo {
  ticker: string;
  companyName: string;
  marketType: MarketType;
  gicsSector?: string;
  gicsSectorCode?: string;
  gicsIndustryGroup?: string;
  logoUrl?: string;
  companyDomain?: string;
  exchange?: string;
  currency?: string;
}

// ============================================
// SEC Filing DTOs
// ============================================

export interface SecFiling {
  id: number;
  ticker: string;
  companyName: string;
  filingType: FilingType;
  filingDate: string;
  fiscalYear?: number;
  fiscalQuarter?: number;
  sentiment: Sentiment;
  score: number;
  summary?: string;
  detailedAnalysis?: string;
  filingUrl?: string;
  aiModel?: string;
  positiveFactors?: string;
  negativeFactors?: string;
  stockInfo?: StockInfo;
}

export interface ScoreHistory {
  score: number;
  dataDate: string;
}

export interface FilingWithScores {
  currentFiling: SecFiling;
  scoreHistory: ScoreHistory[];
}

// ============================================
// Favorite Stock DTOs
// ============================================

export interface FavoriteStockRequest {
  ticker: string;
  memo?: string;
  notificationEnabled?: boolean;
}

export interface FavoriteStockUpdateRequest {
  memo?: string;
  notificationEnabled?: boolean;
}

export interface FavoriteStock {
  id: number;
  userId: string;
  ticker: string;
  stockInfo?: StockInfo;
  latestFiling?: SecFiling;
  memo?: string;
  notificationEnabled: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface FavoriteCheckResponse {
  isFavorite: boolean;
}

export type FavoriteMap = Record<string, boolean>;

// ============================================
// Undervalued Stock DTOs
// ============================================

export interface UndervaluedStock {
  // Basic Info
  ticker: string;
  name: string;
  sector: string;
  industry?: string;
  market: string;  // "US" | "KR"
  logoUrl?: string;

  // Price Data
  price: number;
  marketCap: number;
  dollarVolume?: number;

  // Valuation Metrics
  pe?: number;
  peg?: number;
  pb?: number;
  ps?: number;
  evEbitda?: number;
  fcfYield?: number;
  divYield?: number;
  payoutRatio?: number;

  // Profitability Metrics
  roe?: number;
  roa?: number;
  opMargin?: number;       // 영업이익률 (TTM)
  operatingMargins?: number;
  grossMargins?: number;
  netMargins?: number;

  // Growth Metrics
  revGrowth?: number;
  epsGrowth3Y?: number;
  revenueGrowth3Y?: number;
  ebitdaGrowth3Y?: number;

  // Technical Indicators
  sma20?: number;
  sma50?: number;
  sma200?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  bbPosition?: number;
  atr?: number;

  // Momentum Metrics
  ret5d?: number;
  ret20d?: number;
  ret63d?: number;
  momentum12m?: number;
  volatility?: number;
  high52wRatio?: number;
  low52wRatio?: number;
  rvol?: number;

  // Risk Metrics
  beta?: number;
  shortPercent?: number;
  insiderOwnership?: number;
  institutionOwnership?: number;

  // Fair Value
  fairValue?: number;
  discount?: number;

  // Scores
  growthScore: number;
  qualityScore: number;
  valueScore: number;
  momentumScore: number;
  totalScore: number;

  // AI Analysis (AI 분석 정보)
  sentiment: Sentiment;     // 감성 분석 (POSITIVE/NEUTRAL/NEGATIVE)
  confidence: number;       // 신뢰도 (0.0 ~ 1.0)
  rank?: number;            // 순위 (totalScore 기준, 리스트 조회 시에만 제공)

  // Profile
  passedProfiles: InvestmentProfile[];

  // Performance (수익률)
  perfSinceIntro?: number;  // 첫 스크리닝 통과 이후 수익률 (%)
  perf100d?: number;        // 100일 수익률 (%)
  firstScreeningDate?: string;  // 첫 스크리닝 통과 날짜

  // Metadata
  dataDate: string;
}

export interface LatestDateResponse {
  latestDate: string;
}

export interface ProfileCountResponse {
  profile: string;
  count: number;
  latestDate: string;
}

export interface StockStats {
  latestDate: string;
  totalStocks: number;
  averageTotalScore: number;
  profileCounts: Record<InvestmentProfile, number>;
}

export interface HealthResponse {
  status: 'UP' | 'DOWN';
  service: string;
  timestamp: string;
  latestDataDate: string;
  dataStatus: string;
}

// ============================================
// Featured Stock DTOs (오늘의 주목 종목)
// ============================================

export interface FeaturedStock {
  // 기본 정보
  ticker: string;
  name: string;
  sector: string;
  industry?: string;
  market: string;
  logoUrl?: string;

  // 가격 정보
  currentPrice: number;
  targetPrice?: number;
  upside: number;

  // AI 분석 정보
  reason: string;
  totalScore: number;
  sentiment: Sentiment;     // 감성 분석 (POSITIVE/NEUTRAL/NEGATIVE)
  confidence: number;       // 신뢰도 (0.0 ~ 1.0)
  passedProfiles: InvestmentProfile[];

  // 주요 지표
  pe?: number;
  roe?: number;
  revGrowth?: number;
  marketCap: number;

  // 메타데이터
  dataDate: string;
  rank: number;
}

// ============================================
// Backtest DTOs
// ============================================

export interface BacktestResult {
  ticker: string;
  name: string;
  sector: string;

  // Investment Period
  buyDate: string;
  sellDate: string;
  holdingDays: number;
  holdingYears: number;

  // Prices
  buyPrice: number;
  sellPrice: number;

  // Returns
  priceReturn: number;
  dividendReturn: number;
  totalReturn: number;
  annualizedReturn: number;

  // Dividends
  totalDividends: number;
  dividendCount: number;

  // Screening
  screeningPassCount: number;
  undervaluedQualityCount: number;
  lastScreeningDate?: string;
  lastTotalScore?: number;

  // Risk
  maxDrawdown: number;
  volatility: number;

  // Comparison
  sp500Return: number;
  outperformance: number;
}

export interface ScreeningStats {
  ticker: string;
  totalScreenings: number;
  name: string;
  sector: string;
  lastScreeningDate?: string;
  lastTotalScore?: number;
  lastPassedProfiles: InvestmentProfile[];
  profileCounts: Record<string, number>;
  averageTotalScore: number;
  maxTotalScore: number;
  minTotalScore: number;
  firstScreeningDate?: string;
}

export interface ProfilePerformance {
  averageReturn: number;
  medianReturn: number;
  minReturn: number;
  maxReturn: number;
  stocksAnalyzed: number;
  successRate: number;
}

export interface TopScreenedStock {
  ticker: string;
  screeningCount: number;
  name: string;
  sector: string;
  lastTotalScore?: number;
  lastScreeningDate?: string;
  currentPrice?: number;
  marketCap?: number;
}

// ============================================
// Exchange Rate DTOs
// ============================================

export interface ExchangeRate {
  symbol: string;
  rate: number;
  timestamp: string;
}

// ============================================
// Pagination DTOs
// ============================================

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort?: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  offset?: number;
  paged?: boolean;
  unpaged?: boolean;
}

export interface Page<T> {
  content: T[];
  pageable: Pageable;
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ============================================
// Common Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface MessageResponse {
  message: string;
}

// ============================================
// API Query Parameters
// ============================================

export interface PaginationParams {
  page?: number;
  size?: number;
}

export interface StockSearchParams extends PaginationParams {
  profile?: InvestmentProfile;
  sector?: string;
  minScore?: number;
}

export interface ScoreFilterParams {
  minScore?: number;
  maxScore?: number;
  limit?: number;
}

export interface MarketCapFilterParams {
  minMarketCap?: number;
  maxMarketCap?: number;
  limit?: number;
}

export interface BacktestParams {
  years?: number;
}

export interface BatchBacktestParams {
  tickers: string;
  years?: number;
}

// ============================================
// API Endpoint Types (for type-safe API calls)
// ============================================

export interface ApiEndpoints {
  // Auth
  login: (data: LoginRequest) => Promise<AuthResponse>;
  signup: (data: SignupRequest) => Promise<AuthResponse>;
  sendVerificationEmail: (data: EmailSendRequest) => Promise<MessageResponse>;
  verifyEmail: (data: EmailVerifyRequest) => Promise<MessageResponse>;
  checkUsername: (username: string) => Promise<CheckResponse>;
  checkEmail: (email: string) => Promise<CheckResponse>;
  googleLogin: (data: GoogleLoginRequest) => Promise<AuthResponse>;
  naverLogin: (data: NaverLoginRequest) => Promise<AuthResponse>;
  kakaoLogin: (data: KakaoLoginRequest) => Promise<AuthResponse>;

  // Favorites
  getFavorites: (userId: string) => Promise<FavoriteStock[]>;
  addFavorite: (userId: string, data: FavoriteStockRequest) => Promise<FavoriteStock>;
  deleteFavorite: (ticker: string, userId: string) => Promise<MessageResponse>;
  checkFavorite: (ticker: string, userId: string) => Promise<FavoriteCheckResponse>;
  updateFavorite: (ticker: string, userId: string, data: FavoriteStockUpdateRequest) => Promise<FavoriteStock>;
  getFavoriteMap: (userId: string) => Promise<FavoriteMap>;
  toggleFavorite: (ticker: string, userId: string) => Promise<FavoriteCheckResponse>;

  // SEC Filings
  getFilingWithScores: (ticker: string) => Promise<FilingWithScores>;
  getFilings: (ticker: string) => Promise<SecFiling[]>;
  getLatestFilings: (limit?: number) => Promise<SecFiling[]>;
  getHighScoreFilings: (minScore?: number, limit?: number) => Promise<SecFiling[]>;
  getPositiveFilings: (daysAgo?: number, limit?: number) => Promise<SecFiling[]>;
  getFilingsByType: (filingType: FilingType, limit?: number) => Promise<SecFiling[]>;
  getAnnualReports: (limit?: number) => Promise<SecFiling[]>;
  getQuarterlyReports: (limit?: number) => Promise<SecFiling[]>;
  batchGetFilings: (tickers: string[]) => Promise<Record<string, SecFiling>>;

  // Stock Info
  getStockInfo: (ticker: string) => Promise<StockInfo>;
  getStocksByMarket: (marketType: MarketType) => Promise<StockInfo[]>;
  getStocksBySector: (sector: string) => Promise<StockInfo[]>;

  // Undervalued Stocks
  getLatestDate: () => Promise<LatestDateResponse>;
  getTopStocks: (limit?: number) => Promise<UndervaluedStock[]>;
  getStock: (ticker: string) => Promise<UndervaluedStock>;
  getStockHistory: (ticker: string, date: string) => Promise<UndervaluedStock>;
  getStocksByProfile: (profile: InvestmentProfile, limit?: number) => Promise<UndervaluedStock[]>;
  getStocksByProfilePaged: (profile: InvestmentProfile, params?: PaginationParams & { date?: string }) => Promise<Page<UndervaluedStock>>;
  getSectors: () => Promise<string[]>;
  getTopBySector: (sector: string, limit?: number) => Promise<UndervaluedStock[]>;
  filterByScore: (params: ScoreFilterParams) => Promise<UndervaluedStock[]>;
  filterByMarketCap: (params: MarketCapFilterParams) => Promise<UndervaluedStock[]>;
  getMostUndervalued: (limit?: number) => Promise<UndervaluedStock[]>;
  searchStocks: (params: StockSearchParams) => Promise<Page<UndervaluedStock>>;
  getTopByGrowth: (limit?: number) => Promise<UndervaluedStock[]>;
  getTopByQuality: (limit?: number) => Promise<UndervaluedStock[]>;
  getTopByValue: (limit?: number) => Promise<UndervaluedStock[]>;
  getTopByMomentum: (limit?: number) => Promise<UndervaluedStock[]>;
  getStats: () => Promise<StockStats>;
  getProfileCount: (profile: InvestmentProfile) => Promise<ProfileCountResponse>;
  healthCheck: () => Promise<HealthResponse>;

  // Backtest
  backtest: (ticker: string, years?: number) => Promise<BacktestResult>;
  batchBacktest: (tickers: string[], years?: number) => Promise<BacktestResult[]>;
  getScreeningStats: (ticker: string) => Promise<ScreeningStats>;
  getProfilePerformance: (profile: InvestmentProfile, years?: number) => Promise<ProfilePerformance>;
  getFrequencyCorrelation: (years?: number) => Promise<any>;
  getTopScreened: (limit?: number) => Promise<TopScreenedStock[]>;

  // Exchange Rate
  getExchangeRate: (symbol: string) => Promise<ExchangeRate>;
}

// ============================================
// Analytics & Visit Tracking
// ============================================

export interface VisitLogRequest {
  timestamp: string;
  sessionId: string;
  userAgent: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  language: string;
  referrer: string;
  timezone: string;
  isReturningVisitor: boolean;
}

export interface VisitLogResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    timestamp: string;
  };
}
