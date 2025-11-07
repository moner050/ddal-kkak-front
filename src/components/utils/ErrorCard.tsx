import React from 'react';

interface ErrorCardProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorCard({
  message = "데이터를 불러오는 중 오류가 발생했습니다.",
  onRetry
}: ErrorCardProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm text-center">
      <div className="text-4xl mb-3">⚠️</div>
      <div className="text-sm font-semibold text-red-800 mb-2">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
