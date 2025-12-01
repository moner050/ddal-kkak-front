import React from 'react';

interface ThreePointSummaryProps {
  reason?: string;
  opportunity?: string;
  caution?: string;
}

export default function ThreePointSummary({
  reason = "데이터 기반 AI 분석을 통한 추천",
  opportunity = "성장 가능성이 높은 섹터",
  caution = "시장 변동성을 주의하세요"
}: ThreePointSummaryProps) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100 p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm sm:text-base">📝</span>
        <h3 className="text-xs sm:text-sm font-bold text-gray-900">3줄 요약</h3>
      </div>

      <div className="space-y-2.5">
        {/* 추천 사유 */}
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
            <span className="text-xs sm:text-sm">✓</span>
          </div>
          <div className="flex-1">
            <div className="text-[10px] sm:text-xs font-semibold text-emerald-700 mb-0.5">추천 사유</div>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{reason}</p>
          </div>
        </div>

        {/* 예상 호재 */}
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
            <span className="text-xs sm:text-sm">📈</span>
          </div>
          <div className="flex-1">
            <div className="text-[10px] sm:text-xs font-semibold text-blue-700 mb-0.5">예상 호재</div>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{opportunity}</p>
          </div>
        </div>

        {/* 주의점 */}
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
            <span className="text-xs sm:text-sm">⚠️</span>
          </div>
          <div className="flex-1">
            <div className="text-[10px] sm:text-xs font-semibold text-amber-700 mb-0.5">주의점</div>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{caution}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
