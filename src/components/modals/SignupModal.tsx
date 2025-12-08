import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/api/client';

interface SignupModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SignupModal({ open, onClose }: SignupModalProps) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      setPasswordConfirm('');
      setEmail('');
      setVerificationCode('');
      setIsCodeSent(false);
      setIsVerified(false);
      setTimer(0);
      setError('');
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [open]);

  if (!open) return null;

  // 1단계: 이메일 인증 코드 발송
  const handleSendCode = async () => {
    setError('');
    setLoading(true);

    if (!email) {
      setError('이메일을 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      // 이메일 중복 체크
      const checkResponse = await api.auth.checkEmail(email);
      if (checkResponse.exists) {
        setError('이미 사용 중인 이메일입니다.');
        setLoading(false);
        return;
      }

      // 인증 코드 발송
      const response = await api.auth.sendVerificationEmail({ email });
      if (response.success) {
        setIsCodeSent(true);
        setTimer(300); // 5분
        alert('인증 코드가 이메일로 발송되었습니다.');
        console.log('✅ 인증 코드 발송:', email);
      } else {
        setError(response.message || '인증 코드 발송에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('❌ 인증 코드 발송 실패:', err);
      setError(err.response?.data?.message || '인증 코드 발송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 2단계: 이메일 인증 코드 확인
  const handleVerify = async () => {
    setError('');
    setLoading(true);

    if (!verificationCode) {
      setError('인증번호를 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.auth.verifyEmail({ email, verificationCode });
      if (response.success) {
        setIsVerified(true);
        setTimer(0);
        if (timerRef.current) clearTimeout(timerRef.current);
        alert('이메일 인증이 완료되었습니다!');
        console.log('✅ 이메일 인증 완료:', email);
      } else {
        setError(response.message || '인증번호가 올바르지 않습니다.');
      }
    } catch (err: any) {
      console.error('❌ 인증 실패:', err);
      setError(err.response?.data?.message || '인증번호가 올바르지 않거나 만료되었습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 3단계: 회원가입
  const handleSignup = async () => {
    setError('');
    setLoading(true);

    // 유효성 검사
    if (!id || !password || !email) {
      setError('모든 필드를 입력해주세요.');
      setLoading(false);
      return;
    }

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (!isVerified) {
      setError('이메일 인증을 완료해주세요.');
      setLoading(false);
      return;
    }

    try {
      // 아이디 중복 체크
      const checkResponse = await api.auth.checkUsername(id);
      if (checkResponse.exists) {
        setError('이미 사용 중인 아이디입니다.');
        setLoading(false);
        return;
      }

      // 회원가입 API 호출
      const response = await api.auth.signup({
        username: id,
        password,
        email,
        verificationCode,
      });

      if (response.success && response.data) {
        alert(`회원가입 성공! 환영합니다, ${response.data.username}님!`);
        console.log('✅ 회원가입 성공:', response.data);
        onClose();
        // 페이지 새로고침으로 헤더 업데이트
        window.location.reload();
      } else {
        setError(response.message || '회원가입에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('❌ 회원가입 실패:', err);
      setError(err.response?.data?.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                비밀번호 확인
                {passwordConfirm && (
                  <span className={`ml-2 text-xs sm:text-sm font-bold ${password === passwordConfirm ? 'text-green-600' : 'text-red-600'}`}>
                    {password === passwordConfirm ? '✓ 일치' : '✗ 불일치'}
                  </span>
                )}
              </label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border-2 ${
                  passwordConfirm && password === passwordConfirm
                    ? 'border-green-500 focus:border-green-600'
                    : passwordConfirm && password !== passwordConfirm
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-gray-200 focus:border-indigo-500'
                } focus:outline-none transition-colors`}
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
                  disabled={!email || isCodeSent || loading}
                  className="px-3 py-2.5 sm:px-4 sm:py-3 bg-indigo-600 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading ? '발송 중...' : '인증번호 발송'}
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
                  disabled={!isCodeSent || !verificationCode || isVerified || loading}
                  className="px-3 py-2.5 sm:px-4 sm:py-3 bg-green-600 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isVerified ? '인증완료' : loading ? '확인 중...' : '인증'}
                </button>
              </div>
            </div>

            <button
              onClick={handleSignup}
              disabled={!isVerified || !password || password !== passwordConfirm || loading}
              className="w-full bg-indigo-600 text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? '회원가입 중...' : '회원가입'}
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
