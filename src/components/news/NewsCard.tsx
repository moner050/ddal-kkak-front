import React from 'react';
import NewsImportanceBadge from './NewsImportanceBadge';

interface NewsCardItem {
  category: string;
  date: string;
  importance: number;
  title: string;
  reason: string;
}

interface NewsCardProps {
  item: NewsCardItem;
  onOpen: (item: any) => void;
}

export default function NewsCard({ item, onOpen }: NewsCardProps) {
  return (
    <article
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md"
      onClick={() => onOpen && onOpen(item)}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 ring-1 ring-gray-200">
              {item.category}
            </span>
            <span>{item.date}</span>
            <NewsImportanceBadge score={item.importance} />
          </div>
          <h3 className="mt-1 truncate text-sm font-semibold text-gray-900">
            <span className="hover:underline">{item.title}</span>
          </h3>
          <p className="mt-1 text-[11px] text-gray-500">{item.reason}</p>
        </div>
      </div>
    </article>
  );
}
