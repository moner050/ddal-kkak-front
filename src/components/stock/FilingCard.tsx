import React, { useState } from 'react';
import { classNames } from '../../utils/format';

interface FilingCardItem {
  symbol: string;
  company: string;
  formType: string;
  market: string;
  category: string;
  summary: string;
  logoUrl?: string;
}

interface FilingCardProps {
  item: FilingCardItem;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function FilingCard({
  item,
  onClick,
  isFavorite,
  onToggleFavorite
}: FilingCardProps) {
  const [logoError, setLogoError] = useState(false);

  return (
    <div
      role="button"
      onClick={onClick}
      className="group w-full text-left rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {item.logoUrl && !logoError ? (
          <img
            src={item.logoUrl}
            alt="logo"
            className="h-7 w-7 sm:h-8 sm:w-8 rounded object-contain flex-shrink-0 bg-white p-0.5"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] sm:text-xs text-gray-400">?</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 flex-wrap">
            <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium">
              {item.formType}
            </span>
            <span className="text-[10px] sm:text-xs">{item.market}</span>
            <span className="hidden sm:inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
              {item.category}
            </span>
          </div>
          <div className="mt-1 flex items-start gap-2">
            <div className="truncate text-sm sm:text-base font-semibold text-gray-900 flex-1 min-w-0">
              {item.symbol} <span className="hidden sm:inline">· {item.company}</span>
            </div>
            <button
              aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite && onToggleFavorite();
              }}
              className={classNames(
                "shrink-0 rounded-full border px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold",
                isFavorite
                  ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                  : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
              )}
            >
              {isFavorite ? "★" : "☆"}
            </button>
          </div>
          <p className="mt-2 line-clamp-2 text-xs sm:text-sm text-gray-700">{item.summary}</p>
        </div>
      </div>
    </div>
  );
}
