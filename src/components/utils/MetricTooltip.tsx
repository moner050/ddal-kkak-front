import React, { useState, useRef, useEffect } from 'react';

interface MetricTooltipProps {
  tooltip: string;
  delay?: number; // milliseconds
  children?: React.ReactNode; // 레이블 등을 children으로 받을 수 있음
}

export default function MetricTooltip({ tooltip, delay = 1000, children }: MetricTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowTooltip(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowTooltip(!showTooltip);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // children이 있으면 children과 함께 감싸서 렌더링 (레이블 전체 영역이 클릭 가능)
  if (children) {
    return (
      <div
        className="inline-flex items-center gap-1 relative cursor-help"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
        <svg className="w-3 h-3 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        {showTooltip && (
          <div className="absolute top-full mt-1 z-50 w-64 p-2 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-normal left-1/2 transform -translate-x-1/2">
            {tooltip}
          </div>
        )}
      </div>
    );
  }

  // children이 없으면 기존처럼 물음표 아이콘만 렌더링
  return (
    <div className="inline-block relative">
      <button
        className="text-gray-400 hover:text-gray-600 transition-colors ml-1 align-middle"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        aria-label="도움말"
      >
        <svg className="w-3 h-3 inline-block" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {showTooltip && (
        <div className="absolute top-full mt-1 z-50 w-64 p-2 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-normal left-1/2 transform -translate-x-1/2">
          {tooltip}
        </div>
      )}
    </div>
  );
}
