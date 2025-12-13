/**
 * 각 지표의 간략한 설명 (자세히 버튼 클릭 전 표시)
 */
export const METRIC_SHORT_DESCRIPTIONS: Record<string, string> = {
  // 기본 정보
  "Ticker": "주식의 고유 식별 기호",
  "Name": "회사의 공식 명칭",
  "Sector": "산업 분류",
  "Industry": "세부 산업 분류",

  // 가격 및 시가총액
  "Price": "현재 주가",
  "MktCap": "시가총액 (주가 × 발행주식수)",
  "DollarVol": "일평균 거래대금",

  // 밸류에이션 지표
  "PE": "주가가 이익 대비 비싼지 판단",
  "PEG": "성장성 대비 주가가 적정한지 판단",
  "PB": "회사 자산 대비 주가 수준",
  "PS": "매출 대비 주가 수준",
  "EV_EBITDA": "기업가치 대비 영업이익",
  "FairValue": "상장사 적정가치 평가",
  "Discount": "현재가 대비 할인율 (양수: 저평가)",

  // 재무 지표
  "ROE": "주주의 투자금으로 벌어들인 이익 비율",
  "ROA": "자산을 활용한 이익 창출 효율",
  "OpMarginTTM": "매출 중 영업이익 비율",
  "OperatingMargins": "영업이익률",
  "FCF_Yield": "시가총액 대비 현금창출력",
  "DivYield": "주가 대비 배당금 수익률",
  "PayoutRatio": "순이익 중 배당금 비율",
  "GrossMargins": "매출 중 원가 제외한 이익 비율",
  "NetMargins": "매출 중 순이익 비율",

  // 성장성 지표
  "RevYoY": "전년 대비 매출 증가율",
  "EPS_Growth_3Y": "최근 3년 주당순이익 성장률",
  "Revenue_Growth_3Y": "최근 3년 매출 성장률",
  "EBITDA_Growth_3Y": "최근 3년 영업이익 성장률",

  // 기술적 지표
  "RSI_14": "과매수/과매도 판단 지표 (0-100)",
  "MACD": "단기-중기 이동평균 추세 지표",
  "MACD_Signal": "MACD의 매매 신호",
  "MACD_Histogram": "MACD와 신호선의 차이",
  "BB_Position": "볼린저밴드 내 주가 위치 (0-1)",
  "ATR_PCT": "주가 대비 변동폭 비율",
  "Volatility_21D": "최근 21일 주가 변동 정도",
  "SMA20": "최근 20일 평균주가",
  "SMA50": "최근 50일 평균주가",
  "SMA200": "최근 200일 평균주가",

  // 수익률 지표
  "RET5": "최근 5일 주가 변동률",
  "RET20": "최근 20일 주가 변동률",
  "RET63": "최근 63일 주가 변동률",
  "Momentum_12M": "최근 12개월 주가 변동률",
  "High_52W_Ratio": "52주 고가 대비 현재가",
  "Low_52W_Ratio": "52주 저가 대비 현재가",

  // 리스크 지표
  "Beta": "시장 대비 주가 변동성",
  "ShortPercent": "공매도 비율 (높을수록 위험)",
  "InsiderOwnership": "경영진 및 내부자 지분율",
  "InstitutionOwnership": "기관 투자자 지분율",

  // 거래 지표
  "RVOL": "평균 거래량 대비 현재 거래량",

  // AI 점수
  "GrowthScore": "매출·이익 성장성 평가 (0-100점)",
  "QualityScore": "수익성·현금창출력 평가 (0-100점)",
  "ValueScore": "밸류에이션 평가 (0-100점)",
  "MomentumScore": "기술적 추세·거래량 평가 (0-100점)",
  "TotalScore": "종합 투자 매력도 (0-100점)",
};
