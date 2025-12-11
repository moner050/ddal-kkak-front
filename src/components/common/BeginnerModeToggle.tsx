import React from 'react';
import { classNames } from '../../utils/format';

interface BeginnerModeToggleProps {
  isBeginnerMode: boolean;
  onToggle: (value: boolean) => void;
}

export default function BeginnerModeToggle({ isBeginnerMode, onToggle }: BeginnerModeToggleProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 rounded-xl border border-gray-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-sm sm:text-base">{isBeginnerMode ? '🌱' : '📊'}</span>
        <span className="text-xs sm:text-sm font-semibold text-gray-700">
          {isBeginnerMode ? '간편' : '상세'}
        </span>
      </div>
      <button
        onClick={() => onToggle(!isBeginnerMode)}
        className={classNames(
          "relative inline-flex h-5 sm:h-6 w-10 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1",
          isBeginnerMode ? "bg-indigo-600" : "bg-gray-300"
        )}
        role="switch"
        aria-checked={isBeginnerMode}
        aria-label="보기 모드 토글"
      >
        <span
          className={classNames(
            "inline-block h-3.5 sm:h-4 w-3.5 sm:w-4 transform rounded-full bg-white shadow-md transition-transform",
            isBeginnerMode ? "translate-x-5 sm:translate-x-6" : "translate-x-1"
          )}
        />
      </button>
      <div className="hidden sm:block text-[10px] text-gray-500 max-w-[120px]">
        {isBeginnerMode
          ? "핵심 지표와 쉬운 설명"
          : "모든 지표 상세 보기"}
      </div>
    </div>
  );
}
