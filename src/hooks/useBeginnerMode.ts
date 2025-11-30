/**
 * 초보자 모드 Custom Hook
 *
 * 초보자 모드 상태를 관리하고 localStorage에 저장합니다.
 */

import { useState } from 'react';

export interface UseBeginnerModeReturn {
  isBeginnerMode: boolean;
  handleBeginnerModeToggle: (value: boolean) => void;
}

/**
 * 초보자 모드 hook
 */
export function useBeginnerMode(): UseBeginnerModeReturn {
  const [isBeginnerMode, setIsBeginnerMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return true; // 기본값: 초보자 모드
    try {
      const saved = localStorage.getItem("ddal-kkak-beginner-mode");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const handleBeginnerModeToggle = (value: boolean) => {
    setIsBeginnerMode(value);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ddal-kkak-beginner-mode", JSON.stringify(value));
      } catch (e) {
        console.error("Failed to save beginner mode:", e);
      }
    }
  };

  return {
    isBeginnerMode,
    handleBeginnerModeToggle,
  };
}
