import React, { useState, useRef } from 'react';
import { classNames } from '../../utils/format';
import { SECTOR_THEMES } from '../../constants/categories';

interface CategoryMove {
  name: string;
  pct: number;
}

interface CategoryHeatmapCardProps {
  movesUS: CategoryMove[];
  movesKR: CategoryMove[];
  asOf?: string;
}

function heatColor(pct: number) {
  if (pct <= -3) return { bg: "#1e3a8a", text: "#ffffff" };
  if (pct < -0.3) return { bg: "#3b82f6", text: "#ffffff" };
  if (pct <= 0.3) return { bg: "#e5e7eb", text: "#111827" };
  if (pct < 3) return { bg: "#fecaca", text: "#7f1d1d" };
  return { bg: "#b91c1c", text: "#ffffff" };
}

function pctStr(x: number) {
  const sign = x > 0 ? "+" : x < 0 ? "" : "";
  return `${sign}${x.toFixed(1)}%`;
}

function DelayedTooltip({
  id,
  activeId,
  setActiveId,
  content,
  children
}: {
  id: string;
  activeId: string | null;
  setActiveId: (v: string | null) => void;
  content: React.ReactNode;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 320 });
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const WIDTH = 320;
  const open = activeId === id;

  const place = () => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const left = Math.min(Math.max(8, rect.left + rect.width / 2 - WIDTH / 2), vw - WIDTH - 8);
    const top = rect.bottom + 8;
    setPos({ top, left, width: WIDTH });
  };

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    place();
    setActiveId(open ? null : id);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(e as any);
    }
  };

  return (
    <div
      ref={anchorRef}
      className="relative"
      onClick={onClick}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
    >
      {children}
      {open && (
        <div
          className="z-[999] rounded-xl border border-gray-200 bg-white p-3 text-xs shadow-2xl"
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: pos.width,
            maxWidth: "calc(100vw - 16px)"
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export default function CategoryHeatmapCard({ movesUS, movesKR, asOf }: CategoryHeatmapCardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [marketView, setMarketView] = useState<"US" | "KR">("US");
  const moves = marketView === "US" ? movesUS : movesKR;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          카테고리 등락 <span className="ml-1 text-xs text-gray-400">({asOf})</span>
          <span className="ml-2 text-xs text-gray-400">
            {marketView === "US" ? "2025 미국 GICS 기준" : "한국: KRX/테마 매핑(준)"}
          </span>
        </div>
        <div className="rounded-full border border-gray-200 bg-gray-50 p-1">
          <button
            className={classNames(
              "rounded-full px-3 py-1 text-xs font-semibold",
              marketView === "US" ? "bg-white shadow" : "text-gray-700"
            )}
            onClick={() => setMarketView("US")}
          >
            미국
          </button>
          <button
            className={classNames(
              "rounded-full px-3 py-1 text-xs font-semibold",
              marketView === "KR" ? "bg-white shadow" : "text-gray-700"
            )}
            onClick={() => setMarketView("KR")}
          >
            한국
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
        {moves.map((m) => {
          const { bg, text } = heatColor(m.pct);
          const themes = SECTOR_THEMES[m.name] || [];
          const tooltip = (
            <div>
              <div className="mb-1 font-semibold text-gray-900">{m.name}</div>
              <div className="flex flex-wrap gap-1">
                {themes.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 ring-1 ring-gray-200"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          );

          return (
            <DelayedTooltip
              key={`${marketView}-${m.name}`}
              id={`${marketView}-${m.name}`}
              activeId={activeId}
              setActiveId={setActiveId}
              content={tooltip}
            >
              <div
                className="rounded-xl p-3 text-center shadow-sm ring-1 ring-gray-200 flex flex-col items-center justify-center h-24 leading-tight cursor-pointer"
                style={{ backgroundColor: bg, color: text }}
              >
                <div className="text-sm font-bold">{m.name}</div>
                <div className="text-xs opacity-90">{pctStr(m.pct)}</div>
              </div>
            </DelayedTooltip>
          );
        })}
      </div>
    </div>
  );
}
