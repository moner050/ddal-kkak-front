import React, { useState } from 'react';

interface ComingSoonModalProps {
  open: boolean;
  onClose: () => void;
  featureName?: string;
}

export default function ComingSoonModal({
  open,
  onClose,
  featureName = "공시 분석"
}: ComingSoonModalProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  if (!open) return null;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // TODO: 실제 알림 구독 로직 구현
      console.log('알림 구독:', email);
      setSubscribed(true);
      setTimeout(() => {
        onClose();
        setSubscribed(false);
        setEmail('');
      }, 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 컨텐츠 */}
        <div className="p-6 sm:p-8">
          {!subscribed ? (
            <>
              {/* 아이콘 */}
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
                  <span className="text-3xl">🚀</span>
                </div>
              </div>

              {/* 제목 */}
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-3">
                오픈 준비 중입니다
              </h2>

              {/* 설명 */}
              <p className="text-sm sm:text-base text-gray-600 text-center mb-6 leading-relaxed">
                <span className="font-semibold text-indigo-600">{featureName}</span> 기능은 현재 열심히 준비 중입니다.<br />
                오픈 시 알림을 받으시겠습니까?
              </p>

              {/* 알림 신청 폼 */}
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    이메일 주소
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm sm:text-base"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg text-sm sm:text-base"
                  >
                    알림 받기
                  </button>
                </div>
              </form>

              {/* 추가 안내 */}
              <p className="text-xs text-gray-400 text-center mt-4">
                빠른 시일 내에 찾아뵙겠습니다 ✨
              </p>
            </>
          ) : (
            /* 구독 완료 메시지 */
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                  <span className="text-3xl">✅</span>
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                알림 신청 완료!
              </h3>
              <p className="text-sm text-gray-600">
                {email}로 오픈 알림을 보내드리겠습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
