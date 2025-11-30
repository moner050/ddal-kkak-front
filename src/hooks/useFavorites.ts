/**
 * 즐겨찾기 Custom Hook
 *
 * 즐겨찾기 상태를 관리하고 쿠키에 저장합니다.
 */

import { useState, useRef } from 'react';
import { setCookie, getCookie } from '../utils/cookies';

export interface UseFavoritesReturn {
  favorites: Record<string, boolean>;
  toggleFavorite: (symbol: string) => void;
}

/**
 * 즐겨찾기 hook
 */
export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    // Load favorites from cookie on mount
    const cookieValue = getCookie('ddal-kkak-favorites');
    if (cookieValue) {
      try {
        return JSON.parse(decodeURIComponent(cookieValue));
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  const favoriteDebounceRef = useRef<Record<string, boolean>>({});

  const toggleFavorite = (symbol: string) => {
    // Prevent rapid clicks (1 second debounce)
    if (favoriteDebounceRef.current[symbol]) return;

    favoriteDebounceRef.current[symbol] = true;
    const newFavorites = { ...favorites, [symbol]: !favorites[symbol] };
    setFavorites(newFavorites);

    // Save to cookie
    setCookie('ddal-kkak-favorites', encodeURIComponent(JSON.stringify(newFavorites)));

    setTimeout(() => {
      favoriteDebounceRef.current[symbol] = false;
    }, 1000);
  };

  return {
    favorites,
    toggleFavorite,
  };
}
