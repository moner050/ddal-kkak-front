import React, { useState, useEffect } from "react";
import { etfApi } from "../../api/client";
import type { EtfHoldingsResponse, EtfSimpleInfo } from "../../api/types";
import { etfSectorToKorean, etfCategoryToKorean } from "../../constants/etfMapping";

interface StockEtfHoldingsProps {
  ticker: string;
  companyName?: string;
}

/**
 * 종목이 포함된 ETF 목록 표시 컴포넌트
 * - 해당 종목을 보유한 ETF 목록
 * - ETF별 비중, 자산규모, 카테고리 정보 표시
 * - 가독성 좋은 카드 레이아웃
 */
const StockEtfHoldings: React.FC<StockEtfHoldingsProps> = ({ ticker, companyName }) => {
  const [etfData, setEtfData] = useState<EtfHoldingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hideComponent, setHideComponent] = useState(false);

  useEffect(() => {
    const fetchEtfHoldings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await etfApi.getHoldingsSimple(ticker);
        setEtfData(response.data);
      } catch (err: any) {
        console.error("Failed to fetch ETF holdings:", err);

        // 403 에러인 경우 컴포넌트를 숨김
        if (err?.response?.status === 403) {
          console.warn("ETF API returned 403 - hiding component");
          setHideComponent(true);
        } else {
          setError("ETF 정보를 불러올 수 없습니다.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEtfHoldings();
  }, [ticker]);

  // 403 에러로 인해 컴포넌트를 숨기는 경우
  if (hideComponent) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">ETF 정보 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error || !etfData || etfData.count === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500 text-center">
          {error || "이 종목을 보유한 ETF 정보가 없습니다."}
        </p>
      </div>
    );
  }

  // 자산 규모로 정렬 (큰 순서)
  const sortedEtfs = [...etfData.etfs].sort((a, b) =>
    (b.total_assets || 0) - (a.total_assets || 0)
  );

  // 표시할 ETF 개수 (접기/펼치기)
  const displayLimit = isExpanded ? sortedEtfs.length : 6;
  const displayEtfs = sortedEtfs.slice(0, displayLimit);
  const hasMore = sortedEtfs.length > 6;

  // 자산 규모 포맷팅
  const formatAssets = (assets: number | undefined): string => {
    if (!assets) return "N/A";
    if (assets >= 1e9) return `$${(assets / 1e9).toFixed(1)}B`;
    if (assets >= 1e6) return `$${(assets / 1e6).toFixed(1)}M`;
    return `$${assets.toLocaleString()}`;
  };

  // 비중 포맷팅
  const formatWeight = (weight: number): string => {
    return `${(weight * 100).toFixed(2)}%`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              포함 ETF 목록
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {companyName || ticker}를 보유한 ETF {etfData.count}개
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">자산규모 순</span>
          </div>
        </div>
      </div>

      {/* ETF 리스트 */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayEtfs.map((etf: EtfSimpleInfo, index: number) => (
            <div
              key={`${etf.ticker}-${index}`}
              className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              {/* ETF 티커 & 이름 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-blue-600">
                      {etf.ticker}
                    </span>
                    {index < 3 && (
                      <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                        TOP {index + 1}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {etf.name}
                  </p>
                </div>
              </div>

              {/* ETF 정보 */}
              <div className="space-y-2">
                {/* 비중 */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">보유 비중</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatWeight(etf.weight_in_etf)}
                  </span>
                </div>

                {/* 자산 규모 */}
                {etf.total_assets && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">운용 자산</span>
                    <span className="text-sm font-medium text-gray-700">
                      {formatAssets(etf.total_assets)}
                    </span>
                  </div>
                )}

                {/* 카테고리 */}
                {etf.category && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-400">카테고리:</span>
                      <span className="text-xs text-gray-600 font-medium">
                        {etfCategoryToKorean(etf.category)}
                      </span>
                    </div>
                  </div>
                )}

                {/* 주요 섹터 */}
                {etf.primary_sector && (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-400">주요 섹터:</span>
                    <span className="text-xs text-gray-600">
                      {etfSectorToKorean(etf.primary_sector)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 더보기 버튼 */}
        {hasMore && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              {isExpanded ? (
                <>접기 ▲</>
              ) : (
                <>
                  더보기 ({sortedEtfs.length - displayLimit}개) ▼
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 푸터 정보 */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <p className="text-xs text-gray-500">
          💡 ETF 투자 시 참고: 이 종목은 위 ETF들을 통해 간접 투자할 수 있습니다.
          ETF는 개별 종목 대비 리스크 분산 효과가 있습니다.
        </p>
      </div>
    </div>
  );
};

export default StockEtfHoldings;
