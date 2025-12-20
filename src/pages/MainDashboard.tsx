/**
 * MainDashboard.tsx
 * 메인 대시보드 - 주식 추천, SEC 공시, 관심 종목, 종목 상세 정보 표시
 * 
 * 개정안 v10.4 - 리팩토링 버전
 * - 파일명: DemoHome → MainDashboard로 변경 (명확한 역할 표현)
 * - 엑셀 내보내기 로직 분리: utils/excelExport.ts
 * - 스크롤/하단네비 고정 레이아웃 (헤더/스크롤/고정탭)
 * - TabKey 타입 도입으로 scrollRef 인덱싱 오류 해결
 * - Header / FilingsSectionByMarket / RankingSectionByMarket / BottomNav 포함
 */
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

/* ------------------------------------------------------------
   엑셀 내보내기 유틸리티 import (분리된 파일)
------------------------------------------------------------ */
import { exportFilingsToExcel, exportStockDetailToExcel, exportUndervaluedToExcel } from "../utils/excelExport";

// Import utilities
import { classNames, formatNumber, getRelativeTime, formatAsOf, inDateRange } from "../utils/format";
import { setCookie, getCookie } from "../utils/cookies";
import { setQueryParams, getQueryParam } from "../utils/queryParams";
import { getScoreLevel, getCriticalMetrics, matchesInvestmentStrategy, getMetricColor, getMetricStatus } from "../utils/stockMetrics";

// Import constants
import { CATEGORIES, SECTOR_INDUSTRIES, SECTOR_THEMES } from "../constants/categories";
import { INVESTMENT_STRATEGIES } from "../constants/investmentStrategies";
import { METRIC_DESCRIPTIONS, CALCULATION_GUIDE_URL } from "../constants/metricDescriptions";
import { METRIC_SHORT_DESCRIPTIONS } from "../constants/metricShortDescriptions";

// Import types
import { TAB_KEYS, TabKey, Sentiment } from "../types";

// Import mock data (차트 및 뉴스용)
import {
  categoryMovesUS as mockCategoryMovesUS,
  categoryMovesKR as mockCategoryMovesKR,
  usdKrwData as mockUSDKRW,
  goldUsdData as mockGoldUSD,
  sp500Data as mockSP500,
  kospiData as mockKOSPI,
  us10YData as mockUS10Y,
  vixData as mockVIX,
  btcData as mockBTC,
  wtiData as mockWTI,
  usFearGreedSeries,
  krFearGreedSeries,
  usBuffettSeries,
  krBuffettSeries,
  NEWS_CATEGORIES,
  newsItems as mockNews,
} from "../data/mock";

// Import API services
import { stockService, featuredService, filingService } from "../api/services";
import { api } from "../api/client";
import type {
  FrontendUndervaluedStock,
  FrontendFeaturedStock,
  FrontendFiling
} from "../utils/apiMappers";
import type { EtfSimpleInfo, EtfInfo, ProfilePerformance } from "../api/types";

// Import chart components
import FearGreedCard from "../components/charts/FearGreedCard";
import Sparkline from "../components/charts/Sparkline";
import LineChartCard from "../components/charts/LineChartCard";
import BuffettCard from "../components/charts/BuffettCard";
import CategoryHeatmapCard from "../components/charts/CategoryHeatmapCard";
import DashboardSummaryCard from "../components/charts/DashboardSummaryCard";
import UnifiedSectorPerformanceCard from "../components/charts/UnifiedSectorPerformanceCard";

// Import stock components
import AIScoreGauge from "../components/stock/AIScoreGauge";
import AnalysisStatusBadge from "../components/stock/AnalysisStatusBadge";
import ImpactBadge from "../components/stock/ImpactBadge";
import FeaturedStockCard from "../components/stock/FeaturedStockCard";
import FilingAnalysisCard from "../components/stock/FilingAnalysisCard";
import FilingCard from "../components/stock/FilingCard";
import BeginnerStockCard from "../components/stock/BeginnerStockCard";
import StockPriceVisualization from "../components/stock/StockPriceVisualization";
import FilingScoreTrendChart from "../components/charts/FilingScoreTrendChart";
import EtfSectorPieChart from "../components/charts/EtfSectorPieChart";
import StockLogo from "../components/stock/StockLogo";
import StockEtfHoldings from "../components/stock/StockEtfHoldings";
import ThreePointSummary from "../components/stock/ThreePointSummary";
import PriceGuideBand from "../components/stock/PriceGuideBand";
import EnhancedThreePointSummary from "../components/stock/EnhancedThreePointSummary";
import EnhancedPriceGuideBand from "../components/stock/EnhancedPriceGuideBand";

// Import news components
import NewsImportanceBadge from "../components/news/NewsImportanceBadge";
import NewsModal from "../components/news/NewsModal";
import NewsCard from "../components/news/NewsCard";
import CategoryPager from "../components/news/CategoryPager";

// Import common components
import Header from "../components/common/Header";
import BottomNav from "../components/common/BottomNav";
import Footer from "../components/common/Footer";
import CategoryChips from "../components/common/CategoryChips";
import Pagination from "../components/common/Pagination";
import ColorLegend from "../components/common/ColorLegend";

// Import page components
import NewsSummaryTab from "../components/pages/DemoHome/NewsSummaryTab";
import EtfListView from "../components/etf/EtfListView";
import EtfDetailView from "../components/etf/EtfDetailView";

// Import section components
import HeroSection from "../components/sections/HeroSection";
import FeaturedStocksSection from "../components/sections/FeaturedStocksSection";
import RecentFilingsSection from "../components/sections/RecentFilingsSection";
import InvestmentStrategySelector from "../components/sections/InvestmentStrategySelector";
import BacktestingPerformanceSection from "../components/sections/BacktestingPerformanceSection";
import SearchAndFilterPanel from "../components/sections/SearchAndFilterPanel";
import StockDetailEmptyState from "../components/sections/StockDetailEmptyState";

// Import beginner guide constants
import { METRIC_BEGINNER_GUIDE, AI_SCORE_INTERPRETATION } from "../constants/beginnerGuide";

// Import sector performance service and component
import {
  loadSectorPerformances,
  loadYearlySectorPerformances,
  type SectorPerformance,
  type SectorPerformanceResult,
  type YearlySectorPerformanceResult
} from "../services/sectorPerformance";

// Import modal components
import LoginModal from "../components/modals/LoginModal";
import SignupModal from "../components/modals/SignupModal";
import ComingSoonModal from "../components/modals/ComingSoonModal";

// Import utility components
import { LoadingSkeleton, CardSkeleton } from "../components/utils/LoadingSkeleton";
import ErrorCard from "../components/utils/ErrorCard";
import EmptyState from "../components/utils/EmptyState";
import QuickActionsBar from "../components/utils/QuickActionsBar";
import TooltipHeader from "../components/utils/TooltipHeader";
import MetricTooltip from "../components/utils/MetricTooltip";

// Import custom hooks
import { useDemoHomeData } from "../hooks/useDemoHomeData";
import { useTabManagement } from "../hooks/useTabManagement";
import { useFiltersAndSort } from "../hooks/useFiltersAndSort";
import { useFavorites } from "../hooks/useFavorites";
import { useBeginnerMode } from "../hooks/useBeginnerMode";
import { useRecentStocks } from "../hooks/useRecentStocks";
import { useStockRecommendation } from "../hooks/useStockRecommendation";

// Import Context
import { useNavigation } from "../context/NavigationContext";

// ======================= DemoHome (메인) =======================
// TAB_KEYS와 TabKey는 ../types에서 import됨

export default function DemoHome() {
  const fearGreedUS = usFearGreedSeries[usFearGreedSeries.length - 1];
  const fearGreedKR = krFearGreedSeries[krFearGreedSeries.length - 1];
  const asOfUS = formatAsOf(new Date());
  const asOfKR = asOfUS;
  const asOf = asOfUS;

  // ===== Custom Hooks =====

  // Navigation Context (ETF에서 종목으로 이동할 때 사용)
  const { targetStockSymbol, setTargetStockSymbol, fromEtfTicker } = useNavigation();

  // 홈 화면 필터 (hooks에 포함되지 않은 홈 화면 전용 상태)
  const [featuredMarket, setFeaturedMarket] = useState<"US" | "KR">("US");
  const [filingsMarket, setFilingsMarket] = useState<"US" | "KR">("US");

  // 데이터 로딩
  const {
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
  } = useDemoHomeData(featuredMarket, filingsMarket);

  // 탭 관리
  const {
    activeTab,
    setActiveTab,
    switchTab,
    homeRef,
    undervaluedRef,
    filingsRef,
    watchlistRef,
    detailRef,
    scrollPositions,
  } = useTabManagement();

  // 필터 및 정렬
  const {
    undervaluedSearchQuery,
    setUndervaluedSearchQuery,
    undervaluedStrategies,
    setUndervaluedStrategies,
    undervaluedMarket,
    setUndervaluedMarket,
    undervaluedCategory,
    setUndervaluedCategory,
    undervaluedIndustry,
    setUndervaluedIndustry,
    undervaluedPage,
    setUndervaluedPage,
    undervaluedCategoryPages,
    setUndervaluedCategoryPages,
    undervaluedSorts,
    setUndervaluedSorts,
    undervaluedMinScore,
    setUndervaluedMinScore,
    undervaluedMaxScore,
    setUndervaluedMaxScore,
    filingsSearchQuery,
    setFilingsSearchQuery,
    filingsPage,
    setFilingsPage,
    filingsSortBy,
    setFilingsSortBy,
    filingsSortDirection,
    setFilingsSortDirection,
    filingsSentimentFilter,
    setFilingsSentimentFilter,
    filingsMarketFilter,
    setFilingsMarketFilter,
    filingsCategory,
    setFilingsCategory,
    filingsIndustry,
    setFilingsIndustry,
    watchlistSearchQuery,
    setWatchlistSearchQuery,
    watchlistMarket,
    setWatchlistMarket,
    watchlistCategory,
    setWatchlistCategory,
    watchlistIndustry,
    setWatchlistIndustry,
    handleUndervaluedSort,
    handleFilingsSort,
    toggleStrategy,
  } = useFiltersAndSort();

  // 즐겨찾기
  const { favorites, toggleFavorite } = useFavorites();

  // 초보자 모드
  const { isBeginnerMode, handleBeginnerModeToggle } = useBeginnerMode();

  // 종목 상세 페이지 상태 (hooks에 포함되지 않은 독립적인 상태들)
  const [detailSymbol, setDetailSymbol] = useState<string>("");
  const [detailTab, setDetailTab] = useState<"info" | "filings" | "chart">("info");
  const [detailLogoError, setDetailLogoError] = useState(false);

  // 종목추천 탭 - 주식/ETF 뷰 모드
  const [recommendationViewMode, setRecommendationViewMode] = useState<"stocks" | "etfs">(() => {
    if (typeof window === "undefined") return "stocks";
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get("view");
    return view === "etfs" ? "etfs" : "stocks";
  });

  // ETF 상세 보기 상태
  const [selectedEtfTicker, setSelectedEtfTicker] = useState<string | null>(null);

  // 지표 설명 토글 상태 (각 지표별로 토글 가능)
  const [expandedMetrics, setExpandedMetrics] = useState<Record<string, boolean>>({});

  // 지표 설명 토글 함수
  const toggleMetricDescription = (key: string) => {
    setExpandedMetrics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 종목 추천 데이터 (백엔드 API)
  const {
    summary: recommendationSummary,
    priceGuidance,
    rating: investmentRating,
    isLoading: isLoadingRecommendation,
  } = useStockRecommendation(detailSymbol || null);

  // 최근 본 종목
  const { recentStocks } = useRecentStocks(detailSymbol);

  // 로고 에러 상태
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});

  // 종목별 SEC 공시 상태 (점수 추이 포함)
  const [stockFilingWithScores, setStockFilingWithScores] = useState<FrontendFiling | null>(null);
  const [stockFilingLoading, setStockFilingLoading] = useState(false);

  // 백테스팅 데이터 (투자 전략별 성과)
  const [backtestPerformances, setBacktestPerformances] = useState<Record<string, ProfilePerformance>>({});
  const [backtestLoading, setBacktestLoading] = useState<Record<string, boolean>>({});

  // 로고 에러 초기화 (detailSymbol 변경 시)
  useEffect(() => {
    if (detailSymbol) {
      setDetailLogoError(false);
    }
  }, [detailSymbol]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = (event: PopStateEvent) => {
      const urlParams = new URLSearchParams(window.location.search);
      
      // 뷰 모드 복원
      const view = urlParams.get("view");
      const newViewMode = view === "etfs" ? "etfs" : "stocks";
      
      // ETF 상세 티커 복원
      const etf = urlParams.get("etf");
      
      // 상태 업데이트를 한 번에 처리
      setRecommendationViewMode(newViewMode);
      setSelectedEtfTicker(etf);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Navigation Context에서 targetStockSymbol 감지 (ETF에서 종목으로 이동할 때)
  useEffect(() => {
    if (targetStockSymbol) {
      // 1. detailSymbol 업데이트
      setDetailSymbol(targetStockSymbol);
      // 2. 상세 정보 탭으로 자동 전환
      switchTab("detail");
      // 3. Context 상태 초기화 (다시 사용되지 않도록)
      setTargetStockSymbol(null);
    }
  }, [targetStockSymbol]);

  // SEC 공시 점수 추이 데이터 로드 (detailSymbol 변경 시)
  useEffect(() => {
    const fetchStockFiling = async () => {
      if (!detailSymbol) {
        setStockFilingWithScores(null);
        return;
      }

      setStockFilingLoading(true);
      try {
        const filing = await filingService.getByTickerWithScores(detailSymbol);
        setStockFilingWithScores(filing);
        if (filing && filing.previousScores.length > 0) {
          console.log(`✅ SEC 공시 점수 추이 로드 성공: ${detailSymbol} - ${filing.previousScores.length}개 이력`);
        }
      } catch (error) {
        console.error('❌ SEC 공시 점수 추이 로드 실패:', error);
        setStockFilingWithScores(null);
      } finally {
        setStockFilingLoading(false);
      }
    };

    fetchStockFiling();
  }, [detailSymbol]);

  // 백테스팅 데이터 로드 (선택된 투자 전략 변경 시, JSON 파일에서 로드)
  useEffect(() => {
    const fetchBacktestPerformances = async () => {
      try {
        // 정적 JSON 파일에서 전체 백테스팅 성과 데이터 로드
        const response = await fetch("/data/backtest-performance.json");
        if (!response.ok) {
          throw new Error(`Failed to load backtest data: ${response.status}`);
        }
        const allBacktestData = await response.json();
        const backtestDataMap = allBacktestData.data || {};

        // 선택된 전략들에 대해 데이터 설정
        const newPerformances: Record<string, any> = {};
        const newLoading: Record<string, boolean> = {};

        for (const strategyKey of undervaluedStrategies) {
          // 이미 로드된 데이터가 있으면 스킵
          if (backtestPerformances[strategyKey]) {
            newPerformances[strategyKey] = backtestPerformances[strategyKey];
            newLoading[strategyKey] = false;
            continue;
          }

          // 로딩 상태 설정
          newLoading[strategyKey] = true;

          try {
            const performance = backtestDataMap[strategyKey];
            if (!performance) {
              throw new Error(`Performance data for ${strategyKey} not found`);
            }
            newPerformances[strategyKey] = performance;
          } catch (error) {
            console.error(`❌ 백테스팅 데이터 로드 실패: ${strategyKey}`, error);
          } finally {
            newLoading[strategyKey] = false;
          }
        }

        setBacktestPerformances(prev => ({ ...prev, ...newPerformances }));
        setBacktestLoading(newLoading);
      } catch (error) {
        console.error('❌ 백테스팅 데이터 파일 로드 실패:', error);
      }
    };

    if (undervaluedStrategies.length > 0) {
      fetchBacktestPerformances();
    }
  }, [undervaluedStrategies]);

  // ===== 기타 상태 및 핸들러 =====

  // 홈 페이지 내 섹션 ref
  const featuredSectionRef = useRef<HTMLDivElement>(null);

  // 홈 페이지 내 섹션으로 스크롤 이동
  const scrollToFeaturedSection = () => {
    if (featuredSectionRef.current && homeRef.current) {
      const sectionTop = featuredSectionRef.current.offsetTop;
      homeRef.current.scrollTo({ top: sectionTop - 20, behavior: 'smooth' });
    }
  };

  // GICS 섹터 클릭 핸들러 - 주식추천 페이지로 이동하며 해당 섹터 필터링
  const handleSectorClick = (sector: string) => {
    setUndervaluedCategory(sector);
    setUndervaluedIndustry("전체");
    setUndervaluedPage(1);
    switchTab("undervalued");
  };

  const handleViewModeChange = useCallback((mode: "stocks" | "etfs") => {
    // 현재 모드와 같으면 아무것도 하지 않음 (중요!)
    if (recommendationViewMode === mode) return;
    
    setRecommendationViewMode(mode);
    
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      
      if (mode === "etfs") {
        url.searchParams.set("view", "etfs");
      } else {
        url.searchParams.delete("view");
        // ETF 상세보기를 닫을 때는 etf 파라미터도 제거
        url.searchParams.delete("etf");
        setSelectedEtfTicker(null);
      }
      
      window.history.pushState({ view: mode }, "", url.toString());
    }
  }, [recommendationViewMode]); // 의존성 추가

  // ETF 선택 시 URL 업데이트 및 히스토리 푸시
  const handleEtfSelect = useCallback((ticker: string | null) => {
    // 현재 티커와 같으면 아무것도 하지 않음 (중요!)
    if (selectedEtfTicker === ticker) return;
    
    setSelectedEtfTicker(ticker);
    
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      
      if (ticker) {
        url.searchParams.set("etf", ticker);
      } else {
        url.searchParams.delete("etf");
      }
      
      window.history.pushState({ etf: ticker }, "", url.toString());
    }
  }, [selectedEtfTicker]); // 의존성 추가


  // 시그널 섹션 카테고리(미국/한국) + 감성
  const [filingCatUS, setFilingCatUS] = useState("전체");
  const [filingCatKR, setFilingCatKR] = useState("전체");
  const [filingSentUS, setFilingSentUS] = useState<"ALL" | "POS" | "NEG" | "NEU">("ALL");
  const [filingSentKR, setFilingSentKR] = useState<"ALL" | "POS" | "NEG" | "NEU">("ALL");

  // 랭킹 섹션 카테고리(미국/한국)
  const [rankCatUS, setRankCatUS] = useState("전체");
  const [rankCatKR, setRankCatKR] = useState("전체");

  // 종목 상세 페이지 열기
  const openStockDetail = (symbol: string, tab: "info" | "filings" = "info") => {
    setDetailSymbol(symbol);
    setDetailTab(tab);
    switchTab("detail");
  };

  // ===== Excel Export Functions =====
  // 엑셀 내보내기 함수들은 utils/excelExport.ts로 분리됨
  // exportFilingsToExcel, exportStockDetailToExcel, exportUndervaluedToExcel 사용


  // URL → 상태 복원
  useEffect(() => {
    const trySet = (key: string, setter: (v: any) => void, whitelist?: readonly string[]) => {
      const v = getQueryParam(key);
      if (!v) return;
      if (!whitelist || whitelist.includes(v)) setter(v);
    };
    trySet("filings_us", setFilingCatUS, CATEGORIES as unknown as string[]);
    trySet("filings_kr", setFilingCatKR, CATEGORIES as unknown as string[]);
    trySet("ranking_us", setRankCatUS, CATEGORIES as unknown as string[]);
    trySet("ranking_kr", setRankCatKR, CATEGORIES as unknown as string[]);
    trySet("filings_sentiment_us", setFilingSentUS, ["ALL", "POS", "NEG", "NEU"]);
    trySet("filings_sentiment_kr", setFilingSentKR, ["ALL", "POS", "NEG", "NEU"]);
  }, []);

  // 상태 → URL 동기화
  useEffect(() => {
    setQueryParams({
      filings_us: filingCatUS,
      filings_kr: filingCatKR,
      ranking_us: rankCatUS,
      ranking_kr: rankCatKR,
      filings_sentiment_us: filingSentUS,
      filings_sentiment_kr: filingSentKR,
    });
  }, [filingCatUS, filingCatKR, rankCatUS, rankCatKR, filingSentUS, filingSentKR]);

  // 카테고리 변경 시 산업군 리셋 및 페이지 복원
  useEffect(() => {
    setUndervaluedIndustry("전체");
    // 새 섹터의 저장된 페이지로 복원 (없으면 1페이지)
    const savedPage = undervaluedCategoryPages[undervaluedCategory] || 1;
    setUndervaluedPage(savedPage);
  }, [undervaluedCategory]);

  // 페이지 변경 시 현재 섹터의 페이지 저장
  useEffect(() => {
    setUndervaluedCategoryPages(prev => ({
      ...prev,
      [undervaluedCategory]: undervaluedPage
    }));
  }, [undervaluedPage, undervaluedCategory]);

  // 투자전략, 시장, 카테고리, 산업군, 검색어 변경 시 페이지를 1로 리셋
  useEffect(() => {
    setUndervaluedPage(1);
  }, [undervaluedStrategies, undervaluedMarket, undervaluedCategory, undervaluedIndustry, undervaluedSearchQuery]);

  useEffect(() => {
    setFilingsIndustry("전체");
  }, [filingsCategory]);

  useEffect(() => {
    setWatchlistIndustry("전체");
  }, [watchlistCategory]);

  // 간단 테스트
  useEffect(() => {
    console.assert(["home", "news", "reports", "list", "detail"].includes(activeTab), "activeTab should be valid");
  }, [activeTab]);

  return (
    // ✅ 전체 레이아웃: 헤더 / (탭별 개별 스크롤 영역) / 고정 하단 네비
    <div className="h-screen w-full bg-gray-50 flex flex-col overflow-hidden">
      {/* 상단 고정 헤더 */}
      <Header onLogoClick={() => switchTab("home")} onMyPageClick={() => switchTab("watchlist")} />

      {/* ✅ 중앙: 탭별 개별 스크롤 컨테이너들 (겹쳐 놓고, active만 표시) */}
      <div className="relative flex-1 overflow-hidden">
        {/* HOME */}
        <div
          ref={homeRef}
          className={classNames(
            "absolute inset-0 overflow-y-auto overscroll-contain",
            activeTab === "home" ? "block" : "hidden"
          )}
        >
          <main className="mx-auto max-w-7xl space-y-4 sm:space-y-6 px-3 sm:px-4 py-4 sm:py-6 pb-24">
            {/* Hero Section - 분석 플랫폼 소개 */}
            <HeroSection />

            {/* GICS 섹터별 동향 */}
            <section>
              <UnifiedSectorPerformanceCard
                performances={sectorPerformances}
                onSectorClick={handleSectorClick}
                loadingShortTerm={isLoadingSectorPerformances}
                todayDate={sectorTodayDate}
                yesterdayDate={sectorYesterdayDate}
                onShortTermRangeChange={handleSectorPerformanceRangeChange}
              />
            </section>

            {/* 오늘의 주목 종목 */}
            <FeaturedStocksSection
              featuredSectionRef={featuredSectionRef}
              featuredStocks={featuredStocks}
              featuredMarket={featuredMarket}
              setFeaturedMarket={setFeaturedMarket}
              isLoadingFeatured={isLoadingFeatured}
              openStockDetail={openStockDetail}
              switchTab={switchTab}
              setUndervaluedMarket={setUndervaluedMarket}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />

            {/* 최근 공시 분석 */}
            <RecentFilingsSection
              filings={filings}
              filingsMarket={filingsMarket}
              setFilingsMarket={setFilingsMarket}
              isLoadingFilings={isLoadingFilings}
              openStockDetail={openStockDetail}
              switchTab={switchTab}
              setFilingsMarketFilter={setFilingsMarketFilter}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />

            {/* 시장 현황 요약 - 추후 구현 예정으로 임시 숨김 처리 */}
            {false && (
              <section>
                <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  📈 시장 현황
                </h2>
                {/* 주요 지수 */}
                <div className="grid gap-4 md:grid-cols-2 mb-4">
                  <LineChartCard title="S&P 500" unit="" asOf={asOf} data={mockSP500} />
                  <LineChartCard title="코스피" unit="" asOf={asOf} data={mockKOSPI} />
                </div>
                {/* 금리 및 변동성 */}
                <div className="grid gap-4 md:grid-cols-2 mb-4">
                  <LineChartCard title="미국 10년물 국채수익률" unit="%" asOf={asOf} data={mockUS10Y} />
                  <LineChartCard title="VIX (변동성지수)" unit="" asOf={asOf} data={mockVIX} />
                </div>
                {/* 원자재 및 암호화폐 */}
                <div className="grid gap-4 md:grid-cols-2 mb-4">
                  <LineChartCard title="비트코인" unit="USD" asOf={asOf} data={mockBTC} />
                  <LineChartCard title="WTI 원유" unit="USD/bbl" asOf={asOf} data={mockWTI} />
                </div>
                {/* 환율 및 금 */}
                <div className="grid gap-4 md:grid-cols-2 mb-4">
                  <LineChartCard title="원·달러 환율" unit="KRW" asOf={asOf} data={mockUSDKRW} />
                  <LineChartCard title="금 시세" unit="USD/oz" asOf={asOf} data={mockGoldUSD} />
                </div>
                {/* 버핏지수 */}
                <div className="grid gap-4 md:grid-cols-2 mb-4">
                  <BuffettCard title="미국 버핏지수" asOf={asOf} data={usBuffettSeries} />
                  <BuffettCard title="한국 버핏지수" asOf={asOf} data={krBuffettSeries} />
                </div>
                {/* 공포·탐욕 지수 */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FearGreedCard title="미국 공포·탐욕 지수" index={fearGreedUS} asOf={asOfUS} variant="US" series={usFearGreedSeries} />
                </div>
              </section>
            )}

            {/* 면책 조항 */}
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 md:p-6 text-center">
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed max-w-4xl mx-auto">
                ⚠️ 본 서비스는 분석 정보를 제공하며, 투자 권유나 자문이 아닙니다.
                모든 투자 결정은 투자자 본인의 판단과 책임 하에 이루어져야 합니다.
              </p>
            </div>

            {/* Footer */}
            <Footer />
          </main>
        </div>

        {/* UNDERVALUED - 종목추천 */}
        <div
          ref={undervaluedRef}
          className={classNames(
            "absolute inset-0 overflow-y-auto overscroll-contain",
            activeTab === "undervalued" ? "block" : "hidden"
          )}
        >
          <main className="mx-auto max-w-7xl px-4 py-6 pb-24">
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                    💎 종목추천
                  </h1>
                  {/* 주식/ETF 토글 */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => handleViewModeChange("stocks")}
                      className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all ${
                        recommendationViewMode === "stocks"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      주식
                    </button>
                    <button
                      onClick={() => handleViewModeChange("etfs")}
                      className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all ${
                        recommendationViewMode === "etfs"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      ETF
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {recommendationViewMode === "stocks" && (
                    <button
                      onClick={() => {
                        let filteredStocks = undervaluedStocks.filter((stock) => {
                          const matchMarket = undervaluedMarket === "전체" || stock.market === undervaluedMarket;
                          const matchCategory = undervaluedCategory === "전체" || stock.category === undervaluedCategory;
                          const matchIndustry = undervaluedIndustry === "전체" || stock.industry === undervaluedIndustry;
                          const matchQuery =
                            !undervaluedSearchQuery ||
                            stock.name.toLowerCase().includes(undervaluedSearchQuery.toLowerCase()) ||
                            stock.symbol.toLowerCase().includes(undervaluedSearchQuery.toLowerCase());
                          // 전략 필터링: 빈 배열이면 모든 종목 표시, 선택된 전략이 있으면 모든 전략에 부합해야 함 (AND 조건)
                          const matchStrategy =
                            undervaluedStrategies.length === 0 ||
                            undervaluedStrategies.every((strategy) => matchesInvestmentStrategy(stock, strategy));
                          return matchMarket && matchCategory && matchIndustry && matchQuery && matchStrategy;
                        });

                        // Apply multi-level sorting
                        if (undervaluedSorts.length > 0) {
                          filteredStocks = [...filteredStocks].sort((a: any, b: any) => {
                            for (const sort of undervaluedSorts) {
                              const aVal = a[sort.key];
                              const bVal = b[sort.key];
                              if (aVal === undefined && bVal === undefined) continue;
                              if (aVal === undefined) return 1;
                              if (bVal === undefined) return -1;
                              if (aVal !== bVal) {
                                const comparison = aVal > bVal ? 1 : -1;
                                return sort.direction === "asc" ? comparison : -comparison;
                              }
                            }
                            return 0;
                          });
                        }

                        exportUndervaluedToExcel(filteredStocks, undervaluedStrategies);
                      }}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md"
                    >
                      <span>📥</span>
                      <span className="hidden sm:inline">엑셀 다운로드</span>
                      <span className="sm:hidden">다운로드</span>
                    </button>
                  )}
                </div>
              </div>
              {recommendationViewMode === "stocks" ? (
                <>
                  <div className="flex items-center justify-end gap-4 flex-wrap">
                    <a
                      href={CALCULATION_GUIDE_URL}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <span>📚</span>
                      <span>계산 방식 가이드</span>
                    </a>
                  </div>
                  {/* 데이터 기준 날짜 */}
                  {dataDate && (
                    <p className="text-xs text-gray-500 mt-2">
                      📅 데이터 기준: {new Date(dataDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                  {/* 색상 범례 */}
                  <div className="mt-3">
                    <ColorLegend />
                  </div>
                </>
              ) : (
                <p className="text-xs sm:text-sm text-gray-600">
                  🏦 섹터별 ETF를 검색하고 비교할 수 있습니다. ETF 카드를 클릭하면 상세 정보를 확인할 수 있어요!
                </p>
              )}
            </div>

            {/* ETF 모드: ETF 목록 또는 상세 보기 */}
            {recommendationViewMode === "etfs" && (
              <>
                {selectedEtfTicker ? (
                  <EtfDetailView
                    ticker={selectedEtfTicker}
                    onClose={() => handleEtfSelect(null)}
                  />
                ) : (
                  <EtfListView
                    onEtfClick={(etf) => handleEtfSelect(etf.ticker)}
                  />
                )}
              </>
            )}

            {/* 주식 모드: 투자 전략 선택 (다중 선택 토글) */}
            {recommendationViewMode === "stocks" && (
            <>
            <InvestmentStrategySelector
              undervaluedStrategies={undervaluedStrategies}
              toggleStrategy={toggleStrategy}
            />

            {/* 백테스팅 성과 (선택된 전략에 대해서만 표시) */}
            <BacktestingPerformanceSection
              undervaluedStrategies={undervaluedStrategies}
              backtestPerformances={backtestPerformances}
              backtestLoading={backtestLoading}
            />

            {/* 검색 및 필터 */}
            <SearchAndFilterPanel
              searchQuery={undervaluedSearchQuery}
              setSearchQuery={setUndervaluedSearchQuery}
              market={undervaluedMarket}
              setMarket={setUndervaluedMarket}
              category={undervaluedCategory}
              setCategory={setUndervaluedCategory}
              industry={undervaluedIndustry}
              setIndustry={setUndervaluedIndustry}
              minScore={undervaluedMinScore}
              setMinScore={setUndervaluedMinScore}
              maxScore={undervaluedMaxScore}
              setMaxScore={setUndervaluedMaxScore}
              setPage={setUndervaluedPage}
              onReset={() => {
                setUndervaluedSearchQuery("");
                setUndervaluedMarket("전체");
                setUndervaluedCategory("전체");
                setUndervaluedIndustry("전체");
                setUndervaluedMinScore(0);
                setUndervaluedMaxScore(100);
                setUndervaluedPage(1);
              }}
            />

            {/* 간편 모드: 카드 뷰 / 상세 모드: 테이블 뷰 */}
            {isLoadingUndervalued ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-4xl mb-3">⏳</div>
                <p className="text-gray-600 font-medium">데이터를 불러오는 중...</p>
              </div>
            ) : undervaluedStocks.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-gray-600 font-medium">데이터가 없습니다</p>
                <p className="text-sm text-gray-500 mt-2">백엔드 서버 연결을 확인해주세요</p>
              </div>
            ) : isBeginnerMode ? (
              /* 간편 모드 - 카드 뷰 */
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {(() => {
                  let filteredStocks = undervaluedStocks.filter((stock) => {
                    const matchMarket = undervaluedMarket === "전체" || stock.market === undervaluedMarket;
                    const matchCategory = undervaluedCategory === "전체" || stock.category === undervaluedCategory;
                    const matchIndustry = undervaluedIndustry === "전체" || stock.industry === undervaluedIndustry;
                    const matchQuery =
                      !undervaluedSearchQuery ||
                      stock.name.toLowerCase().includes(undervaluedSearchQuery.toLowerCase()) ||
                      stock.symbol.toLowerCase().includes(undervaluedSearchQuery.toLowerCase());
                    // 종합 점수 필터링
                    const matchScore = stock.aiScore >= undervaluedMinScore && stock.aiScore <= undervaluedMaxScore;
                    // 전략 필터링: 빈 배열이면 모든 종목 표시, 선택된 전략이 있으면 모든 전략에 부합해야 함 (AND 조건)
                    const matchStrategy =
                      undervaluedStrategies.length === 0 ||
                      undervaluedStrategies.every((strategy) => matchesInvestmentStrategy(stock, strategy));
                    return matchMarket && matchCategory && matchIndustry && matchQuery && matchScore && matchStrategy;
                  });

                  // Apply sorting - 초보자 모드는 무조건 종합 점수 높은 순
                  filteredStocks = [...filteredStocks].sort((a: any, b: any) => {
                    const aVal = a.aiScore;
                    const bVal = b.aiScore;
                    if (aVal === undefined || bVal === undefined) return 0;
                    return bVal - aVal; // 내림차순
                  });

                  const itemsPerPage = 12; // 카드 뷰에서는 12개씩
                  const startIndex = (undervaluedPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const paginatedStocks = filteredStocks.slice(startIndex, endIndex);

                  // 필터링 결과가 없을 때
                  if (filteredStocks.length === 0) {
                    return (
                      <div className="col-span-full text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-gray-600 font-medium mb-2">선택한 투자전략에 맞는 종목이 없습니다</p>
                        <p className="text-sm text-gray-500">다른 투자전략을 선택하거나 필터를 조정해보세요</p>
                      </div>
                    );
                  }

                  return paginatedStocks.map((stock) => (
                    <BeginnerStockCard
                      key={stock.symbol}
                      stock={stock}
                      onClick={() => openStockDetail(stock.symbol, "info")}
                      onToggleFavorite={() => toggleFavorite(stock.symbol)}
                      isFavorite={favorites[stock.symbol]}
                      logoError={logoErrors[stock.symbol]}
                      onLogoError={() => setLogoErrors(prev => ({ ...prev, [stock.symbol]: true }))}
                    />
                  ));
                })()}
              </div>
            ) : (
              /* 상세 모드 - 테이블 뷰 */
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs">
                          종목
                        </th>
                        <th className="px-4 py-3 text-center text-xs">
                          <TooltipHeader
                            label="산업군"
                            sortKey="industry"
                            sorts={undervaluedSorts}
                            onSort={handleUndervaluedSort}
                          />
                        </th>
                        <th className="px-4 py-3 text-center text-xs">
                          <TooltipHeader
                            label="종합 점수"
                            tooltip="종합 투자 매력도 (0-100점)"
                            sortKey="aiScore"
                            sorts={undervaluedSorts}
                            onSort={handleUndervaluedSort}
                          />
                        </th>
                        <th className="px-4 py-3 text-center text-xs">
                          <TooltipHeader
                            label="현재가"
                            tooltip="현재 주가"
                            sortKey="price"
                            sorts={undervaluedSorts}
                            onSort={handleUndervaluedSort}
                          />
                        </th>
                        <th className="px-4 py-3 text-center text-xs">
                          <TooltipHeader
                            label="Discount"
                            tooltip="할인율 - 높을수록 저평가"
                            sortKey="discount"
                            sorts={undervaluedSorts}
                            onSort={handleUndervaluedSort}
                          />
                        </th>
                        <th className="px-4 py-3 text-center text-xs">
                          <TooltipHeader
                            label="PER"
                            tooltip="주가수익비율 - 낮을수록 저평가"
                            sortKey="PER"
                            sorts={undervaluedSorts}
                            onSort={handleUndervaluedSort}
                          />
                        </th>
                        <th className="px-4 py-3 text-center text-xs">
                          <TooltipHeader
                            label="ROE"
                            tooltip="자기자본이익률 - 높을수록 우수"
                            sortKey="ROE"
                            sorts={undervaluedSorts}
                            onSort={handleUndervaluedSort}
                          />
                        </th>
                        <th className="px-4 py-3 text-center text-xs">
                          <TooltipHeader
                            label="EPS 3Y"
                            tooltip="3년 EPS 성장률"
                            sortKey="EPS_Growth_3Y"
                            sorts={undervaluedSorts}
                            onSort={handleUndervaluedSort}
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {(() => {
                        let filteredStocks = undervaluedStocks.filter((stock) => {
                          const matchMarket = undervaluedMarket === "전체" || stock.market === undervaluedMarket;
                          const matchCategory = undervaluedCategory === "전체" || stock.category === undervaluedCategory;
                          const matchIndustry = undervaluedIndustry === "전체" || stock.industry === undervaluedIndustry;
                          const matchQuery =
                            !undervaluedSearchQuery ||
                            stock.name.toLowerCase().includes(undervaluedSearchQuery.toLowerCase()) ||
                            stock.symbol.toLowerCase().includes(undervaluedSearchQuery.toLowerCase());
                          // 종합 점수 필터링
                          const matchScore = stock.aiScore >= undervaluedMinScore && stock.aiScore <= undervaluedMaxScore;
                          // 전략 필터링: 빈 배열이면 모든 종목 표시, 선택된 전략이 있으면 모든 전략에 부합해야 함 (AND 조건)
                          const matchStrategy =
                            undervaluedStrategies.length === 0 ||
                            undervaluedStrategies.every((strategy) => matchesInvestmentStrategy(stock, strategy));
                          return matchMarket && matchCategory && matchIndustry && matchQuery && matchScore && matchStrategy;
                        });

                        // Apply multi-level sorting
                        if (undervaluedSorts.length > 0) {
                          filteredStocks = [...filteredStocks].sort((a: any, b: any) => {
                            // 각 정렬 조건을 순서대로 적용
                            for (const sort of undervaluedSorts) {
                              const aVal = a[sort.key];
                              const bVal = b[sort.key];

                              // undefined 처리
                              if (aVal === undefined && bVal === undefined) continue;
                              if (aVal === undefined) return 1;
                              if (bVal === undefined) return -1;

                              // 값 비교
                              if (aVal !== bVal) {
                                const comparison = aVal > bVal ? 1 : -1;
                                return sort.direction === "asc" ? comparison : -comparison;
                              }
                              // 값이 같으면 다음 정렬 조건으로
                            }
                            return 0;
                          });
                        }

                        const itemsPerPage = 30;
                        const startIndex = (undervaluedPage - 1) * itemsPerPage;
                        const endIndex = startIndex + itemsPerPage;
                        const paginatedStocks = filteredStocks.slice(startIndex, endIndex);

                        // 필터링 결과가 없을 때
                        if (filteredStocks.length === 0) {
                          return (
                            <tr>
                              <td colSpan={8} className="px-4 py-16 text-center">
                                <div className="text-6xl mb-4">🔍</div>
                                <p className="text-gray-600 font-medium mb-2">선택한 투자전략에 맞는 종목이 없습니다</p>
                                <p className="text-sm text-gray-500">다른 투자전략을 선택하거나 필터를 조정해보세요</p>
                              </td>
                            </tr>
                          );
                        }

                        return paginatedStocks.map((stock) => (
                          <tr
                            key={stock.symbol}
                            onClick={() => openStockDetail(stock.symbol, "info")}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <StockLogo
                                    src={stock.logoUrl}
                                    alt={stock.name}
                                    size="md"
                                    onError={() => setLogoErrors(prev => ({ ...prev, [stock.symbol]: true }))}
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(stock.symbol);
                                    }}
                                    className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform border border-gray-200"
                                  >
                                    <span className="text-xs">
                                      {favorites[stock.symbol] ? '❤️' : '🤍'}
                                    </span>
                                  </button>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">
                                    {stock.symbol}.{stock.market === "US" ? "미국" : "한국"}
                                  </div>
                                  <div className="text-sm font-bold text-gray-900">{stock.name}</div>
                                  <div className="text-xs text-gray-500">{stock.category}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-left">
                              <span className="text-xs text-gray-700">{stock.industry}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <div className="flex justify-center">
                                <AIScoreGauge score={stock.aiScore} sentiment={stock.sentiment} size="sm" />
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <span className="text-xs font-medium text-gray-900">
                                {stock.price ? `$${stock.price.toFixed(2)}` : '-'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <span className={classNames("text-xs font-medium", stock.discount && stock.discount > 0 ? "text-green-600" : "text-gray-500")}>
                                {stock.discount ? `${stock.discount.toFixed(1)}%` : '-'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <span className={classNames("text-xs font-medium", getMetricColor("PER", stock.PER))}>{stock.PER?.toFixed(2)}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <span className={classNames("text-xs font-medium", getMetricColor("ROE", stock.ROE))}>{stock.ROE?.toFixed(1)}%</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <span className={classNames("text-xs font-medium", getMetricColor("EPS_Growth_3Y", stock.EPS_Growth_3Y))}>{stock.EPS_Growth_3Y?.toFixed(1)}%</span>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {(() => {
              const filteredStocks = undervaluedStocks.filter((stock) => {
                const matchMarket = undervaluedMarket === "전체" || stock.market === undervaluedMarket;
                const matchCategory = undervaluedCategory === "전체" || stock.category === undervaluedCategory;
                const matchIndustry = undervaluedIndustry === "전체" || stock.industry === undervaluedIndustry;
                const matchQuery =
                  !undervaluedSearchQuery ||
                  stock.name.toLowerCase().includes(undervaluedSearchQuery.toLowerCase()) ||
                  stock.symbol.toLowerCase().includes(undervaluedSearchQuery.toLowerCase());
                // 전략 필터링: 빈 배열이면 모든 종목 표시, 선택된 전략이 있으면 모든 전략에 부합해야 함 (AND 조건)
                const matchStrategy =
                  undervaluedStrategies.length === 0 ||
                  undervaluedStrategies.every((strategy) => matchesInvestmentStrategy(stock, strategy));
                // 점수 범위 필터링
                const matchScore = stock.aiScore >= undervaluedMinScore && stock.aiScore <= undervaluedMaxScore;
                return matchMarket && matchCategory && matchIndustry && matchQuery && matchStrategy && matchScore;
              });
              const itemsPerPage = isBeginnerMode ? 12 : 30;
              const totalPages = Math.ceil(filteredStocks.length / itemsPerPage);

              if (totalPages <= 1) return null;

              return (
                <Pagination
                  currentPage={undervaluedPage}
                  totalPages={totalPages}
                  onPageChange={setUndervaluedPage}
                />
              );
            })()}
            </>
            )}

            {/* Footer */}
            <Footer />
          </main>
        </div>

        {/* FILINGS - 공시 분석 */}
        <div
          ref={filingsRef}
          className={classNames(
            "absolute inset-0 overflow-y-auto overscroll-contain",
            activeTab === "filings" ? "block" : "hidden"
          )}
        >
          <main className="mx-auto max-w-7xl px-4 py-6 pb-24">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                  <span>📊</span>
                  공시 분석 리포트
                </h1>
                <button
                  onClick={() => {
                    let filteredFilings = filings.filter((filing) => {
                      const matchMarket = filingsMarketFilter === "전체" || filing.market === filingsMarketFilter;
                      const matchCategory = filingsCategory === "전체" || filing.category === filingsCategory;
                      const matchIndustry = filingsIndustry === "전체" || filing.industry === filingsIndustry;
                      const matchQuery =
                        !filingsSearchQuery ||
                        filing.company.toLowerCase().includes(filingsSearchQuery.toLowerCase()) ||
                        filing.symbol.toLowerCase().includes(filingsSearchQuery.toLowerCase());
                      const matchSentiment = filingsSentimentFilter === "ALL" || filing.sentiment === filingsSentimentFilter;
                      return matchMarket && matchCategory && matchIndustry && matchQuery && matchSentiment;
                    });

                    // Apply sorting
                    if (filingsSortBy) {
                      filteredFilings = [...filteredFilings].sort((a: any, b: any) => {
                        let aVal, bVal;
                        if (filingsSortBy === "company") {
                          aVal = a.company.toLowerCase();
                          bVal = b.company.toLowerCase();
                        } else {
                          aVal = a[filingsSortBy];
                          bVal = b[filingsSortBy];
                        }
                        if (aVal === undefined || bVal === undefined) return 0;
                        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                        return filingsSortDirection === "asc" ? comparison : -comparison;
                      });
                    }

                    exportFilingsToExcel(filteredFilings);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                  <span>📥</span>
                  <span className="hidden sm:inline">엑셀 다운로드</span>
                  <span className="sm:hidden">다운로드</span>
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600">AI가 분석한 최신 기업 공시 및 보고서를 확인하세요</p>
            </div>

            {/* 검색 및 필터 */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 space-y-4">
              {/* 검색창 */}
              <input
                type="text"
                value={filingsSearchQuery}
                onChange={(e) => setFilingsSearchQuery(e.target.value)}
                placeholder="종목명 또는 티커 검색 (예: 삼성전자, AAPL)"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />

              {/* 감정 필터 */}
              <div>
                <div className="text-[10px] sm:text-xs text-gray-600 mb-2 font-semibold">분석 결과</div>
                <div className="flex gap-1.5 sm:gap-2">
                  {(["ALL", "POS", "NEG", "NEU"] as const).map((sentiment) => (
                    <button
                      key={sentiment}
                      onClick={() => setFilingsSentimentFilter(sentiment)}
                      className={classNames(
                        "flex-1 sm:flex-initial rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all",
                        filingsSentimentFilter === sentiment
                          ? "bg-indigo-600 text-white shadow"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      {sentiment === "ALL" ? "전체" : sentiment === "POS" ? "긍정" : sentiment === "NEG" ? "부정" : "중립"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 정렬 옵션 */}
              <div>
                <div className="text-[10px] sm:text-xs text-gray-600 mb-2 font-semibold">정렬</div>
                <div className="flex gap-1.5 sm:gap-2">
                  <button
                    onClick={() => handleFilingsSort("company")}
                    className={classNames(
                      "flex-1 rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all",
                      filingsSortBy === "company"
                        ? "bg-indigo-600 text-white shadow"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    종목명 {filingsSortBy === "company" && (filingsSortDirection === "asc" ? "↑" : "↓")}
                  </button>
                  <button
                    onClick={() => handleFilingsSort("aiScore")}
                    className={classNames(
                      "flex-1 rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all",
                      filingsSortBy === "aiScore"
                        ? "bg-indigo-600 text-white shadow"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    종합 점수 {filingsSortBy === "aiScore" && (filingsSortDirection === "asc" ? "↑" : "↓")}
                  </button>
                </div>
              </div>

              {/* 시장 선택 - KR 종목 지원 예정 */}
              <div>
                <div className="text-[10px] sm:text-xs text-gray-600 mb-2 font-semibold">시장</div>
                <div className="flex gap-1.5 sm:gap-2">
                  {(["전체", "US"] as const).map((market) => (
                    <button
                      key={market}
                      onClick={() => setFilingsMarketFilter(market)}
                      className={classNames(
                        "flex-1 sm:flex-initial rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all",
                        filingsMarketFilter === market
                          ? "bg-indigo-600 text-white shadow"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      {market === "전체" ? "🌐 전체" : "🇺🇸 미국"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 카테고리 선택 */}
              <div>
                <div className="text-[10px] sm:text-xs text-gray-600 mb-2 font-semibold">GICS 섹터</div>
                <CategoryChips value={filingsCategory} onChange={setFilingsCategory} categories={[...CATEGORIES]} />
              </div>

              {/* 산업군 선택 */}
              {filingsCategory !== "전체" && SECTOR_INDUSTRIES[filingsCategory] && (
                <div>
                  <div className="text-[10px] sm:text-xs text-gray-600 mb-2 font-semibold">산업군</div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {SECTOR_INDUSTRIES[filingsCategory].map((industry) => (
                      <button
                        key={industry}
                        onClick={() => setFilingsIndustry(industry)}
                        className={classNames(
                          "rounded-lg px-2.5 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm font-semibold transition-all",
                          filingsIndustry === industry
                            ? "bg-indigo-600 text-white shadow"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        {industry}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 공시 목록 */}
            {isLoadingFilings ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-4xl mb-3">⏳</div>
                <p className="text-gray-600 font-medium">데이터를 불러오는 중...</p>
              </div>
            ) : filings.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-gray-600 font-medium">데이터가 없습니다</p>
                <p className="text-sm text-gray-500 mt-2">백엔드 서버 연결을 확인해주세요</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  let filteredFilings = filings.filter((filing) => {
                    const matchMarket = filingsMarketFilter === "전체" || filing.market === filingsMarketFilter;
                    const matchCategory = filingsCategory === "전체" || filing.category === filingsCategory;
                    const matchIndustry = filingsIndustry === "전체" || filing.industry === filingsIndustry;
                    const matchQuery =
                      !filingsSearchQuery ||
                      filing.company.toLowerCase().includes(filingsSearchQuery.toLowerCase()) ||
                      filing.symbol.toLowerCase().includes(filingsSearchQuery.toLowerCase());
                    const matchSentiment = filingsSentimentFilter === "ALL" || filing.sentiment === filingsSentimentFilter;
                    return matchMarket && matchCategory && matchIndustry && matchQuery && matchSentiment;
                  });

                  // Apply sorting
                  if (filingsSortBy) {
                    filteredFilings = [...filteredFilings].sort((a: any, b: any) => {
                      let aVal, bVal;
                      if (filingsSortBy === "company") {
                        aVal = a.company.toLowerCase();
                        bVal = b.company.toLowerCase();
                      } else {
                        aVal = a[filingsSortBy];
                        bVal = b[filingsSortBy];
                      }
                      if (aVal === undefined || bVal === undefined) return 0;
                      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                      return filingsSortDirection === "asc" ? comparison : -comparison;
                    });
                  }

                  const itemsPerPage = 30;
                  const startIndex = (filingsPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const paginatedFilings = filteredFilings.slice(startIndex, endIndex);

                  return paginatedFilings.map((filing) => (
                    <FilingAnalysisCard
                      key={filing.id}
                      filing={filing}
                      onClick={() => openStockDetail(filing.symbol, "filings")}
                      favorites={favorites}
                      toggleFavorite={toggleFavorite}
                    />
                  ));
                })()}
              </div>
            )}

            {/* Pagination */}
            {(() => {
              const filteredFilings = filings.filter((filing) => {
                const matchMarket = filingsMarketFilter === "전체" || filing.market === filingsMarketFilter;
                const matchCategory = filingsCategory === "전체" || filing.category === filingsCategory;
                const matchIndustry = filingsIndustry === "전체" || filing.industry === filingsIndustry;
                const matchQuery =
                  !filingsSearchQuery ||
                  filing.company.toLowerCase().includes(filingsSearchQuery.toLowerCase()) ||
                  filing.symbol.toLowerCase().includes(filingsSearchQuery.toLowerCase());
                const matchSentiment = filingsSentimentFilter === "ALL" || filing.sentiment === filingsSentimentFilter;
                return matchMarket && matchCategory && matchIndustry && matchQuery && matchSentiment;
              });
              const totalPages = Math.ceil(filteredFilings.length / 30);

              if (totalPages <= 1) return null;

              return (
                <Pagination
                  currentPage={filingsPage}
                  totalPages={totalPages}
                  onPageChange={setFilingsPage}
                />
              );
            })()}

            {/* Footer */}
            <Footer />
          </main>
        </div>

        {/* WATCHLIST - 관심 종목 */}
        <div
          ref={watchlistRef}
          className={classNames(
            "absolute inset-0 overflow-y-auto overscroll-contain",
            activeTab === "watchlist" ? "block" : "hidden"
          )}
        >
          <main className="mx-auto max-w-7xl px-4 py-6 pb-24">
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                <span>⭐</span>
                관심 종목
              </h1>
              <p className="mt-2 text-sm text-gray-600">즐겨찾기한 종목의 분석을 한눈에 확인하세요</p>
            </div>

            {(() => {
              // Get favorited symbols
              const favoritedSymbols = Object.keys(favorites).filter(symbol => favorites[symbol]);

              if (favoritedSymbols.length === 0) {
                // Show empty state
                return (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">⭐</div>
                    <p className="text-gray-600 mb-2">아직 관심 종목이 없습니다</p>
                    <p className="text-sm text-gray-500 mb-4">종목 카드의 하트 아이콘을 눌러 관심 종목으로 등록하세요</p>
                    <button
                      onClick={() => switchTab("undervalued")}
                      className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      저평가주 둘러보기
                    </button>
                  </div>
                );
              }

              // Get favorited stocks from undervaluedStocks and apply filters
              let favoritedStocks = undervaluedStocks.filter(stock => {
                const isFavorited = favorites[stock.symbol];
                const matchMarket = watchlistMarket === "전체" || stock.market === watchlistMarket;
                const matchCategory = watchlistCategory === "전체" || stock.category === watchlistCategory;
                const matchIndustry = watchlistIndustry === "전체" || stock.industry === watchlistIndustry;
                const matchQuery =
                  !watchlistSearchQuery ||
                  stock.name.toLowerCase().includes(watchlistSearchQuery.toLowerCase()) ||
                  stock.symbol.toLowerCase().includes(watchlistSearchQuery.toLowerCase());
                return isFavorited && matchMarket && matchCategory && matchIndustry && matchQuery;
              });

              return (
                <div>
                  {/* 검색 및 필터 */}
                  <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 space-y-4">
                    {/* 검색창 */}
                    <input
                      type="text"
                      value={watchlistSearchQuery}
                      onChange={(e) => setWatchlistSearchQuery(e.target.value)}
                      placeholder="종목명 또는 티커 검색 (예: 삼성전자, AAPL)"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                    />

                    {/* 시장 선택 - KR 종목 지원 예정 */}
                    <div>
                      <div className="text-xs text-gray-600 mb-2 font-semibold">시장</div>
                      <div className="flex gap-2">
                        {(["전체", "US"] as const).map((market) => (
                          <button
                            key={market}
                            onClick={() => setWatchlistMarket(market)}
                            className={classNames(
                              "rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                              watchlistMarket === market
                                ? "bg-indigo-600 text-white shadow"
                                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                            )}
                          >
                            {market === "전체" ? "🌐 전체" : "🇺🇸 미국"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 카테고리 선택 */}
                    <div>
                      <div className="text-xs text-gray-600 mb-2 font-semibold">GICS 섹터</div>
                      <CategoryChips
                        value={watchlistCategory}
                        onChange={setWatchlistCategory}
                        categories={[...CATEGORIES]}
                      />
                    </div>

                    {/* 산업군 선택 */}
                    {watchlistCategory !== "전체" && SECTOR_INDUSTRIES[watchlistCategory] && (
                      <div>
                        <div className="text-xs text-gray-600 mb-2 font-semibold">산업군</div>
                        <div className="flex flex-wrap gap-2">
                          {SECTOR_INDUSTRIES[watchlistCategory].map((industry) => (
                            <button
                              key={industry}
                              onClick={() => setWatchlistIndustry(industry)}
                              className={classNames(
                                "rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                                watchlistIndustry === industry
                                  ? "bg-indigo-600 text-white shadow"
                                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                              )}
                            >
                              {industry}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mb-4 text-sm text-gray-600">
                    총 {favoritedStocks.length}개의 관심 종목
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              종목
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              섹터
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              산업군
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              종합 점수
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              최근 공시 점수
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              분석
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {favoritedStocks.map((stock) => {
                            // Get latest filing for this stock
                            const latestFiling = filings.find(f => f.symbol === stock.symbol);
                            return (
                              <tr
                                key={stock.symbol}
                                onClick={() => openStockDetail(stock.symbol, "info")}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <StockLogo
                                        src={stock.logoUrl}
                                        alt={stock.name}
                                        size="md"
                                        onError={() => setLogoErrors(prev => ({ ...prev, [stock.symbol]: true }))}
                                      />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleFavorite(stock.symbol);
                                        }}
                                        className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform border border-gray-200"
                                      >
                                        <span className="text-xs">
                                          {favorites[stock.symbol] ? '❤️' : '🤍'}
                                        </span>
                                      </button>
                                    </div>
                                    <div>
                                      <div className="text-xs text-gray-500">
                                        {stock.symbol}.{stock.market === "US" ? "미국" : "한국"}
                                      </div>
                                      <div className="text-sm font-bold text-gray-900">{stock.name}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                    {stock.category}
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                                    {stock.industry}
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                  <div className="flex justify-center">
                                    <AIScoreGauge score={stock.aiScore} sentiment={stock.sentiment} size="sm" />
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                  {latestFiling ? (
                                    <div className="flex justify-center">
                                      <AIScoreGauge score={latestFiling.aiScore} sentiment={latestFiling.sentiment} size="sm" />
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                  <AnalysisStatusBadge sentiment={stock.sentiment} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Footer */}
            <Footer />
          </main>
        </div>

        {/* DETAIL - 종목 상세 */}
        <div
          ref={detailRef}
          className={classNames(
            "absolute inset-0 overflow-y-auto overscroll-contain",
            activeTab === "detail" ? "block" : "hidden"
          )}
        >
          {(() => {
            // ✅ 종목이 선택되지 않은 경우: 첫 화면 표시
            if (!detailSymbol) {
              return (
                <StockDetailEmptyState
                  undervaluedStocks={undervaluedStocks}
                  filings={filings}
                  recentStocks={recentStocks}
                  switchTab={switchTab}
                  setDetailSymbol={setDetailSymbol}
                  setDetailTab={setDetailTab}
                />
              );
            }

            // ✅ 종목이 선택된 경우: 상세 정보 표시
            const stockInfo = undervaluedStocks.find(s => s.symbol === detailSymbol);
            // SEC 공시 데이터: 백엔드 API로부터 점수 추이 포함된 데이터 우선 사용
            const stockFilings = stockFilingWithScores ? [stockFilingWithScores] : filings.filter(f => f.symbol === detailSymbol);

            // ✅ 종목 정보가 없을 때 안내 메시지 표시
            if (!stockInfo) {
              return (
                <main className="mx-auto max-w-7xl px-4 py-6 pb-24">
                  <div className="mb-4">
                    <button
                      onClick={() => window.history.back()}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      <span>←</span>
                      <span>뒤로가기</span>
                    </button>
                  </div>
                  <div className="text-center py-24 bg-white rounded-2xl shadow-md border border-gray-200">
                    <div className="text-8xl mb-6">📊</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">종목 정보가 없습니다</h2>
                    <p className="text-gray-600 mb-6">
                      선택하신 종목 <span className="font-semibold text-indigo-600">{detailSymbol}</span>의 상세 정보를 찾을 수 없습니다.
                    </p>
                    <button
                      onClick={() => window.history.back()}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      뒤로가기
                    </button>
                  </div>
                </main>
              );
            }

            // StockDetail 형식으로 변환 (기존 코드와 호환성 유지)
            const stockDetail: { [key: string]: string | number } = {
              // Basic Info
              Ticker: stockInfo.symbol,
              Name: stockInfo.name,
              Sector: stockInfo.category,
              Industry: stockInfo.industry || stockInfo.sector,

              // Price Data
              Price: stockInfo.price || 0,
              MktCap: stockInfo.marketCap ? stockInfo.marketCap / 1e9 : 0,
              DollarVol: stockInfo.dollarVolume ? stockInfo.dollarVolume / 1e6 : 0,

              // Scores
              GrowthScore: stockInfo.growthScore || 0,
              QualityScore: stockInfo.qualityScore || 0,
              ValueScore: stockInfo.valueScore || 0,
              MomentumScore: stockInfo.momentumScore || 0,
              TotalScore: stockInfo.totalScore || stockInfo.aiScore || 0,

              // Valuation Metrics
              PE: stockInfo.PER || 0,
              PEG: stockInfo.PEG || 0,
              PB: stockInfo.PBR || 0,
              PS: stockInfo.PSR || 0,
              FCF_Yield: stockInfo.FCF_Yield || 0,
              DivYield: stockInfo.divYield || 0,
              PayoutRatio: stockInfo.payoutRatio || 0,
              EV_EBITDA: stockInfo.evEbitda || 0,
              FairValue: stockInfo.fairValue || 0,
              Discount: stockInfo.discount || 0,

              // Profitability Metrics
              ROE: stockInfo.ROE || 0,
              ROA: stockInfo.ROA || 0,
              OpMarginTTM: stockInfo.OpMarginTTM || 0,
              OperatingMargins: stockInfo.operatingMargins || 0,
              GrossMargins: stockInfo.grossMargins || 0,
              NetMargins: stockInfo.netMargins || 0,

              // Growth Metrics
              RevYoY: stockInfo.RevYoY || 0,
              EPS_Growth_3Y: stockInfo.EPS_Growth_3Y || 0,
              Revenue_Growth_3Y: stockInfo.revenueGrowth3Y || 0,
              EBITDA_Growth_3Y: stockInfo.ebitdaGrowth3Y || 0,

              // Technical Indicators
              SMA20: stockInfo.sma20 || 0,
              SMA50: stockInfo.sma50 || 0,
              SMA200: stockInfo.sma200 || 0,
              RSI_14: stockInfo.rsi || 0,
              MACD: stockInfo.macd || 0,
              MACD_Signal: stockInfo.macdSignal || 0,
              MACD_Histogram: stockInfo.macdHistogram || 0,
              BB_Position: stockInfo.bbPosition || 0,
              ATR_PCT: stockInfo.atr || 0,

              // Momentum Metrics
              RET5: stockInfo.ret5d || 0,
              RET20: stockInfo.ret20d || 0,
              RET63: stockInfo.ret63d || 0,
              Momentum_12M: stockInfo.momentum12m || 0,
              Volatility_21D: stockInfo.volatility || 0,
              High_52W_Ratio: stockInfo.high52wRatio || 0,
              Low_52W_Ratio: stockInfo.low52wRatio || 0,
              RVOL: stockInfo.rvol || 0,

              // Risk Metrics
              Beta: stockInfo.beta || 0,
              ShortPercent: stockInfo.shortPercent || 0,
              InsiderOwnership: stockInfo.insiderOwnership || 0,
              InstitutionOwnership: stockInfo.institutionOwnership || 0,
            };

            return (
              <main className="mx-auto max-w-7xl px-4 py-6 pb-24">
                {/* ✅ 뒤로가기 버튼 */}
                <div className="mb-4">
                <button
                  onClick={() => window.history.back()}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <span>←</span>
                  <span>뒤로가기</span>
                </button>
                </div>
                {/* 히어로 섹션 */}
                <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6 md:p-8 text-white shadow-xl">
                  <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-3 sm:gap-6 flex-1">
                      <StockLogo
                        src={stockInfo?.logoUrl}
                        alt={String(stockDetail.Name)}
                        size="xl"
                        className="shadow-lg sm:h-16 sm:w-16 md:h-20 md:w-20 sm:rounded-2xl p-1.5 sm:p-2"
                        onError={() => setDetailLogoError(true)}
                      />
                      <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1 sm:mb-2 truncate">{stockDetail.Name}</h1>
                        <p className="text-sm sm:text-base md:text-xl text-indigo-100 mb-2 sm:mb-3 truncate">
                          {stockDetail.Ticker} · {stockDetail.Sector}
                        </p>
                        {/* 기업 간단 설명 (백엔드에서 제공 시 표시) */}
                        {(stockInfo as any)?.description && (
                          <p className="text-xs sm:text-sm text-indigo-100 mb-2 sm:mb-3 line-clamp-2">
                            {(stockInfo as any).description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                          <div>
                            <div className="text-xs sm:text-sm text-indigo-200">현재가</div>
                            <div className="text-lg sm:text-2xl md:text-3xl font-bold">${stockDetail.Price?.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm text-indigo-200">시가총액</div>
                            <div className="text-base sm:text-xl md:text-2xl font-bold">${stockDetail.MktCap?.toLocaleString()}B</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right sm:text-center self-center">
                      {stockInfo && (
                        <>
                          {dataDate && (
                            <div className="text-xs text-indigo-100 mb-2 text-right">
                              📅 {new Date(dataDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 기준
                            </div>
                          )}
                          <div className="inline-block bg-white/40 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-white/60 shadow-2xl ring-2 ring-white/30">
                            <div className="text-xs text-gray-800 mb-2 font-bold text-center bg-white/70 rounded-lg px-2 py-1 shadow-sm">종합 점수</div>
                            <AIScoreGauge score={stockInfo.aiScore} sentiment={stockInfo.sentiment} size="lg" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3줄 요약 & 가격 가이드 */}
                {stockInfo && (
                  <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* 3줄 요약 - 백엔드 데이터가 있으면 Enhanced 버전 사용 */}
                    {recommendationSummary && !isLoadingRecommendation ? (
                      <EnhancedThreePointSummary
                        reason={recommendationSummary.summary.reason}
                        opportunity={recommendationSummary.summary.opportunity}
                        caution={recommendationSummary.summary.caution}
                      />
                    ) : (
                      <ThreePointSummary
                        reason={
                          stockInfo.ROE && stockInfo.PER
                            ? `ROE ${stockInfo.ROE.toFixed(1)}%, PER ${stockInfo.PER.toFixed(1)} - ${
                                stockInfo.ROE > 15 ? '우수한' : stockInfo.ROE > 10 ? '양호한' : '적정한'
                              } 수익성 보유`
                            : `AI 평가 ${stockInfo.aiScore}점 - ${
                                stockInfo.aiScore >= 80 ? '매우 우수한' : stockInfo.aiScore >= 60 ? '우수한' : '양호한'
                              } 종목`
                        }
                        opportunity={
                          stockInfo.RevYoY
                            ? `${stockDetail.Sector} 섹터, 매출 YoY ${stockInfo.RevYoY > 0 ? '+' : ''}${stockInfo.RevYoY.toFixed(1)}% 성장`
                            : `${stockDetail.Sector} 섹터의 성장 잠재력`
                        }
                        caution={
                          stockInfo.PEG && stockInfo.PEG > 2
                            ? `PEG ${stockInfo.PEG.toFixed(2)} - 밸류에이션 부담 주의`
                            : stockInfo.volatility && stockInfo.volatility > 0.5
                            ? `변동성 ${(stockInfo.volatility * 100).toFixed(1)}% - 리스크 관리 필요`
                            : '전반적인 시장 변동성에 유의'
                        }
                      />
                    )}

                    {/* 가격 가이드 - 백엔드 데이터가 있으면 Enhanced 버전 사용 */}
                    {stockDetail.Price && (
                      priceGuidance && !isLoadingRecommendation ? (
                        <EnhancedPriceGuideBand
                          currentPrice={priceGuidance.currentPrice}
                          targetPrice={priceGuidance.guidance.targetPrice}
                          buyRange={priceGuidance.guidance.buyRange}
                          sellRange={priceGuidance.guidance.sellRange}
                          currency={stockInfo.market === 'US' ? '$' : '₩'}
                        />
                      ) : (
                        <PriceGuideBand
                          currentPrice={stockDetail.Price}
                          currency={stockInfo.market === 'US' ? '$' : '₩'}
                          buyPrice={stockDetail.Price * 0.92}
                          targetPrice={stockDetail.Price * 1.25}
                        />
                      )
                    )}
                  </div>
                )}

                {/* 탭 네비게이션 */}
                <div className="mb-6 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDetailTab("info")}
                      className={classNames(
                        "flex-1 sm:flex-initial rounded-lg px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-all",
                        detailTab === "info"
                          ? "bg-indigo-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      <span className="hidden sm:inline">📊 종목 정보</span>
                      <span className="sm:hidden">📊 정보</span>
                    </button>
                    <button
                      onClick={() => setDetailTab("chart")}
                      className={classNames(
                        "flex-1 sm:flex-initial rounded-lg px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-all",
                        detailTab === "chart"
                          ? "bg-indigo-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      <span className="hidden sm:inline">📈 주가 추이</span>
                      <span className="sm:hidden">📈 차트</span>
                    </button>
                    <button
                      onClick={() => setDetailTab("filings")}
                      className={classNames(
                        "flex-1 sm:flex-initial rounded-lg px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-all",
                        detailTab === "filings"
                          ? "bg-indigo-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      <span className="hidden sm:inline">📋 공시 분석</span>
                      <span className="sm:hidden">📋 공시</span>
                    </button>
                  </div>
                  {detailTab === "info" && (
                    <button
                      onClick={() => exportStockDetailToExcel(stockDetail, stockInfo)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md"
                    >
                      <span>📥</span>
                      <span className="hidden sm:inline">엑셀 다운로드</span>
                      <span className="sm:hidden">다운로드</span>
                    </button>
                  )}
                </div>

                {/* 컨텐츠 */}
                {detailTab === "info" ? (
                  <div className="space-y-6">
                    {/* 종합 점수 */}
                    <div className="rounded-xl bg-white p-6 shadow-md border border-gray-200">
                      <h2 className="text-lg font-bold text-gray-900 mb-4">🏆 종합 평가</h2>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {["GrowthScore", "QualityScore", "ValueScore", "MomentumScore", "TotalScore"].map(key => {
                          const value = stockDetail[key];
                          const isNumber = typeof value === "number";
                          const scoreLevel = isNumber ? getScoreLevel(value) : null;
                          const criticalMetrics = getCriticalMetrics(key);

                          return (
                            <div key={key} className="text-center p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
                              <div className="text-xs font-semibold text-gray-700 mb-1">{key.replace("Score", "")}</div>
                              {(METRIC_DESCRIPTIONS[key] || METRIC_SHORT_DESCRIPTIONS[key]) && (
                                <div className="mb-2">
                                  <div className="text-[10px] text-gray-500 mb-1 leading-tight">
                                    {expandedMetrics[key]
                                      ? METRIC_DESCRIPTIONS[key] || METRIC_SHORT_DESCRIPTIONS[key]
                                      : METRIC_SHORT_DESCRIPTIONS[key] || METRIC_DESCRIPTIONS[key]}
                                  </div>
                                  <button
                                    onClick={() => toggleMetricDescription(key)}
                                    className="text-[9px] text-blue-600 hover:text-blue-800 font-semibold"
                                  >
                                    {expandedMetrics[key] ? "(간략히)" : "(자세히)"}
                                  </button>
                                </div>
                              )}
                              <div className={classNames("text-3xl font-bold", isNumber ? getMetricColor(key, value) : "text-gray-900")}>
                                {isNumber ? value.toFixed(0) : value}
                              </div>
                              {scoreLevel && (
                                <div className="mt-2 text-xs font-semibold">
                                  <span className="mr-1">{scoreLevel.emoji}</span>
                                  <span className={classNames(
                                    value >= 80 ? "text-emerald-600" :
                                    value >= 70 ? "text-blue-600" :
                                    value >= 60 ? "text-gray-600" :
                                    value >= 50 ? "text-orange-600" :
                                    "text-red-600"
                                  )}>{scoreLevel.label}</span>
                                </div>
                              )}
                              {/* 크리티컬 지표 표시 */}
                              {criticalMetrics.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="text-[10px] text-gray-600 mb-1">주요 영향 지표</div>
                                  <div className="flex flex-wrap gap-1 justify-center">
                                    {criticalMetrics.map(metric => {
                                      const metricValue = stockDetail[metric];
                                      const metricColor = typeof metricValue === "number" ? getMetricColor(metric, metricValue) : "text-gray-600";
                                      return (
                                        <span
                                          key={metric}
                                          className={classNames(
                                            "text-[9px] px-1.5 py-0.5 rounded font-semibold",
                                            metricColor.includes("emerald") ? "bg-emerald-100 text-emerald-700" :
                                            metricColor.includes("red") ? "bg-red-100 text-red-700" :
                                            "bg-gray-100 text-gray-700"
                                          )}
                                          title={METRIC_DESCRIPTIONS[metric] || metric}
                                        >
                                          {metric.replace(/_/g, " ").replace("Score", "")}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 수익률 성과 */}
                    {(stockInfo.introducedAt || stockInfo.perfSinceIntro !== undefined || stockInfo.perf100d !== undefined) && (
                      <div className="rounded-xl bg-white p-6 shadow-md border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">📈 수익률 성과</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {stockInfo.introducedAt && (
                            <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
                              <div className="text-xs text-gray-600 mb-2">스크리닝 시작일</div>
                              <div className="text-sm font-bold text-gray-900 mb-1">
                                {new Date(stockInfo.introducedAt).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                ({Math.floor((Date.now() - new Date(stockInfo.introducedAt).getTime()) / (1000 * 60 * 60 * 24))}일 전)
                              </div>
                            </div>
                          )}
                          {stockInfo.perfSinceIntro !== undefined && (
                            <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                              <div className="text-xs text-gray-600 mb-2">스크리닝 이후 수익률</div>
                              <div className={classNames(
                                "text-3xl font-bold mb-1",
                                stockInfo.perfSinceIntro > 0 ? "text-emerald-600" :
                                stockInfo.perfSinceIntro < 0 ? "text-red-600" :
                                "text-gray-600"
                              )}>
                                {stockInfo.perfSinceIntro > 0 ? "+" : ""}{stockInfo.perfSinceIntro.toFixed(1)}%
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <span className={stockInfo.perfSinceIntro > 0 ? "text-emerald-600" : "text-red-600"}>
                                  {stockInfo.perfSinceIntro > 0 ? "↗" : stockInfo.perfSinceIntro < 0 ? "↘" : "→"}
                                </span>
                                <span className="text-gray-600">
                                  {stockInfo.perfSinceIntro > 0 ? "수익 중" : stockInfo.perfSinceIntro < 0 ? "손실 중" : "변동 없음"}
                                </span>
                              </div>
                            </div>
                          )}
                          {stockInfo.perf100d !== undefined && (
                            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
                              <div className="text-xs text-gray-600 mb-2">최근 100일 수익률</div>
                              <div className={classNames(
                                "text-3xl font-bold mb-1",
                                stockInfo.perf100d > 0 ? "text-blue-600" :
                                stockInfo.perf100d < 0 ? "text-red-600" :
                                "text-gray-600"
                              )}>
                                {stockInfo.perf100d > 0 ? "+" : ""}{stockInfo.perf100d.toFixed(1)}%
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <span className={stockInfo.perf100d > 0 ? "text-blue-600" : "text-red-600"}>
                                  {stockInfo.perf100d > 0 ? "↗" : stockInfo.perf100d < 0 ? "↘" : "→"}
                                </span>
                                <span className="text-gray-600">
                                  {stockInfo.perf100d > 0 ? "상승" : stockInfo.perf100d < 0 ? "하락" : "보합"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 밸류에이션 */}
                    <div className="rounded-xl bg-white p-6 shadow-md border border-gray-200">
                      <h2 className="text-lg font-bold text-gray-900 mb-4">💰 밸류에이션</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {["FairValue", "Discount", "PE", "PEG", "PB", "PS", "EV_EBITDA", "FCF_Yield", "DivYield", "PayoutRatio"].map(key => {
                          if (!stockDetail[key]) return null;
                          const value = stockDetail[key];
                          let displayValue = typeof value === "number" ? value.toFixed(2) : String(value);
                          if ((key === "Discount" || key === "DivYield" || key === "PayoutRatio") && typeof value === "number") displayValue = value.toFixed(1) + "%";
                          if ((key === "PE" || key === "PEG" || key === "PB" || key === "PS" || key === "FCF_Yield") && typeof value === "number") displayValue = value.toFixed(2) + "%";
                          const colorClass = typeof value === "number" ? getMetricColor(key, value) : "text-gray-900";
                          const status = getMetricStatus(colorClass);
                          return (
                            <div key={key} className="p-4 rounded-lg bg-gray-50">
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-xs font-semibold text-gray-700">{key.replace(/_/g, " ")}</div>
                                <span className={classNames("text-[9px] px-1.5 py-0.5 rounded font-semibold", status.bgClass, status.textClass)}>
                                  {status.label}
                                </span>
                              </div>
                              {(METRIC_DESCRIPTIONS[key] || METRIC_SHORT_DESCRIPTIONS[key]) && (
                                <div className="mb-2">
                                  <div className="text-[10px] text-gray-500 mb-1 leading-tight">
                                    {expandedMetrics[key]
                                      ? METRIC_DESCRIPTIONS[key] || METRIC_SHORT_DESCRIPTIONS[key]
                                      : METRIC_SHORT_DESCRIPTIONS[key] || METRIC_DESCRIPTIONS[key]}
                                  </div>
                                  <button
                                    onClick={() => toggleMetricDescription(key)}
                                    className="text-[9px] text-blue-600 hover:text-blue-800 font-semibold"
                                  >
                                    {expandedMetrics[key] ? "(간략히)" : "(자세히)"}
                                  </button>
                                </div>
                              )}
                              <div className={classNames("text-xl font-bold", colorClass)}>{displayValue}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 수익성 & 성장성 */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="rounded-xl bg-white p-6 shadow-md border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">📈 수익성</h2>
                        <div className="grid grid-cols-2 gap-4">
                          {["ROE", "ROA", "OpMarginTTM", "OperatingMargins", "GrossMargins", "NetMargins"].map(key => {
                            if (!stockDetail[key]) return null;
                            const value = stockDetail[key];
                            if (typeof value !== "number") return null;
                            const displayValue = value.toFixed(1) + "%";
                            const colorClass = getMetricColor(key, value);
                            const status = getMetricStatus(colorClass);
                            return (
                              <div key={key} className="p-4 rounded-lg bg-gray-50">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="text-xs font-semibold text-gray-700">{key.replace(/_/g, " ")}</div>
                                  <span className={classNames("text-[9px] px-1.5 py-0.5 rounded font-semibold", status.bgClass, status.textClass)}>
                                    {status.label}
                                  </span>
                                </div>
                                {(METRIC_DESCRIPTIONS[key] || METRIC_SHORT_DESCRIPTIONS[key]) && (
                                  <div className="mb-2">
                                    <div className="text-[10px] text-gray-500 mb-1 leading-tight">
                                      {expandedMetrics[key]
                                        ? METRIC_DESCRIPTIONS[key] || METRIC_SHORT_DESCRIPTIONS[key]
                                        : METRIC_SHORT_DESCRIPTIONS[key] || METRIC_DESCRIPTIONS[key]}
                                    </div>
                                    <button
                                      onClick={() => toggleMetricDescription(key)}
                                      className="text-[9px] text-blue-600 hover:text-blue-800 font-semibold"
                                    >
                                      {expandedMetrics[key] ? "(간략히)" : "(자세히)"}
                                    </button>
                                  </div>
                                )}
                                <div className={classNames("text-2xl font-bold", colorClass)}>{displayValue}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-xl bg-white p-6 shadow-md border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">🚀 성장성</h2>
                        <div className="grid grid-cols-2 gap-4">
                          {["RevYoY", "Revenue_Growth_3Y", "EPS_Growth_3Y", "EBITDA_Growth_3Y"].map(key => {
                            if (!stockDetail[key]) return null;
                            const value = stockDetail[key];
                            if (typeof value !== "number") return null;
                            const displayValue = value.toFixed(1) + "%";
                            const colorClass = getMetricColor(key, value);
                            const status = getMetricStatus(colorClass);
                            return (
                              <div key={key} className="p-4 rounded-lg bg-gray-50">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="text-xs font-semibold text-gray-700">{key.replace(/_/g, " ")}</div>
                                  <span className={classNames("text-[9px] px-1.5 py-0.5 rounded font-semibold", status.bgClass, status.textClass)}>
                                    {status.label}
                                  </span>
                                </div>
                                {(METRIC_DESCRIPTIONS[key] || METRIC_SHORT_DESCRIPTIONS[key]) && (
                                  <div className="mb-2">
                                    <div className="text-[10px] text-gray-500 mb-1 leading-tight">
                                      {expandedMetrics[key]
                                        ? METRIC_DESCRIPTIONS[key] || METRIC_SHORT_DESCRIPTIONS[key]
                                        : METRIC_SHORT_DESCRIPTIONS[key] || METRIC_DESCRIPTIONS[key]}
                                    </div>
                                    <button
                                      onClick={() => toggleMetricDescription(key)}
                                      className="text-[9px] text-blue-600 hover:text-blue-800 font-semibold"
                                    >
                                      {expandedMetrics[key] ? "(간략히)" : "(자세히)"}
                                    </button>
                                  </div>
                                )}
                                <div className={classNames("text-2xl font-bold", colorClass)}>{displayValue}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* 나머지 지표들 */}
                    <div className="rounded-xl bg-white p-6 shadow-md border border-gray-200">
                      <h2 className="text-lg font-bold text-gray-900 mb-4">📊 기타 지표</h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.entries(stockDetail).map(([key, value]) => {
                          // 이미 표시한 지표들은 제외
                          const excludeKeys = ["Ticker", "Name", "Sector", "Industry", "Price", "MktCap",
                            "GrowthScore", "QualityScore", "ValueScore", "MomentumScore", "TotalScore",
                            "FairValue", "Discount", "PE", "PEG", "PB", "PS", "EV_EBITDA", "FCF_Yield", "DivYield", "PayoutRatio",
                            "ROE", "ROA", "OpMarginTTM", "OperatingMargins", "GrossMargins", "NetMargins",
                            "RevYoY", "Revenue_Growth_3Y", "EPS_Growth_3Y", "EBITDA_Growth_3Y"];
                          if (excludeKeys.includes(key)) return null;

                          let displayValue = value;
                          let colorClass = "text-gray-900";

                          if (typeof value === "number") {
                            colorClass = getMetricColor(key, value);
                            if (key.includes("Score") || key.includes("Percent") || key.includes("Ratio") || key.includes("Margin")) {
                              displayValue = value.toFixed(1) + (key.includes("Score") ? "" : "%");
                            } else if (key.includes("Cap") || key.includes("Vol")) {
                              displayValue = value.toLocaleString();
                            } else {
                              displayValue = value.toFixed(2);
                            }
                          }

                          const status = getMetricStatus(colorClass);
                          return (
                            <div key={key} className="p-4 rounded-lg bg-gray-50">
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-xs font-semibold text-gray-700">{key.replace(/_/g, " ")}</div>
                                <span className={classNames("text-[9px] px-1.5 py-0.5 rounded font-semibold", status.bgClass, status.textClass)}>
                                  {status.label}
                                </span>
                              </div>
                              {(METRIC_DESCRIPTIONS[key] || METRIC_SHORT_DESCRIPTIONS[key]) && (
                                <div className="mb-2">
                                  <div className="text-[10px] text-gray-500 mb-1 leading-tight">
                                    {expandedMetrics[key]
                                      ? METRIC_DESCRIPTIONS[key] || METRIC_SHORT_DESCRIPTIONS[key]
                                      : METRIC_SHORT_DESCRIPTIONS[key] || METRIC_DESCRIPTIONS[key]}
                                  </div>
                                  <button
                                    onClick={() => toggleMetricDescription(key)}
                                    className="text-[9px] text-blue-600 hover:text-blue-800 font-semibold"
                                  >
                                    {expandedMetrics[key] ? "(간략히)" : "(자세히)"}
                                  </button>
                                </div>
                              )}
                              <div className={classNames("text-lg font-bold", colorClass)}>{displayValue}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* ETF 멤버십 (이 종목을 포함하는 ETF 목록) - 개선된 컴포넌트 사용 */}
                    <StockEtfHoldings
                      ticker={detailSymbol}
                      companyName={String(stockDetail.Name)}
                    />
                  </div>
                ) : detailTab === "chart" ? (
                  /* 주가 추이 차트 탭 */
                  <div>
                    <StockPriceVisualization
                      ticker={detailSymbol}
                      companyName={String(stockDetail.Name)}
                      initialMaxDate={stockInfo?.dataDate}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stockFilings.length > 0 ? stockFilings.map(filing => (
                      <div key={filing.id} className="rounded-xl bg-white p-6 shadow-md border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {/* 로고 추가 */}
                              <StockLogo
                                src={filing.logoUrl}
                                alt={filing.company}
                                size="sm"
                                onError={() => setLogoErrors(prev => ({ ...prev, [filing.symbol]: true }))}
                              />
                              <span className="inline-flex items-center rounded-lg bg-indigo-100 px-3 py-1.5 text-sm font-semibold text-indigo-700">
                                {filing.formType}
                              </span>
                              <span className="text-sm text-gray-500">{filing.date}</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{filing.summary}</h3>
                          </div>
                          <div className="flex-shrink-0">
                            <AIScoreGauge score={filing.aiScore} sentiment={filing.sentiment} size="md" />
                          </div>
                        </div>
                        {filing.previousScores && filing.previousScores.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="text-sm text-gray-600 font-semibold">이전 공시 점수 추이</div>
                              {filing.previousScores.length > 1 && (
                                <div className="text-xs text-gray-500">
                                  ({filing.previousScores.length}개 공시 이력)
                                </div>
                              )}
                            </div>

                            {/* 점수 추이 차트 */}
                            {filing.previousScores.length >= 2 && (
                              <div className="mb-4 p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
                                <FilingScoreTrendChart scores={filing.previousScores} />
                              </div>
                            )}

                            {/* 점수 박스 표시 */}
                            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
                              {filing.previousScores.map((score: number, idx: number) => {
                                const isLatest = idx === filing.previousScores.length - 1;
                                const prevScore = idx > 0 ? filing.previousScores[idx - 1] : null;
                                const scoreDiff = prevScore !== null ? score - prevScore : null;
                                const scoreColor =
                                  score >= 80 ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
                                  score >= 70 ? "text-blue-700 bg-blue-50 border-blue-200" :
                                  score >= 60 ? "text-gray-700 bg-gray-50 border-gray-200" :
                                  score >= 50 ? "text-orange-700 bg-orange-50 border-orange-200" :
                                  "text-red-700 bg-red-50 border-red-200";

                                return (
                                  <div
                                    key={idx}
                                    className={classNames(
                                      "text-center min-w-[80px] rounded-lg border-2 p-2 sm:p-3 transition-all",
                                      isLatest ? "ring-2 ring-indigo-300 shadow-md scale-105" : "",
                                      scoreColor
                                    )}
                                  >
                                    <div className="text-[10px] sm:text-xs text-gray-600 mb-1 font-medium">
                                      {isLatest ? "최신" : `-${filing.previousScores.length - idx}회`}
                                    </div>
                                    <div className="text-base sm:text-lg font-bold mb-1">
                                      {score}점
                                    </div>
                                    {scoreDiff !== null && (
                                      <div className={classNames(
                                        "text-[10px] font-semibold flex items-center justify-center gap-0.5",
                                        scoreDiff > 0 ? "text-emerald-600" :
                                        scoreDiff < 0 ? "text-red-600" :
                                        "text-gray-500"
                                      )}>
                                        {scoreDiff > 0 ? "↗" : scoreDiff < 0 ? "↘" : "→"}
                                        {scoreDiff > 0 ? "+" : ""}{scoreDiff}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )) : (
                      <div className="text-center py-16 bg-white rounded-xl shadow-md">
                        <div className="text-6xl mb-4">📄</div>
                        <p className="text-gray-600 text-lg">공시 분석 정보가 없습니다</p>
                      </div>
                    )}
                  </div>
                )}
              </main>
            );
          })()}
        </div>
      </div>

      {/* 하단 고정 네비 */}
      <BottomNav active={activeTab} onChange={switchTab} />
    </div>
  );
}