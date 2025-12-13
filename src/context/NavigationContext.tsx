import React, { createContext, useContext, useState, ReactNode } from "react";

/**
 * 네비게이션 상태 관리 Context
 * - ETF에서 종목으로 이동할 때 이전 ETF 정보 저장
 * - 종목 상세에서 뒤로가기할 때 ETF로 돌아갈 수 있도록 관리
 */

interface NavigationContextType {
  // ETF에서 온 경우 ETF 티커
  fromEtfTicker: string | null;
  setFromEtfTicker: (ticker: string | null) => void;

  // 이동할 종목 심볼
  targetStockSymbol: string | null;
  setTargetStockSymbol: (symbol: string | null) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fromEtfTicker, setFromEtfTicker] = useState<string | null>(null);
  const [targetStockSymbol, setTargetStockSymbol] = useState<string | null>(null);

  return (
    <NavigationContext.Provider
      value={{
        fromEtfTicker,
        setFromEtfTicker,
        targetStockSymbol,
        setTargetStockSymbol,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

/**
 * NavigationContext를 사용하는 Hook
 */
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
};
