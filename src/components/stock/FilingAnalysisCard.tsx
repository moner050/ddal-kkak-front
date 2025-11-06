import React, { useState } from 'react';
import AIScoreGauge from './AIScoreGauge';
import AnalysisStatusBadge from './AnalysisStatusBadge';

interface Filing {
  symbol: string;
  company: string;
  formType: string;
  market: string;
  date: string;
  summary: string;
  aiScore: number;
  sentiment: "POS" | "NEG" | "NEU";
  confidence: number;
  previousScores?: number[];
  logoUrl?: string;
}

interface FilingAnalysisCardProps {
  filing: Filing;
  onClick: () => void;
  favorites?: Record<string, boolean>;
  toggleFavorite?: (symbol: string) => void;
}

export default function FilingAnalysisCard({
  filing,
  onClick,
  favorites,
  toggleFavorite
}: FilingAnalysisCardProps) {
  const [logoError, setLogoError] = useState(false);

  const getSentiment = (s: number): "POS" | "NEG" | "NEU" => {
    if (s >= 70) return "POS";
    if (s < 50) return "NEG";
    return "NEU";
  };

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 flex items-center gap-2">
          {filing.previousScores && filing.previousScores.length > 0 && (
            <div className="flex items-center gap-1.5">
              {filing.previousScores.map((score: number, idx: number) => (
                <div key={idx} className="relative" style={{ width: '32px', height: '32px' }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-[10px] font-bold text-gray-400">{score}</div>
                  </div>
                  <svg className="w-full h-full -rotate-90 opacity-40" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke={
                        getSentiment(score) === "POS"
                          ? "#10b981"
                          : getSentiment(score) === "NEG"
                          ? "#ef4444"
                          : "#f59e0b"
                      }
                      strokeWidth="3"
                      strokeDasharray={`${(score / 100) * 88} 88`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              ))}
              <div className="text-gray-400 text-xs">→</div>
            </div>
          )}
          <AIScoreGauge score={filing.aiScore} sentiment={filing.sentiment} size="sm" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium">
              {filing.formType}
            </span>
            <span className="text-xs text-gray-500">{filing.market}</span>
            <span className="text-xs text-gray-400">{filing.date}</span>
          </div>
          <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            {/* 로고 이미지 */}
            {filing.logoUrl && !logoError ? (
              <img
                src={filing.logoUrl}
                alt={filing.company}
                className="h-5 w-5 rounded object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="h-5 w-5 rounded bg-gray-200 flex items-center justify-center">
                <span className="text-[10px] text-gray-400">?</span>
              </div>
            )}
            <span>{filing.symbol} · {filing.company}</span>
            {toggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(filing.symbol);
                }}
                className="flex-shrink-0 hover:scale-110 transition-transform"
              >
                <span className="text-sm">
                  {favorites && favorites[filing.symbol] ? '❤️' : '🤍'}
                </span>
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{filing.summary}</p>
          <div className="flex items-center gap-2">
            <AnalysisStatusBadge sentiment={filing.sentiment} confidence={filing.confidence} />
          </div>
        </div>
      </div>
    </div>
  );
}
