import React, { useState, useEffect } from "react";
import type { EtfInfo } from "../../api/types";
import { etfSectorToKorean, etfCategoryToKorean, sectorToKorean } from "../../constants/etfMapping";
import { useNavigation } from "../../context/NavigationContext";
import EtfSectorPieChart from "../charts/EtfSectorPieChart";

interface EtfDetailViewProps {
  ticker: string;
  onClose?: () => void;
}

/**
 * ETF 상세 정보 표시 컴포넌트
 * - 기본 정보 (티커, 이름, 가격, 자산 규모)
 * - 카테고리 및 섹터 정보
 * - 수익률 정보
 * - 리스크 지표 (베타, 변동성, 샤프 비율)
 * - 배당 정보
 * - 비용 비율
 * - 섹터 비중 차트
 * - 주요 보유 종목
 * 🎯 티커 표시 개선
 */
const EtfDetailView: React.FC<EtfDetailViewProps> = ({ ticker, onClose }) => {
  const { setFromEtfTicker, setTargetStockSymbol } = useNavigation();
  const [etf, setEtf] = useState<EtfInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEtfDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 정적 JSON 파일에서 ETF 상세 정보 로드
        const response = await fetch("/data/etfs-detailed.json");
        if (!response.ok) {
          throw new Error(`Failed to load ETF data: ${response.status}`);
        }
        const data = await response.json();
        const etfDetail = data.data[ticker];

        if (!etfDetail) {
          throw new Error("ETF 정보를 찾을 수 없습니다.");
        }

        setEtf(etfDetail);
      } catch (err: any) {
        console.error("Failed to fetch ETF details:", err);
        setError("ETF 정보를 불러올 수 없습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEtfDetail();
  }, [ticker]);

  // 수익률 포맷팅 (소수점 형식 정규화)
  const formatReturn = (value: number | undefined): string => {
    if (value === undefined || value === null) return "-";

    // 데이터 값이 -1과 1 사이면 * 100 (소수점 형식: 0.7009 → 70.09)
    // 그 외에는 그냥 사용 (이미 퍼센트 형식: 70.09 → 70.09)
    let displayValue = value;
    if (Math.abs(value) < 1 && value !== 0) {
      displayValue = value * 100;
    }

    const sign = displayValue > 0 ? "+" : "";
    return `${sign}${displayValue.toFixed(2)}%`;
  };

  // 수익률 색상
  const getReturnColor = (value: number | undefined): string => {
    if (value === undefined || value === null) return "text-gray-600";
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };

  // 자산 규모 포맷팅
  const formatAssets = (assets: number | undefined): string => {
    if (!assets) return "N/A";
    if (assets >= 1e9) return `$${(assets / 1e9).toFixed(2)}B`;
    if (assets >= 1e6) return `$${(assets / 1e6).toFixed(2)}M`;
    return `$${assets.toLocaleString()}`;
  };

  // 백분율 포맷팅 (소수점 형식 정규화)
  const formatPercent = (value: number | undefined): string => {
    if (value === undefined || value === null) return "-";

    // 데이터 값이 -1과 1 사이면 * 100 (소수점 형식: 0.7009 → 70.09)
    // 그 외에는 그냥 사용 (이미 퍼센트 형식: 70.09 → 70.09)
    let displayValue = value;
    if (Math.abs(value) < 1 && value !== 0) {
      displayValue = value * 100;
    }

    const sign = displayValue > 0 ? "+" : "";
    return `${sign}${displayValue.toFixed(2)}%`;
  };

  // 소수점 포맷팅
  const formatDecimal = (value: number | undefined, decimals: number = 2): string => {
    if (value === undefined || value === null) return "-";
    return value.toFixed(decimals);
  };

  // 보유 종목 클릭 핸들러
  const handleHoldingClick = (symbol: string) => {
    setFromEtfTicker(ticker);
    setTargetStockSymbol(symbol);
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4 mx-auto"></div>
        <p className="text-gray-600 text-lg">ETF 정보를 불러오는 중...</p>
      </div>
    );
  }

  // 에러 상태
  if (error || !etf) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-red-600 mb-2">오류 발생</h2>
        <p className="text-red-600 mb-6">{error || "ETF 정보를 찾을 수 없습니다."}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            목록으로 돌아가기
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 뒤로가기 버튼 */}
      {onClose && (
        <button
          onClick={onClose}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">뒤로가기</span>
        </button>
      )}

      {/* 헤더 - 티커 개선 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* 티커 배지 */}
            <div className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg mb-3">
              <span className="text-2xl font-extrabold tracking-wide">{etf.ticker}</span>
            </div>
            
            {/* ETF 이름 */}
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
              {etf.short_name || etf.long_name}
            </h2>
            
            {/* 태그 */}
            <div className="flex flex-wrap gap-2">
              {etf.category && (
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg border border-blue-200">
                  {etfCategoryToKorean(etf.category)}
                </span>
              )}
              {etf.primary_sector && (
                <span className="px-3 py-1.5 bg-purple-50 text-purple-700 text-sm font-semibold rounded-lg border border-purple-200">
                  {etfSectorToKorean(etf.primary_sector)}
                </span>
              )}
              {etf.fund_family && (
                <span className="px-3 py-1.5 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-200">
                  {etf.fund_family}
                </span>
              )}
            </div>
          </div>
          
          {/* 현재가 */}
          {etf.price && (
            <div className="sm:ml-6 text-left sm:text-right">
              <p className="text-sm text-gray-500 mb-1">현재가</p>
              <p className="text-3xl font-bold text-gray-900">${etf.price.toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 운용 자산 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-2">운용 자산</p>
          <p className="text-2xl font-bold text-gray-900">{formatAssets(etf.total_assets)}</p>
        </div>

        {/* 비용 비율 */}
        {etf.expense_ratio !== undefined && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-2">비용 비율</p>
            <p className="text-2xl font-bold text-gray-900">{formatPercent(etf.expense_ratio)}</p>
          </div>
        )}

        {/* 배당 수익률 */}
        {etf.dividend_yield !== undefined && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-2">배당 수익률</p>
            <p className="text-2xl font-bold text-gray-900">{formatPercent(etf.dividend_yield)}</p>
          </div>
        )}

        {/* 베타 */}
        {etf.beta !== undefined && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-2">베타</p>
            <p className="text-2xl font-bold text-gray-900">{formatDecimal(etf.beta)}</p>
          </div>
        )}
      </div>

      {/* 수익률 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">수익률</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {[
            { label: "YTD", value: etf.ytd_return },
            { label: "1개월", value: etf.return_1m },
            { label: "3개월", value: etf.return_3m },
            { label: "6개월", value: etf.return_6m },
            { label: "1년", value: etf.return_1y },
            { label: "3년", value: etf.return_3y },
            { label: "5년", value: etf.return_5y },
          ].map((item) => (
            <div key={item.label} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">{item.label}</p>
              <p className={`text-xl font-bold ${getReturnColor(item.value)}`}>
                {formatReturn(item.value)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 리스크 지표 */}
      {(etf.volatility !== undefined || etf.sharpe_ratio !== undefined) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">리스크 지표</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {etf.beta !== undefined && (
              <div>
                <p className="text-sm text-gray-500 mb-2">베타 (Beta)</p>
                <p className="text-2xl font-bold text-gray-900">{formatDecimal(etf.beta)}</p>
                <p className="text-xs text-gray-400 mt-1">시장 대비 변동성</p>
              </div>
            )}
            {etf.volatility !== undefined && (
              <div>
                <p className="text-sm text-gray-500 mb-2">변동성 (Volatility)</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercent(etf.volatility)}</p>
                <p className="text-xs text-gray-400 mt-1">표준편차</p>
              </div>
            )}
            {etf.sharpe_ratio !== undefined && (
              <div>
                <p className="text-sm text-gray-500 mb-2">샤프 비율 (Sharpe Ratio)</p>
                <p className="text-2xl font-bold text-gray-900">{formatDecimal(etf.sharpe_ratio)}</p>
                <p className="text-xs text-gray-400 mt-1">위험 대비 수익률</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 섹터 비중 */}
        {etf.sector_weightings && Object.keys(etf.sector_weightings).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">섹터 비중 분석</h2>
            <div className="mb-4">
              <EtfSectorPieChart sectorWeightings={etf.sector_weightings} />
            </div>
            <div className="mt-6 space-y-2 max-h-60 overflow-y-auto">
              <p className="text-xs text-gray-500 font-semibold mb-3 uppercase">모든 섹터 비중</p>
              {Object.entries(etf.sector_weightings)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([sector, weight]) => (
                  <div key={sector} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{sectorToKorean(sector)}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(weight as number) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-12 text-right">
                        {((weight as number) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 주요 보유 종목 - 티커 표시 개선 */}
        {etf.top_holdings && etf.top_holdings.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              주요 보유 종목 (TOP {etf.top_holdings.length})
            </h2>
            <div className="space-y-3">
              {etf.top_holdings.map((holding, index) => (
                <div
                  key={`${holding.symbol}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer border border-gray-100 hover:border-blue-200"
                  onClick={() => handleHoldingClick(holding.symbol)}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* 순위 */}
                    <span className="text-sm font-semibold text-gray-400 w-6 flex-shrink-0">
                      {index + 1}
                    </span>
                    
                    <div className="flex-1 min-w-0">
                      {/* 티커 배지 */}
                      <div className="inline-flex items-center px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-bold tracking-wide mb-1">
                        {holding.symbol}
                      </div>
                      {/* 회사명 */}
                      <p className="text-xs text-gray-600 truncate">{holding.name}</p>
                    </div>
                  </div>
                  
                  {/* 비중 */}
                  <div className="ml-4 flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {(holding.weight * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 데이터 업데이트 날짜 */}
      {etf.data_date && (
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">
            데이터 업데이트: {new Date(etf.data_date).toLocaleDateString("ko-KR")}
          </p>
        </div>
      )}
    </div>
  );
};

export default EtfDetailView;