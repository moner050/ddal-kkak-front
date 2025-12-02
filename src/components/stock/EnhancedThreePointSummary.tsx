import React from 'react';
import type { ReasonDto, OpportunityDto, CautionDto } from '../../api/types';

interface EnhancedThreePointSummaryProps {
  reason: ReasonDto;
  opportunity: OpportunityDto;
  caution: CautionDto;
}

export default function EnhancedThreePointSummary({
  reason,
  opportunity,
  caution,
}: EnhancedThreePointSummaryProps) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100 p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm sm:text-base">📝</span>
        <h3 className="text-xs sm:text-sm font-bold text-gray-900">3줄 요약 (AI 분석)</h3>
      </div>

      <div className="space-y-2.5">
        {/* 추천 사유 */}
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
            <span className="text-xs sm:text-sm">✓</span>
          </div>
          <div className="flex-1">
            <div className="text-[10px] sm:text-xs font-semibold text-emerald-700 mb-0.5">
              추천 사유
              {reason.aiAnalysis && (
                <span className="ml-2 text-[9px] sm:text-[10px] text-gray-500">
                  (신뢰도: {(reason.aiAnalysis.confidence * 100).toFixed(0)}%)
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-1">
              {reason.investmentThesis}
            </p>
            {reason.strengths && reason.strengths.length > 0 && (
              <ul className="text-[10px] sm:text-xs text-gray-600 space-y-0.5 ml-2">
                {reason.strengths.slice(0, 2).map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span>•</span>
                    <span>{strength.description}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 예상 호재 */}
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
            <span className="text-xs sm:text-sm">📈</span>
          </div>
          <div className="flex-1">
            <div className="text-[10px] sm:text-xs font-semibold text-blue-700 mb-0.5">예상 호재</div>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-1">
              {opportunity.sectorTrend.description}
            </p>
            {opportunity.catalysts && opportunity.catalysts.length > 0 && (
              <div className="text-[10px] sm:text-xs text-gray-600 space-y-0.5 ml-2">
                {opportunity.catalysts.slice(0, 2).map((catalyst, idx) => (
                  <div key={idx} className="flex items-start gap-1">
                    <span>•</span>
                    <div>
                      <span className="font-semibold">{catalyst.title}:</span> {catalyst.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {opportunity.analystConsensus && (
              <div className="mt-1 text-[10px] sm:text-xs text-gray-600">
                애널리스트 의견: <span className="font-semibold text-blue-600">{opportunity.analystConsensus.rating}</span>
                ({opportunity.analystConsensus.numberOfAnalysts}명)
              </div>
            )}
          </div>
        </div>

        {/* 주의점 */}
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
            <span className="text-xs sm:text-sm">⚠️</span>
          </div>
          <div className="flex-1">
            <div className="text-[10px] sm:text-xs font-semibold text-amber-700 mb-0.5">주의점</div>
            {caution.risks && caution.risks.length > 0 ? (
              <ul className="text-xs sm:text-sm text-gray-700 space-y-0.5">
                {caution.risks.slice(0, 2).map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className={`text-xs ${
                      risk.severity === 'high' ? 'text-red-500' :
                      risk.severity === 'medium' ? 'text-amber-500' : 'text-gray-400'
                    }`}>●</span>
                    <span>
                      <span className="font-semibold">{risk.title}:</span> {risk.description}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs sm:text-sm text-gray-700">일반적인 시장 변동성에 유의하세요</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
