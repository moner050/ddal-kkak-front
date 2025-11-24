/**
 * Mock 데이터를 위한 타입 정의
 * 백엔드 API 연동 전까지 임시로 사용
 */

export type Sentiment = "POS" | "NEU" | "NEG";

export type Market = "US" | "KR";

export interface CategoryMove {
  name: string;
  pct: number;
}

export interface FeaturedStock {
  id: string;
  market: Market;
  symbol: string;
  name: string;
  category: string;
  aiScore: number;
  sentiment: Sentiment;
  confidence: number;
  reason: string;
  logoUrl: string;
  currentPrice: number;
  targetPrice: number;
  upside: number;
}

export interface Filing {
  id: string;
  market: Market;
  symbol: string;
  company: string;
  formType: string;
  date: string;
  summary: string;
  direction: string;
  sentiment: Sentiment;
  confidence: number;
  aiScore: number;
  category: string;
  industry: string;
  logoUrl: string;
  previousScores: number[];
}

export interface UndervaluedStock {
  market: Market;
  symbol: string;
  name: string;
  category: string;
  industry: string;
  sector: string;
  rank: number;
  aiScore: number;
  sentiment: Sentiment;
  introducedAt: string;
  perfSinceIntro: number;
  perf100d: number;
  logoUrl: string;
  ROE: number;
  PER: number;
  PEG: number;
  PBR: number;
  PSR: number;
  RevYoY: number;
  EPS_Growth_3Y: number;
  OpMarginTTM: number;
  FCF_Yield: number;
}

export interface StockDetail {
  [key: string]: string | number;
  Ticker: string;
  Name: string;
  Sector: string;
  Industry: string;
  Price: number;
  MktCap: number;
  DollarVol: number;
  FairValue: number;
  Discount: number;
  PE: number;
  PEG: number;
  PB: number;
  PS: number;
  EV_EBITDA: number;
  ROE: number;
  ROA: number;
  OpMarginTTM: number;
  OperatingMargins: number;
  RevYoY: number;
  EPS_Growth_3Y: number;
  Revenue_Growth_3Y: number;
  EBITDA_Growth_3Y: number;
  FCF_Yield: number;
  DivYield: number;
  PayoutRatio: number;
  Beta: number;
  ShortPercent: number;
  InsiderOwnership: number;
  InstitutionOwnership: number;
  RVOL: number;
  RSI_14: number;
  ATR_PCT: number;
  Volatility_21D: number;
  RET5: number;
  RET20: number;
  RET63: number;
  SMA20: number;
  SMA50: number;
  SMA200: number;
  MACD: number;
  MACD_Signal: number;
  MACD_Histogram: number;
  BB_Position: number;
  High_52W_Ratio: number;
  Low_52W_Ratio: number;
  Momentum_12M: number;
  GrowthScore: number;
  QualityScore: number;
  ValueScore: number;
  MomentumScore: number;
  TotalScore: number;
}

export interface NewsItem {
  id: string;
  date: string;
  category: string;
  title: string;
  summary?: string;
  body?: string;
  link?: string;
  importance: number;
  reason: string;
}
