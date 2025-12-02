import { useState, useEffect } from 'react';
import { recommendationService } from '../api/services';
import type {
  RecommendationSummary,
  PriceGuidance,
  InvestmentRating,
} from '../api/types';

/**
 * 종목 추천 데이터를 가져오는 커스텀 훅
 */
export function useStockRecommendation(symbol: string | null) {
  const [summary, setSummary] = useState<RecommendationSummary | null>(null);
  const [priceGuidance, setPriceGuidance] = useState<PriceGuidance | null>(null);
  const [rating, setRating] = useState<InvestmentRating | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!symbol) {
      setSummary(null);
      setPriceGuidance(null);
      setRating(null);
      return;
    }

    const fetchRecommendation = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 병렬로 3개 API 호출
        const [summaryData, guidanceData, ratingData] = await Promise.all([
          recommendationService.getSummary(symbol),
          recommendationService.getPriceGuidance(symbol),
          recommendationService.getInvestmentRating(symbol),
        ]);

        setSummary(summaryData);
        setPriceGuidance(guidanceData);
        setRating(ratingData);
      } catch (err) {
        console.error('Failed to fetch recommendation data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendation();
  }, [symbol]);

  return {
    summary,
    priceGuidance,
    rating,
    isLoading,
    error,
  };
}
