import React, { useState, useEffect } from "react";
import DateRangePicker from "../common/DateRangePicker";
import TimeSeriesChart, { TimeSeriesDataPoint } from "../charts/TimeSeriesChart";
import StockComparisonTable, { StockSnapshot } from "./StockComparisonTable";
import { stockService } from "../../api/services";
import type { FrontendUndervaluedStock } from "../../utils/apiMappers";

interface StockPriceVisualizationProps {
  ticker: string;
  companyName: string;
  initialMaxDate?: string; // 최신 데이터 날짜
}

/**
 * 종목 주가 시각화 복합 뷰 컴포넌트
 * - 날짜 범위 선택
 * - 시계열 차트 (주가, AI 점수 등)
 * - 날짜별 비교 테이블
 */
const StockPriceVisualization: React.FC<StockPriceVisualizationProps> = ({
  ticker,
  companyName,
  initialMaxDate,
}) => {
  const [maxDate, setMaxDate] = useState<string>(
    initialMaxDate || new Date().toISOString().split("T")[0]
  );
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [historyData, setHistoryData] = useState<FrontendUndervaluedStock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChartMetric, setSelectedChartMetric] = useState<"price" | "totalScore" | "pe" | "roe">("price");

  // 최신 데이터 날짜 조회 (정적 날짜별 파일 우선)
  useEffect(() => {
    const fetchLatestDate = async () => {
      if (!initialMaxDate) {
        // 1. 정적 파일에서 사용 가능한 날짜 조회
        try {
          const availableDates = await stockService.getAvailableDates();
          if (availableDates.length > 0) {
            // 최신 날짜 사용
            const sortedDates = availableDates.sort((a, b) =>
              new Date(b).getTime() - new Date(a).getTime()
            );
            const latestDate = sortedDates[0];

            setMaxDate(latestDate);
            // DateRangePicker가 자동으로 날짜 범위를 설정하므로 여기서는 설정하지 않음
            return;
          }
        } catch (error) {
          console.warn("Failed to load from static files, falling back to API:", error);
        }

        // 2. 폴백: API에서 조회
        const latestDate = await stockService.getLatestDataDate();
        if (latestDate) {
          setMaxDate(latestDate);
          // DateRangePicker가 자동으로 날짜 범위를 설정하므로 여기서는 설정하지 않음
        }
      } else {
        // initialMaxDate가 제공된 경우
        // DateRangePicker가 자동으로 날짜 범위를 설정하므로 여기서는 설정하지 않음
      }
    };

    fetchLatestDate();
  }, [initialMaxDate]);

  // 날짜 범위 변경 시 데이터 로드 (날짜별 파일에서)
  useEffect(() => {
    if (!dateRange) return;

    const loadHistoryData = async () => {
      setIsLoading(true);
      try {
        // 1. 사용 가능한 날짜 조회
        const availableDates = await stockService.getAvailableDates();

        if (availableDates.length > 0) {
          // 날짜 범위에 맞는 날짜 필터링
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);

          const filteredDates = availableDates.filter((date) => {
            const d = new Date(date);
            return d >= startDate && d <= endDate;
          });

          if (filteredDates.length > 0) {
            // 날짜별 파일에서 해당 종목 히스토리 조회
            const staticData = await stockService.getStaticHistory(ticker, filteredDates);

            if (staticData && staticData.length > 0) {
              console.log(`✅ Loaded ${staticData.length} data points from date-separated files for ${ticker}`);
              setHistoryData(staticData);
              setIsLoading(false);
              return;
            }
          }
        }

        console.warn(`No static data for ${ticker}, falling back to API...`);

        // 2. 폴백: API에서 조회
        const dates = stockService.generateDateRange(
          dateRange.end,
          getMonthsDiff(dateRange.start, dateRange.end),
          7 // 주 단위
        );

        const data = await stockService.getStockHistoryRange(ticker, dates);
        console.log(`✅ Loaded ${data.length} data points from API for ${ticker}`);
        setHistoryData(data);
      } catch (error) {
        console.error("Failed to load history data:", error);
        setHistoryData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistoryData();
  }, [dateRange, ticker]);

  // 개월 수 차이 계산
  const getMonthsDiff = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    return Math.max(1, months);
  };

  // 날짜 범위 변경 핸들러
  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setDateRange({ start: startDate, end: endDate });
  };

  // 차트 데이터 변환
  const getChartData = (): TimeSeriesDataPoint[] => {
    if (!historyData || historyData.length === 0) return [];

    return historyData
      .filter((d) => d.dataDate)
      .map((d) => ({
        date: d.dataDate,
        value: getMetricValue(d, selectedChartMetric),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // 지표 값 추출
  const getMetricValue = (
    data: FrontendUndervaluedStock,
    metric: string
  ): number => {
    switch (metric) {
      case "price":
        return data.price || 0;
      case "totalScore":
        return data.totalScore || 0;
      case "pe":
        return data.PER || 0;
      case "roe":
        return data.ROE || 0;
      default:
        return 0;
    }
  };

  // 테이블 데이터 변환
  const getTableData = (): StockSnapshot[] => {
    if (!historyData || historyData.length === 0) return [];

    // 최대 10개 스냅샷만 표시 (균등 분포)
    const maxSnapshots = 10;
    const step = Math.max(1, Math.floor(historyData.length / maxSnapshots));
    const selectedData = historyData.filter((_, idx) => idx % step === 0 || idx === historyData.length - 1);

    return selectedData.map((d) => ({
      date: d.dataDate,
      price: d.price,
      marketCap: d.marketCap,
      pe: d.PER,
      pb: d.PBR,
      roe: d.ROE,
      totalScore: d.totalScore,
      growthScore: d.growthScore,
      valueScore: d.valueScore,
      momentumScore: d.momentumScore,
      ret5d: d.ret5d,
      ret20d: d.ret20d,
      ret63d: d.ret63d,
      sma20: d.sma20,
      sma50: d.sma50,
      sma200: d.sma200,
    }));
  };

  const chartMetricOptions = [
    { value: "price", label: "주가", unit: "USD" },
    { value: "totalScore", label: "종합점수", unit: "" },
    { value: "pe", label: "PER", unit: "" },
    { value: "roe", label: "ROE", unit: "%" },
  ];

  const tableMetricGroups = {
    기본: ["price", "totalScore", "pe", "roe"],
    밸류에이션: ["price", "pe", "pb", "marketCap"],
    수익성: ["roe", "totalScore", "growthScore", "valueScore"],
    모멘텀: ["price", "ret5d", "ret20d", "ret63d"],
    이동평균: ["price", "sma20", "sma50", "sma200"],
  };

  const [selectedTableMetrics, setSelectedTableMetrics] = useState<string[]>(tableMetricGroups["기본"]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">{companyName}</h2>
        <p className="text-sm text-gray-600 mt-1">
          티커: <span className="font-mono font-semibold">{ticker}</span>
        </p>
      </div>

      {/* 날짜 범위 선택 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 날짜 범위 선택</h3>
        <DateRangePicker
          onDateRangeChange={handleDateRangeChange}
          maxDate={maxDate}
          defaultRange="3M"
        />
        {dateRange && (
          <p className="text-sm text-gray-600 mt-3">
            선택된 기간: <span className="font-semibold">{dateRange.start}</span> ~{" "}
            <span className="font-semibold">{dateRange.end}</span>
          </p>
        )}
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-gray-600 font-medium">데이터를 불러오는 중...</p>
        </div>
      )}

      {/* 차트 섹션 */}
      {!isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">📈 추세 차트</h3>
            <div className="flex gap-2">
              {chartMetricOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedChartMetric(option.value as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    selectedChartMetric === option.value
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {historyData.length > 0 ? (
            <TimeSeriesChart
              data={getChartData()}
              height={300}
              unit={chartMetricOptions.find((o) => o.value === selectedChartMetric)?.unit}
              showGrid={true}
              showXAxis={true}
              showYAxis={true}
            />
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-600 font-medium">선택한 기간에 데이터가 없습니다</p>
              <p className="text-sm text-gray-500 mt-2">다른 기간을 선택해주세요</p>
            </div>
          )}
        </div>
      )}

      {/* 테이블 섹션 */}
      {!isLoading && historyData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 지표 비교</h3>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 self-center">표시 지표:</span>
              {Object.entries(tableMetricGroups).map(([groupName, metrics]) => (
                <button
                  key={groupName}
                  onClick={() => setSelectedTableMetrics(metrics)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    JSON.stringify(selectedTableMetrics) === JSON.stringify(metrics)
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {groupName}
                </button>
              ))}
            </div>
          </div>
          <StockComparisonTable
            snapshots={getTableData()}
            selectedMetrics={selectedTableMetrics}
            showChangeColumn={true}
          />
        </div>
      )}

      {/* 데이터 없음 */}
      {!isLoading && historyData.length === 0 && dateRange && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-600 font-medium">선택한 기간의 데이터가 없습니다</p>
          <p className="text-sm text-gray-500 mt-2">다른 날짜 범위를 선택해보세요</p>
        </div>
      )}
    </div>
  );
};

export default StockPriceVisualization;
