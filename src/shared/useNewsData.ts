export type NewsItem = {
  id: string;
  date: string;
  category: string;
  title: string;
  summary?: string;
  body?: string;
  link?: string;
  importance: number;
  reason: string;
};

export const NEWS_CATEGORIES = ['전체','거시경제','금융시장','기업/산업','부동산','소비/고용','정책/제도','정치'] as const;

const mock: NewsItem[] = [
  { id: 'n1', date: '2025-10-16 12:00:45', category: '거시경제', title: '트럼프, 다음달 관세 재판에 "현장 방청할 생각"…美 대통령 최초 사례 되나', summary: '트럼프, 연방대법원 관세 심리 방청 의사 표명.', link: 'https://www.hankyung.com/article/2025101626227', importance: 8, reason: 'IEEPA 근거 관세 적법성 여부가 거시경제에 광범위한 영향.' },
  { id: 'n2', date: '2025-10-16 07:23:33', category: '거시경제', title: "'10일 내' 무역협상 타결 기대감…'3500억달러 패키지' 운명은", summary: '한미 무역협상 타결 임박, 통화스와프 등 논의.', link: 'https://www.hankyung.com/article/2025101615667', importance: 8, reason: '대규모 투자/관세/외환시장 영향.' },
  { id: 'n3', date: '2025-10-16 05:26:38', category: '거시경제', title: '베선트 "한미 관세협상, 열흘 내 어떤 결과 나올 것"', summary: 'APEC 전 결과 가능성 언급, 투자 방식 조율.', link: 'https://www.hankyung.com/article/202510161460i', importance: 8, reason: '거시지표에 즉각적 영향 가능.' },
  { id: 'n4', date: '2025-10-16 11:30:06', category: '거시경제', title: '韓협상단, 내일 美백악관 예산국 방문…관세 협상 막바지', summary: '최종 문구 조율, 3500억달러 조달 방식 쟁점.', link: 'https://www.hankyung.com/article/2025101625437', importance: 7, reason: '외환보유액/국가부채 변수.' },
  { id: 'n5', date: '2025-10-16 11:19:29', category: '거시경제', title: '트럼프 "한국 3500억달러 선불" 또 거론', summary: '선불 지급 주장으로 불확실성 증폭.', link: 'https://www.hankyung.com/article/202510162536i', importance: 7, reason: '무역/환율에 잠재적 영향.' },
  { id: 'o1', date: '2025-10-15 10:00:00', category: '기업/산업', title: '삼성전자 HBM 증설 발표', summary: 'AI 수요 대응 생산능력 확대.', link: '#', importance: 8, reason: 'AI 공급망 영향' },
  { id: 'o2', date: '2025-10-14 10:00:00', category: '거시경제', title: '미 연준 의사록: 추가 인상 가능성 낮아', summary: '금리 동결 기조 유지', link: '#', importance: 9, reason: '시장 변동성 직접 영향' },
  { id: 'o3', date: '2025-10-13 10:00:00', category: '금융시장', title: '달러/원 1330원대 재진입', summary: '위험선호 회복으로 환율 하락', link: '#', importance: 7, reason: '수출/수입주 민감' }
];

export function useNewsData(): NewsItem[] {
  return mock;
}
