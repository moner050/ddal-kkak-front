import React from 'react';

/**
 * HeroSection - 플랫폼 소개 배너
 * 메인 페이지 상단에 표시되는 서비스 소개 섹션
 */
export default function HeroSection() {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 sm:p-10 shadow-lg">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
            <span className="text-2xl sm:text-4xl">📊</span>
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">딸깍</h1>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">Smart Investment Platform</p>
          </div>
        </div>

        {/* 슬로건 */}
        <div className="mb-4 sm:mb-5">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
            복잡한 분석 없이 딸깍!<br className="sm:hidden" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> 주식 초보를 위한 가장 쉬운 종목 추천</span>
          </h2>
        </div>

        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          데이터 기반의 종목 분석과 투자 인사이트를 제공합니다.<br className="hidden sm:inline" />
          <span className="text-gray-600"> 종합 평가 · 재무 분석 · 공시 정보를 한눈에 확인하세요.</span>
        </p>
      </div>
    </div>
  );
}
