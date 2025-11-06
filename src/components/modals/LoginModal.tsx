import React, { useState } from 'react';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  if (!open) return null;

  const handleLogin = () => {
    // TODO: Implement login logic
    console.log('Login with ID:', id);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-[1001] w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-gray-200 m-3">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">로그인</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">아이디</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="아이디를 입력하세요"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>
          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            로그인
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">또는</span>
          </div>
        </div>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
            Google로 로그인
          </button>

          <button className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-yellow-400 bg-yellow-300 px-4 py-3 text-sm font-semibold hover:bg-yellow-400 transition-colors">
            <span className="text-lg">💬</span>
            카카오로 로그인
          </button>

          <button className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-green-500 bg-green-500 px-4 py-3 text-sm font-semibold text-white hover:bg-green-600 transition-colors">
            <span className="text-lg font-bold">N</span>
            네이버로 로그인
          </button>
        </div>

        <div className="mt-6 text-center">
          <button onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
