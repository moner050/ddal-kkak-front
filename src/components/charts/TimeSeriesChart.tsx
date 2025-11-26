import React, { useRef, useState } from "react";
import { formatNumber } from "../../utils/format";

export interface TimeSeriesDataPoint {
  date: string; // YYYY-MM-DD 형식
  value: number;
  label?: string; // 추가 라벨 (선택)
}

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  height?: number;
  stroke?: string;
  fill?: string;
  unit?: string;
  title?: string;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
}

/**
 * 날짜별 시계열 차트 컴포넌트
 * - X축: 날짜 라벨
 * - Y축: 값
 * - 인터랙티브 툴팁
 * - 그리드 옵션
 */
const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  height = 200,
  stroke = "#6366f1",
  fill = "rgba(99, 102, 241, 0.1)",
  unit = "",
  title,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<TimeSeriesDataPoint | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200"
        style={{ height: `${height}px` }}
      >
        <p className="text-gray-400 text-sm">데이터가 없습니다</p>
      </div>
    );
  }

  const padding = {
    top: 20,
    right: 20,
    bottom: showXAxis ? 40 : 10,
    left: showYAxis ? 50 : 10,
  };

  const width = 800; // SVG viewBox width
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // 데이터 범위 계산
  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  // Y축 스케일 (값 → SVG Y 좌표)
  const yScale = (value: number) => {
    return padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
  };

  // X축 스케일 (인덱스 → SVG X 좌표)
  const xScale = (index: number) => {
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  // 라인 패스 생성
  const linePath = data
    .map((point, i) => {
      const x = xScale(i);
      const y = yScale(point.value);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  // 영역 패스 생성 (라인 아래 채우기)
  const areaPath =
    linePath +
    ` L ${xScale(data.length - 1)} ${padding.top + chartHeight}` +
    ` L ${xScale(0)} ${padding.top + chartHeight} Z`;

  // 날짜 포맷팅 (MM/DD 형식)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 날짜 포맷팅 (툴팁용 - 전체 날짜)
  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  // X축 라벨 표시 (최대 10개)
  const xAxisLabels = (() => {
    const maxLabels = 10;
    if (data.length <= maxLabels) return data.map((_, i) => i);
    const step = Math.floor(data.length / maxLabels);
    return Array.from({ length: maxLabels }, (_, i) => i * step);
  })();

  // Y축 라벨 표시 (5개)
  const yAxisLabels = Array.from({ length: 5 }, (_, i) => {
    const value = minValue + (valueRange / 4) * i;
    return value;
  }).reverse();

  // 마우스 이벤트 핸들러
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // SVG viewBox 좌표로 변환
    const svgX = (x / rect.width) * width;
    const svgY = (y / rect.height) * height;

    // 가장 가까운 데이터 포인트 찾기
    const closestIndex = Math.round(
      ((svgX - padding.left) / chartWidth) * (data.length - 1)
    );

    if (closestIndex >= 0 && closestIndex < data.length) {
      setHoveredPoint(data[closestIndex]);
      setMousePosition({ x, y });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      )}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          style={{ height: `${height}px` }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* 그리드 */}
          {showGrid && (
            <g className="grid">
              {/* 수평 그리드 */}
              {yAxisLabels.map((value, i) => (
                <line
                  key={`h-grid-${i}`}
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={yScale(value)}
                  y2={yScale(value)}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              ))}
              {/* 수직 그리드 */}
              {xAxisLabels.map((index) => (
                <line
                  key={`v-grid-${index}`}
                  x1={xScale(index)}
                  x2={xScale(index)}
                  y1={padding.top}
                  y2={padding.top + chartHeight}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              ))}
            </g>
          )}

          {/* Y축 */}
          {showYAxis && (
            <g className="y-axis">
              {yAxisLabels.map((value, i) => (
                <text
                  key={`y-label-${i}`}
                  x={padding.left - 10}
                  y={yScale(value)}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  className="text-[10px] fill-gray-500"
                >
                  {formatNumber(value)}
                </text>
              ))}
            </g>
          )}

          {/* 영역 */}
          <path d={areaPath} fill={fill} />

          {/* 라인 */}
          <path
            d={linePath}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 데이터 포인트 */}
          {data.map((point, i) => (
            <circle
              key={`point-${i}`}
              cx={xScale(i)}
              cy={yScale(point.value)}
              r="3"
              fill={stroke}
              className="transition-all"
              style={{
                opacity: hoveredPoint === point ? 1 : 0.6,
                r: hoveredPoint === point ? 5 : 3,
              }}
            />
          ))}

          {/* X축 */}
          {showXAxis && (
            <g className="x-axis">
              {xAxisLabels.map((index) => (
                <text
                  key={`x-label-${index}`}
                  x={xScale(index)}
                  y={padding.top + chartHeight + 20}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-500"
                >
                  {formatDate(data[index].date)}
                </text>
              ))}
            </g>
          )}
        </svg>

        {/* 툴팁 */}
        {hoveredPoint && (
          <div
            className="absolute pointer-events-none bg-gray-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg z-10"
            style={{
              left: `${mousePosition.x}px`,
              top: `${mousePosition.y - 60}px`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="font-semibold">{formatFullDate(hoveredPoint.date)}</div>
            <div className="text-indigo-300">
              {formatNumber(hoveredPoint.value)}
              {unit && ` ${unit}`}
            </div>
            {hoveredPoint.label && (
              <div className="text-gray-300 text-[10px]">{hoveredPoint.label}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSeriesChart;
