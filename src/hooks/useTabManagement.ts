/**
 * 탭 관리 Custom Hook
 *
 * 탭 전환 및 스크롤 위치 관리 로직을 분리합니다.
 * - 탭 상태 관리
 * - 브라우저 히스토리 연동
 * - 탭별 스크롤 위치 저장/복원
 */

import { useState, useEffect, useRef, MutableRefObject } from 'react';
import { TabKey, TAB_KEYS } from '../types';

export interface UseTabManagementReturn {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  switchTab: (tab: TabKey) => void;
  scrollPositions: MutableRefObject<Record<TabKey, number>>;
  homeRef: MutableRefObject<HTMLDivElement | null>;
  undervaluedRef: MutableRefObject<HTMLDivElement | null>;
  filingsRef: MutableRefObject<HTMLDivElement | null>;
  watchlistRef: MutableRefObject<HTMLDivElement | null>;
  detailRef: MutableRefObject<HTMLDivElement | null>;
  refMap: Record<TabKey, MutableRefObject<HTMLDivElement | null>>;
}

/**
 * 탭 관리 hook
 */
export function useTabManagement(): UseTabManagementReturn {
  // 탭 상태 (URL 파라미터에서 초기값 가져오기)
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window === "undefined") return "home";
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab");
    return TAB_KEYS.includes(tab as TabKey) ? (tab as TabKey) : "home";
  });

  // 탭별 스크롤 위치 저장용
  const scrollPositions = useRef<Record<TabKey, number>>({
    home: 0,
    undervalued: 0,
    filings: 0,
    watchlist: 0,
    detail: 0,
  });

  // 탭별 개별 스크롤 컨테이너 ref
  const homeRef = useRef<HTMLDivElement>(null);
  const undervaluedRef = useRef<HTMLDivElement>(null);
  const filingsRef = useRef<HTMLDivElement>(null);
  const watchlistRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const refMap: Record<TabKey, MutableRefObject<HTMLDivElement | null>> = {
    home: homeRef,
    undervalued: undervaluedRef,
    filings: filingsRef,
    watchlist: watchlistRef,
    detail: detailRef,
  };

  // 초기 페이지 로드 시 현재 탭을 히스토리에 설정
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 초기 상태 설정 (replaceState 사용하여 새 히스토리 엔트리를 만들지 않음)
    const url = new URL(window.location.href);
    url.searchParams.set("tab", activeTab);
    window.history.replaceState({ tab: activeTab }, "", url.toString());
  }, []); // 빈 배열: 최초 한 번만 실행

  // 브라우저 뒤로가기/앞으로가기 버튼 감지
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state && state.tab && TAB_KEYS.includes(state.tab as TabKey)) {
        setActiveTab(state.tab as TabKey);
      } else {
        // URL 파라미터에서 탭 정보 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get("tab");
        if (tab && TAB_KEYS.includes(tab as TabKey)) {
          setActiveTab(tab as TabKey);
        } else {
          setActiveTab("home");
        }
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // 탭 전환 함수: 현재 탭 스크롤 저장 → 다음 탭 스크롤 복원 → 브라우저 히스토리 추가
  const switchTab = (next: TabKey) => {
    const currEl = refMap[activeTab].current;
    if (currEl) scrollPositions.current[activeTab] = currEl.scrollTop;

    setActiveTab(next);

    // 브라우저 히스토리에 상태 추가
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      window.history.pushState({ tab: next }, "", url.toString());
    }

    // 다음 프레임에서 복원 (DOM 업데이트 후)
    requestAnimationFrame(() => {
      const nextEl = refMap[next].current;
      if (nextEl) nextEl.scrollTo({ top: scrollPositions.current[next] || 0 });
    });
  };

  return {
    activeTab,
    setActiveTab,
    switchTab,
    scrollPositions,
    homeRef,
    undervaluedRef,
    filingsRef,
    watchlistRef,
    detailRef,
    refMap,
  };
}
