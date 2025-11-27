import React, { useEffect, useMemo, useState } from "react";
import { classNames, inDateRange } from "../../../utils/format";
import { NEWS_CATEGORIES, newsItems as mockNews } from "../../../data/mock";
import NewsImportanceBadge from "../../news/NewsImportanceBadge";
import NewsModal from "../../news/NewsModal";
import CategoryChips from "../../common/CategoryChips";
import CategoryPager from "../../news/CategoryPager";

export default function NewsSummaryTab() {
  const [cat, setCat] = useState("전체");
  const [minImp, setMinImp] = useState(6);
  const [query, setQuery] = useState("");
  const [modalItem, setModalItem] = useState<any | null>(null);
  const [topOpen, setTopOpen] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "importance">("date");

  // 날짜 기본값: 어제 ~ 오늘
  const fmt = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const _today = new Date();
  const _yesterday = new Date(_today);
  _yesterday.setDate(_today.getDate() - 1);
  const [startDate, setStartDate] = useState(fmt(_yesterday));
  const [endDate, setEndDate] = useState(fmt(_today));

  const data = useMemo(() => {
    return mockNews
      .filter((n) => (cat === "전체" ? true : n.category === cat))
      .filter((n) => n.importance >= minImp)
      .filter((n) => inDateRange(n.date, startDate, endDate))
      .filter((n) => !query || (n.title + " " + (n.summary || "") + " " + (n.body || "")).toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => (sortBy === "date" ? b.date.localeCompare(a.date) || b.importance - a.importance : b.importance - a.importance || b.date.localeCompare(a.date)));
  }, [cat, minImp, query, startDate, endDate, sortBy]);

  const grouped = useMemo(() => {
    if (cat !== "전체") return { [cat]: data } as Record<string, typeof data>;
    return data.reduce((acc: Record<string, typeof data>, it) => {
      if (!acc[it.category]) acc[it.category] = [];
      acc[it.category].push(it);
      return acc;
    }, {});
  }, [data, cat]);

  const top5 = useMemo(() => [...mockNews].sort((a, b) => b.importance - a.importance || b.date.localeCompare(a.date)).slice(0, 5), []);

  useEffect(() => {
    try {
      const byDate = [...mockNews].sort((a, b) => b.date.localeCompare(a.date) || b.importance - a.importance);
      console.assert(byDate[0]?.id === "n9", "[TEST] 날짜 정렬 최상단은 n9");
      const byImp = [...mockNews].sort((a, b) => b.importance - a.importance || b.date.localeCompare(a.date));
      console.assert(byImp[0]?.id === "n1", "[TEST] 중요도 정렬 최상단은 n1");
      const f = (iso: string, s?: string, e?: string) => inDateRange(iso, s, e);
      console.assert(f("2025-10-16 12:00:45", "2025-10-16", "2025-10-16") === true, "[TEST] 날짜 경계 포함(같은날)");
      console.assert(f("2025-10-15", "2025-10-16", "2025-10-16") === false, "[TEST] 범위 밖 제외");
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 pb-24">
      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900 md:text-xl">뉴스 요약</h1>
            <p className="mt-1 text-xs text-gray-500">카테고리별 · 중요도/날짜 정렬 · 키워드/날짜 필터</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {/* 카테고리 칩 */}
          <CategoryChips value={cat} onChange={setCat} categories={[...NEWS_CATEGORIES]} />

          {/* 날짜 범위 */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>기간</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-1" />
            <span>~</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-1" />
            {(startDate || endDate) && (
              <button type="button" onClick={() => { setStartDate(""); setEndDate(""); }} className="rounded-lg border border-gray-200 bg-white px-2 py-1">
                초기화
              </button>
            )}
          </div>

          {/* 최소 중요도 */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>최소 중요도</span>
            <input type="range" min="1" max="10" value={minImp} onChange={(e) => setMinImp(Number(e.target.value))} />
            <span className="font-semibold">{minImp}+</span>
          </div>

          {/* 정렬 */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>정렬</span>
            <div className="rounded-full border border-gray-200 bg-gray-50 p-1">
              <button type="button" onClick={() => setSortBy("date")} className={classNames("rounded-full px-3 py-1 text-xs font-semibold", sortBy === "date" ? "bg-white shadow" : "text-gray-700")}>
                날짜
              </button>
              <button type="button" onClick={() => setSortBy("importance")} className={classNames("rounded-full px-3 py-1 text-xs font-semibold", sortBy === "importance" ? "bg-white shadow" : "text-gray-700")}>
                중요도
              </button>
            </div>
          </div>

          {/* 키워드 검색(좌측 정렬) */}
          <div className="flex items-center gap-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="검색: 제목/요약" className="w-56 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
        </div>
      </div>

      {/* TOP 5: 접기/펼치기, 중요도 이유 표시 */}
      <section className="mt-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">오늘의 TOP 5</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setTopOpen((v) => !v)} className="rounded-full border border-gray-200 bg-white px-2 py-1 text-xs font-semibold hover:bg-gray-50" aria-expanded={topOpen}>
                {topOpen ? "접기" : "펼치기"}
              </button>
            </div>
          </div>
          {topOpen && (
            <ul className="grid gap-2 md:grid-cols-2">
              {top5.map((n) => (
                <li key={n.id} onClick={() => setModalItem(n)} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3 hover:bg-gray-50 cursor-pointer" role="button">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 ring-1 ring-gray-200">{n.category}</span>
                      <span>{n.date}</span>
                      <NewsImportanceBadge score={n.importance} />
                    </div>
                    <span className="block truncate text-sm font-semibold text-gray-900 hover:underline">{n.title}</span>
                    <p className="mt-1 text-[11px] text-gray-500">{n.reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 본문 리스트: 카테고리별 섹션, 4개/페이지 페이징 */}
      <section className="mt-4 space-y-4">
        {Object.entries(grouped).map(([gcat, arr]) => (
          <div key={gcat} className="space-y-3">
            {cat === "전체" && (
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">
                  {gcat} <span className="text-xs font-normal text-gray-500">· {arr.length}건</span>
                </h3>
              </div>
            )}
            <CategoryPager items={arr} onOpen={setModalItem} />
          </div>
        ))}
      </section>

      {/* 공통 모달 */}
      <NewsModal open={!!modalItem} onClose={() => setModalItem(null)} item={modalItem} />
    </main>
  );
}
