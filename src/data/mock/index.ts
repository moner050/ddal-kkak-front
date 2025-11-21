/**
 * Mock 데이터 통합 export
 * 백엔드 API 연동 전까지 임시로 사용
 */

// Types
export * from "./types";

// Market Data
export {
  categoryMovesUS,
  categoryMovesKR,
  usdKrwData,
  goldUsdData,
  sp500Data,
  kospiData,
  us10YData,
  vixData,
  btcData,
  wtiData,
  usFearGreedSeries,
  krFearGreedSeries,
  usBuffettSeries,
  krBuffettSeries,
} from "./marketData";

// Stock Data
export {
  featuredStocks,
  filings,
  undervaluedStocks,
  stockDetails,
} from "./stockData";

// News Data
export {
  NEWS_CATEGORIES,
  newsItems,
} from "./newsData";
