import React from 'react';
import { CATEGORIES } from '../../constants/categories';
import { classNames } from '../../utils/format';

interface CategoryChipsProps {
  value: string;
  onChange: (v: string) => void;
  categories?: string[];
}

export default function CategoryChips({
  value,
  onChange,
  categories = CATEGORIES as unknown as string[]
}: CategoryChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      {categories.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange && onChange(c)}
          className={classNames(
            "rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold ring-1",
            value === c
              ? "bg-gray-900 text-white ring-gray-900"
              : "bg-gray-50 text-gray-700 ring-gray-200 hover:bg-gray-100"
          )}
          aria-pressed={value === c}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
