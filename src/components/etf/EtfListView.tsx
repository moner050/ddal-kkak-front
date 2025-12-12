import React, { useState, useEffect } from "react";
import { etfApi } from "../../api/client";
import type { EtfInfo } from "../../api/types";
import { GICS_SECTORS } from "../../services/sectorPerformance";
import { toKoreanSector } from "../../constants/sectorMapping";
import { etfSectorToKorean, etfCategoryToKorean } from "../../constants/etfMapping";

interface EtfListViewProps {
  onEtfClick?: (etf: EtfInfo) => void;
}

/**
 * ETF 목록 표시 컴포넌트
 * - 섹터별 필터링
 * - 검색 기능
 * - 정렬 기능 (자산 규모, 수익률)
 * - 카드 형식 표시
 */
const EtfListView: React.FC<EtfListViewProps> = ({ onEtfClick }) => {
  const [etfs, setEtfs] = useState<EtfInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 필터링 & 정렬
  const [selectedSector, setSelectedSector] = useState<string>("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"assets" | "ytd" | "1m" | "3m" | "6m" | "1y">("assets");

  // ETF 데이터 로드 (백엔드 API)
  useEffect(() => {
    const fetchEtfs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await etfApi.getAll();
        setEtfs(response.data || []);
      } catch (err: any) {
        console.error("Failed to fetch ETFs:", err);
        setError("ETF 목록을 불러올 수 없습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEtfs();
  }, []);

  // 필터링 & 정렬
  const filteredAndSortedEtfs = React.useMemo(() => {
    let result = [...etfs];

    // 섹터 필터링
    if (selectedSector !== "전체") {
      result = result.filter(
        (etf) => etf.primary_sector === selectedSector
      );
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
    result.sort((a, b) => {
      switch (sortBy) {
        case "assets":
          return (b.total_assets || 0) - (a.total_assets || 0);
        case "ytd":
          return (b.ytd_return || 0) - (a.ytd_return || 0);
        case "1m":
          return (b.return_1m || 0) - (a.return_1m || 0);
        case "3m":
          return (b.return_3m || 0) - (a.return_3m || 0);
        case "6m":
          return (b.return_6m || 0) - (a.return_6m || 0);
        case "1y":
          return (b.return_1y || 0) - (a.return_1y || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [etfs, selectedSector, searchQuery, sortBy]);

  // 자산 규모 포맷팅
  const formatAssets = (assets: number | undefined): string => {
    if (!assets) return "N/A";
    if (assets >= 1e9) return `$${(assets / 1e9).toFixed(1)}B`;
    if (assets >= 1e6) return `$${(assets / 1e6).toFixed(1)}M`;
    return `$${assets.toLocaleString()}`;
  };

  // 수익률 포맷팅
  const formatReturn = (returnValue: number | undefined): string => {
    if (returnValue === undefined || returnValue === null) return "-";
    const sign = returnValue > 0 ? "+" : "";
    return `${sign}${returnValue.toFixed(2)}%`;
  };

  // 수익률 색상
  const getReturnColor = (returnValue: number | undefined): string => {
    if (returnValue === undefined || returnValue === null) return "text-gray-600";
    if (returnValue > 0) return "text-green-600";
    if (returnValue < 0) return "text-red-600";
    return "text-gray-600";
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
      {/* 검색 & 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        {/* 검색 */}
        <div>
          <label className="text-xs sm:text-sm text-gray-600 mb-2 font-semibold block">
            🔍 검색
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
              onClick={() => setSelectedSector("전체")}
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
                onClick={() => setSelectedSector(sector)}
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

        {/* 정렬 */}
        <div>
          <label className="text-xs sm:text-sm text-gray-600 mb-2 font-semibold block">
            📊 정렬
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "assets", label: "자산 규모" },
              { value: "ytd", label: "YTD" },
              { value: "1m", label: "1개월" },
              { value: "3m", label: "3개월" },
              { value: "6m", label: "6개월" },
              { value: "1y", label: "1년" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  sortBy === option.value
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 결과 요약 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          총 <span className="font-bold text-blue-600">{filteredAndSortedEtfs.length}</span>개 ETF
        </p>
      </div>

      {/* ETF 카드 목록 */}
      {filteredAndSortedEtfs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-600 font-medium">검색 결과가 없습니다</p>
          <p className="text-sm text-gray-500 mt-2">다른 검색어나 필터를 시도해보세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedEtfs.map((etf) => (
            <div
              key={etf.ticker}
              onClick={() => onEtfClick?.(etf)}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-all cursor-pointer"
            >
              {/* 헤더 */}
              <div className="mb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-blue-600 truncate">
                      {etf.ticker}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {etf.short_name || etf.long_name}
                    </p>
                  </div>
                  {etf.price && (
                    <div className="text-right ml-2">
                      <p className="text-sm font-bold text-gray-900">
                        ${etf.price.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 정보 */}
              <div className="space-y-2">
                {/* 자산 규모 */}
                {etf.total_assets && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">운용 자산</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatAssets(etf.total_assets)}
                    </span>
                  </div>
                )}

                {/* 주요 섹터 */}
                {etf.primary_sector && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">주요 섹터</span>
                    <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                      {etfSectorToKorean(etf.primary_sector)}
                    </span>
                  </div>
                )}

                {/* 카테고리 */}
                {etf.category && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">카테고리</span>
                    <span className="text-xs text-gray-700 truncate max-w-[60%]" title={etfCategoryToKorean(etf.category)}>
                      {etfCategoryToKorean(etf.category)}
                    </span>
                  </div>
                )}
              </div>

              {/* 수익률 */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">수익률</p>
                <div className="grid grid-cols-3 gap-2">
                  {etf.ytd_return !== undefined && (
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 mb-1">YTD</p>
                      <p className={`text-xs font-bold ${getReturnColor(etf.ytd_return)}`}>
                        {formatReturn(etf.ytd_return)}
                      </p>
                    </div>
                  )}
                  {etf.return_3m !== undefined && (
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 mb-1">3개월</p>
                      <p className={`text-xs font-bold ${getReturnColor(etf.return_3m)}`}>
                        {formatReturn(etf.return_3m)}
                      </p>
                    </div>
                  )}
                  {etf.return_1y !== undefined && (
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 mb-1">1년</p>
                      <p className={`text-xs font-bold ${getReturnColor(etf.return_1y)}`}>
                        {formatReturn(etf.return_1y)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* TOP 보유 종목 (있는 경우) */}
              {etf.top_holdings && etf.top_holdings.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">주요 보유 종목</p>
                  <div className="space-y-1">
                    {etf.top_holdings.slice(0, 3).map((holding, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-xs text-gray-700 truncate flex-1">
                          {holding.symbol}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {(holding.weight * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EtfListView;
