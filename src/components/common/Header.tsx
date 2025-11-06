import React, { useState } from 'react';
import LoginModal from '../modals/LoginModal';
import SignupModal from '../modals/SignupModal';

export default function Header() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-lg shadow-sm">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <div>
                <div className="text-base sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  DDalKKak
                </div>
                <div className="text-[8px] sm:text-[9px] text-gray-500 font-medium">AI 기업 분석 플랫폼</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setLoginOpen(true)}
                className="rounded-lg sm:rounded-xl border border-gray-200 bg-white px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                로그인
              </button>
              <button
                onClick={() => setSignupOpen(true)}
                className="rounded-lg sm:rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-white hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                회원가입
              </button>
            </div>
          </div>
        </div>
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} />
    </>
  );
}
