/**
 * 즐겨찾기 Custom Hook
 *
 * 백엔드 API를 사용하여 즐겨찾기 상태를 관리합니다.
 * 로그인되지 않은 경우 API를 호출하지 않습니다.
 */

import { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';
import { authStorage } from '../utils/authStorage';

export interface UseFavoritesReturn {
  favorites: Record<string, boolean>;
  toggleFavorite: (symbol: string) => void;
  loading: boolean;
}

/**
 * 즐겨찾기 hook (백엔드 API 연동)
 * 로그인 상태를 확인한 후에만 API 호출
 */
export function useFavorites(userId: string = 'default'): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const favoriteDebounceRef = useRef<Record<string, boolean>>({});

  // 로그인 상태 확인
  useEffect(() => {
    const currentUser = authStorage.getCurrentUser();
    const loggedIn = currentUser !== null;
    setIsLoggedIn(loggedIn);

    if (!loggedIn) {
      // 로그인되지 않았으면 즐겨찾기 데이터 초기화
      setFavorites({});
      setLoading(false);
      console.log('⏭️ 로그인되지 않음 - 즐겨찾기 API 호출 스킵');
      return;
    }

    // 로그인된 상태에서만 백엔드에서 즐겨찾기 로드
    const loadFavorites = async () => {
      try {
        const favoritesMap = await api.favorites.getMap(userId);
        setFavorites(favoritesMap);
        console.log('✅ 즐겨찾기 로드 성공:', favoritesMap);
      } catch (error) {
        console.error('❌ 즐겨찾기 로드 실패:', error);
        // 실패 시 빈 객체 사용
        setFavorites({});
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [userId]);

  const toggleFavorite = async (symbol: string) => {
    // 로그인되지 않은 경우 API 호출하지 않음
    if (!isLoggedIn) {
      console.log('⏭️ 로그인되지 않음 - 즐겨찾기 토글 API 호출 스킵');
      return;
    }

    // Prevent rapid clicks (300ms debounce)
    if (favoriteDebounceRef.current[symbol]) return;

    favoriteDebounceRef.current[symbol] = true;

    // 낙관적 업데이트 (Optimistic Update): 즉시 UI 반영
    const newValue = !favorites[symbol];
    setFavorites(prev => ({ ...prev, [symbol]: newValue }));

    try {
      // 백엔드 API 호출
      const response = await api.favorites.toggle(symbol, userId);

      // 서버 응답과 동기화
      setFavorites(prev => ({
        ...prev,
        [symbol]: response.isFavorite
      }));

      console.log(`✅ 즐겨찾기 토글 성공: ${symbol} = ${response.isFavorite}`);
    } catch (error) {
      console.error('❌ 즐겨찾기 토글 실패:', error);

      // 실패 시 롤백
      setFavorites(prev => ({ ...prev, [symbol]: !newValue }));
    } finally {
      setTimeout(() => {
        favoriteDebounceRef.current[symbol] = false;
      }, 300);
    }
  };

  return {
    favorites,
    toggleFavorite,
    loading,
  };
}
