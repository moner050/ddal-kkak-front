import React, { useState } from 'react';
import { classNames } from '../../utils/format';
import type { SortConfig } from '../../hooks/useFiltersAndSort';

interface TooltipHeaderProps {
  label: string;
  tooltip?: string;
  sortKey?: string;
  sorts: SortConfig[];
  onSort?: (key: string) => void;
}

export default function TooltipHeader({
  label,
  tooltip,
  sortKey,
  sorts,
  onSort
}: TooltipHeaderProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // 현재 정렬 상태 확인
  const sortIndex = sorts.findIndex(s => s.key === sortKey);
  const isSorted = sortIndex !== -1;
  const sortDirection = isSorted ? sorts[sortIndex].direction : 'desc';
  const sortOrder = isSorted ? sortIndex + 1 : null;

  return (
    <div className="flex items-center justify-center gap-1 relative group">
      <button
        className={classNames(
          "font-semibold uppercase tracking-wider transition-colors",
          sortKey && onSort ? "hover:text-indigo-600 cursor-pointer" : "",
          isSorted ? "text-indigo-600" : "text-gray-600"
        )}
        onClick={() => sortKey && onSort && onSort(sortKey)}
      >
        {label}
        {isSorted && (
          <span className="ml-1">
            {sorts.length > 1 && <sup className="text-[10px] font-bold">{sortOrder}</sup>}
            {sortDirection === "asc" ? "↑" : "↓"}
          </span>
        )}
      </button>
      {tooltip && (
        <>
          <button
            className="text-gray-400 hover:text-gray-600"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(!showTooltip)}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {showTooltip && (
            <div className="absolute top-full mt-1 z-50 w-48 p-2 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-normal left-1/2 transform -translate-x-1/2">
              {tooltip}
            </div>
          )}
        </>
      )}
    </div>
  );
}
