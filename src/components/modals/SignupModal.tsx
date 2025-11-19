import React, { useState, useRef, useEffect } from 'react';

interface SignupModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SignupModal({ open, onClose }: SignupModalProps) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timer]);

  useEffect(() => {
    // Reset state when modal closes
    if (!open) {
      setId('');
      setPassword('');
      setEmail('');
      setVerificationCode('');
      setIsCodeSent(false);
      setIsVerified(false);
      setTimer(0);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [open]);

  if (!open) return null;

  const handleSendCode = () => {
    // TODO: Implement send verification code logic
    console.log('Sending verification code to:', email);
    setIsCodeSent(true);
    setTimer(300); // 5 minutes = 300 seconds
  };

  const handleVerify = () => {
    // TODO: Implement verification logic
    console.log('Verifying code:', verificationCode);
    setIsVerified(true);
    setTimer(0);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleSignup = () => {
    // TODO: Implement signup logic
    console.log('Signup with ID:', id);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-[1001] w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 my-auto max-h-[95vh] overflow-y-auto">
        <div className="px-4 py-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">회원가입</h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">AI 기업 분석을 무료로 시작하세요</p>

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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">이메일</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일을 입력하세요"
                  disabled={isCodeSent}
                  className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors disabled:bg-gray-100"
                />
                <button
                  onClick={handleSendCode}
                  disabled={!email || isCodeSent}
                  className="px-3 py-2.5 sm:px-4 sm:py-3 bg-indigo-600 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  인증번호 발송
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                인증번호
                {timer > 0 && <span className="ml-2 text-red-600 text-xs sm:text-sm font-bold">{formatTimer(timer)}</span>}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="인증번호를 입력하세요"
                  disabled={!isCodeSent || isVerified}
                  className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors disabled:bg-gray-100"
                />
                <button
                  onClick={handleVerify}
                  disabled={!isCodeSent || !verificationCode || isVerified}
                  className="px-3 py-2.5 sm:px-4 sm:py-3 bg-green-600 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isVerified ? '인증완료' : '인증'}
                </button>
              </div>
            </div>

            <button
              onClick={handleSignup}
              disabled={!isVerified}
              className="w-full bg-indigo-600 text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              회원가입
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
              Google로 시작하기
            </button>

            <button className="w-full flex items-center justify-center gap-2 sm:gap-3 rounded-xl border-2 border-yellow-400 bg-yellow-300 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold hover:bg-yellow-400 transition-colors">
              <span className="text-base sm:text-lg">💬</span>
              카카오로 시작하기
            </button>

            <button className="w-full flex items-center justify-center gap-2 sm:gap-3 rounded-xl border-2 border-green-500 bg-green-500 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-white hover:bg-green-600 transition-colors">
              <span className="text-base sm:text-lg font-bold">N</span>
              네이버로 시작하기
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
  );
}
