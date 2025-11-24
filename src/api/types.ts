/**
 * Finance Info Shuttle - API Type Definitions
 * 백엔드 API 연동용 타입 정의
 */

// ============================================
// Enums & Constants
// ============================================

export type ApiSentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

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

export interface ApiSecFiling {
  id: number;
  ticker: string;
  companyName: string;
  filingType: FilingType;
  filingDate: string;
  fiscalYear?: number;
  fiscalQuarter?: number;
  sentiment: ApiSentiment;
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
  currentFiling: ApiSecFiling;
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

export interface ApiFavoriteStock {
  id: number;
  userId: string;
  ticker: string;
  stockInfo?: StockInfo;
  latestFiling?: ApiSecFiling;
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

export interface ApiUndervaluedStock {
  // Basic Info
  ticker: string;
  name: string;
  sector: string;
  industry?: string;
  market: string;
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
  opMargin?: number;
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

  // AI Analysis
  sentiment: ApiSentiment;
  confidence: number;
  rank?: number;

  // Profile
  passedProfiles: InvestmentProfile[];

  // Performance
  perfSinceIntro?: number;
  perf100d?: number;
  firstScreeningDate?: string;

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
// Featured Stock DTOs
// ============================================

export interface ApiFeaturedStock {
  ticker: string;
  name: string;
  sector: string;
  industry?: string;
  market: string;
  logoUrl?: string;
  currentPrice: number;
  targetPrice?: number;
  upside: number;
  reason: string;
  totalScore: number;
  passedProfiles: InvestmentProfile[];
  pe?: number;
  roe?: number;
  revGrowth?: number;
  marketCap: number;
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
  buyDate: string;
  sellDate: string;
  holdingDays: number;
  holdingYears: number;
  buyPrice: number;
  sellPrice: number;
  priceReturn: number;
  dividendReturn: number;
  totalReturn: number;
  annualizedReturn: number;
  totalDividends: number;
  dividendCount: number;
  screeningPassCount: number;
  undervaluedQualityCount: number;
  lastScreeningDate?: string;
  lastTotalScore?: number;
  maxDrawdown: number;
  volatility: number;
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
