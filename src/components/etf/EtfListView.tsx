import React, { useState, useMemo, useEffect } from "react";
import type { EtfInfo } from "../../api/types";
import { GICS_SECTORS, loadSectorPerformances, type SectorPerformance, type DateRangeType } from "../../services/sectorPerformance";
import { toKoreanSector } from "../../constants/sectorMapping";
import { etfSectorToKorean, etfCategoryToKorean, gicsToEtfSector, ETF_CATEGORY_HIERARCHY } from "../../constants/etfMapping";
import TooltipHeader from "../utils/TooltipHeader";
import SectorPerformanceCard from "../charts/SectorPerformanceCard";
import { useBeginnerMode } from "../../hooks/useBeginnerMode";

interface EtfListViewProps {
  onEtfClick?: (etf: EtfInfo) => void;
}

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

type ViewMode = "beginner" | "detail";

/**
 * ETF 목록 표시 컴포넌트 (주식과 동일한 UI)
 * - 간편/상세 모드 토글
 * - 섹터별 필터링
 * - 검색 기능
 * - 정렬 기능 (헤더 클릭으로 정렬)
 * - 카드 형식(간편) 및 테이블 형식(상세) 표시
 * 
 * ✅ 버그 수정: 필터 해제 시 즉시 반영
 * 📊 섹터 성과 차트 통합
 * 🏷️ 티커 표시 개선
 */
const EtfListView: React.FC<EtfListViewProps> = ({ onEtfClick }) => {
  const [etfs, setEtfs] = useState<EtfInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 섹터 성과 데이터
  const [sectorPerformances, setSectorPerformances] = useState<SectorPerformance[]>([]);
  const [isLoadingSectorPerformances, setIsLoadingSectorPerformances] = useState(false);
  const [sectorTodayDate, setSectorTodayDate] = useState<string>("");
  const [sectorYesterdayDate, setSectorYesterdayDate] = useState<string>("");

  // 반응형 모드: 모바일=간편모드, 웹=상세모드
  const { isBeginnerMode } = useBeginnerMode();
  const viewMode: ViewMode = isBeginnerMode ? "beginner" : "detail";

  // 필터링 & 정렬
  const [selectedSector, setSelectedSector] = useState<string>("전체");
  const [selectedCategoryType, setSelectedCategoryType] = useState<string>("전체"); // 대분류 (주식형, 채권형, 특수형)
  const [selectedCategoryMid, setSelectedCategoryMid] = useState<string>("전체"); // 중분류 (규모별, 섹터별, etc.)
  const [selectedCategoryFinal, setSelectedCategoryFinal] = useState<string>("전체"); // 소분류 (실제 category 값)
  const [searchQuery, setSearchQuery] = useState("");
  const [etfSorts, setEtfSorts] = useState<SortConfig[]>([]);
  
  // ✅ 강제 리렌더링을 위한 상태
  const [filterVersion, setFilterVersion] = useState(0);

  // ETF 데이터 로드 (정적 JSON 파일)
  React.useEffect(() => {
    const fetchEtfs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/data/etfs.json");
        if (!response.ok) {
          throw new Error(`Failed to load ETF data: ${response.status}`);
        }
        const data = await response.json();
        setEtfs(data.data || []);
        console.log(`✓ Loaded ${(data.data || []).length} ETFs from static JSON`);
      } catch (err: any) {
        console.error("Failed to fetch ETFs from static JSON:", err);
        setError("ETF 목록을 불러올 수 없습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEtfs();
  }, []);

  // 섹터 성과 데이터 로드
  React.useEffect(() => {
    const fetchSectorPerformances = async () => {
      setIsLoadingSectorPerformances(true);
      try {
        const result = await loadSectorPerformances('1day');
        setSectorPerformances(result.performances);
        setSectorTodayDate(result.todayDate);
        setSectorYesterdayDate(result.yesterdayDate);
      } catch (err) {
        console.error('Failed to load sector performances:', err);
      } finally {
        setIsLoadingSectorPerformances(false);
      }
    };

    fetchSectorPerformances();
  }, []);

  // 섹터 성과 기간 변경 핸들러
  const handleSectorPerformanceRangeChange = async (
    rangeType: DateRangeType,
    startDate?: string,
    endDate?: string
  ) => {
    setIsLoadingSectorPerformances(true);
    try {
      const result = await loadSectorPerformances(rangeType, startDate, endDate);
      setSectorPerformances(result.performances);
      setSectorTodayDate(result.todayDate);
      setSectorYesterdayDate(result.yesterdayDate);
    } catch (err) {
      console.error('Failed to load sector performances:', err);
    } finally {
      setIsLoadingSectorPerformances(false);
    }
  };

  // ✅ 필터 변경 감지 - 필터가 변경될 때마다 버전 증가
  useEffect(() => {
    setFilterVersion(prev => prev + 1);
  }, [selectedSector, selectedCategoryType, selectedCategoryMid, selectedCategoryFinal, searchQuery]);

  // 정렬 핸들러
  const handleEtfSort = (key: string) => {
    setEtfSorts((prevSorts) => {
      const existingIndex = prevSorts.findIndex((s) => s.key === key);
      let newSorts: SortConfig[];

      if (existingIndex === -1) {
        // 새로운 정렬 추가
        newSorts = [{ key, direction: "desc" }, ...prevSorts];
      } else {
        // 기존 정렬 토글 또는 제거
        const currentSort = prevSorts[existingIndex];
        if (currentSort.direction === "desc") {
          // desc → asc
          newSorts = [
            { key, direction: "asc" },
            ...prevSorts.filter((_, i) => i !== existingIndex),
          ];
        } else {
          // asc → 제거
          newSorts = prevSorts.filter((_, i) => i !== existingIndex);
        }
      }

      return newSorts;
    });
  };

  // 퍼센트 수치 정규화 (소수점 형식과 퍼센트 형식 통일)
  const normalizePercentValue = (value: number | undefined): number => {
    if (value === undefined || value === null || value === 0) return 0;
    if (Math.abs(value) < 1) {
      return value * 100;
    }
    return value;
  };

  // 고유한 카테고리 목록 추출
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    etfs.forEach((etf) => {
      if (etf.category) {
        categories.add(etf.category);
      }
    });
    return Array.from(categories).sort();
  }, [etfs]);

  // 필터링 & 정렬
  const filteredAndSortedEtfs = useMemo(() => {
    let result = [...etfs];

    // 섹터 필터링
    if (selectedSector !== "전체") {
      const etfSectorFormat = gicsToEtfSector(selectedSector);
      if (etfSectorFormat) {
        result = result.filter((etf) => etf.primary_sector === etfSectorFormat);
      }
    }

    // 카테고리 필터링 (계층적 필터링)
    if (selectedCategoryType !== "전체") {
      const hierarchy = ETF_CATEGORY_HIERARCHY[selectedCategoryType];
      
      if (selectedCategoryMid !== "전체") {
        const categoriesInMid = hierarchy?.[selectedCategoryMid] || [];
        
        if (selectedCategoryFinal !== "전체") {
          result = result.filter((etf) => etf.category === selectedCategoryFinal);
        } else {
          result = result.filter((etf) => 
            etf.category && categoriesInMid.includes(etf.category)
          );
        }
      } else {
        const allCategoriesInType: string[] = [];
        Object.values(hierarchy || {}).forEach((categories) => {
          allCategoriesInType.push(...categories);
        });
        result = result.filter((etf) => 
          etf.category && allCategoriesInType.includes(etf.category)
        );
      }
    }

    // 검색 필터링
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (etf) =>
          etf.ticker.toLowerCase().includes(query) ||
          etf.short_name?.toLowerCase().includes(query) ||
          etf.long_name?.toLowerCase().includes(query)
      );
    }

    // 정렬
    if (etfSorts.length > 0) {
      result.sort((a, b) => {
        for (const sort of etfSorts) {
          let aValue: any, bValue: any;

          switch (sort.key) {
            case "ticker":
              aValue = a.ticker;
              bValue = b.ticker;
              break;
            case "sector":
              aValue = a.primary_sector || "";
              bValue = b.primary_sector || "";
              break;
            case "category":
              aValue = a.category || "";
              bValue = b.category || "";
              break;
            case "price":
              aValue = a.price || 0;
              bValue = b.price || 0;
              break;
            case "assets":
              aValue = a.total_assets || 0;
              bValue = b.total_assets || 0;
              break;
            case "ytd":
              aValue = normalizePercentValue(a.ytd_return);
              bValue = normalizePercentValue(b.ytd_return);
              break;
            case "1m":
              aValue = normalizePercentValue(a.return_1m);
              bValue = normalizePercentValue(b.return_1m);
              break;
            case "3m":
              aValue = normalizePercentValue(a.return_3m);
              bValue = normalizePercentValue(b.return_3m);
              break;
            case "6m":
              aValue = normalizePercentValue(a.return_6m);
              bValue = normalizePercentValue(b.return_6m);
              break;
            case "1y":
              aValue = normalizePercentValue(a.return_1y);
              bValue = normalizePercentValue(b.return_1y);
              break;
            case "dividend":
              aValue = normalizePercentValue(a.dividend_yield);
              bValue = normalizePercentValue(b.dividend_yield);
              break;
            default:
              continue;
          }

          // 문자열 비교
          if (typeof aValue === "string" && typeof bValue === "string") {
            const comparison = aValue.localeCompare(bValue);
            if (comparison !== 0) {
              return sort.direction === "asc" ? comparison : -comparison;
            }
          } else {
            // 숫자 비교
            const aNum = Number(aValue) || 0;
            const bNum = Number(bValue) || 0;
            if (aNum !== bNum) {
              return sort.direction === "asc" ? aNum - bNum : bNum - aNum;
            }
          }
        }

        return 0;
      });
    } else {
      // 기본 정렬: 자산규모 기준 높은 순
      result.sort((a, b) => (b.total_assets || 0) - (a.total_assets || 0));
    }

    return result;
  }, [etfs, selectedSector, selectedCategoryType, selectedCategoryMid, selectedCategoryFinal, searchQuery, etfSorts, filterVersion]);

  // 포맷팅 함수들
  const formatAssets = (assets: number | undefined): string => {
    if (!assets) return "N/A";
    if (assets >= 1e9) return `$${(assets / 1e9).toFixed(1)}B`;
    if (assets >= 1e6) return `$${(assets / 1e6).toFixed(1)}M`;
    return `$${assets.toLocaleString()}`;
  };

  const formatPrice = (price: number | undefined): string => {
    if (!price) return "-";
    return `$${price.toFixed(2)}`;
  };

  const formatPercent = (value: number | undefined): string => {
    if (value === undefined || value === null) return "-";

    let displayValue = value;
    if (Math.abs(value) < 1 && value !== 0) {
      displayValue = value * 100;
    }

    const sign = displayValue > 0 ? "+" : "";
    return `${sign}${displayValue.toFixed(2)}%`;
  };

  const getReturnColor = (returnValue: number | undefined): string => {
    if (returnValue === undefined || returnValue === null) return "text-gray-600";
    if (returnValue > 0) return "text-green-600";
    if (returnValue < 0) return "text-red-600";
    return "text-gray-600";
  };

  // 필터 핸들러
  const handleSectorChange = (sector: string) => {
    setSelectedSector(sector);
  };

  const handleCategoryTypeChange = (type: string) => {
    setSelectedCategoryType(type);
    setSelectedCategoryMid("전체");
    setSelectedCategoryFinal("전체");
  };

  const handleCategoryMidChange = (mid: string) => {
    setSelectedCategoryMid(mid);
    setSelectedCategoryFinal("전체");
  };

  const handleCategoryFinalChange = (final: string) => {
    setSelectedCategoryFinal(final);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // 섹터 클릭 핸들러
  const handleSectorClickFromChart = (sectorKr: string) => {
    const gicsSector = GICS_SECTORS.find(s => toKoreanSector(s) === sectorKr);
    if (gicsSector) {
      handleSectorChange(gicsSector);
      const filterSection = document.getElementById('etf-filter-section');
      if (filterSection) {
        filterSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">ETF 목록을 불러오는 중...</p>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 섹터 성과 차트 */}
      <SectorPerformanceCard
        performances={sectorPerformances}
        onSectorClick={handleSectorClickFromChart}
        loading={isLoadingSectorPerformances}
        todayDate={sectorTodayDate}
        yesterdayDate={sectorYesterdayDate}
        onRangeChange={handleSectorPerformanceRangeChange}
      />

      {/* 헤더: ETF 목록 */}
      <h2 className="text-lg font-bold text-gray-900">ETF 목록</h2>

      {/* 검색 & 필터 */}
      <div id="etf-filter-section" className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        {/* 검색 */}
        <div>
          <label className="text-xs sm:text-sm text-gray-600 mb-2 font-semibold block">
            🔍 검색
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="ETF 티커 또는 이름으로 검색..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* 섹터 선택 */}
        <div>
          <label className="text-xs sm:text-sm text-gray-600 mb-2 font-semibold block">
            🏢 주요 섹터
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSectorChange("전체")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedSector === "전체"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              전체
            </button>
            {GICS_SECTORS.map((sector) => (
              <button
                key={sector}
                onClick={() => handleSectorChange(sector)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedSector === sector
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {toKoreanSector(sector)}
              </button>
            ))}
          </div>
        </div>

        {/* 카테고리 선택 */}
        <div>
          <label className="text-xs sm:text-sm text-gray-600 mb-2 font-semibold block">
            📁 카테고리
          </label>

          {/* 대분류 */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2 font-medium">대분류</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryTypeChange("전체")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategoryType === "전체"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                전체
              </button>
              {Object.keys(ETF_CATEGORY_HIERARCHY).map((type) => (
                <button
                  key={type}
                  onClick={() => handleCategoryTypeChange(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategoryType === type
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* 중분류 */}
          {selectedCategoryType !== "전체" && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2 font-medium">중분류</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategoryMidChange("전체")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategoryMid === "전체"
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  전체
                </button>
                {Object.keys(ETF_CATEGORY_HIERARCHY[selectedCategoryType] || {}).map((mid) => (
                  <button
                    key={mid}
                    onClick={() => handleCategoryMidChange(mid)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedCategoryMid === mid
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {mid}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 소분류 */}
          {selectedCategoryType !== "전체" && selectedCategoryMid !== "전체" && (
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">소분류</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategoryFinalChange("전체")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategoryFinal === "전체"
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  전체
                </button>
                {(ETF_CATEGORY_HIERARCHY[selectedCategoryType]?.[selectedCategoryMid] || []).map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryFinalChange(category)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedCategoryFinal === category
                        ? "bg-purple-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {etfCategoryToKorean(category)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 정렬 옵션 (간편모드용) */}
      {viewMode === "beginner" && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm font-semibold text-gray-700">정렬:</p>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { key: "assets", label: "운용 자산" },
                { key: "dividend", label: "배당률" },
              ].map((option) => {
                const currentSort = etfSorts.find((s) => s.key === option.key);
                return (
                  <button
                    key={option.key}
                    onClick={() => handleEtfSort(option.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      currentSort
                        ? `${
                            currentSort.direction === "desc"
                              ? "bg-blue-600 text-white"
                              : "bg-blue-100 text-blue-700"
                          } shadow-sm`
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                    {currentSort && (
                      <span className="ml-1">
                        {currentSort.direction === "desc" ? "↓" : "↑"}
                      </span>
                    )}
                  </button>
                );
              })}
              {etfSorts.length > 0 && (
                <button
                  onClick={() => setEtfSorts([])}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                >
                  초기화
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 결과 요약 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          총 <span className="font-bold text-blue-600">{filteredAndSortedEtfs.length}</span>개 ETF
        </p>
      </div>

      {/* 간편 모드 - 카드 뷰 */}
      {viewMode === "beginner" && (
        <>
          {filteredAndSortedEtfs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-600 font-medium">검색 결과가 없습니다</p>
              <p className="text-sm text-gray-500 mt-2">다른 검색어나 필터를 시도해보세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredAndSortedEtfs.map((etf) => (
                <div
                  key={etf.ticker}
                  onClick={() => onEtfClick?.(etf)}
                  className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 hover:shadow-lg transition-all cursor-pointer"
                >
                  {/* 헤더 섹션 */}
                  <div className="mb-3">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        {/* 티커 배지 */}
                        <div className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg mb-2">
                          <span className="text-base sm:text-lg font-bold tracking-wide">{etf.ticker}</span>
                        </div>
                        {/* ETF 이름 */}
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{etf.short_name || etf.long_name}</p>
                      </div>
                      {etf.price && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg sm:text-xl font-bold text-gray-900">{formatPrice(etf.price)}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-block text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded font-medium">
                        {etf.category ? etfCategoryToKorean(etf.category) : "-"}
                      </span>
                      {etf.primary_sector && (
                        <span className="inline-block text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded font-medium">
                          {etfSectorToKorean(etf.primary_sector)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 핵심 정보 */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">운용 자산</p>
                      <p className="text-sm font-semibold text-gray-900">{formatAssets(etf.total_assets)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">배당률</p>
                      <p className={`text-sm font-semibold ${getReturnColor(etf.dividend_yield)}`}>
                        {formatPercent(etf.dividend_yield)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 상세 모드 - 테이블 뷰 */}
      {viewMode === "detail" && (
        <>
          {filteredAndSortedEtfs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-600 font-medium">검색 결과가 없습니다</p>
              <p className="text-sm text-gray-500 mt-2">다른 검색어나 필터를 시도해보세요</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs">
                        티커
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="섹터"
                          sortKey="sector"
                          sorts={etfSorts}
                          onSort={handleEtfSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="카테고리"
                          sortKey="category"
                          sorts={etfSorts}
                          onSort={handleEtfSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="현재가"
                          sortKey="price"
                          sorts={etfSorts}
                          onSort={handleEtfSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="운용 자산"
                          tooltip="운용 중인 자산 규모"
                          sortKey="assets"
                          sorts={etfSorts}
                          onSort={handleEtfSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="YTD"
                          tooltip="연초 대비 수익률"
                          sortKey="ytd"
                          sorts={etfSorts}
                          onSort={handleEtfSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="1개월"
                          sortKey="1m"
                          sorts={etfSorts}
                          onSort={handleEtfSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="3개월"
                          sortKey="3m"
                          sorts={etfSorts}
                          onSort={handleEtfSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="6개월"
                          sortKey="6m"
                          sorts={etfSorts}
                          onSort={handleEtfSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="1년"
                          sortKey="1y"
                          sorts={etfSorts}
                          onSort={handleEtfSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="배당률"
                          sortKey="dividend"
                          sorts={etfSorts}
                          onSort={handleEtfSort}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAndSortedEtfs.map((etf) => (
                      <tr
                        key={etf.ticker}
                        onClick={() => onEtfClick?.(etf)}
                        className="hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            {/* 티커 배지 */}
                            <span className="inline-flex items-center w-fit px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-bold tracking-wide mb-1">
                              {etf.ticker}
                            </span>
                            {/* ETF 이름 */}
                            <span className="text-xs text-gray-600 line-clamp-1">
                              {etf.short_name || etf.long_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">
                          {etf.primary_sector ? etfSectorToKorean(etf.primary_sector) : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700 max-w-[150px] truncate">
                          {etf.category ? etfCategoryToKorean(etf.category) : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900">
                          {formatPrice(etf.price)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900">
                          {formatAssets(etf.total_assets)}
                        </td>
                        <td className={`px-4 py-3 text-sm text-center font-semibold ${getReturnColor(etf.ytd_return)}`}>
                          {formatPercent(etf.ytd_return)}
                        </td>
                        <td className={`px-4 py-3 text-sm text-center font-semibold ${getReturnColor(etf.return_1m)}`}>
                          {formatPercent(etf.return_1m)}
                        </td>
                        <td className={`px-4 py-3 text-sm text-center font-semibold ${getReturnColor(etf.return_3m)}`}>
                          {formatPercent(etf.return_3m)}
                        </td>
                        <td className={`px-4 py-3 text-sm text-center font-semibold ${getReturnColor(etf.return_6m)}`}>
                          {formatPercent(etf.return_6m)}
                        </td>
                        <td className={`px-4 py-3 text-sm text-center font-semibold ${getReturnColor(etf.return_1y)}`}>
                          {formatPercent(etf.return_1y)}
                        </td>
                        <td className={`px-4 py-3 text-sm text-center font-semibold ${getReturnColor(etf.dividend_yield)}`}>
                          {formatPercent(etf.dividend_yield)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EtfListView;