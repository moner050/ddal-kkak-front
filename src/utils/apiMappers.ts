/**
 * API ↔ Frontend 데이터 변환 유틸리티
 */

import type { Sentiment as FrontendSentiment, Market } from '../data/mock/types';
import type {
  Sentiment,
  UndervaluedStock,
  FeaturedStock,
  SecFiling,
  FilingType,
  GicsSector,
} from '../api/types';
import { toKoreanSector as mapSectorToKorean, toKoreanIndustry as mapIndustryToKorean } from '../constants/sectorMapping';

// ============================================
// Sentiment 변환
// ============================================

const SENTIMENT_TO_FRONTEND: Record<Sentiment, FrontendSentiment> = {
  'POSITIVE': 'POS',
  'NEUTRAL': 'NEU',
  'NEGATIVE': 'NEG',
};

const SENTIMENT_TO_API: Record<FrontendSentiment, Sentiment> = {
  'POS': 'POSITIVE',
  'NEU': 'NEUTRAL',
  'NEG': 'NEGATIVE',
};

export const toFrontendSentiment = (apiSentiment: Sentiment): FrontendSentiment => {
  return SENTIMENT_TO_FRONTEND[apiSentiment] || 'NEU';
};

export const toApiSentiment = (frontendSentiment: FrontendSentiment): Sentiment => {
  return SENTIMENT_TO_API[frontendSentiment] || 'NEUTRAL';
};

// ============================================
// Sector & Industry 변환 (영문 ↔ 한글)
// ============================================

/**
 * 백엔드 API의 영문 sector를 한글로 변환
 * sectorMapping.ts의 포괄적인 매핑 사용
 */
export const toKoreanSector = (sector: string): string => {
  return mapSectorToKorean(sector);
};

/**
 * 백엔드 API의 영문 industry를 한글로 변환
 * sectorMapping.ts의 포괄적인 매핑 사용
 */
export const toKoreanIndustry = (industry: string): string => {
  return mapIndustryToKorean(industry);
};

// 한글 → 영문 매핑 (필터링/검색용)
const SECTOR_TO_ENGLISH: Record<string, string> = {
  '정보기술': 'Information Technology',
  '헬스케어': 'Healthcare',
  '금융': 'Financials',
  '경기소비재': 'Consumer Discretionary',
  '커뮤니케이션 서비스': 'Communication Services',
  '산업재': 'Industrials',
  '필수소비재': 'Consumer Staples',
  '에너지': 'Energy',
  '유틸리티': 'Utilities',
  '부동산': 'Real Estate',
  '소재': 'Materials',
};

export const toEnglishSector = (sector: string): string => {
  return SECTOR_TO_ENGLISH[sector] || sector;
};

// ============================================
// Filing Type 변환
// ============================================

const FILING_TYPE_TO_FRONTEND: Record<FilingType, string> = {
  'FORM_10K': '10-K',
  'FORM_10Q': '10-Q',
  'FORM_8K': '8-K',
};

const FILING_TYPE_TO_API: Record<string, FilingType> = {
  '10-K': 'FORM_10K',
  '10-Q': 'FORM_10Q',
  '8-K': 'FORM_8K',
};

export const toFrontendFilingType = (apiType: FilingType): string => {
  return FILING_TYPE_TO_FRONTEND[apiType] || apiType;
};

export const toApiFilingType = (frontendType: string): FilingType | string => {
  return FILING_TYPE_TO_API[frontendType] || frontendType;
};

// ============================================
// UndervaluedStock 변환
// ============================================

export interface FrontendUndervaluedStock {
  market: Market;
  symbol: string;
  name: string;
  category: string;
  industry: string;
  sector: string;
  rank: number;
  aiScore: number;
  sentiment: FrontendSentiment;
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
  // 추가 필드 (API에서 제공)
  price?: number;
  marketCap?: number;
  confidence?: number;
  passedProfiles?: string[];
  growthScore?: number;
  qualityScore?: number;
  valueScore?: number;
  momentumScore?: number;
  totalScore?: number;
}

export const toFrontendUndervaluedStock = (
  apiStock: UndervaluedStock,
  index?: number
): FrontendUndervaluedStock => {
  return {
    market: apiStock.market as Market,
    symbol: apiStock.ticker,
    name: apiStock.name,
    category: toKoreanSector(apiStock.sector),
    industry: toKoreanIndustry(apiStock.industry || ''),
    sector: toKoreanSector(apiStock.sector),
    rank: apiStock.rank ?? (index !== undefined ? index + 1 : 0),
    aiScore: apiStock.totalScore,
    sentiment: toFrontendSentiment(apiStock.sentiment),
    introducedAt: apiStock.firstScreeningDate || '',
    perfSinceIntro: apiStock.perfSinceIntro ?? 0,
    perf100d: apiStock.perf100d ?? 0,
    logoUrl: apiStock.logoUrl || '',
    ROE: apiStock.roe ?? 0,
    PER: apiStock.pe ?? 0,
    PEG: apiStock.peg ?? 0,
    PBR: apiStock.pb ?? 0,
    PSR: apiStock.ps ?? 0,
    RevYoY: apiStock.revGrowth ?? 0,
    EPS_Growth_3Y: apiStock.epsGrowth3Y ?? 0,
    OpMarginTTM: (apiStock.opMargin ?? 0) * 100, // API는 소수점, Frontend는 퍼센트
    FCF_Yield: apiStock.fcfYield ?? 0,
    // 추가 필드
    price: apiStock.price,
    marketCap: apiStock.marketCap,
    confidence: apiStock.confidence,
    passedProfiles: apiStock.passedProfiles,
    growthScore: apiStock.growthScore,
    qualityScore: apiStock.qualityScore,
    valueScore: apiStock.valueScore,
    momentumScore: apiStock.momentumScore,
    totalScore: apiStock.totalScore,
  };
};

export const toFrontendUndervaluedStocks = (
  apiStocks: UndervaluedStock[]
): FrontendUndervaluedStock[] => {
  return apiStocks.map((stock, index) => toFrontendUndervaluedStock(stock, index));
};

// ============================================
// FeaturedStock 변환
// ============================================

export interface FrontendFeaturedStock {
  id: string;
  market: Market;
  symbol: string;
  name: string;
  category: string;
  aiScore: number;
  sentiment: FrontendSentiment;
  confidence: number;
  reason: string;
  logoUrl: string;
  currentPrice: number;
  targetPrice: number;
  upside: number;
}

export const toFrontendFeaturedStock = (apiStock: FeaturedStock): FrontendFeaturedStock => {
  return {
    id: `featured-${apiStock.ticker}`,
    market: apiStock.market as Market,
    symbol: apiStock.ticker,
    name: apiStock.name,
    category: toKoreanSector(apiStock.sector),
    aiScore: apiStock.totalScore,
    sentiment: toFrontendSentiment(apiStock.sentiment),
    confidence: apiStock.confidence,
    reason: apiStock.reason,
    logoUrl: apiStock.logoUrl || '',
    currentPrice: apiStock.currentPrice,
    targetPrice: apiStock.targetPrice ?? apiStock.currentPrice,
    upside: apiStock.upside,
  };
};

export const toFrontendFeaturedStocks = (apiStocks: FeaturedStock[]): FrontendFeaturedStock[] => {
  return apiStocks.map(toFrontendFeaturedStock);
};

// ============================================
// Filing 변환
// ============================================

export interface FrontendFiling {
  id: string;
  market: Market;
  symbol: string;
  company: string;
  formType: string;
  date: string;
  summary: string;
  direction: string;
  sentiment: FrontendSentiment;
  confidence: number;
  aiScore: number;
  category: string;
  industry: string;
  logoUrl: string;
  previousScores: number[];
}

export const toFrontendFiling = (
  apiFiling: SecFiling,
  scoreHistory?: { score: number; dataDate: string }[]
): FrontendFiling => {
  const sentiment = toFrontendSentiment(apiFiling.sentiment);

  return {
    id: String(apiFiling.id),
    market: (apiFiling.stockInfo?.marketType || 'US') as Market,
    symbol: apiFiling.ticker,
    company: apiFiling.companyName,
    formType: toFrontendFilingType(apiFiling.filingType),
    date: apiFiling.filingDate,
    summary: apiFiling.summary || '',
    direction: sentiment, // direction과 sentiment 동일하게 처리
    sentiment,
    confidence: apiFiling.score / 100,
    aiScore: apiFiling.score,
    category: toKoreanSector(apiFiling.stockInfo?.gicsSector || ''),
    industry: toKoreanIndustry(apiFiling.stockInfo?.gicsIndustryGroup || ''),
    logoUrl: apiFiling.stockInfo?.logoUrl || '',
    previousScores: scoreHistory?.map(h => h.score) || [],
  };
};

export const toFrontendFilings = (apiFilings: SecFiling[]): FrontendFiling[] => {
  return apiFilings.map(filing => toFrontendFiling(filing));
};

// ============================================
// US 종목만 필터링
// ============================================

export const filterUSOnly = <T extends { market: string }>(items: T[]): T[] => {
  return items.filter(item => item.market === 'US');
};

export const filterUSOnlyFromApi = <T extends { market: string }>(items: T[]): T[] => {
  return items.filter(item => item.market === 'US');
};
