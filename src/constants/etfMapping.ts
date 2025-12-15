/**
 * ETF 카테고리와 섹터 한글 매핑
 * - ETF primary_sector를 GICS 섹터로 매핑
 * - ETF category를 한글로 매핑
 * - ETF 카테고리를 대분류/중분류/소분류로 계층화
 */

// ETF 카테고리 계층 구조 (대분류 → 중분류 → 소분류)
export const ETF_CATEGORY_HIERARCHY: Record<string, Record<string, string[]>> = {
  "주식형": {
    "규모별": ["Large Blend", "Large Growth", "Large Value", "Mid-Cap Blend", "Mid-Cap Growth", "Mid-Cap Value", "Small Blend", "Small Growth", "Small Value"],
    "섹터별": ["Technology", "Financial", "Health", "Equity Energy", "Consumer Cyclical", "Consumer Defensive", "Industrials", "Real Estate", "Utilities", "Communications", "Natural Resources"],
    "지역별": ["Global Large-Stock Blend", "Global Small/Mid Stock", "Foreign Large Blend", "Foreign Small/Mid Value", "Diversified Emerging Mkts", "China Region", "Japan Stock", "Europe Stock", "Latin America Stock", "India Equity", "Miscellaneous Region"],
    "원자재/귀금속": ["Commodities Focused", "Equity Precious Metals", "Commodities Broad Basket"],
  },
  "채권형": {
    "정부채": ["Long Government", "Short Government", "Intermediate Government", "Ultrashort Bond"],
    "회사채": ["Corporate Bond", "Long-Term Bond", "Short-Term Bond", "High Yield Bond", "Intermediate Core Bond"],
    "물가연동채": ["Inflation-Protected Bond", "Short-Term Inflation-Protected Bond"],
    "지방채": ["Muni National Interm", "Muni National Long"],
    "모기지/증권화": ["Government Mortgage-Backed Bond", "Securitized Bond - Focused"],
    "글로벌": ["Global Bond", "Global Bond-USD Hedged", "Emerging Markets Bond"],
  },
  "특수형": {
    "레버리지/인버스": ["Trading--Leveraged Equity", "Trading--Inverse Equity"],
    "디지털자산": ["Equity Digital Assets", "Digital Assets"],
    "기타": ["Infrastructure", "Miscellaneous Sector"],
  },
};

// ETF primary_sector → GICS Sector 매핑
// 백엔드에서 사용하는 소문자 언더스코어 형식을 GICS 표준 형식으로 변환
export const ETF_SECTOR_TO_GICS: Record<string, string> = {
  technology: "Information Technology",
  financial_services: "Financials",
  healthcare: "Healthcare",
  energy: "Energy",
  consumer_cyclical: "Consumer Discretionary",
  consumer_defensive: "Consumer Staples",
  industrials: "Industrials",
  realestate: "Real Estate",
  utilities: "Utilities",
  basic_materials: "Materials",
  communication_services: "Communication Services",
};

// ETF Category 한글 매핑
export const ETF_CATEGORY_MAPPING: Record<string, string> = {
  // 주식형 - 규모별
  "Large Blend": "대형 혼합",
  "Large Growth": "대형 성장",
  "Large Value": "대형 가치",
  "Mid-Cap Blend": "중형 혼합",
  "Mid-Cap Growth": "중형 성장",
  "Mid-Cap Value": "중형 가치",
  "Small Blend": "소형 혼합",
  "Small Growth": "소형 성장",
  "Small Value": "소형 가치",

  // 주식형 - 섹터별
  Technology: "기술",
  Financial: "금융",
  Health: "헬스케어",
  "Equity Energy": "에너지 주식",
  "Consumer Cyclical": "경기소비재",
  "Consumer Defensive": "필수소비재",
  Industrials: "산업재",
  "Real Estate": "부동산",
  Utilities: "유틸리티",
  Communications: "커뮤니케이션",
  "Natural Resources": "천연자원",

  // 주식형 - 원자재/귀금속
  "Commodities Focused": "원자재 집중",
  "Equity Precious Metals": "귀금속 주식",
  "Commodities Broad Basket": "원자재 바스켓",

  // 주식형 - 글로벌/지역별
  "Global Large-Stock Blend": "글로벌 대형주 혼합",
  "Global Small/Mid Stock": "글로벌 중소형주",
  "Foreign Large Blend": "해외 대형 혼합",
  "Foreign Small/Mid Value": "해외 중소형 가치",
  "Diversified Emerging Mkts": "신흥시장 다각화",
  "China Region": "중국 지역",
  "Japan Stock": "일본 주식",
  "Europe Stock": "유럽 주식",
  "Latin America Stock": "중남미 주식",
  "India Equity": "인도 주식",
  "Miscellaneous Region": "기타 지역",

  // 채권형 - 정부채
  "Long Government": "장기 국채",
  "Short Government": "단기 국채",
  "Intermediate Government": "중기 국채",
  "Ultrashort Bond": "초단기 채권",

  // 채권형 - 회사채
  "Corporate Bond": "회사채",
  "Long-Term Bond": "장기채",
  "Short-Term Bond": "단기채",
  "High Yield Bond": "고수익 채권",
  "Intermediate Core Bond": "중기 코어 채권",

  // 채권형 - 물가연동채
  "Inflation-Protected Bond": "물가연동채",
  "Short-Term Inflation-Protected Bond": "단기 물가연동채",

  // 채권형 - 지방채
  "Muni National Interm": "지방채 중기",
  "Muni National Long": "지방채 장기",

  // 채권형 - 모기지/증권화
  "Government Mortgage-Backed Bond": "정부 모기지채",
  "Securitized Bond - Focused": "증권화채권 집중",

  // 채권형 - 글로벌
  "Global Bond": "글로벌 채권",
  "Global Bond-USD Hedged": "글로벌 채권 달러헤지",
  "Emerging Markets Bond": "신흥시장 채권",

  // 특수 - 레버리지/인버스
  "Trading--Leveraged Equity": "레버리지 주식 거래",
  "Trading--Inverse Equity": "인버스 주식 거래",

  // 특수 - 디지털 자산
  "Equity Digital Assets": "디지털자산 주식",
  "Digital Assets": "디지털자산",

  // 특수 - 인프라/기타
  Infrastructure: "인프라",
  "Miscellaneous Sector": "기타 섹터",
};

/**
 * GICS Sector를 ETF primary_sector 포맷으로 역변환
 * @param gicsSector GICS 섹터 이름 (예: "Information Technology")
 * @returns ETF primary_sector 형식 (예: "technology")
 */
export function gicsToEtfSector(gicsSector: string): string | undefined {
  for (const [etfSector, gics] of Object.entries(ETF_SECTOR_TO_GICS)) {
    if (gics === gicsSector) {
      return etfSector;
    }
  }
  return undefined;
}

/**
 * ETF primary_sector를 한글로 변환
 * @param sector ETF의 primary_sector (예: "technology", "financial_services")
 * @returns 한글 섹터 이름 (예: "정보기술", "금융")
 */
export function etfSectorToKorean(sector: string | undefined): string {
  if (!sector) return "";

  // 먼저 GICS 섹터로 변환
  const gicsSector = ETF_SECTOR_TO_GICS[sector.toLowerCase()];
  if (!gicsSector) return sector;

  // sectorMapping의 toKoreanSector를 사용하기 위해 import 필요
  // 하지만 순환 참조를 피하기 위해 여기서 직접 매핑
  const sectorKoreanMap: Record<string, string> = {
    "Information Technology": "정보기술",
    "Technology": "정보기술",
    "Communication Services": "커뮤니케이션 서비스",
    "Consumer Discretionary": "경기소비재",
    "Consumer Staples": "필수소비재",
    Healthcare: "헬스케어",
    Financials: "금융",
    Industrials: "산업재",
    Materials: "소재",
    Energy: "에너지",
    Utilities: "유틸리티",
    "Real Estate": "부동산",
  };

  return sectorKoreanMap[gicsSector] || gicsSector;
}

/**
 * 모든 섹터명을 한글로 변환 (sector_weightings용)
 * API에서 반환하는 다양한 형식의 섹터명을 한글로 변환
 * @param sectorName 섹터명 (예: "Technology", "Information Technology", "Healthcare")
 * @returns 한글 섹터 이름
 */
export function sectorToKorean(sectorName: string | undefined): string {
  if (!sectorName) return "";

  const sectorMap: Record<string, string> = {
    // 소문자 언더스코어 형식 (실제 데이터 형식)
    "technology": "정보기술",
    "financial_services": "금융 서비스",
    "healthcare": "헬스케어",
    "energy": "에너지",
    "consumer_cyclical": "경기소비재",
    "consumer_defensive": "필수소비재",
    "industrials": "산업재",
    "realestate": "부동산",
    "utilities": "유틸리티",
    "basic_materials": "기초 소재",
    "communication_services": "커뮤니케이션 서비스",
    
    // GICS 표준명
    "Information Technology": "정보기술",
    "Communication Services": "커뮤니케이션 서비스",
    "Consumer Discretionary": "경기소비재",
    "Consumer Staples": "필수소비재",
    "Healthcare": "헬스케어",
    "Financials": "금융",
    "Financial Services": "금융 서비스",
    "Industrials": "산업재",
    "Materials": "소재",
    "Basic Materials": "기초 소재",
    "Energy": "에너지",
    "Utilities": "유틸리티",
    "Real Estate": "부동산",

    // 축약/변형명
    "Technology": "정보기술",
    "Tech": "기술",
    "Health": "헬스케어",
    "Healthcare Services": "헬스케어 서비스",
    "Consumer Cyclical": "경기소비재",
    "Consumer Defensive": "필수소비재",
    "Consumer": "소비재",
    "Financial": "금융",
    "Finance": "금융",
    "Communications": "커뮤니케이션",
    "Communication": "커뮤니케이션",
    "Equity Energy": "에너지 주식",
    "Equity Precious Metals": "귀금속 주식",
    "Industrial": "산업",
    "Utility": "유틸리티",
    
    // 기타 변형
    "Information Tech": "정보기술",
    "Info Technology": "정보기술",
    "Financial Svcs": "금융 서비스",
    "Comm Services": "커뮤니케이션 서비스",
    "Consumer Disc": "경기소비재",
    "Consumer Discretion": "경기소비재",
    "Consumer Staple": "필수소비재",
    "Real Est": "부동산",
    "Realestate": "부동산",
    "Material": "소재",
    "Basic Material": "기초 소재",
  };

  return sectorMap[sectorName] || sectorName;
}

/**
 * ETF category를 한글로 변환
 * @param category ETF의 category (예: "Large Blend", "Technology")
 * @returns 한글 카테곣0리 이름 (예: "대형 혼합", "기술")
 */
export function etfCategoryToKorean(category: string | undefined): string {
  if (!category) return "";
  return ETF_CATEGORY_MAPPING[category] || category;
}

/**
 * 섹터와 카테고리를 모두 한글로 변환
 * @param sector ETF의 primary_sector
 * @param category ETF의 category
 * @returns 한글로 변환된 섹터와 카테고리
 */
export function etfSectorCategoryToKorean(
  sector: string | undefined,
  category: string | undefined
): {
  sector: string;
  category: string;
} {
  return {
    sector: etfSectorToKorean(sector),
    category: etfCategoryToKorean(category),
  };
}