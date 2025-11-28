/**
 * GICS 섹터별 시장 성과 분석 서비스
 * 오늘과 어제 데이터를 비교하여 섹터별 변동률 계산
 */

import { stockService } from '../api/services';
import type { FrontendUndervaluedStock } from '../utils/apiMappers';
import type { GicsSector } from '../api/types';
import { toKoreanSector } from '../constants/sectorMapping';

// GICS 11개 섹터 정의
export const GICS_SECTORS: GicsSector[] = [
  'Information Technology',
  'Healthcare',
  'Financials',
  'Consumer Discretionary',
  'Communication Services',
  'Industrials',
  'Consumer Staples',
  'Energy',
  'Utilities',
  'Real Estate',
  'Materials',
];

export interface SectorPerformance {
  sector: string; // 영문 섹터명
  sectorKr: string; // 한글 섹터명
  changePercent: number; // 변동률 (%)
  stockCount: number; // 섹터 내 종목 수
  avgPrice: number; // 평균 가격
  trend: 'up' | 'down' | 'neutral'; // 상승/하락/중립
}

/**
 * 특정 섹터의 평균 가격 계산
 */
function calculateSectorAvgPrice(stocks: FrontendUndervaluedStock[], sector: string): number {
  const sectorStocks = stocks.filter((s) => s.gicsSector === sector);

  if (sectorStocks.length === 0) return 0;

  const totalPrice = sectorStocks.reduce((sum, stock) => {
    return sum + (stock.currentPrice || 0);
  }, 0);

  return totalPrice / sectorStocks.length;
}

/**
 * 섹터별 변동률 계산
 * @param todayStocks 오늘 날짜 주식 데이터
 * @param yesterdayStocks 어제 날짜 주식 데이터
 * @returns 섹터별 성과 배열
 */
export function calculateSectorPerformances(
  todayStocks: FrontendUndervaluedStock[],
  yesterdayStocks: FrontendUndervaluedStock[]
): SectorPerformance[] {
  const performances: SectorPerformance[] = [];

  for (const sector of GICS_SECTORS) {
    const todayAvgPrice = calculateSectorAvgPrice(todayStocks, sector);
    const yesterdayAvgPrice = calculateSectorAvgPrice(yesterdayStocks, sector);

    // 어제 데이터가 없으면 변동률 0
    const changePercent =
      yesterdayAvgPrice > 0
        ? ((todayAvgPrice - yesterdayAvgPrice) / yesterdayAvgPrice) * 100
        : 0;

    const stockCount = todayStocks.filter((s) => s.gicsSector === sector).length;

    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (changePercent > 0.1) trend = 'up';
    else if (changePercent < -0.1) trend = 'down';

    performances.push({
      sector,
      sectorKr: toKoreanSector(sector),
      changePercent,
      stockCount,
      avgPrice: todayAvgPrice,
      trend,
    });
  }

  // 변동률 내림차순 정렬
  return performances.sort((a, b) => b.changePercent - a.changePercent);
}

/**
 * 오늘과 어제 데이터를 로드하여 섹터별 성과 계산
 */
export async function loadSectorPerformances(): Promise<SectorPerformance[]> {
  try {
    // 1. 사용 가능한 날짜 목록 조회
    const availableDates = await stockService.getAvailableDates();

    if (availableDates.length < 2) {
      console.warn('Not enough historical data for sector performance');
      return [];
    }

    // 날짜 정렬 (최신순)
    const sortedDates = availableDates.sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    const todayDate = sortedDates[0];
    const yesterdayDate = sortedDates[1];

    console.log(`📊 Loading sector performances: ${todayDate} vs ${yesterdayDate}`);

    // 2. 오늘과 어제 데이터 로드
    const [todayStocks, yesterdayStocks] = await Promise.all([
      stockService.loadStocksByDate(todayDate),
      stockService.loadStocksByDate(yesterdayDate),
    ]);

    if (todayStocks.length === 0 || yesterdayStocks.length === 0) {
      console.warn('Failed to load stocks for sector performance calculation');
      return [];
    }

    // 3. 섹터별 성과 계산
    const performances = calculateSectorPerformances(todayStocks, yesterdayStocks);

    console.log(
      `✅ Calculated performances for ${performances.length} sectors (${todayStocks.length} stocks today, ${yesterdayStocks.length} yesterday)`
    );

    return performances;
  } catch (error) {
    console.error('Failed to load sector performances:', error);
    return [];
  }
}

/**
 * 색상 가져오기 (변동률 기준)
 */
export function getSectorColor(trend: 'up' | 'down' | 'neutral'): string {
  switch (trend) {
    case 'up':
      return 'text-green-600'; // 초록색
    case 'down':
      return 'text-red-600'; // 빨간색
    case 'neutral':
      return 'text-gray-700'; // 진한 회색
  }
}

/**
 * 배경 색상 가져오기
 */
export function getSectorBgColor(trend: 'up' | 'down' | 'neutral'): string {
  switch (trend) {
    case 'up':
      return 'bg-green-50 border-green-200';
    case 'down':
      return 'bg-red-50 border-red-200';
    case 'neutral':
      return 'bg-gray-50 border-gray-200';
  }
}
