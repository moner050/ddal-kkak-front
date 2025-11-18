import React from 'react';
import { TabKey } from '../../types';
import { classNames } from '../../utils/format';

interface BottomNavProps {
  active?: TabKey;
  onChange: (key: TabKey) => void;
}

export default function BottomNav({ active = "home", onChange }: BottomNavProps) {
  // ✅ 탭 순서: 홈 | 종목추천 | 공시 | 상세 | 관심 (5개 탭 항상 표시)
  const items = [
    { key: "home" as TabKey, icon: "🏠", label: "홈" },
    { key: "undervalued" as TabKey, icon: "💎", label: "종목추천" },
    { key: "filings" as TabKey, icon: "📊", label: "공시" },
    { key: "detail" as TabKey, icon: "📈", label: "상세" },
    { key: "watchlist" as TabKey, icon: "⭐", label: "관심" }
  ];

  const itemCls = (key: TabKey) => classNames(
    "flex flex-col items-center justify-center w-full py-2 text-xs font-semibold touch-manipulation transition-colors",
    // 모바일에서 더 컴팩트하게
    "h-14 sm:h-16",
    key === active ? "text-indigo-700 bg-indigo-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
  );

  const click = (key: TabKey) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onChange && onChange(key);
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-lg shadow-lg">
      <div className="mx-auto max-w-7xl">
        <ul className="grid grid-cols-5">
          {items.map((item) => (
            <li key={item.key}>
              <button
                className={itemCls(item.key)}
                onClick={click(item.key)}
                aria-current={active === item.key ? "page" : undefined}
              >
                <span className="text-base sm:text-xl mb-0.5 sm:mb-1">{item.icon}</span>
                <span className="text-[9px] sm:text-[10px]">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
