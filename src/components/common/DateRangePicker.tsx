import React, { useState, useEffect } from "react";

interface DateRangePickerProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
  maxDate?: string; // YYYY-MM-DD 형식
  minDate?: string; // YYYY-MM-DD 형식
  defaultRange?: "1M" | "3M" | "6M" | "1Y" | "YTD" | "CUSTOM";
}

/**
 * 날짜 범위 선택 컴포넌트
 * - 사전 정의된 기간 버튼 (1개월, 3개월, 6개월, 1년, 연초 대비)
 * - 커스텀 날짜 선택 (시작일/종료일 직접 입력)
 */
const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onDateRangeChange,
  maxDate,
  minDate,
  defaultRange = "3M",
}) => {
  const today = maxDate || new Date().toISOString().split("T")[0];
  const [selectedRange, setSelectedRange] = useState<string>(defaultRange);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>(today);
  const [isInitialized, setIsInitialized] = useState(false);

  // 날짜 계산 유틸리티
  const getDateBefore = (date: string, months: number): string => {
    const d = new Date(date);
    d.setMonth(d.getMonth() - months);
    return d.toISOString().split("T")[0];
  };

  const getYearToDate = (date: string): string => {
    const d = new Date(date);
    return `${d.getFullYear()}-01-01`;
  };

  // 범위 선택 핸들러
  const handleRangeSelect = (range: string) => {
    setSelectedRange(range);
    let startDate = "";
    const endDate = today;

    switch (range) {
      case "1M":
        startDate = getDateBefore(today, 1);
        break;
      case "3M":
        startDate = getDateBefore(today, 3);
        break;
      case "6M":
        startDate = getDateBefore(today, 6);
        break;
      case "1Y":
        startDate = getDateBefore(today, 12);
        break;
      case "YTD":
        startDate = getYearToDate(today);
        break;
      case "CUSTOM":
        // 커스텀 모드는 사용자가 직접 입력
        return;
      default:
        startDate = getDateBefore(today, 3);
    }

    onDateRangeChange(startDate, endDate);
  };

  // 커스텀 날짜 적용
  const handleCustomApply = () => {
    if (customStartDate && customEndDate) {
      onDateRangeChange(customStartDate, customEndDate);
    }
  };

  // 초기 렌더링 시 defaultRange에 맞는 날짜 범위 자동 호출
  useEffect(() => {
    if (!isInitialized && defaultRange !== "CUSTOM") {
      handleRangeSelect(defaultRange);
      setIsInitialized(true);
    }
  }, [isInitialized, defaultRange, today]);

  const rangeButtons = [
    { label: "1개월", value: "1M" },
    { label: "3개월", value: "3M" },
    { label: "6개월", value: "6M" },
    { label: "1년", value: "1Y" },
    { label: "연초대비", value: "YTD" },
    { label: "직접선택", value: "CUSTOM" },
  ];

  return (
    <div className="space-y-3">
      {/* 사전 정의 범위 버튼 */}
      <div className="flex flex-wrap gap-2">
        {rangeButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => handleRangeSelect(btn.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              selectedRange === btn.value
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* 커스텀 날짜 입력 */}
      {selectedRange === "CUSTOM" && (
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                시작일
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                min={minDate}
                max={customEndDate || today}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                종료일
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                min={customStartDate}
                max={maxDate || today}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <button
            onClick={handleCustomApply}
            disabled={!customStartDate || !customEndDate}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
          >
            적용
          </button>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
