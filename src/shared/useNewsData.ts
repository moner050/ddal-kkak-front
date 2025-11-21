/**
 * 뉴스 데이터 Hook
 * 백엔드 API 연동 전까지 임시로 mock 데이터 사용
 */

import { NewsItem, NEWS_CATEGORIES, newsItems } from "../data/mock";

// Re-export for backward compatibility
export type { NewsItem };
export { NEWS_CATEGORIES };

export function useNewsData(): NewsItem[] {
  return newsItems;
}
