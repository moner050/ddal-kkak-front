import React from 'react';
import AIScoreGauge from '../stock/AIScoreGauge';
import StockLogo from '../stock/StockLogo';
import type { FrontendUndervaluedStock, FrontendFiling } from '../../utils/apiMappers';

interface StockDetailEmptyStateProps {
  undervaluedStocks: FrontendUndervaluedStock[];
  filings: FrontendFiling[];
  recentStocks: string[];
  switchTab: (tab: string) => void;
  setDetailSymbol: (symbol: string) => void;
  setDetailTab: (tab: "info" | "filings" | "chart") => void;
}

/**
 * StockDetailEmptyState - 종목 상세 페이지 초기 화면
 * 종목이 선택되지 않았을 때 표시되는 컴포넌트
 * - 저평가 우량주 최신 3개
 * - 공시분석 최신 3개
 * - 최근 본 종목 5개
 */
export default function StockDetailEmptyState({
  undervaluedStocks,
  filings,
  recentStocks,
  switchTab,
  setDetailSymbol,
  setDetailTab
}: StockDetailEmptyStateProps) {
  // 저평가 우량주 최신 3개
  const latestUndervalued = undervaluedStocks
    .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
    .slice(0, 3);

  // 공시분석 최신 3개
  const latestFilings = filings
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // 최근 본 종목 데이터
  const recentStocksList = recentStocks
    .map(symbol => undervaluedStocks.find(s => s.symbol === symbol))
    .filter((s): s is typeof undervaluedStocks[number] => s !== undefined)
    .slice(0, 5);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 pb-24">
      {/* 안내 문구 */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          어떤 종목을 살펴보시겠어요?
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          아래 섹션에서 종목을 선택하거나, 저평가/공시 탭에서 종목을 클릭해보세요
        </p>
      </div>

      {/* 저평가 우량주 섹션 */}
      <div className="mb-8">
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">💎 저평가 우량주</h2>
            <button
              onClick={() => switchTab("undervalued")}
              className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              전체 보기 →
            </button>
          </div>

          {latestUndervalued.length > 0 ? (
            <div className="grid gap-3 sm:gap-4">
              {latestUndervalued.map(stock => (
                <div
                  key={stock.symbol}
                  onClick={() => {
                    setDetailSymbol(stock.symbol);
                    setDetailTab("info");
                  }}
                  className="rounded-xl bg-white p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <StockLogo
                      src={stock.logoUrl}
                      alt={stock.name}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm sm:text-base text-gray-900 truncate">{stock.name}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{stock.symbol} · {stock.sector}</div>
                    </div>
                    {stock.aiScore && (
                      <div className="flex-shrink-0">
                        <AIScoreGauge score={stock.aiScore} sentiment={stock.sentiment} size="sm" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">데이터가 없습니다</div>
          )}
        </div>
      </div>

      {/* 공시분석 섹션 */}
      <div className="mb-8">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">📊 공시분석 기준</h2>
            <button
              onClick={() => switchTab("filings")}
              className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
            >
              전체 보기 →
            </button>
          </div>

          {latestFilings.length > 0 ? (
            <div className="grid gap-3 sm:gap-4">
              {latestFilings.map(filing => {
                const stock = undervaluedStocks.find(s => s.symbol === filing.symbol);
                return (
                  <div
                    key={filing.id}
                    onClick={() => {
                      setDetailSymbol(filing.symbol);
                      setDetailTab("filings");
                    }}
                    className="rounded-xl bg-white p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <StockLogo
                        src={stock?.logoUrl}
                        alt={stock?.name || filing.symbol}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm sm:text-base text-gray-900">{filing.symbol}</span>
                          <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
                            {filing.formType}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-700 line-clamp-1">{filing.summary}</div>
                        <div className="text-xs text-gray-500 mt-1">{filing.date}</div>
                      </div>
                      {filing.aiScore && (
                        <div className="flex-shrink-0">
                          <AIScoreGauge score={filing.aiScore} sentiment={filing.sentiment} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">데이터가 없습니다</div>
          )}
        </div>
      </div>

      {/* 최근 본 종목 섹션 */}
      {recentStocksList.length > 0 && (
        <div className="mb-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-lg">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">🕒 최근 본 종목</h2>
            <div className="grid gap-3 sm:gap-4">
              {recentStocksList.map(stock => (
                <div
                  key={stock.symbol}
                  onClick={() => {
                    setDetailSymbol(stock.symbol);
                    setDetailTab("info");
                  }}
                  className="rounded-xl bg-gray-50 p-3 sm:p-4 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <StockLogo
                      src={stock.logoUrl}
                      alt={stock.name}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm sm:text-base text-gray-900 truncate">{stock.name}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{stock.symbol} · {stock.sector}</div>
                    </div>
                    {stock.aiScore && (
                      <div className="flex-shrink-0">
                        <AIScoreGauge score={stock.aiScore} sentiment={stock.sentiment} size="sm" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
