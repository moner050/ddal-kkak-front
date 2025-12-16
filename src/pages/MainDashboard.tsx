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
import UnifiedSectorPerformanceCard from "../components/charts/UnifiedSectorPerformanceCard";

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
  } = useDemoHomeData();

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

  // 홈 화면 필터 (hooks에 포함되지 않은 홈 화면 전용 상태)
  const [featuredMarket, setFeaturedMarket] = useState<"US" | "KR">("US");
  const [filingsMarket, setFilingsMarket] = useState<"US" | "KR">("US");

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

            {/* GICS 섹터별 동향 (단기 + 연간 통합) */}
            <section>
              <UnifiedSectorPerformanceCard
                performances={sectorPerformances}
                todayDate={sectorTodayDate}
                yesterdayDate={sectorYesterdayDate}
                onShortTermRangeChange={handleSectorPerformanceRangeChange}
                onSectorClick={handleSectorClick}
                loadingShortTerm={isLoadingSectorPerformances}
                yearlyData={yearlySectorPerformances}
                onYearlyRangeChange={handleYearlySectorPerformanceRangeChange}
                loadingYearly={isLoadingYearlySectorPerformances}
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
{/* 나머지 코드는 변경 사항 없음 - 기존 코드 유지 */}
