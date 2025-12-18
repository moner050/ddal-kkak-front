/**
 * JSON 데이터 로더
 * 빌드 타임에 다운로드된 JSON 파일을 런타임에 로드
 * API 호출 없이 정적 파일에서 데이터 로드
 */

import type { UndervaluedStock, FeaturedStock, Filing } from '../data/mock/types';

export type Market = 'US' | 'KR';

/**
 * 캐시 저장소
 */
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const CACHE = new Map<string, CacheEntry>();

// TTL (Time To Live) 설정 (밀리초)
const CACHE_TTL = {
  stocks: 24 * 60 * 60 * 1000,    // 24시간 (저평가 주식)
  featured: 1 * 60 * 60 * 1000,    // 1시간 (주목 종목)
  filings: 1 * 60 * 60 * 1000,     // 1시간 (공시는 자주 변함)
  etfs: 24 * 60 * 60 * 1000,       // 24시간 (ETF)
};

/**
 * JSON 파일 로드 (캐싱 포함)
 */
async function loadJSON<T = any>(path: string, ttl: number): Promise<T | null> {
  // 캐시 확인
  const cached = CACHE.get(path);
  if (cached && Date.now() - cached.timestamp < ttl) {
    console.log(`✓ Loaded from cache: ${path}`);
    return cached.data;
  }

  try {
    console.log(`📥 Loading: ${path}`);
    const response = await fetch(path);

    if (!response.ok) {
      console.error(`❌ Failed to load ${path}: HTTP ${response.status}`);
      return null;
    }

    const data = await response.json() as T;

    // 캐시에 저장
    CACHE.set(path, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    console.log(`✓ Loaded: ${path}`);
    return data;
  } catch (error) {
    console.error(`❌ Error loading ${path}:`, error);
    return null;
  }
}

/**
 * 저평가 주식 로드 (마켓별)
 * @param market 시장 ('US' | 'KR')
 * @returns UndervaluedStock 배열
 */
export async function loadUndervaluedStocks(
  market: Market = 'US'
): Promise<UndervaluedStock[]> {
  const data = await loadJSON<{
    market: Market;
    lastUpdated: string;
    dataDate: string;
    totalCount: number;
    stocks: UndervaluedStock[];
  }>(
    `/data/undervalued-stocks-${market.toLowerCase()}.json`,
    CACHE_TTL.stocks
  );

  return data?.stocks || [];
}

/**
 * 오늘의 주목 종목 로드 (마켓별)
 * @param market 시장 ('US' | 'KR')
 * @returns FeaturedStock 배열
 */
export async function loadFeaturedStocks(
  market: Market = 'US'
): Promise<FeaturedStock[]> {
  const data = await loadJSON<{
    market: Market;
    lastUpdated: string;
    totalCount: number;
    stocks: FeaturedStock[];
  }>(
    `/data/featured-stocks-${market.toLowerCase()}.json`,
    CACHE_TTL.featured
  );

  return data?.stocks || [];
}

/**
 * 공시 정보 로드 (마켓별)
 * @param market 시장 ('US' | 'KR')
 * @returns Filing 배열
 */
export async function loadFilings(
  market: Market = 'US'
): Promise<Filing[]> {
  const data = await loadJSON<{
    market: Market;
    lastUpdated: string;
    totalCount: number;
    filings: Filing[];
  }>(
    `/data/filings-${market.toLowerCase()}.json`,
    CACHE_TTL.filings
  );

  return data?.filings || [];
}

/**
 * 모든 마켓의 저평가 주식 로드 (병렬 처리)
 * @returns 모든 마켓의 UndervaluedStock 통합 배열
 */
export async function loadAllUndervaluedStocks(): Promise<UndervaluedStock[]> {
  const [usStocks, krStocks] = await Promise.all([
    loadUndervaluedStocks('US'),
    loadUndervaluedStocks('KR'),
  ]);

  return [...usStocks, ...krStocks];
}

/**
 * 모든 마켓의 주목 종목 로드 (병렬 처리)
 * @returns 모든 마켓의 FeaturedStock 통합 배열
 */
export async function loadAllFeaturedStocks(): Promise<FeaturedStock[]> {
  const [usStocks, krStocks] = await Promise.all([
    loadFeaturedStocks('US'),
    loadFeaturedStocks('KR'),
  ]);

  return [...usStocks, ...krStocks];
}

/**
 * 모든 마켓의 공시 정보 로드 (병렬 처리)
 * @returns 모든 마켓의 Filing 통합 배열
 */
export async function loadAllFilings(): Promise<Filing[]> {
  const [usFilings, krFilings] = await Promise.all([
    loadFilings('US'),
    loadFilings('KR'),
  ]);

  return [...usFilings, ...krFilings];
}

/**
 * 마켓별 메타데이터 조회
 * @param market 시장 ('US' | 'KR')
 * @returns 데이터 메타데이터
 */
export async function getDataMetadata(market: Market = 'US') {
  const data = await loadJSON<{
    market: Market;
    lastUpdated: string;
    dataDate: string;
    totalCount: number;
  }>(
    `/data/undervalued-stocks-${market.toLowerCase()}.json`,
    CACHE_TTL.stocks
  );

  return {
    market: data?.market,
    dataDate: data?.dataDate,
    lastUpdated: data?.lastUpdated,
    totalCount: data?.totalCount,
  };
}

/**
 * 캐시 초기화
 */
export function clearCache() {
  CACHE.clear();
  console.log('✓ Cache cleared');
}

/**
 * 캐시 상태 조회
 */
export function getCacheStatus() {
  const entries = Array.from(CACHE.entries()).map(([path, entry]) => ({
    path,
    timestamp: new Date(entry.timestamp).toISOString(),
    age: `${Math.round((Date.now() - entry.timestamp) / 1000)}s`,
  }));

  return {
    size: CACHE.size,
    entries,
  };
}
