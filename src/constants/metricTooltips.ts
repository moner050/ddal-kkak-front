/**
 * 주요 지표 설명 툴팁
 * 계산 방식 및 투자 전략 가이드 기반
 */

export const METRIC_TOOLTIPS = {
  // 기본 정보
  ticker: "주식의 고유 식별 기호 (예: AAPL, MSFT)",
  companyName: "회사의 공식 명칭",
  sector: "GICS 기준 산업 분류 (예: Technology, Healthcare)",
  industry: "세부 산업 분류 (예: Consumer Electronics, Pharmaceuticals)",
  market: "상장 시장 (US: 미국, KR: 한국)",

  // 가격 및 시가총액
  price: "현재 주가 (단위: USD)",
  marketCap: "시가총액 = 주가 × 발행주식수 (단위: USD)",
  volume: "당일 거래량 (주식 수)",
  avgVolume: "평균 거래량 (3개월 기준)",

  // 밸류에이션 지표
  pe: "주가수익비율 (P/E Ratio) = 주가 / 주당순이익(EPS). 낮을수록 저평가. 출처: Yahoo Finance API",
  peg: "PEG 비율 = P/E / 성장률(%). PEG < 1.0이면 성장 대비 저평가. 계산식: PE / (earningsGrowth × 100)",
  pb: "주가순자산비율 (P/B Ratio) = 주가 / 주당순자산(BPS). 낮을수록 저평가. 출처: Yahoo Finance API",
  ps: "주가매출비율 (P/S Ratio) = 시가총액 / 매출액. 낮을수록 저평가. 출처: Yahoo Finance API",
  evEbitda: "EV/EBITDA = 기업가치 / 세전영업이익. 밸류에이션 지표",

  // 재무 지표
  roe: "자기자본이익률 (ROE) = 당기순이익 / 자기자본 × 100. 높을수록 수익성 우수. 출처: Yahoo Finance API",
  roa: "총자산이익률 (ROA) = 당기순이익 / 총자산 × 100. 자산 활용 효율성 지표",
  opMargin: "영업이익률 = 영업이익 / 매출액 × 100. 높을수록 수익성 우수. 출처: Yahoo Finance API",
  fcfYield: "잉여현금흐름 수익률 = FCF / 시가총액 × 100. 높을수록 현금 창출력 우수",
  divYield: "배당수익률 = 연간 배당금 / 주가 × 100. 배당 투자자에게 중요",

  // 성장성 지표
  revGrowth: "매출 성장률 (YoY) = (올해 매출 - 작년 매출) / 작년 매출 × 100. 출처: Yahoo Finance API",
  epsGrowth3Y: "EPS 성장률 (3년 평균) = (현재 EPS / 3년 전 EPS)^(1/3) - 1. 장기 수익성 성장 지표",
  revenueGrowth3Y: "매출 성장률 (3년 평균). 장기 성장 추세 파악",
  ebitdaGrowth3Y: "EBITDA 성장률 (3년 평균). 영업이익 성장 추세",

  // 기술적 지표
  rsi: "상대강도지수 (RSI, 14일) = 100 - (100 / (1 + RS)). RSI > 70: 과매수, RSI < 30: 과매도. 계산: Wilder's Smoothing Method",
  macd: "MACD = EMA(12) - EMA(26). 이동평균 수렴확산 지표. MACD > 0: 상승 추세",
  macdSignal: "MACD 시그널선 = EMA(MACD, 9). 매매 신호 판단",
  macdHistogram: "MACD 히스토그램 = MACD - Signal. 양수면 상승 모멘텀",
  bbPosition: "볼린저밴드 위치 = (현재가 - Lower Band) / (Upper Band - Lower Band). 0~1 범위. 0.2 이하: 과매도, 0.8 이상: 과매수",
  atr: "평균진폭범위 (ATR, 14일) = EMA(TR, 14). 변동성 지표. 계산: Wilder's Smoothing Method",
  atrPercent: "ATR% = ATR / 주가 × 100. 주가 대비 변동폭. 2~5%: 적당한 변동성",
  sma20: "20일 이동평균선. 단기 추세 파악",
  sma50: "50일 이동평균선. 중기 추세 파악",
  sma200: "200일 이동평균선. 장기 추세 파악",

  // 수익률 지표
  ret5d: "5일 수익률 = (현재가 - 5일 전 가격) / 5일 전 가격 × 100. 단기 모멘텀",
  ret20d: "20일 수익률 = (현재가 - 20일 전 가격) / 20일 전 가격 × 100. 중기 모멘텀",
  ret63d: "63일 수익률 = (현재가 - 63일 전 가격) / 63일 전 가격 × 100. 분기 수익률",
  momentum12m: "12개월 모멘텀. 연간 주가 변동 추세",
  perfSinceIntro: "최초 편입 이후 수익률 = (현재가 - 최초편입일 종가) / 최초편입일 종가 × 100. 프로파일 최초 통과일부터 수익률",
  perf100d: "100일 수익률 = (현재가 - 100일 전 종가) / 100일 전 종가 × 100. 최근 3개월 수익률",
  high52wRatio: "52주 고가 대비 비율 = 현재가 / 52주 최고가. 1에 가까울수록 고점 근처",
  low52wRatio: "52주 저가 대비 비율 = 현재가 / 52주 최저가. 1에 가까울수록 저점 근처",

  // 리스크 지표
  beta: "베타 = 시장 대비 변동성. Beta > 1: 시장보다 변동성 큼, Beta < 1: 안정적. 출처: Yahoo Finance API",
  shortPercent: "공매도 비율 = 공매도량 / 유통주식수 × 100. 높을수록 하락 위험. 출처: Yahoo Finance API",

  // 거래 지표
  rvol: "상대 거래량 (RVOL) = 현재 거래량 / 평균 거래량(3개월). RVOL > 1.3: 거래량 급증",
  dollarVolume: "거래대금 = 주가 × 거래량. 유동성 지표",

  // AI 점수
  growthScore: "성장 점수 (0-100) = 매출성장률, EPS성장률, 20일수익률 기반. 섹터별 정규화 적용 (섹터 내 40% + 전체 60%). 음수 성장률 시 페널티",
  qualityScore: "품질 점수 (0-100) = ROE, 영업이익률, FCF Yield 기반. 섹터별 정규화 적용 (섹터 내 40% + 전체 60%). 음수 ROE/영업이익률 시 페널티",
  valueScore: "가치 점수 (0-100) = P/E, PEG, P/B 기반. 낮을수록 높은 점수. 섹터별 정규화 적용 (섹터 내 40% + 전체 60%)",
  momentumScore: "모멘텀 점수 (0-100) = RVOL, 5일수익률, 52주고가비율, RSI, MACD 기반. 기술적 지표 중심",
  totalScore: "종합 점수 (0-100) = 성장 25% + 품질 30% + 가치 30% + 모멘텀 15% 가중평균. 70점 이상: 매수, 50-69점: 중립, 50점 미만: 부진",

  // 적정가치 및 할인율
  fairValue: "적정가치 = 섹터 중앙값 P/E 방법과 Peter Lynch PEG 방법론의 중앙값. PEG=1일 때 적정 P/E = 성장률 원칙 적용",
  discount: "할인율 = (적정가치 - 현재가) / 현재가 × 100. 양수: 저평가 (상승여력), 음수: 고평가 (하락위험)",
  upside: "상승 여력 = 할인율과 동일. 적정가 대비 현재가가 얼마나 저렴한지",

  // 감성 분석
  sentiment: "감성 분석 = 종합 점수 기반. 70점 이상: POSITIVE, 50-69점: NEUTRAL, 50점 미만: NEGATIVE",
  confidence: "신뢰도 = totalScore / 100. 점수가 높을수록 신뢰도 상승",

  // 프로파일
  passedProfiles: "통과한 투자 프로파일 = 해당 종목이 충족하는 투자 전략 목록. 여러 프로파일 통과 시 다양한 전략에 적합",

  // 기타
  firstScreeningDate: "최초 스크리닝 날짜 = 프로파일에 최초로 편입된 날짜. 수익률 추적 시작점",
  dataDate: "데이터 기준일 = 해당 데이터가 수집된 날짜",
  rank: "순위 = 종합 점수 기준 순위. 높을수록 투자 매력도 우수",

  // ETF 관련
  category: "ETF 카테고리 (예: Large Blend, Technology)",
  totalAssets: "ETF 총 자산 (단위: USD)",
  expenseRatio: "운용 보수율 = 연간 운용비용 / 총 자산. 낮을수록 유리",
  return1y: "1년 수익률 = (현재 NAV - 1년 전 NAV) / 1년 전 NAV × 100",

  // 보유 종목
  topHoldings: "주요 보유 종목 = ETF가 보유한 상위 종목 목록",
  sectorWeightings: "섹터 비중 = 섹터별 투자 비중 (%)",

  // 회사 정보
  website: "회사 공식 웹사이트",
  businessSummary: "사업 개요 = 회사가 하는 주요 사업 설명. 출처: Yahoo Finance API",
  fullTimeEmployees: "정규직 직원 수 = 회사 규모 지표",
  logoUrl: "회사 로고 URL = Clearbit API 기반 로고 이미지",
};

export type MetricKey = keyof typeof METRIC_TOOLTIPS;

/**
 * 계산 방식 상세 페이지 링크
 */
export const CALCULATION_GUIDE_URL = "/calculation-guide";

/**
 * 점수 기준 설명
 */
export const SCORE_CRITERIA = {
  totalScore: {
    excellent: { min: 90, max: 100, label: "S 등급", description: "매우 강력한 매수" },
    great: { min: 80, max: 89, label: "A 등급", description: "강력한 매수" },
    good: { min: 70, max: 79, label: "B 등급", description: "매수" },
    neutral: { min: 60, max: 69, label: "C 등급", description: "중립" },
    hold: { min: 50, max: 59, label: "D 등급", description: "보류" },
    weak: { min: 40, max: 49, label: "E 등급", description: "약한 매도" },
    poor: { min: 0, max: 39, label: "F 등급", description: "매도" },
  },
  discount: {
    veryUndervalued: { min: 30, label: "매우 저평가", description: "적정가 대비 30% 이상 저렴" },
    undervalued: { min: 20, max: 29, label: "저평가", description: "적정가 대비 20~29% 저렴" },
    slightlyUndervalued: { min: 10, max: 19, label: "다소 저평가", description: "적정가 대비 10~19% 저렴" },
    fair: { min: -10, max: 10, label: "적정", description: "적정가 근처" },
    slightlyOvervalued: { min: -20, max: -11, label: "다소 고평가", description: "적정가 대비 11~20% 비쌈" },
    overvalued: { min: -30, max: -21, label: "고평가", description: "적정가 대비 21~30% 비쌈" },
    veryOvervalued: { max: -30, label: "매우 고평가", description: "적정가 대비 30% 이상 비쌈" },
  },
};

/**
 * RSI 기준
 */
export const RSI_CRITERIA = {
  overbought: { min: 70, label: "과매수", description: "단기 조정 가능성, 매도 고려" },
  bullish: { min: 50, max: 70, label: "상승 추세", description: "강한 모멘텀, 매수 적합" },
  neutral: { min: 40, max: 50, label: "중립", description: "관망" },
  bearish: { min: 30, max: 40, label: "하락 추세", description: "약한 모멘텀" },
  oversold: { max: 30, label: "과매도", description: "반등 가능성, 매수 고려" },
};

/**
 * 베타 기준
 */
export const BETA_CRITERIA = {
  veryHigh: { min: 2.0, label: "매우 높은 변동성", description: "시장 대비 2배 이상 변동 (고위험)" },
  high: { min: 1.5, max: 2.0, label: "높은 변동성", description: "시장 대비 1.5~2배 변동" },
  slightlyHigh: { min: 1.0, max: 1.5, label: "다소 높은 변동성", description: "시장보다 약간 높은 변동성" },
  normal: { min: 0.5, max: 1.0, label: "보통 변동성", description: "시장과 유사한 변동성" },
  low: { max: 0.5, label: "낮은 변동성", description: "안정적 (방어주)" },
};
