// Tab 타입
export const TAB_KEYS = ["home", "undervalued", "filings", "watchlist", "detail"] as const;
export type TabKey = (typeof TAB_KEYS)[number];

// 감정 분석 타입
export type Sentiment = "POS" | "NEG" | "NEU";
export type SentimentFilter = "ALL" | Sentiment;

// 시장 타입
export type Market = "US" | "KR";
export type MarketFilter = "전체" | Market;

// 정렬 방향
export type SortDirection = "asc" | "desc";

// 상세 탭 타입
export type DetailTabKey = "info" | "filings";

// Stock 관련 타입
export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  industry?: string;
  market: Market;
  aiScore?: number;
  sentiment?: Sentiment;
  logoUrl?: string;
  price?: number;
  change?: number;
  changePercent?: number;
}

// Filing 관련 타입
export interface Filing {
  id: string;
  symbol: string;
  company: string;
  formType: string;
  date: string;
  summary: string;
  aiScore: number;
  sentiment: Sentiment;
  previousScores?: number[];
  market: Market;
}

// 스크롤 위치 저장 타입
export type ScrollPositions = Record<TabKey, number>;
