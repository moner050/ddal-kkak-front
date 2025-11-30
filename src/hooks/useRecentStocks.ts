/**
 * 최근 본 종목 Custom Hook
 *
 * 최근 본 종목 목록을 관리하고 localStorage에 저장합니다.
 * 최대 5개까지 저장되며, 새로운 종목이 추가되면 가장 오래된 항목이 제거됩니다.
 */

import { useState, useEffect } from 'react';

export interface UseRecentStocksReturn {
  recentStocks: string[];
  addRecentStock: (symbol: string) => void;
}

/**
 * 최근 본 종목 hook
 */
export function useRecentStocks(detailSymbol: string): UseRecentStocksReturn {
  const [recentStocks, setRecentStocks] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("ddal-kkak-recent-stocks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // detailSymbol이 변경될 때마다 최근 본 종목에 추가
  useEffect(() => {
    if (!detailSymbol) return;

    setRecentStocks(prev => {
      // 중복 제거하고 최신 항목을 맨 앞에 추가
      const filtered = prev.filter(s => s !== detailSymbol);
      const updated = [detailSymbol, ...filtered].slice(0, 5);

      // localStorage에 저장
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("ddal-kkak-recent-stocks", JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to save recent stocks:", e);
        }
      }

      return updated;
    });
  }, [detailSymbol]);

  const addRecentStock = (symbol: string) => {
    setRecentStocks(prev => {
      const filtered = prev.filter(s => s !== symbol);
      const updated = [symbol, ...filtered].slice(0, 5);

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("ddal-kkak-recent-stocks", JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to save recent stocks:", e);
        }
      }

      return updated;
    });
  };

  return {
    recentStocks,
    addRecentStock,
  };
}
