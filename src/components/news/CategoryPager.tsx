import React, { useState, useRef, useEffect } from 'react';
import { classNames } from '../../utils/format';
import NewsCard from './NewsCard';

interface CategoryPagerProps {
  items: any[];
  onOpen: (n: any) => void;
}

export default function CategoryPager({ items, onOpen }: CategoryPagerProps) {
  const PAGE_SIZE = 4;
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, totalPages - 1)));
  }, [items.length, totalPages]);

  const start = page * PAGE_SIZE;
  const slice = items.slice(start, start + PAGE_SIZE);
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  const next = () => {
    if (canNext) setPage((p) => p + 1);
  };

  const prev = () => {
    if (canPrev) setPage((p) => p - 1);
  };

  // 드래그
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const onStart = (e: React.TouchEvent | React.MouseEvent) => {
    const pt = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    dragRef.current = { x: pt.clientX, y: pt.clientY };
  };

  const onEnd = (e: React.TouchEvent | React.MouseEvent) => {
    const pt = "changedTouches" in e ? e.changedTouches[0] : (e as React.MouseEvent);
    if (!dragRef.current) return;
    const dx = pt.clientX - dragRef.current.x;
    const dy = pt.clientY - dragRef.current.y;
    dragRef.current = null;
    if (Math.abs(dx) > 40 && Math.abs(dy) < 60) {
      if (dx < 0) next();
      else prev();
    }
  };

  return (
    <div
      className="relative"
      onTouchStart={onStart}
      onTouchEnd={onEnd}
      onMouseDown={onStart as any}
      onMouseUp={onEnd as any}
    >
      <div className="grid gap-3 md:grid-cols-2">
        {slice.map((n) => (
          <div key={n.id} role="button" onClick={() => onOpen(n)}>
            <NewsCard item={n} onOpen={onOpen} />
          </div>
        ))}
      </div>

      {items.length > PAGE_SIZE && (
        <>
          <button
            type="button"
            aria-label="이전 페이지"
            onClick={prev}
            className={classNames(
              "absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-white/70 ring-1 ring-gray-300 h-16 w-8 md:h-20 md:w-10 p-0 flex items-center justify-center transition-opacity",
              canPrev ? "opacity-40 hover:opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="다음 페이지"
            onClick={next}
            className={classNames(
              "absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/70 ring-1 ring-gray-300 h-16 w-8 md:h-20 md:w-10 p-0 flex items-center justify-center transition-opacity",
              canNext ? "opacity-40 hover:opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            ›
          </button>
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-gray-400">
            {page + 1} / {totalPages}
          </div>
        </>
      )}
    </div>
  );
}
