import React from "react";
import { formatNumber, formatPercent, formatCurrency } from "../../utils/format";

export interface StockSnapshot {
  date: string; // YYYY-MM-DD
  price?: number;
  marketCap?: number;
  pe?: number;
  pb?: number;
  roe?: number;
  totalScore?: number;
  growthScore?: number;
  valueScore?: number;
  momentumScore?: number;
  ret5d?: number;
  ret20d?: number;
  ret63d?: number;
  sma20?: number;
  sma50?: number;
  sma200?: number;
}

interface StockComparisonTableProps {
  snapshots: StockSnapshot[];
  selectedMetrics?: string[]; // 표시할 지표 선택
  showChangeColumn?: boolean; // 변화량 열 표시
}

/**
 * 날짜별 종목 데이터 비교 테이블
 * - 여러 날짜의 스냅샷 비교
 * - 선택된 지표만 표시
 * - 변화량/변화율 자동 계산
 */
const StockComparisonTable: React.FC<StockComparisonTableProps> = ({
  snapshots,
  selectedMetrics = ["price", "totalScore", "pe", "roe"],
  showChangeColumn = true,
}) => {
  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-400">비교할 데이터가 없습니다</p>
      </div>
    );
  }

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 지표 메타데이터
  const metricMetadata: Record<string, { label: string; format: (val: number) => string; unit?: string }> = {
    price: { label: "주가", format: (v) => formatCurrency(v, "USD") },
    marketCap: { label: "시가총액", format: (v) => formatCurrency(v, "USD", true) },
    pe: { label: "PER", format: (v) => formatNumber(v, 2) },
    pb: { label: "PBR", format: (v) => formatNumber(v, 2) },
    roe: { label: "ROE", format: (v) => formatPercent(v), unit: "%" },
    totalScore: { label: "종합점수", format: (v) => formatNumber(v, 1) },
    growthScore: { label: "성장점수", format: (v) => formatNumber(v, 1) },
    valueScore: { label: "밸류점수", format: (v) => formatNumber(v, 1) },
    momentumScore: { label: "모멘텀점수", format: (v) => formatNumber(v, 1) },
    ret5d: { label: "5일 수익률", format: (v) => formatPercent(v), unit: "%" },
    ret20d: { label: "20일 수익률", format: (v) => formatPercent(v), unit: "%" },
    ret63d: { label: "63일 수익률", format: (v) => formatPercent(v), unit: "%" },
    sma20: { label: "20일 이평", format: (v) => formatNumber(v, 2) },
    sma50: { label: "50일 이평", format: (v) => formatNumber(v, 2) },
    sma200: { label: "200일 이평", format: (v) => formatNumber(v, 2) },
  };

  // 변화량 계산
  const calculateChange = (metric: string, firstValue?: number | null, lastValue?: number | null) => {
    if (firstValue == null || lastValue == null) return null;
    const change = lastValue - firstValue;
    const changePercent = (change / firstValue) * 100;
    return { change, changePercent };
  };

  // 변화량 색상
  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  const firstSnapshot = snapshots[0];
  const lastSnapshot = snapshots[snapshots.length - 1];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
              지표
            </th>
            {snapshots.map((snapshot, idx) => (
              <th
                key={`header-${idx}`}
                className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                {formatDate(snapshot.date)}
              </th>
            ))}
            {showChangeColumn && snapshots.length > 1 && (
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider bg-indigo-50">
                변화
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {selectedMetrics.map((metric) => {
            const meta = metricMetadata[metric];
            if (!meta) return null;

            const firstValue = firstSnapshot[metric as keyof StockSnapshot] as number | undefined;
            const lastValue = lastSnapshot[metric as keyof StockSnapshot] as number | undefined;
            const changeData = calculateChange(metric, firstValue, lastValue);

            return (
              <tr key={metric} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-700 sticky left-0 bg-white">
                  {meta.label}
                </td>
                {snapshots.map((snapshot, idx) => {
                  const value = snapshot[metric as keyof StockSnapshot] as number | undefined | null;
                  return (
                    <td
                      key={`cell-${metric}-${idx}`}
                      className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900"
                    >
                      {meta.format(value)}
                    </td>
                  );
                })}
                {showChangeColumn && snapshots.length > 1 && (
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-semibold bg-indigo-50">
                    {changeData ? (
                      <div className={getChangeColor(changeData.change)}>
                        <div>{changeData.change > 0 ? "▲" : changeData.change < 0 ? "▼" : "―"}</div>
                        <div className="text-xs">
                          {formatPercent(changeData.changePercent)}
                        </div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StockComparisonTable;
