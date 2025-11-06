import React from 'react';

interface NewsItem {
  title: string;
  date: string;
  summary: string;
  link?: string;
}

interface NewsModalProps {
  open: boolean;
  onClose: () => void;
  item: NewsItem | null;
}

export default function NewsModal({ open, onClose, item }: NewsModalProps) {
  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-[1001] w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-gray-200 m-3">
        <h3 className="text-base font-bold text-gray-900">
          {item.title}
          <span className="ml-2 text-sm font-normal text-gray-500">{item.date}</span>
        </h3>
        <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{item.summary}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={() => {
              const url = item.link;
              if (url && url !== "#") {
                if (typeof window !== "undefined") {
                  window.open(String(url), "_blank", "noopener,noreferrer");
                }
              }
            }}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            원문보기
          </button>
        </div>
      </div>
    </div>
  );
}
