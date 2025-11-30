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
  // sector는 영문명, stock.category는 한글명이므로 한글로 변환해서 비교
  const sectorKr = toKoreanSector(sector);
  const sectorStocks = stocks.filter((s) => s.category === sectorKr);

  if (sectorStocks.length === 0) return 0;

  const totalPrice = sectorStocks.reduce((sum, stock) => {
    return sum + (stock.price || 0);
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

    const stockCount = todayStocks.filter((s) => s.category === toKoreanSector(sector)).length;

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

export interface SectorPerformanceResult {
  performances: SectorPerformance[];
  todayDate: string;
  yesterdayDate: string;
}

/**
 * 오늘과 어제 데이터를 로드하여 섹터별 성과 계산
 */
export async function loadSectorPerformances(): Promise<SectorPerformanceResult> {
  try {
    // 1. 사용 가능한 날짜 목록 조회
    const availableDates = await stockService.getAvailableDates();

    if (availableDates.length < 2) {
      console.warn('Not enough historical data for sector performance');
      return {
        performances: [],
        todayDate: '',
        yesterdayDate: '',
      };
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
      return {
        performances: [],
        todayDate,
        yesterdayDate,
      };
    }

    // 3. 섹터별 성과 계산
    const performances = calculateSectorPerformances(todayStocks, yesterdayStocks);

    console.log(
      `✅ Calculated performances for ${performances.length} sectors (${todayStocks.length} stocks today, ${yesterdayStocks.length} yesterday)`
    );

    return {
      performances,
      todayDate,
      yesterdayDate,
    };
  } catch (error) {
    console.error('Failed to load sector performances:', error);
    return {
      performances: [],
      todayDate: '',
      yesterdayDate: '',
    };
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

// ========== 연간 섹터 성과 분석 ==========

/**
 * 월별 섹터 성과 데이터
 */
export interface MonthlySectorData {
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  [sectorKr: string]: number | string; // 섹터명(한글): 연초 대비 수익률(%)
}

/**
 * 섹터별 연간 요약 데이터
 */
export interface SectorYearlySummary {
  sector: string; // 영문 섹터명
  sectorKr: string; // 한글 섹터명
  ytdReturn: number; // 연초 대비 수익률 (%)
  highestReturn: number; // 최고 수익률 (%)
  lowestReturn: number; // 최저 수익률 (%)
  volatility: number; // 변동성 (표준편차)
  trend: 'up' | 'down' | 'neutral'; // 최종 트렌드
  color: string; // 차트 색상
}

/**
 * 연간 섹터 성과 결과
 */
export interface YearlySectorPerformanceResult {
  monthlyData: MonthlySectorData[]; // 월별 시계열 데이터
  summaries: SectorYearlySummary[]; // 섹터별 요약
  startDate: string; // 시작 날짜
  endDate: string; // 종료 날짜
  bestSector: SectorYearlySummary | null; // 최고 성과 섹터
  worstSector: SectorYearlySummary | null; // 최저 성과 섹터
  avgReturn: number; // 전체 섹터 평균 수익률
}

/**
 * 섹터별 차트 색상 (11개 섹터)
 */
const SECTOR_COLORS: Record<string, string> = {
  '정보기술': '#3b82f6', // 파란색
  '헬스케어': '#10b981', // 초록색
  '금융': '#f59e0b', // 주황색
  '경기소비재': '#8b5cf6', // 보라색
  '커뮤니케이션 서비스': '#ec4899', // 핑크색
  '산업재': '#14b8a6', // 청록색
  '필수소비재': '#6366f1', // 인디고
  '에너지': '#f97316', // 다크 오렌지
  '유틸리티': '#84cc16', // 라임
  '부동산': '#06b6d4', // 시안
  '소재': '#eab308', // 노란색
};

/**
 * 섹터 색상 가져오기
 */
export function getSectorChartColor(sectorKr: string): string {
  return SECTOR_COLORS[sectorKr] || '#6b7280'; // 기본값: 회색
}

/**
 * 연간 섹터 성과 계산 (2025-01-01 ~ 현재)
 */
export async function loadYearlySectorPerformances(
  startDate: string = '2025-01-01',
  endDate?: string
): Promise<YearlySectorPerformanceResult> {
  try {
    console.log(`📊 Loading yearly sector performances from ${startDate}...`);

    // 1. 사용 가능한 날짜 목록 조회
    const availableDates = await stockService.getAvailableDates();

    if (availableDates.length === 0) {
      console.warn('No historical data available');
      return {
        monthlyData: [],
        summaries: [],
        startDate,
        endDate: endDate || new Date().toISOString().split('T')[0],
        bestSector: null,
        worstSector: null,
        avgReturn: 0,
      };
    }

    // 날짜 정렬 (오래된 순)
    const sortedDates = availableDates.sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    // 기간 내 날짜만 필터링
    const filteredDates = sortedDates.filter((date) => {
      const d = new Date(date);
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      return d >= start && d <= end;
    });

    if (filteredDates.length === 0) {
      console.warn('No data in the specified date range');
      return {
        monthlyData: [],
        summaries: [],
        startDate,
        endDate: endDate || new Date().toISOString().split('T')[0],
        bestSector: null,
        worstSector: null,
        avgReturn: 0,
      };
    }

    const firstDate = filteredDates[0];
    const lastDate = filteredDates[filteredDates.length - 1];

    console.log(`📅 Date range: ${firstDate} to ${lastDate} (${filteredDates.length} dates)`);

    // 2. 첫 날짜 데이터 로드 (기준점)
    const baseStocks = await stockService.loadStocksByDate(firstDate);
    if (baseStocks.length === 0) {
      console.warn('Failed to load base stocks');
      return {
        monthlyData: [],
        summaries: [],
        startDate: firstDate,
        endDate: lastDate,
        bestSector: null,
        worstSector: null,
        avgReturn: 0,
      };
    }

    // 3. 섹터별 기준 가격 계산
    const basePrices: Record<string, number> = {};
    for (const sector of GICS_SECTORS) {
      basePrices[sector] = calculateSectorAvgPrice(baseStocks, sector);
    }

    // 4. 월말 날짜만 추출 (매월 마지막 거래일)
    const monthlyDates: string[] = [];
    const datesByMonth: Record<string, string[]> = {};

    for (const date of filteredDates) {
      const month = date.substring(0, 7); // YYYY-MM
      if (!datesByMonth[month]) {
        datesByMonth[month] = [];
      }
      datesByMonth[month].push(date);
    }

    // 각 월의 마지막 날짜 선택
    for (const month in datesByMonth) {
      const dates = datesByMonth[month];
      monthlyDates.push(dates[dates.length - 1]);
    }

    console.log(`📅 Monthly dates: ${monthlyDates.length} months`);

    // 5. 월별 데이터 로드 및 수익률 계산
    const monthlyData: MonthlySectorData[] = [];
    const sectorReturns: Record<string, number[]> = {};

    // 섹터별 수익률 배열 초기화
    for (const sector of GICS_SECTORS) {
      sectorReturns[sector] = [];
    }

    for (const date of monthlyDates) {
      const stocks = await stockService.loadStocksByDate(date);
      if (stocks.length === 0) continue;

      const dataPoint: MonthlySectorData = {
        date,
        month: date.substring(0, 7),
      };

      for (const sector of GICS_SECTORS) {
        const sectorKr = toKoreanSector(sector);
        const currentPrice = calculateSectorAvgPrice(stocks, sector);
        const basePrice = basePrices[sector];

        // 연초 대비 수익률 계산
        const returnPercent = basePrice > 0 ? ((currentPrice - basePrice) / basePrice) * 100 : 0;
        dataPoint[sectorKr] = parseFloat(returnPercent.toFixed(2));
        sectorReturns[sector].push(returnPercent);
      }

      monthlyData.push(dataPoint);
    }

    // 6. 섹터별 요약 통계 계산
    const summaries: SectorYearlySummary[] = [];

    for (const sector of GICS_SECTORS) {
      const sectorKr = toKoreanSector(sector);
      const returns = sectorReturns[sector];

      if (returns.length === 0) continue;

      const ytdReturn = returns[returns.length - 1]; // 최종 수익률
      const highestReturn = Math.max(...returns);
      const lowestReturn = Math.min(...returns);

      // 변동성 계산 (표준편차)
      const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance);

      let trend: 'up' | 'down' | 'neutral' = 'neutral';
      if (ytdReturn > 1) trend = 'up';
      else if (ytdReturn < -1) trend = 'down';

      summaries.push({
        sector,
        sectorKr,
        ytdReturn: parseFloat(ytdReturn.toFixed(2)),
        highestReturn: parseFloat(highestReturn.toFixed(2)),
        lowestReturn: parseFloat(lowestReturn.toFixed(2)),
        volatility: parseFloat(volatility.toFixed(2)),
        trend,
        color: getSectorChartColor(sectorKr),
      });
    }

    // 수익률 내림차순 정렬
    summaries.sort((a, b) => b.ytdReturn - a.ytdReturn);

    // 7. 최고/최저 섹터 및 평균 수익률
    const bestSector = summaries[0] || null;
    const worstSector = summaries[summaries.length - 1] || null;
    const avgReturn = summaries.length > 0
      ? summaries.reduce((sum, s) => sum + s.ytdReturn, 0) / summaries.length
      : 0;

    console.log(`✅ Yearly sector performances calculated: ${summaries.length} sectors`);
    console.log(`🏆 Best: ${bestSector?.sectorKr} (${bestSector?.ytdReturn}%)`);
    console.log(`📉 Worst: ${worstSector?.sectorKr} (${worstSector?.ytdReturn}%)`);

    return {
      monthlyData,
      summaries,
      startDate: firstDate,
      endDate: lastDate,
      bestSector,
      worstSector,
      avgReturn: parseFloat(avgReturn.toFixed(2)),
    };
  } catch (error) {
    console.error('Failed to load yearly sector performances:', error);
    return {
      monthlyData: [],
      summaries: [],
      startDate,
      endDate: endDate || new Date().toISOString().split('T')[0],
      bestSector: null,
      worstSector: null,
      avgReturn: 0,
    };
  }
}
