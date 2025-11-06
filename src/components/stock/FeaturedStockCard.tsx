import React from 'react';
import AIScoreGauge from './AIScoreGauge';
import AnalysisStatusBadge from './AnalysisStatusBadge';

interface FeaturedStock {
  symbol: string;
  name: string;
  logoUrl?: string;
  aiScore: number;
  sentiment: "POS" | "NEG" | "NEU";
  reason: string;
  confidence: number;
  category: string;
}

interface FeaturedStockCardProps {
  stock: FeaturedStock;
  onClick: () => void;
}

export default function FeaturedStockCard({ stock, onClick }: FeaturedStockCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-5 shadow-md hover:shadow-xl transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {stock.logoUrl && (
              <img src={stock.logoUrl} alt={stock.name} className="h-10 w-10 rounded-lg" />
            )}
            <div>
              <div className="text-sm text-gray-600">{stock.symbol}</div>
              <div className="text-lg font-bold text-gray-900">{stock.name}</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-700 line-clamp-2">{stock.reason}</p>
          <div className="mt-3 flex items-center gap-2">
            <AnalysisStatusBadge sentiment={stock.sentiment} confidence={stock.confidence} />
            <span className="text-xs text-gray-500">{stock.category}</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AIScoreGauge score={stock.aiScore} sentiment={stock.sentiment} size="md" />
          <div className="text-xs text-gray-600 font-semibold">AI 분석</div>
        </div>
      </div>
    </div>
  );
}
