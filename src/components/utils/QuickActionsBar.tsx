import React, { useState } from 'react';
import { formatNumber } from '../../utils/format';
import { usdKrwData } from '../../data/mock';

export default function QuickActionsBar() {
  const mockUSDKRW = usdKrwData;
  const [calcModalOpen, setCalcModalOpen] = useState(false);
  const [amount, setAmount] = useState("1000");
  const [rate] = useState(mockUSDKRW[mockUSDKRW.length - 1]);

  const actions = [
    { icon: "🔄", label: "새로고침", onClick: () => window.location.reload() },
    { icon: "💱", label: "환율 계산", onClick: () => setCalcModalOpen(true) },
    { icon: "🔔", label: "알림 설정", onClick: () => alert("알림 설정 기능은 곧 출시됩니다!") },
    { icon: "📊", label: "보고서", onClick: () => alert("보고서 기능은 곧 출시됩니다!") }
  ];

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-2 sm:p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-xs font-semibold text-gray-600">빠른 기능</span>
          <div className="flex gap-1.5 sm:gap-2">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className="flex flex-col items-center gap-0.5 sm:gap-1 rounded-lg sm:rounded-xl bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 text-xs hover:bg-gray-100 transition-colors"
                title={action.label}
              >
                <span className="text-base sm:text-lg">{action.icon}</span>
                <span className="hidden sm:block text-[10px] text-gray-600 whitespace-nowrap">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 환율 계산기 모달 */}
      {calcModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCalcModalOpen(false)} />
          <div className="relative z-[1001] w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-gray-200 m-3">
            <h3 className="text-base font-bold text-gray-900">💱 환율 계산기</h3>
            <p className="mt-1 text-xs text-gray-500">
              현재 환율: {formatNumber(rate, { decimals: 2 })} KRW/USD
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-gray-600">금액 (USD)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="금액 입력"
                />
              </div>

              <div className="rounded-lg bg-indigo-50 p-3">
                <div className="text-xs text-gray-600">환산 금액 (KRW)</div>
                <div className="text-2xl font-bold text-indigo-700">
                  {formatNumber(parseFloat(amount || "0") * rate, { decimals: 0 })} 원
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCalcModalOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
