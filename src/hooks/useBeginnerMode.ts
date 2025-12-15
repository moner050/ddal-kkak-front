/**
 * 초보자 모드 Custom Hook
 *
 * 반응형으로 모바일에서는 간편모드, 데스크톱에서는 상세모드를 자동으로 설정합니다.
 */

import { useState, useEffect } from 'react';

export interface UseBeginnerModeReturn {
  isBeginnerMode: boolean;
  handleBeginnerModeToggle: (value: boolean) => void;
}

/**
 * 초보자 모드 hook (반응형 처리: 모바일=true, 웹=false)
 */
export function useBeginnerMode(): UseBeginnerModeReturn {
  const [isBeginnerMode, setIsBeginnerMode] = useState<boolean>(true);

  useEffect(() => {
    const handleResize = () => {
      // sm 브레이크포인트는 640px
      const isMobile = window.innerWidth < 640;
      setIsBeginnerMode(isMobile);
    };

    // 초기값 설정
    handleResize();

    // 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleBeginnerModeToggle = (value: boolean) => {
    // 토글 함수는 유지하되, 실제로는 사용되지 않음
    setIsBeginnerMode(value);
  };

  return {
    isBeginnerMode,
    handleBeginnerModeToggle,
  };
}
