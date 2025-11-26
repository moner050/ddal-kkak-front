/**
 * 초보자 모드용 지표 설명 및 해석 가이드
 */

// 핵심 지표 (초보자 모드에서 보여줄 지표들)
export const CORE_METRICS = ['aiScore', 'ROE', 'PER', 'PEG'] as const;

// 지표별 상세 설명 (초보자 친화적)
export const METRIC_BEGINNER_GUIDE: Record<string, {
  name: string;
  shortDesc: string;
  fullDesc: string;
  goodRange: string;
  interpretation: (value: number) => { level: 'good' | 'normal' | 'bad'; text: string };
}> = {
  aiScore: {
    name: '종합 투자 점수',
    shortDesc: '종합 투자 매력도',
    fullDesc: '기업의 재무 건전성, 성장성, 밸류에이션 등 다양한 지표를 종합 분석하여 0~100점으로 산출한 점수입니다. 점수가 높을수록 투자 매력도가 높다고 판단됩니다.',
    goodRange: '70점 이상 추천',
    interpretation: (value) => {
      if (value >= 80) return { level: 'good', text: '매우 우수 - 투자 매력도 높음' };
      if (value >= 70) return { level: 'good', text: '우수 - 긍정적 전망' };
      if (value >= 60) return { level: 'normal', text: '보통 - 추가 분석 필요' };
      return { level: 'bad', text: '주의 - 신중한 검토 필요' };
    }
  },
  ROE: {
    name: '자기자본이익률(ROE)',
    shortDesc: '주주가 투자한 돈으로 얼마나 벌었나',
    fullDesc: 'Return on Equity의 약자로, 기업이 주주의 투자금(자기자본)을 활용해 얼마나 효율적으로 이익을 냈는지 보여주는 지표입니다. 쉽게 말해 "100원 투자해서 몇 원을 벌었나"입니다.',
    goodRange: '15% 이상 우수',
    interpretation: (value) => {
      if (value >= 20) return { level: 'good', text: '매우 우수 - 효율적 경영' };
      if (value >= 15) return { level: 'good', text: '우수 - 양호한 수익성' };
      if (value >= 10) return { level: 'normal', text: '보통 - 평균 수준' };
      return { level: 'bad', text: '주의 - 수익성 개선 필요' };
    }
  },
  PER: {
    name: '주가수익비율(PER)',
    shortDesc: '주가가 이익 대비 비싼지 판단',
    fullDesc: 'Price to Earnings Ratio의 약자로, 현재 주가가 기업 이익의 몇 배인지 보여줍니다. PER 10이면 "기업이 10년간 현재 이익을 유지하면 투자금 회수"라는 의미입니다. 낮을수록 저평가되었을 가능성이 높습니다.',
    goodRange: '15배 이하 저평가',
    interpretation: (value) => {
      if (value <= 10) return { level: 'good', text: '매우 저평가 - 매력적 가격' };
      if (value <= 15) return { level: 'good', text: '저평가 - 합리적 가격' };
      if (value <= 25) return { level: 'normal', text: '적정 - 시장 평균 수준' };
      return { level: 'bad', text: '고평가 - 프리미엄 반영됨' };
    }
  },
  PEG: {
    name: 'PEG 비율',
    shortDesc: '성장성 대비 주가가 적정한지',
    fullDesc: 'PER을 이익 성장률로 나눈 값입니다. PER이 높아도 성장이 빠르면 PEG는 낮아집니다. 1 이하면 "성장성 대비 저평가", 2 이상이면 "성장성 대비 고평가"로 해석합니다.',
    goodRange: '1.0 이하 매력적',
    interpretation: (value) => {
      if (value <= 0.5) return { level: 'good', text: '매우 매력적 - 성장 대비 저평가' };
      if (value <= 1.0) return { level: 'good', text: '매력적 - 적정 밸류' };
      if (value <= 2.0) return { level: 'normal', text: '적정 - 성장 반영됨' };
      return { level: 'bad', text: '고평가 - 기대 과다 반영' };
    }
  },
  PBR: {
    name: '주가순자산비율(PBR)',
    shortDesc: '회사 자산 대비 주가 수준',
    fullDesc: 'Price to Book Ratio의 약자로, 주가가 기업의 순자산(자본)의 몇 배인지 보여줍니다. PBR 1 미만이면 "회사 청산 시 받을 금액보다 주가가 낮다"는 의미로, 극단적 저평가 상태일 수 있습니다.',
    goodRange: '2.0 이하 저평가',
    interpretation: (value) => {
      if (value <= 1.0) return { level: 'good', text: '매우 저평가 - 자산가치 미반영' };
      if (value <= 2.0) return { level: 'good', text: '저평가 - 합리적 수준' };
      if (value <= 4.0) return { level: 'normal', text: '적정 - 성장 프리미엄 포함' };
      return { level: 'bad', text: '고평가 - 높은 기대치 반영' };
    }
  },
  PSR: {
    name: '주가매출비율(PSR)',
    shortDesc: '매출 대비 주가 수준',
    fullDesc: 'Price to Sales Ratio의 약자로, 시가총액을 연간 매출로 나눈 값입니다. 아직 이익을 내지 못하는 성장 기업을 평가할 때 유용합니다. 낮을수록 매출 대비 저평가입니다.',
    goodRange: '2.0 이하 저평가',
    interpretation: (value) => {
      if (value <= 1.0) return { level: 'good', text: '매우 저평가 - 매출 대비 저렴' };
      if (value <= 2.0) return { level: 'good', text: '저평가 - 합리적 수준' };
      if (value <= 5.0) return { level: 'normal', text: '적정 - 성장 기대 반영' };
      return { level: 'bad', text: '고평가 - 높은 성장 기대' };
    }
  },
  RevYoY: {
    name: '매출 성장률(YoY)',
    shortDesc: '전년 대비 매출 증가율',
    fullDesc: 'Year over Year 매출 성장률로, 작년 같은 기간 대비 올해 매출이 얼마나 늘었는지 보여줍니다. 꾸준한 매출 성장은 기업의 경쟁력과 시장 확대를 의미합니다.',
    goodRange: '10% 이상 양호',
    interpretation: (value) => {
      if (value >= 20) return { level: 'good', text: '고성장 - 빠른 사업 확장' };
      if (value >= 10) return { level: 'good', text: '양호한 성장 - 안정적 확대' };
      if (value >= 0) return { level: 'normal', text: '정체 - 성장 동력 필요' };
      return { level: 'bad', text: '역성장 - 매출 감소 주의' };
    }
  },
  EPS_Growth_3Y: {
    name: '3년 EPS 성장률',
    shortDesc: '주당순이익의 3년간 성장률',
    fullDesc: '주당순이익(EPS)이 3년간 연평균 얼마나 성장했는지 보여줍니다. 장기적으로 이익이 늘어나는 기업은 주가도 함께 상승하는 경향이 있습니다.',
    goodRange: '10% 이상 양호',
    interpretation: (value) => {
      if (value >= 20) return { level: 'good', text: '고성장 - 이익 급증' };
      if (value >= 10) return { level: 'good', text: '양호한 성장 - 꾸준한 이익 증가' };
      if (value >= 0) return { level: 'normal', text: '정체 - 이익 유지 수준' };
      return { level: 'bad', text: '이익 감소 - 실적 악화 주의' };
    }
  },
  OpMarginTTM: {
    name: '영업이익률',
    shortDesc: '매출 중 영업이익 비율',
    fullDesc: '매출에서 영업이익이 차지하는 비율입니다. 높을수록 본업에서 효율적으로 돈을 번다는 의미입니다. 업종별로 평균이 다르므로 같은 업종 내 비교가 중요합니다.',
    goodRange: '15% 이상 우수',
    interpretation: (value) => {
      if (value >= 20) return { level: 'good', text: '매우 우수 - 높은 수익성' };
      if (value >= 15) return { level: 'good', text: '우수 - 양호한 마진' };
      if (value >= 10) return { level: 'normal', text: '보통 - 평균 수준' };
      return { level: 'bad', text: '낮음 - 마진 개선 필요' };
    }
  },
  FCF_Yield: {
    name: 'FCF 수익률',
    shortDesc: '시가총액 대비 현금창출력',
    fullDesc: 'Free Cash Flow Yield로, 기업이 실제로 창출하는 현금을 시가총액으로 나눈 값입니다. 높을수록 투자금 대비 현금 창출 능력이 좋습니다. 배당이나 자사주 매입 여력을 가늠할 수 있습니다.',
    goodRange: '5% 이상 우수',
    interpretation: (value) => {
      if (value >= 8) return { level: 'good', text: '매우 우수 - 현금 창출 탁월' };
      if (value >= 5) return { level: 'good', text: '우수 - 양호한 현금흐름' };
      if (value >= 2) return { level: 'normal', text: '보통 - 평균 수준' };
      return { level: 'bad', text: '낮음 - 현금흐름 주의' };
    }
  }
};

// 종합 점수 해석 텍스트
export const AI_SCORE_INTERPRETATION = {
  getLabel: (score: number): string => {
    if (score >= 85) return '매우 우수';
    if (score >= 70) return '우수';
    if (score >= 55) return '보통';
    if (score >= 40) return '주의';
    return '위험';
  },
  getStars: (score: number): number => {
    if (score >= 85) return 5;
    if (score >= 70) return 4;
    if (score >= 55) return 3;
    if (score >= 40) return 2;
    return 1;
  },
  getDescription: (score: number): string => {
    if (score >= 85) return '투자 매력도가 매우 높습니다. 재무 건전성과 성장성 모두 우수합니다.';
    if (score >= 70) return '투자 매력도가 높습니다. 전반적으로 긍정적인 지표를 보입니다.';
    if (score >= 55) return '평균적인 투자 매력도입니다. 추가적인 분석을 권장합니다.';
    if (score >= 40) return '투자에 주의가 필요합니다. 일부 지표에서 우려 사항이 있습니다.';
    return '투자 위험이 높습니다. 신중한 검토가 필요합니다.';
  }
};

// 감정 분석 해석
export const SENTIMENT_GUIDE = {
  POS: {
    label: '긍정적',
    emoji: '📈',
    description: '기업에 호재성 뉴스나 공시입니다. 주가에 긍정적 영향이 예상됩니다.',
    color: 'emerald'
  },
  NEU: {
    label: '중립적',
    emoji: '➡️',
    description: '주가에 큰 영향이 없을 것으로 예상되는 일반적인 공시입니다.',
    color: 'gray'
  },
  NEG: {
    label: '부정적',
    emoji: '📉',
    description: '기업에 악재성 뉴스나 공시입니다. 주가에 부정적 영향이 예상됩니다.',
    color: 'red'
  }
};

// 공시 유형 설명
export const FILING_TYPE_GUIDE: Record<string, { name: string; description: string }> = {
  '10-K': {
    name: '연간 보고서',
    description: '1년간의 재무 실적을 담은 가장 중요한 보고서입니다. 기업의 전체적인 건강 상태를 파악할 수 있습니다.'
  },
  '10-Q': {
    name: '분기 보고서',
    description: '분기별(3개월) 재무 실적 보고서입니다. 기업의 최근 동향을 파악하는 데 유용합니다.'
  },
  '8-K': {
    name: '수시 공시',
    description: '중요한 사건(인수합병, 경영진 변경, 대규모 계약 등) 발생 시 제출하는 긴급 보고서입니다.'
  },
  '사업보고서': {
    name: '사업보고서',
    description: '한국 기업의 연간 실적 보고서입니다. 미국의 10-K와 유사합니다.'
  },
  '분기보고서': {
    name: '분기보고서',
    description: '한국 기업의 분기별 실적 보고서입니다.'
  },
  '주요사항보고서': {
    name: '주요사항보고서',
    description: '기업의 중요한 변동 사항을 알리는 수시 공시입니다.'
  }
};
