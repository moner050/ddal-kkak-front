import React, { useState } from 'react';
import { classNames } from '../../utils/format';
import { METRIC_BEGINNER_GUIDE, AI_SCORE_INTERPRETATION } from '../../constants/beginnerGuide';
import AIScoreGauge from './AIScoreGauge';
import ThreePointSummary from './ThreePointSummary';
import PriceGuideBand from './PriceGuideBand';

interface BeginnerStockCardProps {
  stock: {
    symbol: string;
    name: string;
    market: string;
    category: string;
    industry: string;
    logoUrl?: string;
    aiScore: number;
    sentiment: 'POS' | 'NEG' | 'NEU';
    price?: number;
    ROE: number;
    PER: number;
    PEG: number;
    PBR: number;
    PSR: number;
    RevYoY: number;
    EPS_Growth_3Y: number;
    OpMarginTTM: number;
    FCF_Yield: number;
  };
  onClick: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  logoError?: boolean;
  onLogoError?: () => void;
}

function MetricWithGuide({
  label,
  value,
  metricKey,
  format = 'percent'
}: {
  label: string;
  value: number;
  metricKey: string;
  format?: 'percent' | 'number' | 'ratio';
}) {
  const [showGuide, setShowGuide] = useState(false);
  const guide = METRIC_BEGINNER_GUIDE[metricKey];

  if (!guide) return null;

  const interpretation = guide.interpretation(value);

  const formatValue = () => {
    if (format === 'percent') return `${value?.toFixed(1)}%`;
    if (format === 'ratio') return value?.toFixed(2);
    return value?.toFixed(1);
  };

  const levelColor = {
    good: 'text-emerald-600 bg-emerald-50',
    normal: 'text-gray-700 bg-gray-50',
    bad: 'text-red-600 bg-red-50'
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowGuide(!showGuide);
        }}
        className={classNames(
          "w-full text-left p-2.5 sm:p-3 rounded-lg border transition-all",
          showGuide ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white hover:border-gray-300"
        )}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1">
            {label}
            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </span>
          <span className={classNames(
            "text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-medium",
            levelColor[interpretation.level]
          )}>
            {interpretation.level === 'good' ? '좋음' : interpretation.level === 'normal' ? '보통' : '주의'}
          </span>
        </div>
        <div className={classNames(
          "text-base sm:text-lg font-bold",
          interpretation.level === 'good' ? 'text-emerald-600' :
          interpretation.level === 'bad' ? 'text-red-600' : 'text-gray-900'
        )}>
          {formatValue()}
        </div>
        <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 line-clamp-1">
          {guide.shortDesc}
        </div>
      </button>

      {/* 상세 설명 팝업 */}
      {showGuide && (
        <div
          className="absolute z-50 left-0 right-0 top-full mt-1 p-3 bg-white border border-gray-200 rounded-xl shadow-lg text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="font-bold text-gray-900 mb-1">{guide.name}</div>
          <p className="text-gray-600 mb-2 leading-relaxed">{guide.fullDesc}</p>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-gray-500">적정 기준: <span className="font-medium text-indigo-600">{guide.goodRange}</span></span>
          </div>
          <div className={classNames(
            "mt-2 p-2 rounded-lg text-xs",
            levelColor[interpretation.level]
          )}>
            {interpretation.text}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BeginnerStockCard({
  stock,
  onClick,
  onToggleFavorite,
  isFavorite,
  logoError,
  onLogoError
}: BeginnerStockCardProps) {
  const scoreInterpretation = AI_SCORE_INTERPRETATION;
  const stars = scoreInterpretation.getStars(stock.aiScore);

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl border-2 border-gray-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all"
    >
      {/* 헤더: 종목 정보 + AI Score */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {stock.logoUrl && !logoError ? (
            <img
              src={stock.logoUrl}
              alt={stock.name}
              className="h-12 w-12 rounded-xl flex-shrink-0 object-contain bg-white p-1"
              onError={onLogoError}
            />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0">
              <span className="text-xl text-gray-400">?</span>
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{stock.symbol} · {stock.market === 'US' ? '🇺🇸 미국' : '🇰🇷 한국'}</span>
              {onToggleFavorite && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite();
                  }}
                  className="hover:scale-110 transition-transform"
                >
                  <span className="text-sm">{isFavorite ? '❤️' : '🤍'}</span>
                </button>
              )}
            </div>
            <div className="text-base sm:text-lg font-bold text-gray-900 truncate">{stock.name}</div>
            <div className="text-[10px] sm:text-xs text-gray-500">{stock.category}</div>
          </div>
        </div>

        {/* AI Score */}
        <div className="flex flex-col items-center">
          <AIScoreGauge score={stock.aiScore} sentiment={stock.sentiment} size="sm" />
          <div className="mt-1 text-center">
            <div className="flex justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={classNames("text-xs", i <= stars ? "text-yellow-400" : "text-gray-300")}>
                  ★
                </span>
              ))}
            </div>
            <div className="text-[9px] sm:text-[10px] text-gray-600 font-medium mt-0.5">
              {scoreInterpretation.getLabel(stock.aiScore)}
            </div>
          </div>
        </div>
      </div>

      {/* AI Score 해석 */}
      <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
        <div className="text-xs text-gray-700">
          <span className="font-semibold text-indigo-700">AI 분석 의견:</span>{' '}
          {scoreInterpretation.getDescription(stock.aiScore)}
        </div>
      </div>

      {/* 3줄 요약 */}
      <div className="mb-4">
        <ThreePointSummary
          reason={`높은 ROE(${stock.ROE.toFixed(1)}%)와 안정적인 PER(${stock.PER.toFixed(1)}) 보유`}
          opportunity={`${stock.category} 섹터의 성장세 지속`}
          caution={stock.PEG > 2 ? "PEG 비율이 다소 높아 밸류에이션 주의 필요" : "시장 전체 변동성에 유의"}
        />
      </div>

      {/* 가격 가이드 */}
      {stock.price && (
        <div className="mb-4">
          <PriceGuideBand
            currentPrice={stock.price}
            currency={stock.market === 'US' ? '$' : '₩'}
          />
        </div>
      )}

      {/* 핵심 지표 그리드 - 초보자용 4개 핵심 지표 */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <MetricWithGuide label="ROE" value={stock.ROE} metricKey="ROE" format="percent" />
        <MetricWithGuide label="PER" value={stock.PER} metricKey="PER" format="ratio" />
        <MetricWithGuide label="PEG" value={stock.PEG} metricKey="PEG" format="ratio" />
        <MetricWithGuide label="영업이익률" value={stock.OpMarginTTM} metricKey="OpMarginTTM" format="percent" />
      </div>

      {/* 클릭 유도 */}
      <div className="mt-4 text-center">
        <span className="text-xs text-indigo-600 font-medium">
          클릭하여 상세 분석 보기 →
        </span>
      </div>
    </div>
  );
}
