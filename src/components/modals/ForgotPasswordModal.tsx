import React, { useState, useRef, useEffect } from 'react';
import { authStorage, verificationStorage } from '@/utils/authStorage';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'email' | 'verification' | 'newPassword' | 'complete';

export default function ForgotPasswordModal({ open, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState('');
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
      setStep('email');
      setEmail('');
      setVerificationCode('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setTimer(0);
      setError('');
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [open]);

  if (!open) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendCode = () => {
    setError('');

    // 이메일로 사용자 찾기
    const user = authStorage.findUserByEmail(email);
    if (!user) {
      setError('등록되지 않은 이메일입니다.');
      return;
    }

    // 인증번호 생성
    verificationStorage.generateCode(email);
    setTimer(300); // 5분
    setStep('verification');
  };

  const handleVerify = () => {
    setError('');

    // 인증번호 검증
    const isValid = verificationStorage.verifyCode(email, verificationCode);
    if (!isValid) {
      setError('인증번호가 올바르지 않거나 만료되었습니다.');
      return;
    }

    // 인증 성공
    verificationStorage.removeCode(email);
    setTimer(0);
    if (timerRef.current) clearTimeout(timerRef.current);
    setStep('newPassword');
  };

  const handleChangePassword = () => {
    setError('');

    // 비밀번호 확인
    if (newPassword !== newPasswordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 4) {
      setError('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    // 비밀번호 변경
    const success = authStorage.changePassword(email, newPassword);
    if (success) {
      setStep('complete');
    } else {
      setError('비밀번호 변경에 실패했습니다.');
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/30" onClick={handleClose} />
      <div className="relative z-[1001] w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 my-auto max-h-[95vh] overflow-y-auto">
        <div className="px-4 py-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">비밀번호 찾기</h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
            {step === 'email' && '가입 시 사용한 이메일을 입력하세요'}
            {step === 'verification' && '이메일로 발송된 인증번호를 입력하세요'}
            {step === 'newPassword' && '새로운 비밀번호를 입력하세요'}
            {step === 'complete' && '비밀번호가 변경되었습니다'}
          </p>

          {/* 오류 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs sm:text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 1단계: 이메일 입력 */}
          {step === 'email' && (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일을 입력하세요"
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              <button
                onClick={handleSendCode}
                disabled={!email}
                className="w-full bg-indigo-600 text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                인증번호 발송
              </button>
            </div>
          )}

          {/* 2단계: 인증번호 입력 */}
          {step === 'verification' && (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-gray-200 bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  인증번호
                  {timer > 0 && <span className="ml-2 text-red-600 text-xs sm:text-sm font-bold">{formatTimer(timer)}</span>}
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="인증번호를 입력하세요"
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={!verificationCode}
                className="w-full bg-indigo-600 text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                인증하기
              </button>
            </div>
          )}

          {/* 3단계: 새 비밀번호 입력 */}
          {step === 'newPassword' && (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">새 비밀번호</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호를 입력하세요"
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  새 비밀번호 확인
                  {newPasswordConfirm && (
                    <span className={`ml-2 text-xs sm:text-sm font-bold ${newPassword === newPasswordConfirm ? 'text-green-600' : 'text-red-600'}`}>
                      {newPassword === newPasswordConfirm ? '✓ 일치' : '✗ 불일치'}
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  placeholder="새 비밀번호를 다시 입력하세요"
                  className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border-2 ${
                    newPasswordConfirm && newPassword === newPasswordConfirm
                      ? 'border-green-500 focus:border-green-600'
                      : newPasswordConfirm && newPassword !== newPasswordConfirm
                      ? 'border-red-500 focus:border-red-600'
                      : 'border-gray-200 focus:border-indigo-500'
                  } focus:outline-none transition-colors`}
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={!newPassword || newPassword !== newPasswordConfirm}
                className="w-full bg-indigo-600 text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                비밀번호 변경
              </button>
            </div>
          )}

          {/* 4단계: 완료 */}
          {step === 'complete' && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="text-5xl mb-4">✓</div>
                <p className="text-base sm:text-lg font-semibold text-gray-900 mb-2">비밀번호 변경 완료</p>
                <p className="text-xs sm:text-sm text-gray-600">새로운 비밀번호로 로그인해주세요.</p>
              </div>

              <button
                onClick={handleClose}
                className="w-full bg-indigo-600 text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-xl hover:bg-indigo-700 transition-colors"
              >
                확인
              </button>
            </div>
          )}

          {/* 닫기 버튼 (완료 단계 제외) */}
          {step !== 'complete' && (
            <div className="mt-4 sm:mt-6 text-center">
              <button onClick={handleClose} className="text-xs sm:text-sm text-gray-600 hover:text-gray-900">
                닫기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
