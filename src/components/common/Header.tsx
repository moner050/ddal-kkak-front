import React, { useState, useEffect } from 'react';
import LoginModal from '../modals/LoginModal';
import SignupModal from '../modals/SignupModal';
import { authStorage } from '@/utils/authStorage';

interface HeaderProps {
  onLogoClick?: () => void;
  onMyPageClick?: () => void;
}

export default function Header({ onLogoClick, onMyPageClick }: HeaderProps) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(authStorage.getCurrentUser());

  // 로그인 상태 변경 감지
  useEffect(() => {
    const checkLoginStatus = () => {
      setCurrentUser(authStorage.getCurrentUser());
    };

    // 페이지 포커스 시 로그인 상태 확인
    window.addEventListener('focus', checkLoginStatus);
    // storage 이벤트 리스너 (다른 탭에서의 변경 감지)
    window.addEventListener('storage', checkLoginStatus);

    return () => {
      window.removeEventListener('focus', checkLoginStatus);
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      authStorage.logout();
      setCurrentUser(null);
      window.location.reload();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-lg shadow-sm">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onLogoClick}
                className="text-left hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="text-base sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  DDalKKak
                </div>
                <div className="text-[8px] sm:text-[9px] text-gray-500 font-medium">AI 기업 분석 플랫폼</div>
              </button>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {currentUser ? (
                // 로그인 상태
                <>
                  <span className="text-xs sm:text-sm text-gray-700 font-medium hidden sm:inline">
                    {currentUser.id}님
                  </span>
                  <button
                    onClick={onMyPageClick}
                    className="rounded-lg sm:rounded-xl border border-gray-200 bg-white px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    내정보
                  </button>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-white hover:from-gray-700 hover:to-gray-800 transition-all"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                // 비로그인 상태
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} />
    </>
  );
}
