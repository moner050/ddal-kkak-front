import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6">
        {/* 서비스 정보 */}
        <div className="mb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
              <span className="text-sm">📊</span>
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              딸깍
            </span>
          </div>
          <p className="text-xs text-gray-600">
            주식 초보자를 위한 가장 쉬운 투자 분석 플랫폼
          </p>
        </div>

        {/* 책임 고지 (Disclaimer) */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-[10px] sm:text-xs text-gray-400 text-center leading-relaxed">
            본 사이트에서 제공하는 정보는 투자 판단의 참고 자료이며,<br className="hidden sm:inline" />
            실제 투자의 책임은 전적으로 투자자 본인에게 있습니다.
          </p>
          <p className="text-[9px] sm:text-[10px] text-gray-300 text-center mt-2">
            © 2025 딸깍(Ddalkkak). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
