/**
 * 백엔드 API에서 받은 영문 sector/industry를 한글로 매핑
 * GICS(Global Industry Classification Standard) 기준 유지
 */

// Sector 매핑 (11개 GICS 섹터)
export const SECTOR_MAPPING: Record<string, string> = {
  // API에서 사용하는 표준 GICS 섹터 이름 (GicsSector 타입과 일치)
  "Information Technology": "정보기술",
  "Communication Services": "커뮤니케이션 서비스",
  "Consumer Discretionary": "경기소비재",
  "Consumer Staples": "필수소비재",
  "Healthcare": "헬스케어",
  "Financials": "금융",
  "Industrials": "산업재",
  "Materials": "소재",
  "Energy": "에너지",
  "Utilities": "유틸리티",
  "Real Estate": "부동산",

  // 하위 호환성을 위한 별칭 (이전 버전 지원)
  "Technology": "정보기술",
  "Financial Services": "금융",
  "Consumer Cyclical": "경기소비재",
  "Consumer Defensive": "필수소비재",
  "Basic Materials": "소재",
};

// Industry 매핑 (GICS 산업군 기준, 가독성 향상)
export const INDUSTRY_MAPPING: Record<string, string> = {
  // 정보기술
  "Software - Application": "소프트웨어",
  "Software - Infrastructure": "소프트웨어",
  "Communication Equipment": "통신장비",
  "Information Technology Services": "IT 서비스",
  "Computer Hardware": "하드웨어",
  "Semiconductors": "반도체",
  "Electronic Components": "전자기기",
  "Solar": "태양광",
  "Semiconductor Equipment & Materials": "반도체 장비",
  "Electronics & Computer Distribution": "전자기기",

  // 커뮤니케이션 서비스
  "Telecom Services": "통신",
  "Broadcasting": "미디어",
  "Internet Content & Information": "인터넷 플랫폼",
  "Advertising Agencies": "광고",
  "Publishing": "미디어",
  "Electronic Gaming & Multimedia": "게임",
  "Entertainment": "엔터테인먼트",

  // 경기소비재
  "Resorts & Casinos": "호텔·레저",
  "Furnishings, Fixtures & Appliances": "가전",
  "Apparel Retail": "의류",
  "Residential Construction": "주택건설",
  "Specialty Retail": "소매",
  "Packaging & Containers": "용기·포장재",
  "Leisure": "호텔·레저",
  "Internet Retail": "이커머스",
  "Lodging": "호텔·레저",
  "Restaurants": "음식점",
  "Travel Services": "여행",
  "Auto Parts": "자동차",
  "Auto Manufacturers": "자동차",
  "Apparel Manufacturing": "의류",
  "Auto & Truck Dealerships": "자동차",
  "Personal Services": "개인서비스",
  "Gambling": "호텔·레저",
  "Recreational Vehicles": "자동차",
  "Footwear & Accessories": "의류",

  // 필수소비재
  "Education & Training Services": "교육서비스",
  "Packaged Foods": "식품",
  "Beverages - Non-Alcoholic": "음료",
  "Household & Personal Products": "생활용품",
  "Discount Stores": "슈퍼마켓",
  "Grocery Stores": "슈퍼마켓",
  "Farm Products": "농산물",
  "Tobacco": "담배",
  "Confectioners": "식품",
  "Food Distribution": "식품",
  "Beverages - Brewers": "음료",

  // 헬스케어
  "Medical Care Facilities": "의료서비스",
  "Biotechnology": "바이오의약품",
  "Drug Manufacturers - Specialty & Generic": "제약",
  "Diagnostics & Research": "의료기기",
  "Health Information Services": "의료서비스",
  "Drug Manufacturers - General": "제약",
  "Medical Devices": "의료기기",
  "Medical Instruments & Supplies": "의료기기",

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
  "Financial Data & Stock Exchanges": "증권",
  "Banks - Diversified": "은행",
  "Capital Markets": "증권",
  "Insurance - Specialty": "보험",

  // 산업재
  "Marine Shipping": "운송",
  "Farm & Heavy Construction Machinery": "기계",
  "Electrical Equipment & Parts": "전기장비",
  "Aerospace & Defense": "항공우주",
  "Airlines": "항공",
  "Railroads": "운송",
  "Airports & Air Services": "항공",
  "Security & Protection Services": "보안서비스",
  "Specialty Industrial Machinery": "기계",
  "Rental & Leasing Services": "임대서비스",
  "Metal Fabrication": "금속가공",
  "Engineering & Construction": "건설",
  "Consulting Services": "컨설팅",
  "Specialty Business Services": "비즈니스 서비스",
  "Staffing & Employment Services": "인력서비스",
  "Building Products & Equipment": "건설",
  "Conglomerates": "복합기업",

  // 소재
  "Gold": "금속",
  "Agricultural Inputs": "화학",
  "Specialty Chemicals": "화학",
  "Building Materials": "건축자재",
  "Steel": "금속",
  "Silver": "금속",
  "Copper": "금속",
  "Lumber & Wood Production": "목재",
  "Coking Coal": "석탄",
  "Other Industrial Metals & Mining": "금속",
  "Chemicals": "화학",

  // 에너지
  "Oil & Gas Midstream": "석유·가스",
  "Oil & Gas E&P": "석유·가스",
  "Oil & Gas Drilling": "석유·가스",
  "Oil & Gas Refining & Marketing": "석유·가스",
  "Thermal Coal": "석탄",
  "Oil & Gas Integrated": "석유·가스",
  "Uranium": "우라늄",

  // 유틸리티
  "Utilities - Regulated Electric": "전력",
  "Utilities - Regulated Gas": "가스",
  "Utilities - Regulated Water": "수도",
  "Utilities - Diversified": "전력",
  "Utilities - Renewable": "신재생에너지",
  "Utilities - Independent Power Producers": "전력",

  // 부동산
  "REIT - Mortgage": "리츠",
  "REIT - Retail": "리츠",
  "REIT - Specialty": "리츠",
  "Real Estate Services": "부동산 서비스",
  "REIT - Industrial": "리츠",
  "REIT - Healthcare Facilities": "리츠",
  "REIT - Residential": "리츠",
  "REIT - Hotel & Motel": "리츠",
  "REIT - Diversified": "리츠",
  "REIT - Office": "리츠",
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
