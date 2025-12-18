/**
 * DemoHome 데이터 로딩 Custom Hook
 *
 * API 데이터 로딩 로직을 분리하여 관리합니다.
 * - Featured Stocks
 * - Filings
 * - Undervalued Stocks
 * - Sector Performances (일일)
 * - Yearly Sector Performances (연간)
 */

import { useState, useEffect, useCallback } from 'react';
import { stockService } from '../api/services';
import {
  loadSectorPerformances,
  loadYearlySectorPerformances,
  type SectorPerformance,
  type YearlySectorPerformanceResult,
  type DateRangeType
} from '../services/sectorPerformance';
import {
  loadFeaturedStocks,
  loadFilings,
  type Market
} from '../services/jsonDataLoader';
import {
  toFrontendFeaturedStock,
  toFrontendFiling,
  type FrontendUndervaluedStock,
  type FrontendFeaturedStock,
  type FrontendFiling
} from '../utils/apiMappers';

export interface UseDemoHomeDataReturn {
  // Featured Stocks
  featuredStocks: FrontendFeaturedStock[];
  isLoadingFeatured: boolean;

  // Filings
  filings: FrontendFiling[];
  isLoadingFilings: boolean;

  // Undervalued Stocks
  undervaluedStocks: FrontendUndervaluedStock[];
  isLoadingUndervalued: boolean;
  dataLastUpdated: string;
  dataDate: string;

  // Sector Performances
  sectorPerformances: SectorPerformance[];
  sectorTodayDate: string;
  sectorYesterdayDate: string;
  isLoadingSectorPerformances: boolean;
  handleSectorPerformanceRangeChange: (rangeType: DateRangeType, startDate?: string, endDate?: string) => Promise<void>;

  // Yearly Sector Performances
  yearlySectorPerformances: YearlySectorPerformanceResult;
  isLoadingYearlySectorPerformances: boolean;
  handleYearlySectorPerformanceRangeChange: (rangeType: DateRangeType, startDate?: string, endDate?: string) => Promise<void>;
}

/**
 * DemoHome 데이터 로딩 hook
 * @param featuredMarket 주목 종목 마켓 ('US' | 'KR')
 * @param filingsMarket 공시 마켓 ('US' | 'KR')
 */
export function useDemoHomeData(
  featuredMarket: Market = 'US',
  filingsMarket: Market = 'US'
): UseDemoHomeDataReturn {
  // Featured Stocks
  const [featuredStocks, setFeaturedStocks] = useState<FrontendFeaturedStock[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(false);

  // Filings
  const [filings, setFilings] = useState<FrontendFiling[]>([]);
  const [isLoadingFilings, setIsLoadingFilings] = useState(false);

  // Undervalued Stocks
  const [undervaluedStocks, setUndervaluedStocks] = useState<FrontendUndervaluedStock[]>([]);
  const [isLoadingUndervalued, setIsLoadingUndervalued] = useState(false);
  const [dataLastUpdated, setDataLastUpdated] = useState<string>('');
  const [dataDate, setDataDate] = useState<string>('');

  // Sector Performances
  const [sectorPerformances, setSectorPerformances] = useState<SectorPerformance[]>([]);
  const [sectorTodayDate, setSectorTodayDate] = useState<string>('');
  const [sectorYesterdayDate, setSectorYesterdayDate] = useState<string>('');
  const [isLoadingSectorPerformances, setIsLoadingSectorPerformances] = useState(false);

  // Yearly Sector Performances
  const [yearlySectorPerformances, setYearlySectorPerformances] = useState<YearlySectorPerformanceResult>({
    monthlyData: [],
    summaries: [],
    startDate: '2025-01-01',
    endDate: new Date().toISOString().split('T')[0],
    bestSector: null,
    worstSector: null,
    avgReturn: 0,
  });
  const [isLoadingYearlySectorPerformances, setIsLoadingYearlySectorPerformances] = useState(false);

  // 섹터 성과 데이터 로드 함수
  const handleSectorPerformanceRangeChange = useCallback(async (
    rangeType: DateRangeType,
    startDate?: string,
    endDate?: string
  ) => {
    try {
      setIsLoadingSectorPerformances(true);
      const sectorResult = await loadSectorPerformances(rangeType, startDate, endDate);
      setSectorPerformances(sectorResult.performances);
      setSectorTodayDate(sectorResult.todayDate);
      setSectorYesterdayDate(sectorResult.yesterdayDate);
      console.log('✅ Sector performances loaded:', sectorResult.performances.length);
      setIsLoadingSectorPerformances(false);
    } catch (error) {
      console.error('❌ Failed to load sector performances:', error);
      setIsLoadingSectorPerformances(false);
    }
  }, []);

  // 연간 섹터 성과 데이터 로드 함수
  const handleYearlySectorPerformanceRangeChange = useCallback(async (
    rangeType: DateRangeType,
    startDate?: string,
    endDate?: string
  ) => {
    try {
      setIsLoadingYearlySectorPerformances(true);

      // rangeType에 따라 시작 날짜 계산
      let calculatedStartDate = '2025-01-01';
      const today = new Date();

      if (rangeType === 'custom' && startDate) {
        calculatedStartDate = startDate;
      } else {
        switch (rangeType) {
          case '1day':
            calculatedStartDate = new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0];
            break;
          case '1week':
            calculatedStartDate = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
            break;
          case '1month':
            calculatedStartDate = new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0];
            break;
        }
      }

      const yearlyResult = await loadYearlySectorPerformances(calculatedStartDate, endDate);
      setYearlySectorPerformances(yearlyResult);
      console.log('✅ Yearly sector performances loaded:', yearlyResult.summaries.length);
      setIsLoadingYearlySectorPerformances(false);
    } catch (error) {
      console.error('❌ Failed to load yearly sector performances:', error);
      setIsLoadingYearlySectorPerformances(false);
    }
  }, []);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log(`🔄 Loading JSON data... (Featured Market: ${featuredMarket}, Filings Market: ${filingsMarket})`);

        // Featured Stocks 로드 (JSON 파일에서)
        setIsLoadingFeatured(true);
        const featuredData = await loadFeaturedStocks(featuredMarket);
        const mappedFeaturedStocks = featuredData.map(stock => toFrontendFeaturedStock(stock));
        setFeaturedStocks(mappedFeaturedStocks);
        console.log(`✅ Featured stocks loaded (${featuredMarket}):`, mappedFeaturedStocks.length);
        setIsLoadingFeatured(false);

        // Filings 로드 (JSON 파일에서)
        setIsLoadingFilings(true);
        const filingsData = await loadFilings(filingsMarket);
        const mappedFilings = filingsData.map(filing => toFrontendFiling(filing));
        setFilings(mappedFilings);
        console.log(`✅ Filings loaded (${filingsMarket}):`, mappedFilings.length);
        setIsLoadingFilings(false);

        // Undervalued Stocks 로드 (정적 데이터 Export)
        setIsLoadingUndervalued(true);
        const stocksData = await stockService.exportAllStocks(1000);
        setUndervaluedStocks(stocksData.stocks);
        setDataLastUpdated(stocksData.lastUpdated);
        setDataDate(stocksData.dataDate);
        console.log('✅ Undervalued stocks loaded:', stocksData.stocks.length);
        console.log('📅 Data date:', stocksData.dataDate, '| Last updated:', stocksData.lastUpdated);
        setIsLoadingUndervalued(false);

        // Sector Performances 로드 (기본값: 하루 전)
        await handleSectorPerformanceRangeChange('1day');

        // Yearly Sector Performances 로드 (기본값: 한달 전)
        await handleYearlySectorPerformanceRangeChange('1month');
      } catch (error) {
        console.error('❌ Failed to load JSON data:', error);
        setIsLoadingFeatured(false);
        setIsLoadingFilings(false);
        setIsLoadingUndervalued(false);
        setIsLoadingSectorPerformances(false);
        setIsLoadingYearlySectorPerformances(false);
      }
    };

    loadData();
  }, [featuredMarket, filingsMarket, handleSectorPerformanceRangeChange, handleYearlySectorPerformanceRangeChange]);

  return {
    featuredStocks,
    isLoadingFeatured,
    filings,
    isLoadingFilings,
    undervaluedStocks,
    isLoadingUndervalued,
    dataLastUpdated,
    dataDate,
    sectorPerformances,
    sectorTodayDate,
    sectorYesterdayDate,
    isLoadingSectorPerformances,
    handleSectorPerformanceRangeChange,
    yearlySectorPerformances,
    isLoadingYearlySectorPerformances,
    handleYearlySectorPerformanceRangeChange,
  };
}
