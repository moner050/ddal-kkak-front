// ------------------------------------------------------------------
// 재무 지표 설명
// ------------------------------------------------------------------
export const METRIC_DESCRIPTIONS: Record<string, string> = {
  // 기본 정보
  "Ticker": "주식의 고유 식별 기호 (예: AAPL, MSFT)",
  "Name": "회사의 공식 명칭",
  "Sector": "GICS 기준 산업 분류 (예: Technology, Healthcare)",
  "Industry": "세부 산업 분류 (예: Consumer Electronics, Pharmaceuticals)",

  // 가격 및 시가총액
  "Price": "현재 주가 (단위: USD)",
  "MktCap": "시가총액 = 주가 × 발행주식수 (10억 달러 단위)",
  "DollarVol": "거래대금 = 주가 × 거래량 (일평균, 백만 달러 단위). 유동성 지표",

  // 밸류에이션 지표
  "PE": "주가수익비율 (P/E) = 주가 / 주당순이익(EPS). 낮을수록 저평가. 출처: Yahoo Finance API",
  "PEG": "PEG 비율 = P/E / 성장률(%). PEG < 1.0이면 성장 대비 저평가. 계산식: PE / (earningsGrowth × 100)",
  "PB": "주가순자산비율 (P/B) = 주가 / 주당순자산(BPS). 낮을수록 저평가. 출처: Yahoo Finance API",
  "PS": "주가매출비율 (P/S) = 시가총액 / 매출액. 낮을수록 저평가. 출처: Yahoo Finance API",
  "EV_EBITDA": "EV/EBITDA = 기업가치 / 세전영업이익. 밸류에이션 지표",
  "FairValue": "적정가치 = 섹터 중앙값 P/E 방법과 Peter Lynch PEG 방법론의 중앙값. PEG=1일 때 적정 P/E = 성장률 원칙 적용",
  "Discount": "할인율 = (적정가치 - 현재가) / 현재가 × 100. 양수: 저평가 (상승여력), 음수: 고평가 (하락위험)",

  // 재무 지표
  "ROE": "자기자본이익률 (ROE) = 당기순이익 / 자기자본 × 100. 높을수록 수익성 우수. 출처: Yahoo Finance API",
  "ROA": "총자산이익률 (ROA) = 당기순이익 / 총자산 × 100. 자산 활용 효율성 지표",
  "OpMarginTTM": "영업이익률 (TTM) = 영업이익 / 매출액 × 100. 높을수록 수익성 우수. 출처: Yahoo Finance API",
  "OperatingMargins": "영업이익률 = 영업이익 / 매출액 × 100. 출처: Yahoo Finance API",
  "FCF_Yield": "잉여현금흐름 수익률 = FCF / 시가총액 × 100. 높을수록 현금 창출력 우수",
  "DivYield": "배당수익률 = 연간 배당금 / 주가 × 100. 배당 투자자에게 중요",
  "PayoutRatio": "배당성향 = 배당금 / 순이익 × 100",
  "GrossMargins": "매출총이익률 - 높을수록 우수",
  "NetMargins": "순이익률 - 높을수록 우수",

  // 성장성 지표
  "RevYoY": "매출 성장률 (YoY) = (올해 매출 - 작년 매출) / 작년 매출 × 100. 출처: Yahoo Finance API",
  "EPS_Growth_3Y": "EPS 성장률 (3년 평균) = (현재 EPS / 3년 전 EPS)^(1/3) - 1. 장기 수익성 성장 지표",
  "Revenue_Growth_3Y": "매출 성장률 (3년 평균). 장기 성장 추세 파악",
  "EBITDA_Growth_3Y": "EBITDA 성장률 (3년 평균). 영업이익 성장 추세",

  // 기술적 지표
  "RSI_14": "상대강도지수 (RSI, 14일) = 100 - (100 / (1 + RS)). RSI > 70: 과매수, RSI < 30: 과매도. 계산: Wilder's Smoothing Method",
  "MACD": "MACD = EMA(12) - EMA(26). 이동평균 수렴확산 지표. MACD > 0: 상승 추세",
  "MACD_Signal": "MACD 시그널선 = EMA(MACD, 9). 매매 신호 판단",
  "MACD_Histogram": "MACD 히스토그램 = MACD - Signal. 양수면 상승 모멘텀",
  "BB_Position": "볼린저밴드 위치 = (현재가 - Lower Band) / (Upper Band - Lower Band). 0~1 범위. 0.2 이하: 과매도, 0.8 이상: 과매수",
  "ATR_PCT": "ATR% = ATR / 주가 × 100. 주가 대비 변동폭. 2~5%: 적당한 변동성",
  "Volatility_21D": "21일 변동성 = 수익률의 표준편차",
  "SMA20": "20일 이동평균선. 단기 추세 파악",
  "SMA50": "50일 이동평균선. 중기 추세 파악",
  "SMA200": "200일 이동평균선. 장기 추세 파악",

  // 수익률 지표
  "RET5": "5일 수익률 = (현재가 - 5일 전 가격) / 5일 전 가격 × 100. 단기 모멘텀",
  "RET20": "20일 수익률 = (현재가 - 20일 전 가격) / 20일 전 가격 × 100. 중기 모멘텀",
  "RET63": "63일 수익률 = (현재가 - 63일 전 가격) / 63일 전 가격 × 100. 분기 수익률",
  "Momentum_12M": "12개월 모멘텀. 연간 주가 변동 추세",
  "High_52W_Ratio": "52주 고가 대비 비율 = 현재가 / 52주 최고가. 1에 가까울수록 고점 근처",
  "Low_52W_Ratio": "52주 저가 대비 비율 = 현재가 / 52주 최저가. 1에 가까울수록 저점 근처",

  // 리스크 지표
  "Beta": "베타 = 시장 대비 변동성. Beta > 1: 시장보다 변동성 큼, Beta < 1: 안정적. 출처: Yahoo Finance API",
  "ShortPercent": "공매도 비율 = 공매도량 / 유통주식수 × 100. 높을수록 하락 위험. 출처: Yahoo Finance API",
  "InsiderOwnership": "내부자 지분율 = 내부자 보유 주식 / 총 발행 주식",
  "InstitutionOwnership": "기관 투자자 지분율 = 기관 보유 주식 / 총 발행 주식",

  // 거래 지표
  "RVOL": "상대 거래량 (RVOL) = 현재 거래량 / 평균 거래량(3개월). RVOL > 1.3: 거래량 급증",

  // AI 점수
  "GrowthScore": "성장 점수 (0-100) = 매출성장률, EPS성장률, 20일수익률 기반. 섹터별 정규화 적용 (섹터 내 40% + 전체 60%). 음수 성장률 시 페널티",
  "QualityScore": "품질 점수 (0-100) = ROE, 영업이익률, FCF Yield 기반. 섹터별 정규화 적용 (섹터 내 40% + 전체 60%). 음수 ROE/영업이익률 시 페널티",
  "ValueScore": "가치 점수 (0-100) = P/E, PEG, P/B 기반. 낮을수록 높은 점수. 섹터별 정규화 적용 (섹터 내 40% + 전체 60%)",
  "MomentumScore": "모멘텀 점수 (0-100) = RVOL, 5일수익률, 52주고가비율, RSI, MACD 기반. 기술적 지표 중심",
  "TotalScore": "종합 점수 (0-100) = 성장 25% + 품질 30% + 가치 30% + 모멘텀 15% 가중평균. 70점 이상: 매수, 50-69점: 중립, 50점 미만: 부진",
};

/**
 * 계산 방식 가이드 페이지 URL
 */
export const CALCULATION_GUIDE_URL = "/calculation-guide";
