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
        (s.PER || 0) < 25 &&
        (s.PEG || 0) < 1.5 &&
        (s.RevYoY || 0) > 5 &&
        (s.EPS_Growth_3Y || 0) > 5 &&
        (s.OpMarginTTM || 0) > 12 &&
        (s.ROE || 0) > 15 &&
        (s.FCF_Yield || 0) > 3
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
        (s.PER || 0) < 20 &&
        (s.PEG || 0) < 1.5 &&
        (s.RevYoY || 0) > 5 &&
        (s.EPS_Growth_3Y || 0) > 5 &&
        (s.OpMarginTTM || 0) > 10 &&
        (s.ROE || 0) > 12 &&
        (s.FCF_Yield || 0) > 2
      );

    case "growth_quality":
      return (
        (s.marketCap || 0) >= 1 &&  // 10억 달러 이상
        (s.RevYoY || 0) > 15 &&
        (s.EPS_Growth_3Y || 0) > 10 &&
        (s.OpMarginTTM || 0) > 15 &&
        (s.ROE || 0) > 15 &&
        (s.PER || 0) < 40 &&
        (s.PEG || 0) < 2.0
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
      return (
        (s.price || 0) >= 5 &&
        (s.dollarVolume || 0) >= 1 &&  // 100만 달러
        (s.atr || 0) >= 2 && (s.atr || 0) <= 10 &&
        (s.rsi || 0) >= 30 && (s.rsi || 0) <= 70 &&
        (s.bbPosition || 0) >= 20 && (s.bbPosition || 0) <= 80 &&
        (s.ret5d || 0) >= -5 && (s.ret5d || 0) <= 10
      );

    default:
      return true;
  }
}

/**
 * 재무 지표 평가 함수 (좋음: 초록색, 보통: 검정색, 나쁨: 빨간색)
 */
export function getMetricColor(key: string, value: number): string {
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

/**
 * 지표 상태 레이블 및 스타일 반환
 */
export function getMetricStatus(colorClass: string): { label: string; bgClass: string; textClass: string } {
  if (colorClass.includes("emerald")) {
    return { label: "좋음", bgClass: "bg-emerald-100", textClass: "text-emerald-700" };
  }
  if (colorClass.includes("red")) {
    return { label: "나쁨", bgClass: "bg-red-100", textClass: "text-red-700" };
  }
  return { label: "보통", bgClass: "bg-gray-100", textClass: "text-gray-700" };
}
