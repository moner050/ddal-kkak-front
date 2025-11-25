/**
 * 백엔드 API에서 받은 영문 sector/industry를 한글로 매핑
 * GICS(Global Industry Classification Standard) 기준 유지
 */

// Sector 매핑 (11개 GICS 섹터)
export const SECTOR_MAPPING: Record<string, string> = {
  "Technology": "정보기술",
  "Communication Services": "커뮤니케이션 서비스",
  "Consumer Cyclical": "경기소비재",
  "Consumer Defensive": "필수소비재",
  "Healthcare": "헬스케어",
  "Financial Services": "금융",
  "Industrials": "산업재",
  "Basic Materials": "소재",
  "Energy": "에너지",
  "Utilities": "유틸리티",
  "Real Estate": "부동산",
};

// Industry 매핑 (GICS 산업군 기준, 가독성 향상)
export const INDUSTRY_MAPPING: Record<string, string> = {
  // 정보기술
  "Software - Application": "소프트웨어",
  "Software - Infrastructure": "소프트웨어",
  "Communication Equipment": "통신장비",

  // 금융
  "Banks - Regional": "은행",
  "Asset Management": "자산운용",
  "Insurance - Reinsurance": "보험",
  "Insurance - Life": "보험",
  "Insurance - Property & Casualty": "보험",
  "Insurance - Diversified": "보험",
  "Credit Services": "금융서비스",
  "Mortgage Finance": "모기지",
  "Financial Conglomerates": "금융지주",

  // 부동산
  "REIT - Mortgage": "리츠",
  "REIT - Retail": "리츠",

  // 소재
  "Gold": "금속",
  "Agricultural Inputs": "화학",

  // 헬스케어
  "Medical Care Facilities": "의료서비스",
  "Biotechnology": "바이오의약품",
  "Drug Manufacturers - Specialty & Generic": "제약",

  // 유틸리티
  "Utilities - Regulated Electric": "전력",

  // 경기소비재
  "Resorts & Casinos": "호텔·레저",
  "Furnishings, Fixtures & Appliances": "가전",

  // 커뮤니케이션 서비스
  "Telecom Services": "통신",
  "Broadcasting": "미디어",
  "Internet Content & Information": "인터넷 플랫폼",

  // 산업재
  "Marine Shipping": "운송",

  // 에너지
  "Oil & Gas Midstream": "석유·가스",
  "Oil & Gas E&P": "석유·가스",

  // 필수소비재
  "Education & Training Services": "교육서비스",
  "Packaged Foods": "식품",
};

/**
 * 영문 sector를 한글로 변환
 * @param sector 영문 sector 이름
 * @returns 한글 sector 이름 (매핑 없으면 원본 반환)
 */
export function toKoreanSector(sector: string): string {
  return SECTOR_MAPPING[sector] || sector;
}

/**
 * 영문 industry를 한글로 변환
 * @param industry 영문 industry 이름
 * @returns 한글 industry 이름 (매핑 없으면 원본 반환)
 */
export function toKoreanIndustry(industry: string): string {
  return INDUSTRY_MAPPING[industry] || industry;
}

/**
 * sector와 industry를 모두 한글로 변환
 * @param sector 영문 sector
 * @param industry 영문 industry
 * @returns 한글 sector와 industry
 */
export function toKoreanSectorIndustry(sector: string, industry: string): {
  sector: string;
  industry: string;
} {
  return {
    sector: toKoreanSector(sector),
    industry: toKoreanIndustry(industry),
  };
}
