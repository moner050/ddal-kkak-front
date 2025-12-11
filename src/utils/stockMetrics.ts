import { INVESTMENT_STRATEGIES } from "../constants/investmentStrategies";

// ------------------------------------------------------------------
// 주식 지표 유틸리티 함수
// ------------------------------------------------------------------

/**
 * 점수를 유망도 수준으로 변환하는 함수
 */
export function getScoreLevel(score: number): { label: string; emoji: string } {
  if (score >= 80) return { label: "매우 유망", emoji: "🌟" };
  if (score >= 70) return { label: "유망", emoji: "⭐" };
  if (score >= 60) return { label: "보통", emoji: "➖" };
  if (score >= 50) return { label: "주의", emoji: "⚠️" };
  return { label: "위험", emoji: "🚨" };
}

/**
 * 각 점수에 영향을 주는 크리티컬 지표 매핑
 */
export function getCriticalMetrics(scoreType: string): string[] {
  const metricsMap: Record<string, string[]> = {
    "GrowthScore": ["RevYoY", "Revenue_Growth_3Y", "EPS_Growth_3Y", "EBITDA_Growth_3Y"],
    "QualityScore": ["ROE", "ROA", "OpMarginTTM", "OperatingMargins"],
    "ValueScore": ["PE", "PEG", "PB", "PS", "Discount"],
    "MomentumScore": ["RET5", "RET20", "RET63", "RSI_14"],
    "TotalScore": ["GrowthScore", "QualityScore", "ValueScore", "MomentumScore"]
  };
  return metricsMap[scoreType] || [];
}

/**
 * 투자전략 필터 함수
 */
export function matchesInvestmentStrategy(stock: any, strategy: keyof typeof INVESTMENT_STRATEGIES): boolean {
  const s = stock;

  switch (strategy) {
    case "undervalued_quality":
      return (
        (s.marketCap || 0) >= 2 &&  // 20억 달러 이상
        (s.price || 0) >= 10 &&
        (s.dollarVolume || 0) >= 5 &&  // 500만 달러
        (s.PER || 0) > 0 && (s.PER || 0) < 25 &&  // PER 양수 필수
        (s.PEG || 0) < 1.0 &&  // 2025-12 강화: 1.5 → 1.0
        (s.PS || 0) < 50 &&  // 버블 방지: P/S < 50
        (s.PB || 0) < 10 &&  // 버블 방지: P/B < 10
        (s.RevYoY || 0) > 5 &&
        (s.EPS_Growth_3Y || 0) > 5 &&
        (s.OpMarginTTM || 0) > 12 &&
        (s.ROE || 0) > 15 &&
        (s.FCF_Yield || 0) > 3 &&
        (s.shortPercent || 0) < 20  // 버블 방지: 공매도 < 20%
      );

    case "value_basic":
      return (
        (s.marketCap || 0) >= 0.5 &&  // 5억 달러 이상
        (s.price || 0) >= 5 &&
        (s.dollarVolume || 0) >= 1 &&  // 100만 달러
        (s.PER || 0) < 30 &&
        (s.PEG || 0) < 2.0 &&
        (s.OpMarginTTM || 0) > 5 &&
        (s.ROE || 0) > 8
      );

    case "value_strict":
      return (
        (s.marketCap || 0) >= 2 &&  // 20억 달러 이상
        (s.price || 0) >= 5 &&
        (s.dollarVolume || 0) >= 5 &&  // 500만 달러
        (s.PER || 0) > 0 && (s.PER || 0) < 20 &&  // PER 양수 필수
        (s.PEG || 0) < 1.0 &&  // 2025-12 강화: 1.5 → 1.0
        (s.PS || 0) < 30 &&  // 더 엄격한 기준: P/S < 30
        (s.PB || 0) < 8 &&  // 더 엄격한 기준: P/B < 8
        (s.RevYoY || 0) > 5 &&
        (s.EPS_Growth_3Y || 0) > 5 &&
        (s.OpMarginTTM || 0) > 10 &&
        (s.ROE || 0) > 12 &&
        (s.FCF_Yield || 0) > 2 &&
        (s.shortPercent || 0) < 15  // 더 엄격한 기준: 공매도 < 15%
      );

    case "growth_quality":
      return (
        (s.marketCap || 0) >= 1 &&  // 10억 달러 이상
        (s.RevYoY || 0) > 15 &&
        (s.EPS_Growth_3Y || 0) > 10 &&
        (s.OpMarginTTM || 0) > 15 &&
        (s.ROE || 0) > 15 &&
        (s.PER || 0) > 0 && (s.PER || 0) < 50 &&  // 2025-12 변경: 40 → 50 (성장주 특성)
        (s.PEG || 0) < 2.5 &&  // 2025-12 변경: 2.0 → 2.5 (필수)
        (s.PS || 0) < 100 &&  // 버블 방지: 극단적 밸류에이션 제외
        (s.shortPercent || 0) < 25  // 버블 방지: 공매도 < 25%
      );

    case "momentum":
      return (
        (s.price || 0) >= 10 &&
        (s.dollarVolume || 0) >= 3 &&  // 300만 달러
        (s.rvol || 0) > 1.3 &&
        (s.rsi || 0) >= 40 && (s.rsi || 0) <= 70 &&
        (s.ret20d || 0) > 3 &&
        (s.high52wRatio || 0) > 70 &&
        (s.macdHistogram || 0) > 0
      );

    case "swing":
      // 2025-12 변경: 과매도 반등 전략으로 전환
      return (
        (s.price || 0) >= 5 &&
        (s.dollarVolume || 0) >= 1 &&  // 100만 달러
        (s.atr || 0) >= 2 && (s.atr || 0) <= 8 &&  // 적당한 변동성
        (s.rsi || 0) >= 25 && (s.rsi || 0) <= 45 &&  // 과매도~중립 하단
        (s.bbPosition || 0) >= 5 && (s.bbPosition || 0) <= 40 &&  // 밴드 하단 근처
        (s.ret5d || 0) >= -10 && (s.ret5d || 0) <= 0  // 최근 하락 후 바닥
      );

    case "ai_transformation":
      // AI 인프라 전환 기업: Technology/Communication Services 섹터만
      const isAISector =
        s.category === "Information Technology" ||
        s.category === "정보기술" ||
        s.category === "Communication Services" ||
        s.category === "커뮤니케이션 서비스";

      return (
        isAISector &&  // 섹터 제한 추가 (2025-12 강화)
        (s.marketCap || 0) >= 1 &&  // 10억 달러 이상
        (s.ROE || 0) > 20 &&
        (s.OpMarginTTM || 0) > 10 &&
        (s.RevYoY || 0) > 200 &&  // 매출 성장률 200% 이상 (YoY) - 극단적 성장 (2025-12 강화)
        (s.PER || 0) > 0 && (s.PER || 0) < 40 &&  // PER 양수 필수, 초고성장 허용
        (s.PS || 0) < 30 &&  // P/S < 30 (버블 방지 강화)
        (s.shortPercent || 0) < 30 &&  // 공매도 비율 < 30%
        (s.beta || 0) > 2.5  // Beta > 2.5 (초고성장 고위험 특성)
      );

    default:
      return true;
  }
}

/**
 * 재무 지표 평가 함수 (가이드 기준 적용)
 * 반환값: Tailwind CSS 색상 클래스
 */
export function getMetricColor(key: string, value: number): string {
  // 1. 기업 규모 지표
  if (key === "MktCap") {
    if (value >= 10) return "text-emerald-600"; // Large Cap
    if (value >= 2) return "text-blue-600"; // Mid Cap
    return "text-orange-600"; // Small Cap
  }

  if (key === "DollarVol") {
    if (value >= 50) return "text-emerald-600"; // 유동성 우수
    if (value >= 10) return "text-gray-900"; // 보통
    return "text-red-600"; // 유동성 리스크
  }

  // 2. 밸류에이션 지표 (낮을수록 저평가)
  if (key === "PE" || key === "PER") {
    if (value < 0) return "text-red-600"; // 적자
    if (value <= 15) return "text-emerald-600"; // 저평가
    if (value <= 25) return "text-gray-900"; // 적정
    return "text-red-600"; // 고평가
  }

  if (key === "PEG") {
    if (value < 1.0) return "text-emerald-600"; // 저평가
    if (value <= 2.0) return "text-gray-900"; // 적정
    return "text-red-600"; // 고평가
  }

  if (key === "PB" || key === "PBR") {
    if (value < 1.0) return "text-emerald-600"; // 저평가
    if (value <= 3.0) return "text-gray-900"; // 적정
    return "text-red-600"; // 고평가
  }

  if (key === "PS" || key === "PSR") {
    if (value < 1.0) return "text-emerald-600"; // 저평가
    if (value <= 2.0) return "text-gray-900"; // 적정
    return "text-red-600"; // 고평가
  }

  if (key === "EV_EBITDA") {
    if (value < 10) return "text-emerald-600"; // 저평가
    if (value <= 15) return "text-gray-900"; // 적정
    return "text-red-600"; // 고평가
  }

  // 3. 현금흐름 & 배당 지표
  if (key === "FCF_Yield") {
    if (value < 0) return "text-red-600"; // 현금 소진
    if (value > 8) return "text-emerald-600"; // 우수
    if (value >= 4) return "text-blue-600"; // 양호
    return "text-gray-900"; // 보통
  }

  if (key === "DivYield") {
    if (value === 0) return "text-gray-500"; // 배당 미지급
    if (value > 4) return "text-emerald-600"; // 고배당
    if (value >= 2) return "text-gray-900"; // 보통
    return "text-gray-700"; // 저배당
  }

  if (key === "PayoutRatio") {
    if (value > 100) return "text-red-600"; // 위험 (차입 배당)
    if (value > 80) return "text-orange-600"; // 주의
    if (value >= 30 && value <= 60) return "text-emerald-600"; // 안정적
    return "text-gray-900"; // 보통
  }

  // 4. 수익성 지표 (높을수록 좋음)
  if (key === "ROE") {
    if (value > 20) return "text-emerald-600"; // 우수
    if (value >= 15) return "text-blue-600"; // 양호
    if (value >= 10) return "text-gray-900"; // 보통
    return "text-red-600"; // 미흡
  }

  if (key === "ROA") {
    if (value > 10) return "text-emerald-600"; // 우수
    if (value >= 5) return "text-blue-600"; // 양호
    if (value >= 2) return "text-gray-900"; // 보통
    return "text-red-600"; // 미흡
  }

  if (key === "OpMarginTTM" || key === "OperatingMargins") {
    if (value > 20) return "text-emerald-600"; // 우수
    if (value >= 10) return "text-blue-600"; // 양호
    if (value >= 5) return "text-gray-900"; // 보통
    return "text-red-600"; // 미흡
  }

  if (key === "GrossMargins") {
    if (value > 50) return "text-emerald-600"; // 우수
    if (value >= 30) return "text-blue-600"; // 양호
    if (value >= 20) return "text-gray-900"; // 보통
    return "text-red-600"; // 미흡
  }

  if (key === "NetMargins") {
    if (value > 15) return "text-emerald-600"; // 우수
    if (value >= 10) return "text-blue-600"; // 양호
    if (value >= 5) return "text-gray-900"; // 보통
    return "text-red-600"; // 미흡
  }

  // 5. 성장성 지표 (높을수록 좋음)
  if (key === "RevYoY" || key === "Revenue_Growth_3Y" || key === "EPS_Growth_3Y" || key === "EBITDA_Growth_3Y") {
    if (value > 20) return "text-emerald-600"; // 고성장
    if (value >= 10) return "text-blue-600"; // 성장
    if (value >= 5) return "text-gray-900"; // 보통
    if (value >= 0) return "text-orange-600"; // 정체
    return "text-red-600"; // 역성장
  }

  // 6. 기술적 지표 (이동평균선)
  if (key === "SMA20" || key === "SMA50" || key === "SMA200") {
    if (value > 5) return "text-emerald-600"; // 강세
    if (value >= -5) return "text-gray-900"; // 중립
    return "text-red-600"; // 약세
  }

  // 7. 모멘텀 & 변동성 지표
  if (key === "RSI_14") {
    if (value > 70) return "text-red-600"; // 과매수
    if (value >= 30) return "text-emerald-600"; // 중립
    return "text-blue-600"; // 과매도 (반등 가능성)
  }

  if (key === "MACD_Histogram") {
    if (value > 0) return "text-emerald-600"; // 매수신호
    return "text-red-600"; // 매도신호
  }

  if (key === "BB_Position") {
    if (value > 0.8) return "text-red-600"; // 과매수
    if (value >= 0.2) return "text-gray-900"; // 중립
    return "text-blue-600"; // 과매도
  }

  // 8. 수익률 지표
  if (key === "RET5" || key === "RET20" || key === "RET63" || key === "Momentum_12M") {
    if (value > 10) return "text-emerald-600"; // 강세
    if (value >= 0) return "text-gray-900"; // 보통
    return "text-red-600"; // 약세
  }

  if (key === "Volatility_21D") {
    if (value < 20) return "text-emerald-600"; // 안정적
    if (value <= 40) return "text-gray-900"; // 보통
    return "text-red-600"; // 고위험
  }

  if (key === "High_52W_Ratio") {
    if (value > 0.9) return "text-emerald-600"; // 고점권
    if (value >= 0.7) return "text-gray-900"; // 중간
    return "text-orange-600"; // 저점권
  }

  if (key === "Low_52W_Ratio") {
    if (value > 1.5) return "text-emerald-600"; // 상승
    if (value >= 1.2) return "text-gray-900"; // 보통
    return "text-orange-600"; // 저점권
  }

  // 9. 거래 & 리스크 지표
  if (key === "RVOL") {
    if (value > 2.0) return "text-emerald-600"; // 급증
    if (value >= 1.2) return "text-blue-600"; // 활발
    if (value >= 0.8) return "text-gray-900"; // 보통
    return "text-red-600"; // 저조
  }

  if (key === "Beta") {
    if (value > 1.2) return "text-orange-600"; // 고변동
    if (value >= 0.8) return "text-gray-900"; // 시장추종
    return "text-blue-600"; // 저변동 (방어주)
  }

  if (key === "ShortPercent") {
    if (value > 10) return "text-orange-600"; // 높음 (숏스퀴즈 가능성)
    if (value >= 5) return "text-gray-900"; // 보통
    return "text-emerald-600"; // 낮음
  }

  // 10. 소유구조 지표
  if (key === "InsiderOwnership") {
    if (value > 20) return "text-emerald-600"; // 높음 (이해관계 일치)
    if (value >= 10) return "text-gray-900"; // 보통
    return "text-orange-600"; // 낮음
  }

  if (key === "InstitutionOwnership") {
    if (value > 70) return "text-emerald-600"; // 높음 (기관 선호)
    if (value >= 40) return "text-gray-900"; // 보통
    return "text-orange-600"; // 낮음
  }

  // 11. 종합 평가 지표
  if (key === "Discount") {
    if (value > 20) return "text-emerald-600"; // 저평가
    if (value >= -10) return "text-gray-900"; // 적정
    return "text-red-600"; // 고평가
  }

  if (key.includes("Score")) {
    if (value > 70) return "text-emerald-600"; // 우수
    if (value >= 50) return "text-blue-600"; // 양호
    if (value >= 30) return "text-gray-900"; // 보통
    return "text-red-600"; // 미흡
  }

  // 기본값: 중립
  return "text-gray-900";
}

/**
 * 지표 상태 레이블 및 스타일 반환
 */
export function getMetricStatus(colorClass: string): { label: string; bgClass: string; textClass: string } {
  if (colorClass.includes("emerald")) {
    return { label: "우수", bgClass: "bg-emerald-100", textClass: "text-emerald-700" };
  }
  if (colorClass.includes("blue")) {
    return { label: "양호", bgClass: "bg-blue-100", textClass: "text-blue-700" };
  }
  if (colorClass.includes("red")) {
    return { label: "미흡", bgClass: "bg-red-100", textClass: "text-red-700" };
  }
  if (colorClass.includes("orange")) {
    return { label: "주의", bgClass: "bg-orange-100", textClass: "text-orange-700" };
  }
  return { label: "보통", bgClass: "bg-gray-100", textClass: "text-gray-700" };
}
