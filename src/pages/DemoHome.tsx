// DemoHome.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

/* ------------------------------------------------------------
   UI PACKAGE (개정안 v10.3, 뉴스요약 섹션 통합본 + TS 타입 보강)
   - 스크롤/하단네비 고정 레이아웃 (헤더/스크롤/고정탭)
   - TabKey 타입 도입으로 scrollRef 인덱싱 오류 해결
   - Header / FilingsSectionByMarket / RankingSectionByMarket / BottomNav 포함
------------------------------------------------------------ */

// Import utilities
import { classNames, formatNumber, getRelativeTime, formatAsOf } from "../utils/format";
import { setCookie, getCookie } from "../utils/cookies";
import { setQueryParams, getQueryParam } from "../utils/queryParams";

// Import constants
import { CATEGORIES, SECTOR_INDUSTRIES, SECTOR_THEMES } from "../constants/categories";

// Import types
import { TabKey, Sentiment } from "../types";

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

// Import news components
import NewsImportanceBadge from "../components/news/NewsImportanceBadge";
import NewsModal from "../components/news/NewsModal";
import NewsCard from "../components/news/NewsCard";
import CategoryPager from "../components/news/CategoryPager";

// Import common components
import Header from "../components/common/Header";
import BottomNav from "../components/common/BottomNav";
import CategoryChips from "../components/common/CategoryChips";
import Pagination from "../components/common/Pagination";

// Import modal components
import LoginModal from "../components/modals/LoginModal";
import SignupModal from "../components/modals/SignupModal";

// Import utility components
import { LoadingSkeleton, CardSkeleton } from "../components/utils/LoadingSkeleton";
import ErrorCard from "../components/utils/ErrorCard";
import EmptyState from "../components/utils/EmptyState";
import QuickActionsBar from "../components/utils/QuickActionsBar";
import TooltipHeader from "../components/utils/TooltipHeader";
import MetricTooltip from "../components/utils/MetricTooltip";

// 모의 데이터: 섹터별 등락(%) — 미국/한국 분리
const mockCategoryMovesUS = [
  { name: "정보기술", pct: 1.2 },
  { name: "커뮤니케이션 서비스", pct: 0.4 },
  { name: "경기소비재", pct: -1.1 },
  { name: "필수소비재", pct: 0.0 },
  { name: "헬스케어", pct: 0.7 },
  { name: "금융", pct: -0.6 },
  { name: "산업재", pct: 2.8 },
  { name: "소재", pct: -3.4 },
  { name: "에너지", pct: 3.6 },
  { name: "유틸리티", pct: -0.2 },
  { name: "부동산", pct: -2.5 },
];
const mockCategoryMovesKR = [
  { name: "정보기술", pct: 0.8 },
  { name: "커뮤니케이션 서비스", pct: 1.1 },
  { name: "경기소비재", pct: -0.4 },
  { name: "필수소비재", pct: 0.2 },
  { name: "헬스케어", pct: -0.9 },
  { name: "금융", pct: 0.3 },
  { name: "산업재", pct: 1.6 },
  { name: "소재", pct: -1.2 },
  { name: "에너지", pct: 0.5 },
  { name: "유틸리티", pct: -0.1 },
  { name: "부동산", pct: -0.7 },
];

// 모의 시세 데이터: USD/KRW, Gold(USD/oz)
const mockUSDKRW = [1380, 1375, 1372, 1368, 1360, 1355, 1362, 1368, 1359, 1355, 1351, 1348, 1340, 1335, 1332, 1328, 1330, 1338, 1342, 1336, 1331, 1327, 1325, 1322, 1318, 1315, 1317, 1313, 1311, 1314];
const mockGoldUSD = [2400, 2408, 2412, 2420, 2417, 2410, 2405, 2416, 2424, 2432, 2426, 2420, 2414, 2418, 2422, 2428, 2435, 2440, 2436, 2431, 2428, 2422, 2418, 2412, 2408, 2415, 2419, 2425, 2429, 2433];

// 추가 시장 지표 데이터
const mockSP500 = [5825, 5840, 5855, 5870, 5860, 5845, 5830, 5850, 5865, 5880, 5895, 5910, 5900, 5885, 5870, 5890, 5905, 5920, 5935, 5950, 5940, 5925, 5910, 5930, 5945, 5960, 5975, 5965, 5950, 5970];
const mockKOSPI = [2450, 2465, 2480, 2475, 2460, 2445, 2455, 2470, 2485, 2500, 2490, 2475, 2460, 2470, 2485, 2500, 2515, 2530, 2520, 2505, 2490, 2500, 2515, 2530, 2545, 2535, 2520, 2530, 2545, 2560];
const mockUS10Y = [4.15, 4.18, 4.22, 4.25, 4.28, 4.32, 4.30, 4.27, 4.24, 4.20, 4.17, 4.15, 4.12, 4.10, 4.08, 4.05, 4.08, 4.12, 4.15, 4.18, 4.22, 4.25, 4.28, 4.30, 4.33, 4.35, 4.32, 4.28, 4.25, 4.22];
const mockVIX = [14.5, 15.2, 16.0, 15.8, 15.5, 14.8, 14.2, 13.8, 13.5, 13.2, 12.8, 13.0, 13.5, 14.0, 14.5, 15.0, 15.5, 16.2, 16.8, 17.5, 17.0, 16.5, 16.0, 15.5, 15.0, 14.5, 14.0, 13.8, 13.5, 13.2];
const mockBTC = [92500, 94200, 96800, 95500, 93800, 91200, 89500, 90800, 93200, 96500, 99200, 101800, 100500, 98200, 95800, 94500, 96200, 98800, 101500, 104200, 102800, 100500, 98200, 96800, 95500, 97200, 99800, 102500, 105200, 103800];
const mockWTI = [70.5, 71.2, 72.0, 71.8, 71.2, 70.5, 69.8, 69.2, 68.5, 68.0, 67.5, 67.8, 68.5, 69.2, 70.0, 70.8, 71.5, 72.2, 73.0, 73.5, 73.0, 72.5, 72.0, 71.5, 71.0, 70.5, 70.0, 69.5, 69.0, 68.5];

// 공포·탐욕 시계열
const usFearGreedSeries = [58, 60, 59, 61, 62, 64, 63, 66, 67, 65, 66, 61, 60, 62];
const krFearGreedSeries = [48, 50, 52, 51, 53, 54, 55, 54, 56, 57, 55, 54, 56, 55];

// 버핏지수 시계열(비율, 1.0 = 100%)
const usBuffettSeries = [1.55, 1.58, 1.57, 1.59, 1.61, 1.6, 1.62, 1.63, 1.61, 1.6, 1.62, 1.64];
const krBuffettSeries = [0.97, 0.98, 1.0, 0.99, 1.02, 1.01, 1.03, 1.05, 1.04, 1.03, 1.05, 1.06];

// ------------------------------------------------------------------
// 투자 전략 정의
// ------------------------------------------------------------------
const INVESTMENT_STRATEGIES = {
  undervalued_quality: {
    name: "저평가 우량주 (워렌 버핏 스타일)",
    description: "높은 수익성과 성장성을 갖춘 기업을 합리적인 가격에 매수",
    criteria: [
      "시가총액: 20억 달러 이상",
      "주가: 10달러 이상",
      "거래대금: 500만 달러 이상",
      "PER < 25 (섹터별 조정)",
      "PEG < 1.5",
      "매출 성장률 > 5%",
      "EPS 성장률 > 5%",
      "영업이익률 > 12%",
      "ROE > 15%",
      "FCF Yield > 3%"
    ]
  },
  value_basic: {
    name: "기본 가치투자",
    description: "저평가된 기업을 발굴하는 기본적인 가치투자 전략",
    criteria: [
      "시가총액: 5억 달러 이상",
      "주가: 5달러 이상",
      "거래대금: 100만 달러 이상",
      "PER < 30 (섹터별 조정)",
      "PEG < 2.0",
      "영업이익률 > 5%",
      "ROE > 8%"
    ]
  },
  value_strict: {
    name: "엄격한 가치투자",
    description: "더 까다로운 기준으로 우량한 저평가 기업을 선별",
    criteria: [
      "시가총액: 20억 달러 이상",
      "주가: 5달러 이상",
      "거래대금: 500만 달러 이상",
      "PER < 20 (섹터별 조정)",
      "PEG < 1.5",
      "매출 성장률 > 5%",
      "EPS 성장률 > 5%",
      "영업이익률 > 10%",
      "ROE > 12%",
      "FCF Yield > 2%"
    ]
  },
  growth_quality: {
    name: "성장+품질 (장타 전략)",
    description: "높은 성장성과 품질을 갖춘 기업 장기 보유",
    criteria: [
      "시가총액: 10억 달러 이상",
      "매출 성장률 > 15%",
      "EPS 성장률 > 10%",
      "영업이익률 > 15%",
      "ROE > 15%",
      "PER < 40 (성장주 특성 반영)",
      "PEG < 2.0"
    ]
  },
  momentum: {
    name: "모멘텀 트레이딩 (단타)",
    description: "강한 상승 추세를 보이는 종목 단기 매매",
    criteria: [
      "주가: 10달러 이상",
      "거래대금: 300만 달러 이상",
      "상대 거래량 > 1.3배",
      "RSI: 40-70 (과매도 후 반등)",
      "20일 수익률 > 3%",
      "52주 고가 대비 > 70%",
      "MACD 히스토그램 > 0 (상승 추세)"
    ]
  },
  swing: {
    name: "스윙 트레이딩 (단타)",
    description: "적절한 변동성을 가진 종목의 단기 등락 활용",
    criteria: [
      "주가: 5달러 이상",
      "거래대금: 100만 달러 이상",
      "ATR 변동성: 2-10%",
      "RSI: 30-70",
      "볼린저밴드 위치: 20-80%",
      "5일 수익률: -5% ~ 10%"
    ]
  }
};

// ------------------------------------------------------------------
// Mock Data
// ------------------------------------------------------------------

// 오늘의 주목 저평가주 (Featured)
const mockFeaturedStocks = [
  {
    id: "fs1",
    market: "US",
    symbol: "NVDA",
    name: "NVIDIA",
    category: "정보기술",
    aiScore: 92,
    sentiment: "POS" as const,
    confidence: 0.88,
    reason: "AI 칩 수요 폭발적 증가, 데이터센터 매출 3분기 연속 150% 성장. 차세대 Blackwell 아키텍처 출시 임박",
    logoUrl: "https://logo.clearbit.com/nvidia.com",
    currentPrice: 487.2,
    targetPrice: 620.0,
    upside: 27.3
  },
  {
    id: "fs2",
    market: "KR",
    symbol: "005930.KS",
    name: "삼성전자",
    category: "정보기술",
    aiScore: 85,
    sentiment: "POS" as const,
    confidence: 0.82,
    reason: "HBM3E 수율 개선 확인, AI 서버용 메모리 공급 본격화. 파운드리 3나노 양산 가시화",
    logoUrl: "https://logo.clearbit.com/samsung.com",
    currentPrice: 73500,
    targetPrice: 95000,
    upside: 29.3
  },
  {
    id: "fs3",
    market: "US",
    symbol: "AMD",
    name: "AMD",
    category: "정보기술",
    aiScore: 78,
    sentiment: "POS" as const,
    confidence: 0.75,
    reason: "MI300 AI 가속기 수주 확대, 데이터센터 CPU 점유율 꾸준한 상승",
    logoUrl: "https://logo.clearbit.com/amd.com",
    currentPrice: 142.8,
    targetPrice: 180.0,
    upside: 26.0
  }
];

// 최근 공시 분석
const mockFilings = [
  {
    id: "f1",
    market: "US",
    symbol: "MSFT",
    company: "Microsoft",
    formType: "10-Q",
    date: "2025-11-03",
    summary: "Azure 클라우드 매출 31% 성장, AI 통합 서비스 확대로 경쟁력 강화",
    direction: "POS",
    sentiment: "POS" as const,
    confidence: 0.85,
    aiScore: 88,
    category: "정보기술",
    logoUrl: "https://logo.clearbit.com/microsoft.com",
    previousScores: [82, 85, 87]
  },
  {
    id: "f2",
    market: "US",
    symbol: "TSLA",
    company: "Tesla",
    formType: "10-Q",
    date: "2025-11-02",
    summary: "차량 인도량 전분기 대비 6% 감소, 마진율 하락 우려",
    direction: "NEG",
    sentiment: "NEG" as const,
    confidence: 0.73,
    aiScore: 42,
    category: "경기소비재",
    logoUrl: "https://logo.clearbit.com/tesla.com",
    previousScores: [68, 52, 48]
  },
  {
    id: "f3",
    market: "KR",
    symbol: "005930.KS",
    company: "삼성전자",
    formType: "분기보고서",
    date: "2025-11-01",
    summary: "메모리 부문 ASP 상승, HBM 매출 비중 확대",
    direction: "POS",
    sentiment: "POS" as const,
    confidence: 0.79,
    aiScore: 82,
    category: "정보기술",
    logoUrl: "https://logo.clearbit.com/samsung.com",
    previousScores: [74, 78, 80]
  },
  {
    id: "f4",
    market: "KR",
    symbol: "068270.KS",
    company: "셀트리온",
    formType: "분기보고서",
    date: "2025-10-31",
    summary: "바이오시밀러 유럽 매출 안정적, 신약 파이프라인 진행 중",
    direction: "NEU",
    sentiment: "NEU" as const,
    confidence: 0.65,
    aiScore: 68,
    category: "헬스케어",
    logoUrl: "https://logo.clearbit.com/celltrion.com",
    previousScores: [65, 67, 69]
  },
  {
    id: "f5",
    market: "US",
    symbol: "META",
    company: "Meta",
    formType: "10-Q",
    date: "2025-10-30",
    summary: "광고 매출 회복세, Reality Labs 투자 지속으로 적자 확대",
    direction: "NEU",
    sentiment: "NEU" as const,
    confidence: 0.58,
    aiScore: 64,
    category: "커뮤니케이션 서비스",
    logoUrl: "https://logo.clearbit.com/meta.com",
    previousScores: [58, 61, 63]
  }
];

// 저평가 우량주 랭킹
const mockUndervalued = [
  {
    market: "US", symbol: "NVDA", name: "NVIDIA", category: "정보기술", industry: "반도체",
    rank: 1, aiScore: 92, sentiment: "POS" as const, introducedAt: "2025-08-12",
    perfSinceIntro: 0.124, perf100d: 0.153, logoUrl: "https://logo.clearbit.com/nvidia.com",
    ROE: 28.5, PER: 45.2, PEG: 0.82, PBR: 12.8, PSR: 18.3,
    RevYoY: 34.2, EPS_Growth_3Y: 55.3, OpMarginTTM: 32.1, FCF_Yield: 2.8
  },
  {
    market: "US", symbol: "MSFT", name: "Microsoft", category: "정보기술", industry: "소프트웨어",
    rank: 2, aiScore: 88, sentiment: "POS" as const, introducedAt: "2025-08-15",
    perfSinceIntro: 0.104, perf100d: 0.132, logoUrl: "https://logo.clearbit.com/microsoft.com",
    ROE: 42.3, PER: 32.5, PEG: 0.95, PBR: 10.5, PSR: 11.2,
    RevYoY: 16.8, EPS_Growth_3Y: 34.2, OpMarginTTM: 42.5, FCF_Yield: 3.5
  },
  {
    market: "US", symbol: "AMD", name: "AMD", category: "정보기술", industry: "반도체",
    rank: 3, aiScore: 78, sentiment: "POS" as const, introducedAt: "2025-09-01",
    perfSinceIntro: 0.067, perf100d: 0.089, logoUrl: "https://logo.clearbit.com/amd.com",
    ROE: 18.2, PER: 38.7, PEG: 1.12, PBR: 5.3, PSR: 7.8,
    RevYoY: 18.5, EPS_Growth_3Y: 34.5, OpMarginTTM: 24.3, FCF_Yield: 2.1
  },
  {
    market: "KR", symbol: "005930.KS", name: "삼성전자", category: "정보기술", industry: "전자기기",
    rank: 1, aiScore: 85, sentiment: "POS" as const, introducedAt: "2025-09-02",
    perfSinceIntro: 0.089, perf100d: 0.112, logoUrl: "https://logo.clearbit.com/samsung.com",
    ROE: 12.8, PER: 18.5, PEG: 0.88, PBR: 1.8, PSR: 1.2,
    RevYoY: 12.3, EPS_Growth_3Y: 21.0, OpMarginTTM: 14.5, FCF_Yield: 4.2
  },
  {
    market: "KR", symbol: "000660.KS", name: "SK하이닉스", category: "정보기술", industry: "반도체",
    rank: 2, aiScore: 81, sentiment: "POS" as const, introducedAt: "2025-08-25",
    perfSinceIntro: 0.095, perf100d: 0.128, logoUrl: "https://logo.clearbit.com/skhynix.com",
    ROE: 15.3, PER: 22.1, PEG: 0.75, PBR: 2.3, PSR: 2.1,
    RevYoY: 28.7, EPS_Growth_3Y: 29.4, OpMarginTTM: 18.9, FCF_Yield: 3.8
  },
  {
    market: "KR", symbol: "068270.KS", name: "셀트리온", category: "헬스케어", industry: "바이오의약품",
    rank: 3, aiScore: 72, sentiment: "NEU" as const, introducedAt: "2025-08-30",
    perfSinceIntro: 0.031, perf100d: 0.064, logoUrl: "https://logo.clearbit.com/celltrion.com",
    ROE: 9.5, PER: 25.3, PEG: 1.35, PBR: 2.8, PSR: 3.5,
    RevYoY: 8.2, EPS_Growth_3Y: 18.7, OpMarginTTM: 21.3, FCF_Yield: 2.5
  },
];

// 종목 상세 정보 (포괄적인 재무/기술적 지표 포함) - 일부만 표시
const mockStockDetails: Record<string, any> = {
  "NVDA": {
    Ticker: "NVDA",
    Name: "NVIDIA",
    Sector: "정보기술",
    Industry: "반도체",
    Price: 487.20,
    MktCap: 1200.5,
    DollarVol: 3500.2,
    FairValue: 520.00,
    Discount: 6.3,
    PE: 45.2,
    PEG: 0.82,
    PB: 12.8,
    PS: 18.3,
    EV_EBITDA: 38.5,
    ROE: 28.5,
    ROA: 18.3,
    OpMarginTTM: 32.1,
    OperatingMargins: 31.8,
    RevYoY: 34.2,
    EPS_Growth_3Y: 55.3,
    Revenue_Growth_3Y: 42.1,
    EBITDA_Growth_3Y: 48.7,
    FCF_Yield: 2.8,
    DivYield: 0.04,
    PayoutRatio: 0.05,
    Beta: 1.85,
    ShortPercent: 1.2,
    InsiderOwnership: 4.3,
    InstitutionOwnership: 68.5,
    RVOL: 1.15,
    RSI_14: 67.3,
    ATR_PCT: 3.2,
    Volatility_21D: 2.8,
    RET5: 2.1,
    RET20: 8.5,
    RET63: 15.3,
    SMA20: 478.50,
    SMA50: 465.30,
    SMA200: 420.80,
    MACD: 5.2,
    MACD_Signal: 3.8,
    MACD_Histogram: 1.4,
    BB_Position: 0.75,
    High_52W_Ratio: 0.95,
    Low_52W_Ratio: 1.88,
    Momentum_12M: 124.5,
    GrowthScore: 95,
    QualityScore: 88,
    ValueScore: 65,
    MomentumScore: 82,
    TotalScore: 92
  },
  "005930.KS": {
    Ticker: "005930.KS",
    Name: "삼성전자",
    Sector: "정보기술",
    Industry: "전자기기",
    Price: 73500,
    MktCap: 450.2,
    DollarVol: 1200.5,
    FairValue: 85000,
    Discount: 13.5,
    PE: 18.5,
    PEG: 0.88,
    PB: 1.8,
    PS: 1.2,
    EV_EBITDA: 12.3,
    ROE: 12.8,
    ROA: 8.5,
    OpMarginTTM: 14.5,
    OperatingMargins: 14.2,
    RevYoY: 12.3,
    EPS_Growth_3Y: 21.0,
    Revenue_Growth_3Y: 18.5,
    EBITDA_Growth_3Y: 20.2,
    FCF_Yield: 4.2,
    DivYield: 2.1,
    PayoutRatio: 0.35,
    Beta: 1.15,
    ShortPercent: 0.8,
    InsiderOwnership: 18.5,
    InstitutionOwnership: 45.2,
    RVOL: 0.95,
    RSI_14: 58.5,
    ATR_PCT: 2.1,
    Volatility_21D: 1.9,
    RET5: 1.2,
    RET20: 5.8,
    RET63: 11.2,
    SMA20: 72000,
    SMA50: 70500,
    SMA200: 68000,
    MACD: 2.1,
    MACD_Signal: 1.8,
    MACD_Histogram: 0.3,
    BB_Position: 0.65,
    High_52W_Ratio: 0.91,
    Low_52W_Ratio: 1.52,
    Momentum_12M: 89.2,
    GrowthScore: 82,
    QualityScore: 85,
    ValueScore: 88,
    MomentumScore: 75,
    TotalScore: 85
  }
};

// ----------------------------
// 뉴스 요약 (카테고리·정렬·날짜·모달 포함)
// ----------------------------
const NEWS_CATEGORIES = ["전체", "거시경제", "금융시장", "기업/산업", "부동산", "소비/고용", "정책/제도", "정치"];

const mockNews = [
  { id: "n1", date: "2025-10-14", category: "거시경제", title: "미 연준 의사록: 추가 인상 가능성 낮아", body: "...", summary: "금리 동결 기조 유지, 물가 둔화 확인.", link: "#", importance: 9, reason: "시장 변동성 직접 영향" },
  { id: "n2", date: "2025-10-15", category: "기업/산업", title: "삼성전자 HBM 생산 증설 발표", body: "...", summary: "AI 수요 대응 위해 생산능력 확대.", link: "#", importance: 8, reason: "AI 공급망 영향" },
  { id: "n3", date: "2025-10-13", category: "금융시장", title: "달러/원 1,330원대 재진입", body: "...", summary: "위험선호 회복으로 환율 하락.", link: "#", importance: 7, reason: "수출/수입주 실적 민감" },
  { id: "n4", date: "2025-10-12", category: "부동산", title: "수도권 전세가 상승세 둔화", body: "...", summary: "거래량 감소, 금리 부담 지속.", link: "#", importance: 5, reason: "가계 소비 여력 관련" },
  { id: "n5", date: "2025-10-15", category: "정책/제도", title: "정부, 데이터센터 전력 요금 인센티브 검토", body: "...", summary: "친AI 인프라 정책 일환.", link: "#", importance: 6, reason: "산업 전반 비용 구조" },
  { id: "n6", date: "2025-10-11", category: "정치", title: "미-중 정상 통화, 통상 이슈 완화 시사", body: "...", summary: "관세 이슈 일부 진전 가능성.", link: "#", importance: 7, reason: "대외 불확실성 완화" },
  { id: "n7", date: "2025-10-15", category: "소비/고용", title: "9월 고용, 예상치 하회", body: "...", summary: "임금 상승률도 둔화.", link: "#", importance: 8, reason: "소비 사이클 전환 신호" },
  { id: "n8", date: "2025-10-10", category: "기업/산업", title: "테슬라, FSD 구독가 인하", body: "...", summary: "시장 점유율 확대 전략 분석.", link: "#", importance: 6, reason: "경쟁 구도 변화" },
  { id: "n9", date: "2025-10-16 12:00:45", category: "거시경제", title: '트럼프, 다음달 관세 재판에 "현장 방청할 생각"…美 대통령 최초 사례 되나', summary: "트럼프 美 대통령, 관세 부과 적법성 심리하는 연방대법원 재판(다음달 5일) 현장 방청 의사 밝힘. 하급심은 IEEPA 근거 관세 부과 위법 판결. 대법원서 하급심 유지 시 美 유효 관세율 16.3%의 절반 이하로 하락 및 수백억 달러 환급 가능성.", link: "https://www.hankyung.com/article/2025101626227", importance: 8, reason: "IEEPA 근거 관세 부과 적법성 여부가 결정됨. 관세는 무역·물가 등 거시경제에 직접적이고 광범위한 영향을 미치는 중대 사안이며, 수백억 달러 환급 가능성도 있음." },
  { id: "n10", date: "2025-10-16 07:23:33", category: "거시경제", title: "'10일 내' 무역협상 타결 기대감…'3500억달러 패키지' 운명은", summary: "한미 무역협상이 최종 타결 단계에 근접, 미국 베선트 재무부 장관이 10일 내 협상 결과 예상. 주요 쟁점은 3500억 달러 대미 투자 패키지 구성 및 한미 통화스와프 등 외환시장 안정장치. 양측이 세부 사항 조율 중이며, 한국 외환시장 안전장치 마련에 긍정적 언급 나옴.", link: "https://www.hankyung.com/article/2025101615667", importance: 8, reason: "무역 협상 타결 임박 소식은 관세 및 대규모 대미 투자의 확정으로 이어져 거시경제 및 무역에 직접적 영향. 외환시장 안전장치는 금융시장 변동성 완화에 중요." },
  { id: "n11", date: "2025-10-16 05:26:38", category: "거시경제", title: '베선트 "한미 관세협상, 열흘 내 어떤 결과 나올 것" [이상은의 워싱턴나우]', summary: '베선트 美 재무장관 "한미 관세협상, APEC 정상회담 전 열흘 내 결과 나올 것" 언급. 한국 측 3500억 달러 일시 투자 및 외환시장 영향 우려 관련 양측 의견 좁혀. 협상 마무리 단계, 구체적 투자 방식(펀드 등) 및 최종 타결의 관건 예상.', link: "https://www.hankyung.com/article/202510161460i", importance: 8, reason: "한미 간 대규모 관세협상 및 투자 관련 논의가 마무리 단계에 진입, 외환시장 및 무역 환경 등 거시경제 지표에 즉각적이고 중요한 영향을 미칠 가능성 높음." },
  { id: "n12", date: "2025-10-16 11:30:06", category: "거시경제", title: "韓협상단, 내일 美백악관 예산국 방문…관세 협상 막바지", summary: "한미 관세 협상 막바지로, 韓 협상단 내일(17일 새벽) 美 백악관 관리예산국 방문 예정. 협상 최종 문구 조율 관측 속, 美 요구 투자액($3500억) 조달 방식(통화스와프, 외평채 등)이 외환보유액 및 국가부채에 미칠 영향이 핵심 쟁점.", link: "https://www.hankyung.com/article/2025101625437", importance: 7, reason: "한미 관세 협상의 최종 단계, $3500억 대미 투자금 조달 방식은 외환보유액, 통화스와프 등 거시경제 핵심 변수에 직접적 영향 예상." },
  { id: "n13", date: "2025-10-16 11:19:29", category: "거시경제", title: `트럼프 "한국 '3500억달러 선불' 합의" 또 다시 거론 [HK영상]`, summary: `트럼프 美 대통령, 백악관 기자회견서 한국이 무역 합의 일환으로 대미 투자금 3500억 달러(약 500조 원)를 '선불(up front)' 지급하기로 했다고 재차 주장.`, link: "https://www.hankyung.com/article/202510162536i", importance: 7, reason: "한국의 3500억 달러 대미 투자금 관련, 지급 방식(선불 여부)에 대한 미국 대통령의 직접적 압박 발언으로 거시경제 변수(무역/환율)에 잠재적 불확실성 증폭." },
];

function inDateRange(iso: string, startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return true;
  const datePart = (iso || "").split(" ")[0];
  const d = new Date(`${datePart}T00:00:00`);
  if (startDate) {
    const s = new Date(`${startDate}T00:00:00`);
    if (d < s) return false;
  }
  if (endDate) {
    const e = new Date(`${endDate}T23:59:59`);
    if (d > e) return false;
  }
  return true;
}

function NewsSummaryTab() {
  const [cat, setCat] = useState("전체");
  const [minImp, setMinImp] = useState(6);
  const [query, setQuery] = useState("");
  const [modalItem, setModalItem] = useState<any | null>(null);
  const [topOpen, setTopOpen] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "importance">("date");

  // 날짜 기본값: 어제 ~ 오늘
  const fmt = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
  const _today = new Date();
  const _yesterday = new Date(_today);
  _yesterday.setDate(_today.getDate() - 1);
  const [startDate, setStartDate] = useState(fmt(_yesterday));
  const [endDate, setEndDate] = useState(fmt(_today));

  const data = useMemo(() => {
    return mockNews
      .filter((n) => (cat === "전체" ? true : n.category === cat))
      .filter((n) => n.importance >= minImp)
      .filter((n) => inDateRange(n.date, startDate, endDate))
      .filter((n) => !query || (n.title + " " + (n.summary || "") + " " + (n.body || "")).toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => (sortBy === "date" ? b.date.localeCompare(a.date) || b.importance - a.importance : b.importance - a.importance || b.date.localeCompare(a.date)));
  }, [cat, minImp, query, startDate, endDate, sortBy]);

  const grouped = useMemo(() => {
    if (cat !== "전체") return { [cat]: data } as Record<string, typeof data>;
    return data.reduce((acc: Record<string, typeof data>, it) => {
      if (!acc[it.category]) acc[it.category] = [];
      acc[it.category].push(it);
      return acc;
    }, {});
  }, [data, cat]);

  const top5 = useMemo(() => [...mockNews].sort((a, b) => b.importance - a.importance || b.date.localeCompare(a.date)).slice(0, 5), []);

  useEffect(() => {
    try {
      const byDate = [...mockNews].sort((a, b) => b.date.localeCompare(a.date) || b.importance - a.importance);
      console.assert(byDate[0]?.id === "n9", "[TEST] 날짜 정렬 최상단은 n9");
      const byImp = [...mockNews].sort((a, b) => b.importance - a.importance || b.date.localeCompare(a.date));
      console.assert(byImp[0]?.id === "n1", "[TEST] 중요도 정렬 최상단은 n1");
      const f = (iso: string, s?: string, e?: string) => inDateRange(iso, s, e);
      console.assert(f("2025-10-16 12:00:45", "2025-10-16", "2025-10-16") === true, "[TEST] 날짜 경계 포함(같은날)");
      console.assert(f("2025-10-15", "2025-10-16", "2025-10-16") === false, "[TEST] 범위 밖 제외");
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 pb-24">
      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900 md:text-xl">뉴스 요약</h1>
            <p className="mt-1 text-xs text-gray-500">카테고리별 · 중요도/날짜 정렬 · 키워드/날짜 필터</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {/* 카테고리 칩 */}
          <CategoryChips value={cat} onChange={setCat} categories={[...NEWS_CATEGORIES]} />

          {/* 날짜 범위 */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>기간</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-1" />
            <span>~</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-1" />
            {(startDate || endDate) && (
              <button type="button" onClick={() => { setStartDate(""); setEndDate(""); }} className="rounded-lg border border-gray-200 bg-white px-2 py-1">
                초기화
              </button>
            )}
          </div>

          {/* 최소 중요도 */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>최소 중요도</span>
            <input type="range" min="1" max="10" value={minImp} onChange={(e) => setMinImp(Number(e.target.value))} />
            <span className="font-semibold">{minImp}+</span>
          </div>

          {/* 정렬 */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>정렬</span>
            <div className="rounded-full border border-gray-200 bg-gray-50 p-1">
              <button type="button" onClick={() => setSortBy("date")} className={classNames("rounded-full px-3 py-1 text-xs font-semibold", sortBy === "date" ? "bg-white shadow" : "text-gray-700")}>
                날짜
              </button>
              <button type="button" onClick={() => setSortBy("importance")} className={classNames("rounded-full px-3 py-1 text-xs font-semibold", sortBy === "importance" ? "bg-white shadow" : "text-gray-700")}>
                중요도
              </button>
            </div>
          </div>

          {/* 키워드 검색(좌측 정렬) */}
          <div className="flex items-center gap-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="검색: 제목/요약" className="w-56 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
        </div>
      </div>

      {/* TOP 5: 접기/펼치기, 중요도 이유 표시 */}
      <section className="mt-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">오늘의 TOP 5</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setTopOpen((v) => !v)} className="rounded-full border border-gray-200 bg-white px-2 py-1 text-xs font-semibold hover:bg-gray-50" aria-expanded={topOpen}>
                {topOpen ? "접기" : "펼치기"}
              </button>
            </div>
          </div>
          {topOpen && (
            <ul className="grid gap-2 md:grid-cols-2">
              {top5.map((n) => (
                <li key={n.id} onClick={() => setModalItem(n)} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3 hover:bg-gray-50 cursor-pointer" role="button">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 ring-1 ring-gray-200">{n.category}</span>
                      <span>{n.date}</span>
                      <NewsImportanceBadge score={n.importance} />
                    </div>
                    <span className="block truncate text-sm font-semibold text-gray-900 hover:underline">{n.title}</span>
                    <p className="mt-1 text-[11px] text-gray-500">{n.reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 본문 리스트: 카테고리별 섹션, 4개/페이지 페이징 */}
      <section className="mt-4 space-y-4">
        {Object.entries(grouped).map(([gcat, arr]) => (
          <div key={gcat} className="space-y-3">
            {cat === "전체" && (
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">
                  {gcat} <span className="text-xs font-normal text-gray-500">· {arr.length}건</span>
                </h3>
              </div>
            )}
            <CategoryPager items={arr} onOpen={setModalItem} />
          </div>
        ))}
      </section>

      {/* 공통 모달 */}
      <NewsModal open={!!modalItem} onClose={() => setModalItem(null)} item={modalItem} />
    </main>
  );
}

// ======================= DemoHome (메인) =======================
const TAB_KEYS = ["home", "undervalued", "filings", "watchlist", "detail"] as const;
type TabKey = (typeof TAB_KEYS)[number];

// 재무 지표 평가 함수 (좋음: 초록색, 보통: 검정색, 나쁨: 빨간색)
function getMetricColor(key: string, value: number): string {
  // 높을수록 좋은 지표들
  if (key === "ROE" || key === "ROA") {
    if (value >= 15) return "text-emerald-600";
    if (value >= 10) return "text-gray-900";
    return "text-red-600";
  }

  if (key === "OpMarginTTM" || key === "OperatingMargins") {
    if (value >= 20) return "text-emerald-600";
    if (value >= 10) return "text-gray-900";
    return "text-red-600";
  }

  if (key === "RevYoY" || key === "Revenue_Growth_3Y" || key === "EPS_Growth_3Y" || key === "EBITDA_Growth_3Y") {
    if (value >= 20) return "text-emerald-600";
    if (value >= 10) return "text-gray-900";
    if (value >= 0) return "text-gray-900";
    return "text-red-600";
  }

  if (key === "FCF_Yield") {
    if (value >= 5) return "text-emerald-600";
    if (value >= 2) return "text-gray-900";
    return "text-red-600";
  }

  if (key === "DivYield") {
    if (value === 0) return "text-gray-900";
    if (value >= 4) return "text-emerald-600";
    if (value >= 2) return "text-gray-900";
    return "text-gray-900";
  }

  if (key === "Discount") {
    if (value >= 20) return "text-emerald-600"; // 저평가
    if (value >= 0) return "text-gray-900";
    return "text-red-600"; // 고평가
  }

  if (key.includes("Score")) {
    if (value >= 80) return "text-emerald-600";
    if (value >= 60) return "text-gray-900";
    return "text-red-600";
  }

  // 낮을수록 좋은 지표들
  if (key === "PE" || key === "PER") {
    if (value <= 15) return "text-emerald-600";
    if (value <= 25) return "text-gray-900";
    return "text-red-600";
  }

  if (key === "PEG") {
    if (value <= 1) return "text-emerald-600";
    if (value <= 2) return "text-gray-900";
    return "text-red-600";
  }

  if (key === "PB" || key === "PBR") {
    if (value <= 2) return "text-emerald-600";
    if (value <= 4) return "text-gray-900";
    return "text-red-600";
  }

  if (key === "PS" || key === "PSR") {
    if (value <= 2) return "text-emerald-600";
    if (value <= 5) return "text-gray-900";
    return "text-red-600";
  }

  if (key === "EV_EBITDA") {
    if (value <= 10) return "text-emerald-600";
    if (value <= 15) return "text-gray-900";
    return "text-red-600";
  }

  if (key === "Beta") {
    if (value <= 1) return "text-emerald-600";
    if (value <= 1.5) return "text-gray-900";
    return "text-red-600";
  }

  if (key === "ShortPercent") {
    if (value <= 5) return "text-emerald-600";
    if (value <= 10) return "text-gray-900";
    return "text-red-600";
  }

  // 적절한 범위가 있는 지표들
  if (key === "InsiderOwnership" || key === "InstitutionOwnership") {
    if (value >= 10 && value <= 50) return "text-emerald-600";
    if ((value >= 5 && value < 10) || (value > 50 && value <= 70)) return "text-gray-900";
    return "text-red-600";
  }

  if (key === "PayoutRatio") {
    if (value >= 30 && value <= 60) return "text-emerald-600";
    if ((value >= 20 && value < 30) || (value > 60 && value <= 80)) return "text-gray-900";
    return "text-red-600";
  }

  // RSI (과매수/과매도 지표)
  if (key === "RSI_14") {
    if (value >= 40 && value <= 60) return "text-emerald-600"; // 중립
    if ((value >= 30 && value < 40) || (value > 60 && value <= 70)) return "text-gray-900";
    return "text-red-600"; // 과매도(<30) 또는 과매수(>70)
  }

  // 기본값: 중립 (가격, 시가총액, 거래량 등)
  return "text-gray-900";
}

// 메트릭 설명 매핑
const METRIC_DESCRIPTIONS: Record<string, string> = {
  "Ticker": "티커 심볼",
  "Name": "회사명",
  "Sector": "섹터",
  "Industry": "산업군",
  "Price": "현재 주가",
  "MktCap": "시가총액 (10억 달러)",
  "DollarVol": "일평균 거래대금 (백만 달러)",
  "FairValue": "적정가치 (PE, PB, PEG, FCF 기반 계산)",
  "Discount": "할인율 (적정가치 대비 현재가 할인 정도)",
  "PE": "PER (주가수익비율) - 낮을수록 저평가",
  "PEG": "PEG 비율 (PER/성장률) - 1 이하 매력적",
  "PB": "PBR (주가순자산비율) - 낮을수록 저평가",
  "PS": "PSR (주가매출비율) - 낮을수록 저평가",
  "EV_EBITDA": "EV/EBITDA 배수",
  "ROE": "자기자본이익률 - 높을수록 우수",
  "ROA": "총자산이익률 - 높을수록 우수",
  "OpMarginTTM": "영업이익률 (TTM) - 높을수록 우수",
  "OperatingMargins": "영업이익률 (info)",
  "RevYoY": "매출 YoY 성장률",
  "EPS_Growth_3Y": "3년 EPS 성장률 (CAGR)",
  "Revenue_Growth_3Y": "3년 매출 성장률 (CAGR)",
  "EBITDA_Growth_3Y": "3년 EBITDA 성장률",
  "FCF_Yield": "FCF 수익률 (현금 창출 능력)",
  "DivYield": "배당수익률",
  "PayoutRatio": "배당성향",
  "Beta": "베타 (시장 대비 변동성)",
  "ShortPercent": "공매도 비율",
  "InsiderOwnership": "내부자 지분율",
  "InstitutionOwnership": "기관 투자자 지분율",
  "RVOL": "상대 거래량 (평균 대비)",
  "RSI_14": "RSI 14일 (30 이하 과매도, 70 이상 과매수)",
  "ATR_PCT": "ATR 퍼센트 (변동성)",
  "Volatility_21D": "21일 변동성",
  "RET5": "5일 수익률",
  "RET20": "20일 수익률",
  "RET63": "3개월 수익률",
  "SMA20": "20일 이동평균",
  "SMA50": "50일 이동평균",
  "SMA200": "200일 이동평균",
  "MACD": "MACD 선",
  "MACD_Signal": "MACD 시그널 선",
  "MACD_Histogram": "MACD 히스토그램 (양수 = 상승 추세)",
  "BB_Position": "볼린저밴드 위치 (0-1, 0.5 중앙)",
  "High_52W_Ratio": "52주 고가 대비 비율",
  "Low_52W_Ratio": "52주 저가 대비 비율",
  "Momentum_12M": "12개월 모멘텀",
  "GrowthScore": "성장 점수 (0-100%)",
  "QualityScore": "품질 점수 (0-100%)",
  "ValueScore": "가치 점수 (0-100%)",
  "MomentumScore": "모멘텀 점수 (0-100%)",
  "TotalScore": "종합 점수 (0-100점)"
};

export default function DemoHome() {
  const fearGreedUS = usFearGreedSeries[usFearGreedSeries.length - 1];
  const fearGreedKR = krFearGreedSeries[krFearGreedSeries.length - 1];
  const asOfUS = formatAsOf(new Date());
  const asOfKR = asOfUS;
  const asOf = asOfUS;

  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabKey>("home");

  // 홈 화면 필터
  const [featuredMarket, setFeaturedMarket] = useState<"US" | "KR">("US");
  const [filingsMarket, setFilingsMarket] = useState<"US" | "KR">("US");

  // 종목추천 페이지 필터
  const [undervaluedSearchQuery, setUndervaluedSearchQuery] = useState("");
  const [undervaluedStrategy, setUndervaluedStrategy] = useState<"undervalued_quality" | "value_basic" | "value_strict" | "growth_quality" | "momentum" | "swing">("undervalued_quality");
  const [undervaluedMarket, setUndervaluedMarket] = useState<"전체" | "US" | "KR">("전체");
  const [undervaluedCategory, setUndervaluedCategory] = useState("전체");
  const [undervaluedIndustry, setUndervaluedIndustry] = useState("전체");
  const [undervaluedPage, setUndervaluedPage] = useState(1);
  const [undervaluedSortBy, setUndervaluedSortBy] = useState<string | null>(null);
  const [undervaluedSortDirection, setUndervaluedSortDirection] = useState<"asc" | "desc">("desc");

  // 공시 분석 페이지 필터
  const [filingsSearchQuery, setFilingsSearchQuery] = useState("");
  const [filingsPage, setFilingsPage] = useState(1);
  const [filingsSortBy, setFilingsSortBy] = useState<string | null>(null);
  const [filingsSortDirection, setFilingsSortDirection] = useState<"asc" | "desc">("desc");
  const [filingsSentimentFilter, setFilingsSentimentFilter] = useState<"ALL" | "POS" | "NEG" | "NEU">("ALL");
  const [filingsMarketFilter, setFilingsMarketFilter] = useState<"전체" | "US" | "KR">("전체");
  const [filingsCategory, setFilingsCategory] = useState("전체");
  const [filingsIndustry, setFilingsIndustry] = useState("전체");

  // 관심 종목 페이지 필터
  const [watchlistSearchQuery, setWatchlistSearchQuery] = useState("");
  const [watchlistMarket, setWatchlistMarket] = useState<"전체" | "US" | "KR">("전체");
  const [watchlistCategory, setWatchlistCategory] = useState("전체");
  const [watchlistIndustry, setWatchlistIndustry] = useState("전체");

  // 종목 상세 페이지 상태
  const [detailSymbol, setDetailSymbol] = useState<string>("");
  const [detailTab, setDetailTab] = useState<"info" | "filings">("info");
  const [detailLogoError, setDetailLogoError] = useState(false);

  // 저평가/관심 탭 로고 에러 상태
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});

  // ✅ 최근 본 종목 (최대 5개, localStorage 활용)
  const [recentStocks, setRecentStocks] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("ddal-kkak-recent-stocks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // detailSymbol이 변경될 때마다 최근 본 종목에 추가
  useEffect(() => {
    if (!detailSymbol) return;

    // 로고 에러 상태 초기화
    setDetailLogoError(false);

    setRecentStocks(prev => {
      // 중복 제거하고 최신 항목을 맨 앞에 추가
      const filtered = prev.filter(s => s !== detailSymbol);
      const updated = [detailSymbol, ...filtered].slice(0, 5);

      // localStorage에 저장
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("ddal-kkak-recent-stocks", JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to save recent stocks:", e);
        }
      }

      return updated;
    });
  }, [detailSymbol]);

  // ✅ 탭별 스크롤 위치 저장용
  const scrollPositions = useRef<Record<TabKey, number>>({
    home: 0,
    undervalued: 0,
    filings: 0,
    watchlist: 0,
    detail: 0,
  });

  // ✅ 탭별 개별 스크롤 컨테이너 ref
  const homeRef = useRef<HTMLDivElement>(null);
  const undervaluedRef = useRef<HTMLDivElement>(null);
  const filingsRef = useRef<HTMLDivElement>(null);
  const watchlistRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // ✅ 홈 페이지 내 섹션 ref
  const featuredSectionRef = useRef<HTMLDivElement>(null);

  // 2) ⬇️ 여기 타입을 RefObject<HTMLDivElement> → MutableRefObject<HTMLDivElement | null> 로 수정
  const refMap: Record<TabKey, React.MutableRefObject<HTMLDivElement | null>> = {
    home: homeRef,
    undervalued: undervaluedRef,
    filings: filingsRef,
    watchlist: watchlistRef,
    detail: detailRef,
  };

  // ✅ 탭 전환 시: 현재 탭 스크롤 저장 → 다음 탭 스크롤 복원
  const switchTab = (next: TabKey) => {
    const currEl = refMap[activeTab].current;
    if (currEl) scrollPositions.current[activeTab] = currEl.scrollTop;

    setActiveTab(next);

    // 다음 프레임에서 복원 (DOM 업데이트 후)
    requestAnimationFrame(() => {
      const nextEl = refMap[next].current;
      if (nextEl) nextEl.scrollTo({ top: scrollPositions.current[next] || 0 });
    });
  };

  // ✅ 홈 페이지 내 섹션으로 스크롤 이동
  const scrollToFeaturedSection = () => {
    if (featuredSectionRef.current && homeRef.current) {
      const sectionTop = featuredSectionRef.current.offsetTop;
      homeRef.current.scrollTo({ top: sectionTop - 20, behavior: 'smooth' });
    }
  };

  // 시그널 섹션 카테고리(미국/한국) + 감성
  const [filingCatUS, setFilingCatUS] = useState("전체");
  const [filingCatKR, setFilingCatKR] = useState("전체");
  const [filingSentUS, setFilingSentUS] = useState<"ALL" | "POS" | "NEG" | "NEU">("ALL");
  const [filingSentKR, setFilingSentKR] = useState<"ALL" | "POS" | "NEG" | "NEU">("ALL");

  // 랭킹 섹션 카테고리(미국/한국)
  const [rankCatUS, setRankCatUS] = useState("전체");
  const [rankCatKR, setRankCatKR] = useState("전체");

  // 즐겨찾기
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    // Load favorites from cookie on mount
    const cookieValue = getCookie('ddal-kkak-favorites');
    if (cookieValue) {
      try {
        return JSON.parse(decodeURIComponent(cookieValue));
      } catch (e) {
        return {};
      }
    }
    return {};
  });
  const favoriteDebounceRef = useRef<Record<string, boolean>>({});

  const toggleFavorite = (symbol: string) => {
    // Prevent rapid clicks (1 second debounce)
    if (favoriteDebounceRef.current[symbol]) return;

    favoriteDebounceRef.current[symbol] = true;
    const newFavorites = { ...favorites, [symbol]: !favorites[symbol] };
    setFavorites(newFavorites);

    // Save to cookie
    setCookie('ddal-kkak-favorites', encodeURIComponent(JSON.stringify(newFavorites)));

    setTimeout(() => {
      favoriteDebounceRef.current[symbol] = false;
    }, 1000);
  };

  // 정렬 핸들러
  const handleUndervaluedSort = (key: string) => {
    if (undervaluedSortBy === key) {
      setUndervaluedSortDirection(undervaluedSortDirection === "asc" ? "desc" : "asc");
    } else {
      setUndervaluedSortBy(key);
      setUndervaluedSortDirection("desc");
    }
    setUndervaluedPage(1); // Reset to first page on sort
  };

  const handleFilingsSort = (key: string) => {
    if (filingsSortBy === key) {
      setFilingsSortDirection(filingsSortDirection === "asc" ? "desc" : "asc");
    } else {
      setFilingsSortBy(key);
      setFilingsSortDirection("desc");
    }
    setFilingsPage(1); // Reset to first page on sort
  };

  // 종목 상세 페이지 열기
  const openStockDetail = (symbol: string, tab: "info" | "filings" = "info") => {
    setDetailSymbol(symbol);
    setDetailTab(tab);
    switchTab("detail");
  };

  // 공시 목록을 엑셀로 다운로드
  const exportFilingsToExcel = (filings: any[]) => {
    if (filings.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    // 엑셀에 표시할 데이터 가공
    const excelData = filings.map(filing => ({
      "시장": filing.market,
      "티커": filing.symbol,
      "회사명": filing.company,
      "공시 유형": filing.formType,
      "공시일": filing.date,
      "요약": filing.summary,
      "감정 분석": filing.sentiment === "POS" ? "긍정" : filing.sentiment === "NEG" ? "부정" : "중립",
      "AI 점수": filing.aiScore,
      "신뢰도": `${(filing.confidence * 100).toFixed(1)}%`,
      "섹터": filing.category,
      "산업군": filing.industry || "-"
    }));

    // 워크시트 생성
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "공시분석");

    // 파일 다운로드
    const fileName = `공시분석_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // 상세 페이지 데이터를 엑셀로 다운로드
  const exportStockDetailToExcel = (stockDetail: any, stockInfo: any) => {
    if (!stockDetail) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    // 기본 정보
    const basicInfo = [
      { "항목": "티커", "값": stockDetail.Ticker },
      { "항목": "회사명", "값": stockDetail.Name },
      { "항목": "섹터", "값": stockDetail.Sector },
      { "항목": "산업군", "값": stockDetail.Industry },
      { "항목": "현재가", "값": `$${stockDetail.Price?.toLocaleString()}` },
      { "항목": "시가총액", "값": `$${stockDetail.MktCap?.toLocaleString()}B` }
    ];

    // 종합 평가
    const scores = [
      { "항목": "Growth Score", "값": stockDetail.GrowthScore },
      { "항목": "Quality Score", "값": stockDetail.QualityScore },
      { "항목": "Value Score", "값": stockDetail.ValueScore },
      { "항목": "Momentum Score", "값": stockDetail.MomentumScore },
      { "항목": "Total Score", "값": stockDetail.TotalScore }
    ];

    // 밸류에이션
    const valuation = [
      { "항목": "Fair Value", "값": stockDetail.FairValue },
      { "항목": "Discount", "값": `${stockDetail.Discount?.toFixed(1)}%` },
      { "항목": "PE", "값": stockDetail.PE?.toFixed(2) },
      { "항목": "PEG", "값": stockDetail.PEG?.toFixed(2) },
      { "항목": "PB", "값": stockDetail.PB?.toFixed(2) },
      { "항목": "PS", "값": stockDetail.PS?.toFixed(2) },
      { "항목": "EV/EBITDA", "값": stockDetail.EV_EBITDA?.toFixed(2) }
    ];

    // 수익성
    const profitability = [
      { "항목": "ROE", "값": `${stockDetail.ROE?.toFixed(1)}%` },
      { "항목": "ROA", "값": `${stockDetail.ROA?.toFixed(1)}%` },
      { "항목": "Op Margin TTM", "값": `${stockDetail.OpMarginTTM?.toFixed(1)}%` },
      { "항목": "Operating Margins", "값": `${stockDetail.OperatingMargins?.toFixed(1)}%` }
    ];

    // 성장성
    const growth = [
      { "항목": "Rev YoY", "값": `${stockDetail.RevYoY?.toFixed(1)}%` },
      { "항목": "Revenue Growth 3Y", "값": `${stockDetail.Revenue_Growth_3Y?.toFixed(1)}%` },
      { "항목": "EPS Growth 3Y", "값": `${stockDetail.EPS_Growth_3Y?.toFixed(1)}%` },
      { "항목": "EBITDA Growth 3Y", "값": `${stockDetail.EBITDA_Growth_3Y?.toFixed(1)}%` }
    ];

    // 워크북 생성
    const wb = XLSX.utils.book_new();

    // 각 시트 추가
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(basicInfo), "기본정보");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(scores), "종합평가");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(valuation), "밸류에이션");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(profitability), "수익성");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(growth), "성장성");

    // 파일 다운로드
    const fileName = `${stockDetail.Ticker}_상세정보_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // 종목추천 목록을 엑셀로 다운로드 (파이썬 소스와 동일한 형식)
  const exportUndervaluedToExcel = (stocks: any[], strategy: string) => {
    if (stocks.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    const wb = XLSX.utils.book_new();
    const strategyInfo = INVESTMENT_STRATEGIES[strategy as keyof typeof INVESTMENT_STRATEGIES];

    // 전략 정보 시트 생성
    const headerData: any[] = [];

    // 1행: 전략 이름
    headerData.push({ A: `📊 ${strategyInfo.name}` });

    // 2행: 빈 행
    headerData.push({});

    // 3행: 필터 기준 헤더
    headerData.push({ A: '📋 필터 기준:' });

    // 4행 이후: 각 필터 기준
    strategyInfo.criteria.forEach(criterion => {
      headerData.push({ A: `• ${criterion}` });
    });

    // 빈 행 추가
    headerData.push({});
    headerData.push({});

    // 데이터 가공
    const excelData = stocks.map(stock => ({
      "시장": stock.market,
      "티커": stock.symbol,
      "회사명": stock.name,
      "섹터": stock.category,
      "산업군": stock.industry,
      "AI 점수": stock.aiScore,
      "감정 분석": stock.sentiment === "POS" ? "긍정" : stock.sentiment === "NEG" ? "부정" : "중립",
      "소개일": stock.introducedAt,
      "소개 후 수익률": `${stock.perfSinceIntro?.toFixed(1)}%`,
      "100일 수익률": `${stock.perf100d?.toFixed(1)}%`,
      "ROE": `${stock.ROE?.toFixed(1)}%`,
      "PER": stock.PER?.toFixed(2),
      "PEG": stock.PEG?.toFixed(2),
      "PBR": stock.PBR?.toFixed(2),
      "PSR": stock.PSR?.toFixed(2),
      "매출 YoY": `${stock.RevYoY?.toFixed(1)}%`,
      "EPS 성장률 3Y": `${stock.EPS_Growth_3Y?.toFixed(1)}%`,
      "영업이익률 TTM": `${stock.OpMarginTTM?.toFixed(1)}%`,
      "FCF Yield": `${stock.FCF_Yield?.toFixed(1)}%`
    }));

    // 헤더와 데이터 합치기
    const sheetData = [...headerData, ...excelData];

    // 워크시트 생성
    const ws = XLSX.utils.json_to_sheet(sheetData, { skipHeader: true });

    // 컬럼 너비 설정
    ws['!cols'] = [
      { wch: 35 }, // A: 전략명/필터기준/시장
      { wch: 12 }, // B: 티커
      { wch: 25 }, // C: 회사명
      { wch: 15 }, // D: 섹터
      { wch: 20 }, // E: 산업군
      { wch: 10 }, // F: AI 점수
      { wch: 12 }, // G: 감정 분석
      { wch: 12 }, // H: 소개일
      { wch: 15 }, // I: 소개 후 수익률
      { wch: 15 }, // J: 100일 수익률
      { wch: 10 }, // K: ROE
      { wch: 10 }, // L: PER
      { wch: 10 }, // M: PEG
      { wch: 10 }, // N: PBR
      { wch: 10 }, // O: PSR
      { wch: 12 }, // P: 매출 YoY
      { wch: 15 }, // Q: EPS 성장률 3Y
      { wch: 15 }, // R: 영업이익률 TTM
      { wch: 12 }  // S: FCF Yield
    ];

    XLSX.utils.book_append_sheet(wb, ws, strategyInfo.name.substring(0, 30));

    // 파일 다운로드
    const fileName = `종목추천_${strategyInfo.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

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

  // 카테고리 변경 시 산업군 리셋
  useEffect(() => {
    setUndervaluedIndustry("전체");
  }, [undervaluedCategory]);

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
      <Header onLogoClick={() => switchTab("home")} />

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
            {/* Hero Section - AI 분석 플랫폼 소개 */}
            <div className="rounded-2xl sm:rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4 sm:p-8 text-white shadow-xl">
              <div className="mb-2 sm:mb-3">
                <h1 className="text-lg sm:text-2xl font-extrabold">AI 기업 분석 플랫폼</h1>
                <p className="text-xs sm:text-sm text-indigo-100 mt-1">종목추천 · 공시 분석 · 투자 기회 탐색</p>
              </div>
              <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <button
                  onClick={scrollToFeaturedSection}
                  className="rounded-lg sm:rounded-xl bg-white/20 backdrop-blur p-2 sm:p-3 hover:bg-white/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <span className="text-lg sm:text-2xl font-bold">{mockFeaturedStocks.length}</span>
                    <div className="hidden sm:flex items-center gap-1">
                      <span className="text-red-400 text-lg">↑</span>
                      <span className="text-sm font-bold text-red-300">+5</span>
                    </div>
                  </div>
                  <div className="text-[10px] sm:text-xs text-indigo-100 mt-1">주목 종목</div>
                </button>
                <button
                  onClick={() => switchTab("filings")}
                  className="rounded-lg sm:rounded-xl bg-white/20 backdrop-blur p-2 sm:p-3 hover:bg-white/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <span className="text-lg sm:text-2xl font-bold">{mockFilings.length}</span>
                    <div className="hidden sm:flex items-center gap-1">
                      <span className="text-red-400 text-lg">↑</span>
                      <span className="text-sm font-bold text-red-300">+12</span>
                    </div>
                  </div>
                  <div className="text-[10px] sm:text-xs text-indigo-100 mt-1">공시 분석</div>
                </button>
                <button
                  onClick={() => switchTab("undervalued")}
                  className="rounded-lg sm:rounded-xl bg-white/20 backdrop-blur p-2 sm:p-3 hover:bg-white/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <span className="text-lg sm:text-2xl font-bold">{mockUndervalued.length}</span>
                    <div className="hidden sm:flex items-center gap-1">
                      <span className="text-red-400 text-lg">↑</span>
                      <span className="text-sm font-bold text-red-300">+8</span>
                    </div>
                  </div>
                  <div className="text-[10px] sm:text-xs text-indigo-100 mt-1">종목추천</div>
                </button>
              </div>
            </div>

            {/* 오늘의 주목 종목 */}
            <section ref={featuredSectionRef}>
              <div className="mb-3 sm:mb-4">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <h2 className="text-base sm:text-xl font-extrabold text-gray-900 flex items-center gap-1 sm:gap-2">
                    <span className="text-lg sm:text-2xl">💎</span>
                    <span className="hidden sm:inline">오늘의 주목 종목</span>
                    <span className="sm:hidden">주목 종목</span>
                  </h2>
                  <button
                    onClick={() => {
                      setUndervaluedMarket(featuredMarket === "US" ? "US" : "KR");
                      switchTab("undervalued");
                    }}
                    className="rounded-lg bg-indigo-600 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">전체 보기 →</span>
                    <span className="sm:hidden">전체</span>
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm text-gray-600">AI가 선정한 투자 가치가 높은 종목</p>
                  <div className="rounded-full border border-gray-200 bg-gray-50 p-0.5 sm:p-1 flex gap-0.5 sm:gap-1">
                    <button
                      onClick={() => setFeaturedMarket("US")}
                      className={classNames("rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold transition-all whitespace-nowrap", featuredMarket === "US" ? "bg-indigo-600 text-white shadow" : "text-gray-700 hover:bg-gray-100")}
                    >
                      🇺🇸 미국
                    </button>
                    <button
                      onClick={() => setFeaturedMarket("KR")}
                      className={classNames("rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold transition-all whitespace-nowrap", featuredMarket === "KR" ? "bg-indigo-600 text-white shadow" : "text-gray-700 hover:bg-gray-100")}
                    >
                      🇰🇷 한국
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {mockFeaturedStocks.filter(s => s.market === featuredMarket).map((stock) => (
                  <FeaturedStockCard key={stock.id} stock={stock} onClick={() => openStockDetail(stock.symbol, "info")} />
                ))}
              </div>
            </section>

            {/* 최근 공시 분석 */}
            <section>
              <div className="mb-3 sm:mb-4">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <h2 className="text-base sm:text-xl font-extrabold text-gray-900 flex items-center gap-1 sm:gap-2">
                    <span className="text-lg sm:text-2xl">📊</span>
                    <span className="hidden sm:inline">최근 공시 분석</span>
                    <span className="sm:hidden">공시 분석</span>
                  </h2>
                  <button
                    onClick={() => {
                      setFilingsMarketFilter(filingsMarket === "US" ? "US" : "KR");
                      switchTab("filings");
                    }}
                    className="rounded-lg bg-indigo-600 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">전체 보기 →</span>
                    <span className="sm:hidden">전체</span>
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm text-gray-600">AI가 분석한 최신 기업 공시 및 보고서</p>
                  <div className="rounded-full border border-gray-200 bg-gray-50 p-0.5 sm:p-1 flex gap-0.5 sm:gap-1">
                    <button
                      onClick={() => setFilingsMarket("US")}
                      className={classNames("rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold transition-all whitespace-nowrap", filingsMarket === "US" ? "bg-indigo-600 text-white shadow" : "text-gray-700 hover:bg-gray-100")}
                    >
                      🇺🇸 미국
                    </button>
                    <button
                      onClick={() => setFilingsMarket("KR")}
                      className={classNames("rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold transition-all whitespace-nowrap", filingsMarket === "KR" ? "bg-indigo-600 text-white shadow" : "text-gray-700 hover:bg-gray-100")}
                    >
                      🇰🇷 한국
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid gap-2 sm:gap-3 md:grid-cols-2">
                {mockFilings.filter(f => f.market === filingsMarket).slice(0, 4).map((filing) => (
                  <FilingAnalysisCard
                    key={filing.id}
                    filing={filing}
                    onClick={() => openStockDetail(filing.symbol, "filings")}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </section>

            {/* 시장 현황 요약 */}
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

            {/* 면책 조항 */}
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-600">
                ⚠️ 본 서비스는 AI 기반 분석 정보를 제공하며, 투자 권유나 자문이 아닙니다.<br />
                모든 투자 결정은 투자자 본인의 판단과 책임 하에 이루어져야 합니다.
              </p>
            </div>
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
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                  💎 종목추천
                </h1>
                <button
                  onClick={() => {
                    let filteredStocks = mockUndervalued.filter((stock) => {
                      const matchMarket = undervaluedMarket === "전체" || stock.market === undervaluedMarket;
                      const matchCategory = undervaluedCategory === "전체" || stock.category === undervaluedCategory;
                      const matchQuery =
                        !undervaluedSearchQuery ||
                        stock.name.toLowerCase().includes(undervaluedSearchQuery.toLowerCase()) ||
                        stock.symbol.toLowerCase().includes(undervaluedSearchQuery.toLowerCase());
                      return matchMarket && matchCategory && matchQuery;
                    });

                    // Apply sorting
                    if (undervaluedSortBy) {
                      filteredStocks = [...filteredStocks].sort((a: any, b: any) => {
                        const aVal = a[undervaluedSortBy];
                        const bVal = b[undervaluedSortBy];
                        if (aVal === undefined || bVal === undefined) return 0;
                        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                        return undervaluedSortDirection === "asc" ? comparison : -comparison;
                      });
                    }

                    exportUndervaluedToExcel(filteredStocks, undervaluedStrategy);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                  <span>📥</span>
                  <span className="hidden sm:inline">엑셀 다운로드</span>
                  <span className="sm:hidden">다운로드</span>
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600">전략별 맞춤 종목을 확인하세요</p>
            </div>

            {/* 투자 전략 선택 */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 space-y-4">
              <div>
                <div className="text-xs sm:text-sm text-gray-600 mb-3 font-semibold">📋 투자 전략 선택</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(INVESTMENT_STRATEGIES).map(([key, strategy]) => (
                    <button
                      key={key}
                      onClick={() => setUndervaluedStrategy(key as any)}
                      className={classNames(
                        "text-left p-4 rounded-lg border-2 transition-all",
                        undervaluedStrategy === key
                          ? "bg-indigo-50 border-indigo-600 shadow-md"
                          : "bg-white border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                      )}
                    >
                      <div className={classNames(
                        "text-sm font-bold mb-1",
                        undervaluedStrategy === key ? "text-indigo-700" : "text-gray-900"
                      )}>
                        {strategy.name}
                      </div>
                      <div className="text-xs text-gray-600">{strategy.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 선택된 전략의 필터 기준 표시 */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="text-xs font-bold text-blue-900 mb-2">📌 {INVESTMENT_STRATEGIES[undervaluedStrategy].name} 필터 기준</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INVESTMENT_STRATEGIES[undervaluedStrategy].criteria.map((criterion, idx) => (
                    <div key={idx} className="text-xs text-blue-800 flex items-start gap-1">
                      <span>•</span>
                      <span>{criterion}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 검색 및 필터 */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 space-y-4">
              {/* 검색창 */}
              <input
                type="text"
                value={undervaluedSearchQuery}
                onChange={(e) => setUndervaluedSearchQuery(e.target.value)}
                placeholder="종목명 또는 티커 검색 (예: 삼성전자, AAPL)"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />

              {/* 시장 선택 */}
              <div>
                <div className="text-[10px] sm:text-xs text-gray-600 mb-2 font-semibold">시장</div>
                <div className="flex gap-1.5 sm:gap-2">
                  {(["전체", "US", "KR"] as const).map((market) => (
                    <button
                      key={market}
                      onClick={() => setUndervaluedMarket(market)}
                      className={classNames(
                        "flex-1 sm:flex-initial rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all",
                        undervaluedMarket === market
                          ? "bg-indigo-600 text-white shadow"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      {market === "전체" ? "전체" : market === "US" ? "🇺🇸 미국" : "🇰🇷 한국"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 카테고리 선택 */}
              <div>
                <div className="text-[10px] sm:text-xs text-gray-600 mb-2 font-semibold">GICS 섹터</div>
                <CategoryChips
                  value={undervaluedCategory}
                  onChange={setUndervaluedCategory}
                  categories={[...CATEGORIES]}
                />
              </div>

              {/* 산업군 선택 */}
              {undervaluedCategory !== "전체" && SECTOR_INDUSTRIES[undervaluedCategory] && (
                <div>
                  <div className="text-[10px] sm:text-xs text-gray-600 mb-2 font-semibold">산업군</div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {SECTOR_INDUSTRIES[undervaluedCategory].map((industry) => (
                      <button
                        key={industry}
                        onClick={() => setUndervaluedIndustry(industry)}
                        className={classNames(
                          "rounded-lg px-2.5 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm font-semibold transition-all",
                          undervaluedIndustry === industry
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

            {/* 게시판 형식 테이블 */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs">
                        종목
                      </th>
                      <th className="px-4 py-3 text-left text-xs">
                        섹터
                      </th>
                      <th className="px-4 py-3 text-left text-xs">
                        산업군
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="AI 점수"
                          sortKey="aiScore"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="ROE"
                          tooltip="자기자본이익률 - 높을수록 우수"
                          sortKey="ROE"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="PER"
                          tooltip="주가수익비율 - 낮을수록 저평가"
                          sortKey="PER"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="PEG"
                          tooltip="PEG 비율 (PER/성장률) - 1 이하 매력적"
                          sortKey="PEG"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="PBR"
                          tooltip="주가순자산비율 - 낮을수록 저평가"
                          sortKey="PBR"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="PSR"
                          tooltip="주가매출비율 - 낮을수록 저평가"
                          sortKey="PSR"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="RevYoY"
                          tooltip="매출 YoY 성장률"
                          sortKey="RevYoY"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="EPS 3Y"
                          tooltip="3년 EPS 성장률"
                          sortKey="EPS_Growth_3Y"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="영업이익률"
                          tooltip="영업이익률 - 높을수록 우수"
                          sortKey="OpMarginTTM"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="FCF"
                          tooltip="FCF 수익률 (현금 창출 능력)"
                          sortKey="FCF_Yield"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {(() => {
                      let filteredStocks = mockUndervalued.filter((stock) => {
                        const matchMarket = undervaluedMarket === "전체" || stock.market === undervaluedMarket;
                        const matchCategory = undervaluedCategory === "전체" || stock.category === undervaluedCategory;
                        const matchIndustry = undervaluedIndustry === "전체" || stock.industry === undervaluedIndustry;
                        const matchQuery =
                          !undervaluedSearchQuery ||
                          stock.name.toLowerCase().includes(undervaluedSearchQuery.toLowerCase()) ||
                          stock.symbol.toLowerCase().includes(undervaluedSearchQuery.toLowerCase());
                        return matchMarket && matchCategory && matchIndustry && matchQuery;
                      });

                      // Apply sorting
                      if (undervaluedSortBy) {
                        filteredStocks = [...filteredStocks].sort((a: any, b: any) => {
                          const aVal = a[undervaluedSortBy];
                          const bVal = b[undervaluedSortBy];
                          if (aVal === undefined || bVal === undefined) return 0;
                          const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                          return undervaluedSortDirection === "asc" ? comparison : -comparison;
                        });
                      }

                      const itemsPerPage = 30;
                      const startIndex = (undervaluedPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedStocks = filteredStocks.slice(startIndex, endIndex);

                      return paginatedStocks.map((stock) => (
                        <tr
                          key={stock.symbol}
                          onClick={() => openStockDetail(stock.symbol, "info")}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                {stock.logoUrl && !logoErrors[stock.symbol] ? (
                                  <img
                                    src={stock.logoUrl}
                                    alt={stock.name}
                                    className="h-10 w-10 rounded-lg"
                                    onError={() => setLogoErrors(prev => ({ ...prev, [stock.symbol]: true }))}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                    <span className="text-lg text-gray-400">?</span>
                                  </div>
                                )}
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
                                <div className="text-sm font-bold text-gray-900">{stock.name}</div>
                                <div className="text-xs text-gray-500">
                                  {stock.symbol} · {stock.market === "US" ? "🇺🇸 미국" : "🇰🇷 한국"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                              {stock.category}
                            </span>
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
                            <span className="text-xs text-gray-900 font-medium">{stock.ROE}%</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="text-xs text-gray-900 font-medium">{stock.PER}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="text-xs text-gray-900 font-medium">{stock.PEG}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="text-xs text-gray-900 font-medium">{stock.PBR}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="text-xs text-gray-900 font-medium">{stock.PSR}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="text-xs text-emerald-600 font-medium">{stock.RevYoY}%</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="text-xs text-emerald-600 font-medium">{stock.EPS_Growth_3Y}%</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="text-xs text-gray-900 font-medium">{stock.OpMarginTTM}%</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="text-xs text-gray-900 font-medium">{stock.FCF_Yield}%</span>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {(() => {
              const filteredStocks = mockUndervalued.filter((stock) => {
                const matchMarket = undervaluedMarket === "전체" || stock.market === undervaluedMarket;
                const matchCategory = undervaluedCategory === "전체" || stock.category === undervaluedCategory;
                const matchQuery =
                  !undervaluedSearchQuery ||
                  stock.name.toLowerCase().includes(undervaluedSearchQuery.toLowerCase()) ||
                  stock.symbol.toLowerCase().includes(undervaluedSearchQuery.toLowerCase());
                return matchMarket && matchCategory && matchQuery;
              });
              const totalPages = Math.ceil(filteredStocks.length / 30);

              if (totalPages <= 1) return null;

              return (
                <Pagination
                  currentPage={undervaluedPage}
                  totalPages={totalPages}
                  onPageChange={setUndervaluedPage}
                />
              );
            })()}
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
                    let filteredFilings = mockFilings.filter((filing) => {
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
                    AI 점수 {filingsSortBy === "aiScore" && (filingsSortDirection === "asc" ? "↑" : "↓")}
                  </button>
                </div>
              </div>

              {/* 시장 선택 */}
              <div>
                <div className="text-[10px] sm:text-xs text-gray-600 mb-2 font-semibold">시장</div>
                <div className="flex gap-1.5 sm:gap-2">
                  {(["전체", "US", "KR"] as const).map((market) => (
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
                      {market === "전체" ? "전체" : market === "US" ? "🇺🇸 미국" : "🇰🇷 한국"}
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
            <div className="space-y-3">
              {(() => {
                let filteredFilings = mockFilings.filter((filing) => {
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

            {/* Pagination */}
            {(() => {
              const filteredFilings = mockFilings.filter((filing) => {
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
              <p className="mt-2 text-sm text-gray-600">즐겨찾기한 종목의 AI 분석을 한눈에 확인하세요</p>
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

              // Get favorited stocks from mockUndervalued and apply filters
              let favoritedStocks = mockUndervalued.filter(stock => {
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

                    {/* 시장 선택 */}
                    <div>
                      <div className="text-xs text-gray-600 mb-2 font-semibold">시장</div>
                      <div className="flex gap-2">
                        {(["전체", "US", "KR"] as const).map((market) => (
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
                            {market === "전체" ? "전체" : market === "US" ? "🇺🇸 미국" : "🇰🇷 한국"}
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
                              AI 점수
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
                            const latestFiling = mockFilings.find(f => f.symbol === stock.symbol);
                            return (
                              <tr
                                key={stock.symbol}
                                onClick={() => openStockDetail(stock.symbol, "info")}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      {stock.logoUrl && !logoErrors[stock.symbol] ? (
                                        <img
                                          src={stock.logoUrl}
                                          alt={stock.name}
                                          className="h-10 w-10 rounded-lg"
                                          onError={() => setLogoErrors(prev => ({ ...prev, [stock.symbol]: true }))}
                                        />
                                      ) : (
                                        <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                          <span className="text-lg text-gray-400">?</span>
                                        </div>
                                      )}
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
                                      <div className="text-sm font-bold text-gray-900">{stock.name}</div>
                                      <div className="text-xs text-gray-500">
                                        {stock.symbol} · {stock.market === "US" ? "🇺🇸 미국" : "🇰🇷 한국"}
                                      </div>
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
              // 저평가 우량주 최신 3개
              const latestUndervalued = mockUndervalued
                .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
                .slice(0, 3);

              // 공시분석 최신 3개
              const latestFilings = mockFilings
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 3);

              // 최근 본 종목 데이터
              const recentStocksList = recentStocks
                .map(symbol => mockUndervalued.find(s => s.symbol === symbol))
                .filter(Boolean)
                .slice(0, 5);

              return (
                <main className="mx-auto max-w-7xl px-4 py-6 pb-24">
                  {/* 안내 문구 */}
                  <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                      어떤 종목을 살펴보시겠어요?
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">
                      아래 섹션에서 종목을 선택하거나, 저평가/공시 탭에서 종목을 클릭해보세요
                    </p>
                  </div>

                  {/* 저평가 우량주 섹션 */}
                  <div className="mb-8">
                    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">💎 저평가 우량주</h2>
                        <button
                          onClick={() => switchTab("undervalued")}
                          className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                        >
                          전체 보기 →
                        </button>
                      </div>

                      {latestUndervalued.length > 0 ? (
                        <div className="grid gap-3 sm:gap-4">
                          {latestUndervalued.map(stock => (
                            <div
                              key={stock.symbol}
                              onClick={() => {
                                setDetailSymbol(stock.symbol);
                                setDetailTab("info");
                              }}
                              className="rounded-xl bg-white p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                {stock.logoUrl && (
                                  <img
                                    src={stock.logoUrl}
                                    alt={stock.name}
                                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-white border border-gray-200"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-sm sm:text-base text-gray-900 truncate">{stock.name}</div>
                                  <div className="text-xs sm:text-sm text-gray-500">{stock.symbol} · {stock.sector}</div>
                                </div>
                                {stock.aiScore && (
                                  <div className="flex-shrink-0">
                                    <AIScoreGauge score={stock.aiScore} sentiment={stock.sentiment} size="sm" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 text-sm">데이터가 없습니다</div>
                      )}
                    </div>
                  </div>

                  {/* 공시분석 섹션 */}
                  <div className="mb-8">
                    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 sm:p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">📊 공시분석 기준</h2>
                        <button
                          onClick={() => switchTab("filings")}
                          className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                        >
                          전체 보기 →
                        </button>
                      </div>

                      {latestFilings.length > 0 ? (
                        <div className="grid gap-3 sm:gap-4">
                          {latestFilings.map(filing => {
                            const stock = mockUndervalued.find(s => s.symbol === filing.symbol);
                            return (
                              <div
                                key={filing.id}
                                onClick={() => {
                                  setDetailSymbol(filing.symbol);
                                  setDetailTab("filings");
                                }}
                                className="rounded-xl bg-white p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                              >
                                <div className="flex items-start gap-3">
                                  {stock?.logoUrl && (
                                    <img
                                      src={stock.logoUrl}
                                      alt={stock.name}
                                      className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-white border border-gray-200"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-sm sm:text-base text-gray-900">{filing.symbol}</span>
                                      <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
                                        {filing.formType}
                                      </span>
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-700 line-clamp-1">{filing.summary}</div>
                                    <div className="text-xs text-gray-500 mt-1">{filing.date}</div>
                                  </div>
                                  {filing.aiScore && (
                                    <div className="flex-shrink-0">
                                      <AIScoreGauge score={filing.aiScore} sentiment={filing.sentiment} size="sm" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 text-sm">데이터가 없습니다</div>
                      )}
                    </div>
                  </div>

                  {/* 최근 본 종목 섹션 */}
                  {recentStocksList.length > 0 && (
                    <div className="mb-8">
                      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-lg">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">🕒 최근 본 종목</h2>
                        <div className="grid gap-3 sm:gap-4">
                          {recentStocksList.map(stock => (
                            <div
                              key={stock.symbol}
                              onClick={() => {
                                setDetailSymbol(stock.symbol);
                                setDetailTab("info");
                              }}
                              className="rounded-xl bg-gray-50 p-3 sm:p-4 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                {stock.logoUrl && (
                                  <img
                                    src={stock.logoUrl}
                                    alt={stock.name}
                                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-white border border-gray-200"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-sm sm:text-base text-gray-900 truncate">{stock.name}</div>
                                  <div className="text-xs sm:text-sm text-gray-500">{stock.symbol} · {stock.sector}</div>
                                </div>
                                {stock.aiScore && (
                                  <div className="flex-shrink-0">
                                    <AIScoreGauge score={stock.aiScore} sentiment={stock.sentiment} size="sm" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </main>
              );
            }

            // ✅ 종목이 선택된 경우: 상세 정보 표시
            const stockDetail = mockStockDetails[detailSymbol];
            const stockInfo = mockUndervalued.find(s => s.symbol === detailSymbol);
            const stockFilings = mockFilings.filter(f => f.symbol === detailSymbol);

            // ✅ 종목 정보가 없을 때 안내 메시지 표시
            if (!stockDetail) {
              return (
                <main className="mx-auto max-w-7xl px-4 py-6 pb-24">
                  <div className="mb-4">
                    <button
                      onClick={() => setDetailSymbol("")}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      <span>←</span>
                      <span>목록으로</span>
                    </button>
                  </div>
                  <div className="text-center py-24 bg-white rounded-2xl shadow-md border border-gray-200">
                    <div className="text-8xl mb-6">📊</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">종목 정보가 없습니다</h2>
                    <p className="text-gray-600 mb-6">
                      선택하신 종목 <span className="font-semibold text-indigo-600">{detailSymbol}</span>의 상세 정보를 찾을 수 없습니다.
                    </p>
                    <button
                      onClick={() => setDetailSymbol("")}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      목록으로 돌아가기
                    </button>
                  </div>
                </main>
              );
            }

            return (
              <main className="mx-auto max-w-7xl px-4 py-6 pb-24">
                {/* ✅ 뒤로가기 버튼 */}
                <div className="mb-4">
                  <button
                    onClick={() => setDetailSymbol("")}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <span>←</span>
                    <span>목록으로</span>
                  </button>
                </div>
                {/* 히어로 섹션 */}
                <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6 md:p-8 text-white shadow-xl">
                  <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-3 sm:gap-6 flex-1">
                      {stockInfo?.logoUrl && !detailLogoError ? (
                        <img
                          src={stockInfo.logoUrl}
                          alt={stockDetail.Name}
                          className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-xl sm:rounded-2xl bg-white p-1.5 sm:p-2 shadow-lg flex-shrink-0"
                          onError={() => setDetailLogoError(true)}
                        />
                      ) : (
                        <div className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-xl sm:rounded-2xl bg-gray-200 flex items-center justify-center shadow-lg flex-shrink-0">
                          <span className="text-xl sm:text-2xl md:text-3xl text-gray-400">?</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1 sm:mb-2 truncate">{stockDetail.Name}</h1>
                        <p className="text-sm sm:text-base md:text-xl text-indigo-100 mb-2 sm:mb-3 truncate">
                          {stockDetail.Ticker} · {stockDetail.Sector}
                        </p>
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
                        <div className="inline-block bg-white/40 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-white/60 shadow-2xl ring-2 ring-white/30">
                          <div className="text-xs text-gray-800 mb-2 font-bold text-center bg-white/70 rounded-lg px-2 py-1 shadow-sm">AI 종합 점수</div>
                          <AIScoreGauge score={stockInfo.aiScore} sentiment={stockInfo.sentiment} size="lg" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

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
                      onClick={() => setDetailTab("filings")}
                      className={classNames(
                        "flex-1 sm:flex-initial rounded-lg px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-all",
                        detailTab === "filings"
                          ? "bg-indigo-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      <span className="hidden sm:inline">📈 공시 분석 요약</span>
                      <span className="sm:hidden">📈 공시</span>
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
                        {["GrowthScore", "QualityScore", "ValueScore", "MomentumScore", "TotalScore"].map(key => (
                          <div key={key} className="text-center p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
                            {METRIC_DESCRIPTIONS[key] ? (
                              <MetricTooltip tooltip={METRIC_DESCRIPTIONS[key]}>
                                <div className="text-xs text-gray-600 mb-2">{key.replace("Score", "")}</div>
                              </MetricTooltip>
                            ) : (
                              <div className="text-xs text-gray-600 mb-2">{key.replace("Score", "")}</div>
                            )}
                            <div className={classNames("text-3xl font-bold", getMetricColor(key, stockDetail[key]))}>
                              {stockDetail[key]}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 밸류에이션 */}
                    <div className="rounded-xl bg-white p-6 shadow-md border border-gray-200">
                      <h2 className="text-lg font-bold text-gray-900 mb-4">💰 밸류에이션</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {["FairValue", "Discount", "PE", "PEG", "PB", "PS", "EV_EBITDA"].map(key => {
                          if (!stockDetail[key]) return null;
                          const value = stockDetail[key];
                          let displayValue = typeof value === "number" ? value.toFixed(2) : value;
                          if (key === "Discount") displayValue = value.toFixed(1) + "%";
                          const colorClass = typeof value === "number" ? getMetricColor(key, value) : "text-gray-900";
                          return (
                            <div key={key} className="p-4 rounded-lg bg-gray-50">
                              {METRIC_DESCRIPTIONS[key] ? (
                                <MetricTooltip tooltip={METRIC_DESCRIPTIONS[key]}>
                                  <div className="text-xs text-gray-600 mb-1">{key.replace(/_/g, " ")}</div>
                                </MetricTooltip>
                              ) : (
                                <div className="text-xs text-gray-600 mb-1">{key.replace(/_/g, " ")}</div>
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
                          {["ROE", "ROA", "OpMarginTTM", "OperatingMargins"].map(key => {
                            if (!stockDetail[key]) return null;
                            const value = stockDetail[key];
                            const displayValue = value.toFixed(1) + "%";
                            const colorClass = getMetricColor(key, value);
                            return (
                              <div key={key} className="p-4 rounded-lg bg-gray-50">
                                {METRIC_DESCRIPTIONS[key] ? (
                                  <MetricTooltip tooltip={METRIC_DESCRIPTIONS[key]}>
                                    <div className="text-xs text-gray-600 mb-1">{key.replace(/_/g, " ")}</div>
                                  </MetricTooltip>
                                ) : (
                                  <div className="text-xs text-gray-600 mb-1">{key.replace(/_/g, " ")}</div>
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
                            const displayValue = value.toFixed(1) + "%";
                            const colorClass = getMetricColor(key, value);
                            return (
                              <div key={key} className="p-4 rounded-lg bg-gray-50">
                                {METRIC_DESCRIPTIONS[key] ? (
                                  <MetricTooltip tooltip={METRIC_DESCRIPTIONS[key]}>
                                    <div className="text-xs text-gray-600 mb-1">{key.replace(/_/g, " ")}</div>
                                  </MetricTooltip>
                                ) : (
                                  <div className="text-xs text-gray-600 mb-1">{key.replace(/_/g, " ")}</div>
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
                            "FairValue", "Discount", "PE", "PEG", "PB", "PS", "EV_EBITDA",
                            "ROE", "ROA", "OpMarginTTM", "OperatingMargins",
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

                          return (
                            <div key={key} className="p-4 rounded-lg bg-gray-50">
                              {METRIC_DESCRIPTIONS[key] ? (
                                <MetricTooltip tooltip={METRIC_DESCRIPTIONS[key]}>
                                  <div className="text-xs text-gray-600 mb-1">{key.replace(/_/g, " ")}</div>
                                </MetricTooltip>
                              ) : (
                                <div className="text-xs text-gray-600 mb-1">{key.replace(/_/g, " ")}</div>
                              )}
                              <div className={classNames("text-lg font-bold", colorClass)}>{displayValue}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stockFilings.length > 0 ? stockFilings.map(filing => (
                      <div key={filing.id} className="rounded-xl bg-white p-6 shadow-md border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {/* 로고 추가 */}
                              {filing.logoUrl && !logoErrors[filing.symbol] ? (
                                <img
                                  src={filing.logoUrl}
                                  alt={filing.company}
                                  className="h-8 w-8 rounded-lg flex-shrink-0"
                                  onError={() => setLogoErrors(prev => ({ ...prev, [filing.symbol]: true }))}
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm text-gray-400">?</span>
                                </div>
                              )}
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
                        {filing.previousScores && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600 font-semibold mb-3">이전 공시 점수 추이</div>
                            <div className="flex gap-3">
                              {filing.previousScores.map((score: number, idx: number) => (
                                <div key={idx} className="text-center">
                                  <div className="text-xs text-gray-500 mb-1">-{filing.previousScores.length - idx}회</div>
                                  <div className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-2 rounded-lg">
                                    {score}점
                                  </div>
                                </div>
                              ))}
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