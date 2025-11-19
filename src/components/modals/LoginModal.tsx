import React, { useState } from 'react';
import { authStorage, initDummyData } from '@/utils/authStorage';
import ForgotPasswordModal from './ForgotPasswordModal';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  if (!open) return null;

  // 더미 데이터 초기화 (개발용)
  initDummyData();

  const handleLogin = () => {
    setError('');

    if (!id || !password) {
      setError('아이디와 비밀번호를 입력하세요.');
      return;
    }

    // 로그인 검증
    const isValid = authStorage.validateLogin(id, password);
    if (isValid) {
      console.log('로그인 성공:', id);
      alert('로그인 성공!');
      onClose();
    } else {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  const handleForgotPassword = () => {
    setForgotPasswordOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-y-auto">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative z-[1001] w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 my-auto max-h-[95vh] overflow-y-auto">
          <div className="px-4 py-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">로그인</h2>

            {/* 오류 메시지 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-xs sm:text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">아이디</label>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">비밀번호</label>
                  <button
                    onClick={handleForgotPassword}
                    className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    비밀번호 찾기
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>
              <button
                onClick={handleLogin}
                className="w-full bg-indigo-600 text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-xl hover:bg-indigo-700 transition-colors"
              >
                로그인
              </button>
            </div>

            <div className="relative mb-4 sm:mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-3 sm:px-4 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              <button className="w-full flex items-center justify-center gap-2 sm:gap-3 rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold hover:bg-gray-50 transition-colors">
                <img src="https://www.google.com/favicon.ico" alt="Google" className="h-4 w-4 sm:h-5 sm:w-5" />
                Google로 로그인
              </button>

              <button className="w-full flex items-center justify-center gap-2 sm:gap-3 rounded-xl border-2 border-yellow-400 bg-yellow-300 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold hover:bg-yellow-400 transition-colors">
                <span className="text-base sm:text-lg">💬</span>
                카카오로 로그인
              </button>

              <button className="w-full flex items-center justify-center gap-2 sm:gap-3 rounded-xl border-2 border-green-500 bg-green-500 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-white hover:bg-green-600 transition-colors">
                <span className="text-base sm:text-lg font-bold">N</span>
                네이버로 로그인
              </button>
            </div>

            <div className="mt-4 sm:mt-6 text-center">
              <button onClick={onClose} className="text-xs sm:text-sm text-gray-600 hover:text-gray-900">
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 비밀번호 찾기 모달 */}
      <ForgotPasswordModal
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />
    </>
  );
}
