// DemoHome.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------
   UI PACKAGE (개정안 v10.3, 뉴스요약 섹션 통합본 + TS 타입 보강)
   - 스크롤/하단네비 고정 레이아웃 (헤더/스크롤/고정탭)
   - TabKey 타입 도입으로 scrollRef 인덱싱 오류 해결
   - Header / FilingsSectionByMarket / RankingSectionByMarket / BottomNav 포함
------------------------------------------------------------ */

function classNames(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(" ");
}

// URL 쿼리 유틸
function setQueryParams(updates: Record<string, string | null | undefined>) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  Object.entries(updates).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "" || v === "전체" || v === "ALL") url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  });
  window.history.replaceState({}, "", url);
}
function getQueryParam(key: string) {
  if (typeof window === "undefined") return null;
  return new URL(window.location.href).searchParams.get(key);
}

// 미국 GICS 섹터 (한국어)
const CATEGORIES = [
  "전체",
  "정보기술",
  "커뮤니케이션 서비스",
  "경기소비재",
  "필수소비재",
  "헬스케어",
  "금융",
  "산업재",
  "소재",
  "에너지",
  "유틸리티",
  "부동산",
] as const;

// 섹터별 관련 테마 맵 (툴팁용)
const SECTOR_THEMES: Record<string, string[]> = {
  정보기술: ["AI 인프라·소프트웨어", "반도체", "클라우드/SaaS", "사이버보안", "IT서비스/컨설팅", "전자부품/EMS", "데이터센터 하드웨어"],
  "커뮤니케이션 서비스": ["소셜미디어/인터넷 플랫폼", "디지털광고", "스트리밍", "게임", "통신사", "생성형 AI 플랫폼"],
  경기소비재: ["전기차/자율주행", "이커머스", "온라인여행·레저", "가전/콘솔", "의류·럭셔리", "교육서비스"],
  필수소비재: ["식음료(주류·음료·가공식품)", "유통(마트/약국)", "담배", "생활·개인용품"],
  헬스케어: ["바이오텍·신약", "제약", "의료기기", "원격의료/헬스케어 IT", "진단·리서치 툴"],
  금융: ["은행", "보험", "자산운용·거래소/데이터", "핀테크·결제", "소비자금융·모기지", "REITs(금융 섹터 소속)"],
  산업재: ["방산/우주", "로봇·자동화", "전력장비", "공작·산업기계", "건설·인프라", "물류/항공·철도", "환경/설비", "아웃소싱/컨설팅"],
  소재: ["원자재(구리·리튬·니켈·철강·알루미늄·금/은)", "배터리 소재(양극/음극/전해질)", "화학(범용·정밀)", "시멘트", "포장재", "제지·임업"],
  에너지: ["석유·가스(E&P, 정유·마케팅)", "파이프라인·저장", "석탄", "오일서비스(시추·장비)"],
  유틸리티: ["전력·가스·수도", "멀티유틸리티", "독립발전/재생에너지 발전사(태양광·풍력 발전사업자 포함)"],
  부동산: ["데이터센터 REITs", "타워 REITs", "물류·창고", "리테일/오피스/주거", "호텔·리조트 REITs", "개발/운영사"],
};

// 모의 데이터: 섹터별 등락(%) — 미국/한국 분리
const mockCategoryMovesUS = [
  { name: "정보기술", pct: 1.2 },
  { name: "커뮤니케이션 서비스", pct: 0.4 },
  { name: "경기소비재", pct: -1.1 },
  { name: "필수소비재", pct: 0.0 },
  { name: "헬스케어", pct: 0.7 },
  { name: "금융", pct: -0.6 },
  { name: "산업재", pct: 2.8 },
  { name: "소재", pct: -3.4 },
  { name: "에너지", pct: 3.6 },
  { name: "유틸리티", pct: -0.2 },
  { name: "부동산", pct: -2.5 },
];
const mockCategoryMovesKR = [
  { name: "정보기술", pct: 0.8 },
  { name: "커뮤니케이션 서비스", pct: 1.1 },
  { name: "경기소비재", pct: -0.4 },
  { name: "필수소비재", pct: 0.2 },
  { name: "헬스케어", pct: -0.9 },
  { name: "금융", pct: 0.3 },
  { name: "산업재", pct: 1.6 },
  { name: "소재", pct: -1.2 },
  { name: "에너지", pct: 0.5 },
  { name: "유틸리티", pct: -0.1 },
  { name: "부동산", pct: -0.7 },
];

// 모의 시세 데이터: USD/KRW, Gold(USD/oz)
const mockUSDKRW = [1380, 1375, 1372, 1368, 1360, 1355, 1362, 1368, 1359, 1355, 1351, 1348, 1340, 1335, 1332, 1328, 1330, 1338, 1342, 1336, 1331, 1327, 1325, 1322, 1318, 1315, 1317, 1313, 1311, 1314];
const mockGoldUSD = [2400, 2408, 2412, 2420, 2417, 2410, 2405, 2416, 2424, 2432, 2426, 2420, 2414, 2418, 2422, 2428, 2435, 2440, 2436, 2431, 2428, 2422, 2418, 2412, 2408, 2415, 2419, 2425, 2429, 2433];

// 공포·탐욕 시계열
const usFearGreedSeries = [58, 60, 59, 61, 62, 64, 63, 66, 67, 65, 66, 61, 60, 62];
const krFearGreedSeries = [48, 50, 52, 51, 53, 54, 55, 54, 56, 57, 55, 54, 56, 55];

// 버핏지수 시계열(비율, 1.0 = 100%)
const usBuffettSeries = [1.55, 1.58, 1.57, 1.59, 1.61, 1.6, 1.62, 1.63, 1.61, 1.6, 1.62, 1.64];
const krBuffettSeries = [0.97, 0.98, 1.0, 0.99, 1.02, 1.01, 1.03, 1.05, 1.04, 1.03, 1.05, 1.06];

// 색상 매핑(히트맵)
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

// 공포·탐욕 지수
function formatAsOf(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const SS = pad(d.getSeconds());
  return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${SS}`;
}
function classifyFG(index: number, variant: "US" | "KR" = "US") {
  const t = variant === "KR" ? { greed: 65, fear: 35 } : { greed: 70, fear: 40 };
  if (index >= t.greed) return { label: "탐욕", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  if (index < t.fear) return { label: "공포", cls: "bg-blue-50 text-blue-700 ring-blue-200" };
  return { label: "중립", cls: "bg-gray-100 text-gray-700 ring-gray-300" };
}
function calcDeltaAndMA(series: number[], window = 7) {
  if (!series || series.length < 2) return { delta: 0, ma: series?.[series.length - 1] ?? 0 };
  const delta = series[series.length - 1] - series[series.length - 2];
  const start = Math.max(0, series.length - window);
  const arr = series.slice(start);
  const ma = arr.reduce((a, b) => a + b, 0) / arr.length;
  return { delta, ma };
}
function FearGreedCard({ title = "공포·탐욕 지수", index = 62, asOf, variant = "US", series }: { title?: string; index?: number; asOf?: string; variant?: "US" | "KR"; series: number[] }) {
  const { label, cls } = classifyFG(index, variant);
  const barPct = Math.max(0, Math.min(100, index));
  const { delta, ma } = calcDeltaAndMA(series || [index]);
  const sign = delta > 0 ? "+" : delta < 0 ? "" : "";
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-600">
        {title} {asOf ? <span className="ml-1 text-xs text-gray-400">({asOf})</span> : null}
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div className="text-4xl font-extrabold text-gray-900">{index}</div>
        <div className={classNames("rounded-full border px-2 py-1 text-xs font-semibold ring-1", cls)}>
          {label}
          {variant === "KR" && <span className="ml-1 text-[11px] text-gray-500">KOSPI 심리</span>}
        </div>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
        <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-yellow-400 to-red-600" style={{ width: `${barPct}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-gray-500">
        <span>공포</span>
        <span>중립</span>
        <span>탐욕</span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px]">
        <span className={classNames("rounded-full px-2 py-0.5 ring-1", delta >= 0 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-red-50 text-red-700 ring-red-200")}>
          Δ {sign}
          {delta.toFixed(1)}
        </span>
        <span className="rounded-full bg-gray-50 px-2 py-0.5 text-gray-700 ring-1 ring-gray-200">MA(7) {ma.toFixed(1)}</span>
      </div>
    </div>
  );
}

// 간단 스파크라인 차트 (SVG)
function Sparkline({ data = [], height = 120, stroke = "#4338ca", fill = "rgba(99,102,241,0.15)" }: { data: number[]; height?: number; stroke?: string; fill?: string }) {
  const width = 500;
  const n = data.length;
  if (n === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const y = (v: number) => {
    if (max === min) return height / 2;
    return height - ((v - min) / (max - min)) * height;
  };
  const x = (i: number) => (i / (n - 1)) * width;
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
  const area = `${d} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-28 w-full">
      <path d={area} fill={fill} />
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function LineChartCard({ title, unit, asOf, data }: { title: string; unit: string; asOf?: string; data: number[] }) {
  const last = data[data.length - 1];
  const first = data[0];
  const diff = last - first;
  const pct = first ? (diff / first) * 100 : 0;
  const up = diff >= 0;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {title} <span className="ml-1 text-xs text-gray-400">({asOf})</span>
        </div>
        <div className={classNames("rounded-full px-2 py-0.5 text-xs font-semibold ring-1", up ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-red-50 text-red-700 ring-red-200")}>
          {up ? "+" : ""}
          {pct.toFixed(2)}%
        </div>
      </div>
      <div className="mt-2 flex items-end justify-between">{/* ← 오타 수정: flex.items-end → flex items-end */}
        <div className="text-2xl font-extrabold text-gray-900">
          {last.toLocaleString()} <span className="text-sm font-semibold text-gray-500">{unit}</span>
        </div>
      </div>
      <div className="mt-2">
        <Sparkline data={data} />
      </div>
    </div>
  );
}

function BuffettCard({ title, asOf, data }: { title: string; asOf?: string; data: number[] }) {
  const last = data[data.length - 1];
  const pct = last * 100;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {title} <span className="ml-1 text-xs text-gray-400">({asOf})</span>
        </div>
        <div className={classNames("rounded-full px-2 py-0.5 text-xs font-semibold ring-1", pct >= 100 ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200")}>{pct.toFixed(0)}%</div>
      </div>
      <div className="mt-2">
        <Sparkline data={data} stroke="#0f766e" fill="rgba(16,185,129,0.15)" />
      </div>
      <div className="mt-1 text-[11px] text-gray-500">(총시가총액 / GDP 비율, 100% 초과 시 상대적 고평가 경향)</div>
    </div>
  );
}

// 클릭 토글 팝오버(오버플로 방지)
function DelayedTooltip({ id, activeId, setActiveId, content, children }: { id: string; activeId: string | null; setActiveId: (v: string | null) => void; content: React.ReactNode; children: React.ReactNode }) {
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
      // @ts-ignore
      onClick(e as any);
    }
  };
  return (
    <div ref={anchorRef} className="relative" onClick={onClick} onKeyDown={onKeyDown} role="button" tabIndex={0}>
      {children}
      {open && (
        <div className="z-[999] rounded-xl border border-gray-200 bg-white p-3 text-xs shadow-2xl" style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, maxWidth: "calc(100vw - 16px)" }}>
          {content}
        </div>
      )}
    </div>
  );
}

function CategoryHeatmapCard({ movesUS = mockCategoryMovesUS, movesKR = mockCategoryMovesKR, asOf }: { movesUS?: typeof mockCategoryMovesUS; movesKR?: typeof mockCategoryMovesKR; asOf?: string }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [marketView, setMarketView] = useState<"US" | "KR">("US");
  const moves = marketView === "US" ? movesUS : movesKR;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          카테고리 등락 <span className="ml-1 text-xs text-gray-400">({asOf})</span>
          <span className="ml-2 text-xs text-gray-400">{marketView === "US" ? "2025 미국 GICS 기준" : "한국: KRX/테마 매핑(준)"}</span>
        </div>
        <div className="rounded-full border border-gray-200 bg-gray-50 p-1">
          <button className={classNames("rounded-full px-3 py-1 text-xs font-semibold", marketView === "US" ? "bg-white shadow" : "text-gray-700")} onClick={() => setMarketView("US")}>
            미국
          </button>
          <button className={classNames("rounded-full px-3 py-1 text-xs font-semibold", marketView === "KR" ? "bg-white shadow" : "text-gray-700")} onClick={() => setMarketView("KR")}>
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
                  <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 ring-1 ring-gray-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          );
          return (
            <DelayedTooltip key={`${marketView}-${m.name}`} id={`${marketView}-${m.name}`} activeId={activeId} setActiveId={setActiveId} content={tooltip}>
              <div className="rounded-xl p-3 text-center shadow-sm ring-1 ring-gray-200 flex flex-col items-center justify-center h-24 leading-tight cursor-pointer" style={{ backgroundColor: bg, color: text }}>
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

export function ImpactBadge({ direction, confidence = 0.7 }: { direction: "POS" | "NEG" | "NEU"; confidence?: number }) {
  const map = {
    POS: { label: "긍정", ring: "ring-green-500/30", bg: "bg-green-50", text: "text-green-700" },
    NEG: { label: "부정", ring: "ring-red-500/30", bg: "bg-red-50", text: "text-red-700" },
    NEU: { label: "횡보", ring: "ring-gray-500/30", bg: "bg-gray-50", text: "text-gray-700" },
  } as const;
  const s = map[direction] || map.NEU;
  return (
    <span className={classNames("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ring-1", s.bg, s.text, s.ring)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label} · {(confidence * 100).toFixed(0)}%
    </span>
  );
}

// ✅ 공용 카테고리 칩 (오버플로우 없이 줄바꿈)
export function CategoryChips({ value, onChange, categories = CATEGORIES as unknown as string[] }: { value: string; onChange: (v: string) => void; categories?: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {categories.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange && onChange(c)}
          className={classNames("rounded-full px-2.5 py-1 text-xs font-semibold ring-1", value === c ? "bg-gray-900 text-white ring-gray-900" : "bg-gray-50 text-gray-700 ring-gray-200 hover:bg-gray-100")}
          aria-pressed={value === c}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export function FilingCard({ item, onClick, isFavorite, onToggleFavorite }: { item: any; onClick: () => void; isFavorite?: boolean; onToggleFavorite?: () => void }) {
  return (
    <div role="button" onClick={onClick} className="group w-full text-left rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        {item.logoUrl ? <img src={item.logoUrl} alt="logo" className="h-8 w-8 rounded" /> : <div className="h-8 w-8 rounded bg-gray-200" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium">{item.formType}</span>
            <span>{item.market}</span>
            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">{item.category}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 truncate">
            <div className="truncate text-base font-semibold text-gray-900">
              {item.symbol} · {item.company}
            </div>
            <button
              aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite && onToggleFavorite();
              }}
              className={classNames("shrink-0 rounded-full border px-2 py-1 text-xs font-semibold", isFavorite ? "border-yellow-300 bg-yellow-50 text-yellow-700" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50")}
            >
              {isFavorite ? "★" : "☆"}
            </button>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-gray-700">{item.summary}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ImpactBadge direction={item.direction} confidence={item.confidence} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function UndervaluedRow({ item, isFavorite, onToggleFavorite, onClick }: { item: any; isFavorite?: boolean; onToggleFavorite: () => void; onClick: () => void }) {
  const perfColor100 = item.perf100d >= 0 ? "text-emerald-600" : "text-red-600";
  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-3 py-3 text-sm font-semibold text-gray-900">#{item.rank}</td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          {item.logoUrl ? <img src={item.logoUrl} alt="logo" className="h-6 w-6 rounded" /> : <div className="h-6 w-6 rounded bg-gray-200" />}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <button onClick={onClick} className="text-left">
                <div className="text-sm font-semibold text-gray-900">
                  {item.symbol} · {item.name}
                </div>
              </button>
              <button aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"} onClick={onToggleFavorite} className={classNames("rounded-full border px-2 py-1 text-xs font-semibold", isFavorite ? "border-yellow-300 bg-yellow-50 text-yellow-700" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50")}>
                {isFavorite ? "★" : "☆"}
              </button>
            </div>
            <div className="text-xs text-gray-500">{item.category}</div>
          </div>
        </div>
      </td>
      <td className={classNames("whitespace-nowrap px-3 py-3 text-sm font-semibold", perfColor100)}>{(item.perf100d * 100).toFixed(1)}%</td>
      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-700">{item.score?.toFixed ? item.score.toFixed(1) : item.score}</td>
    </tr>
  );
}

// ------------------------------------------------------------------
// MOCK DATA (미국/한국 + 섹터 카테고리 + 로고 + 100일 수익률)
// ------------------------------------------------------------------
const mockFilings = [
  { id: "f1", market: "US", symbol: "MSFT", company: "Microsoft", formType: "10-Q", summary: "클라우드 성장 지속", direction: "POS", confidence: 0.8, category: "정보기술", logoUrl: "https://logo.clearbit.com/microsoft.com" },
  { id: "f2", market: "US", symbol: "AAPL", company: "Apple", formType: "10-K", summary: "수익성 방어, R&D 확대", direction: "NEU", confidence: 0.62, category: "정보기술", logoUrl: "https://logo.clearbit.com/apple.com" },
  { id: "f3", market: "KR", symbol: "005930.KS", company: "삼성전자", formType: "분기보고서", summary: "메모리 ASP 상승", direction: "POS", confidence: 0.7, category: "정보기술", logoUrl: "https://logo.clearbit.com/samsung.com" },
  { id: "f4", market: "KR", symbol: "068270.KS", company: "셀트리온", formType: "분기보고서", summary: "바이오시밀러 성장", direction: "POS", confidence: 0.66, category: "헬스케어", logoUrl: "https://logo.clearbit.com/celltrion.com" },
];
const mockUndervalued = [
  { market: "US", symbol: "MSFT", name: "Microsoft", category: "정보기술", rank: 1, score: 88.2, introducedAt: "2025-08-12", perfSinceIntro: 0.124, perf100d: 0.153, logoUrl: "https://logo.clearbit.com/microsoft.com" },
  { market: "US", symbol: "XOM", name: "Exxon Mobil", category: "에너지", rank: 2, score: 80.1, introducedAt: "2025-08-15", perfSinceIntro: 0.044, perf100d: -0.021, logoUrl: "https://logo.clearbit.com/exxon.com" },
  { market: "KR", symbol: "005930.KS", name: "삼성전자", category: "정보기술", rank: 1, score: 84.5, introducedAt: "2025-09-02", perfSinceIntro: 0.089, perf100d: 0.112, logoUrl: "https://logo.clearbit.com/samsung.com" },
  { market: "KR", symbol: "068270.KS", name: "셀트리온", category: "헬스케어", rank: 2, score: 79.3, introducedAt: "2025-08-30", perfSinceIntro: 0.031, perf100d: 0.064, logoUrl: "https://logo.clearbit.com/celltrion.com" },
];

// ------------------------------------------------------------------
// 섹션: 최근 공시/보고서 시그널 (시장별)
// ------------------------------------------------------------------
function FilingsSectionByMarket({
  market,
  selectedCategory,
  setSelectedCategory,
  favorites,
  toggleFavorite,
  asOf,
  sentiment,
  setSentiment,
}: {
  market: "US" | "KR";
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  favorites: Record<string, boolean>;
  toggleFavorite: (s: string) => void;
  asOf?: string;
  sentiment: "ALL" | "POS" | "NEG" | "NEU";
  setSentiment: (v: "ALL" | "POS" | "NEG" | "NEU") => void;
}) {
  const baseItems = useMemo(() => {
    return mockFilings.filter((f) => f.market === market && (selectedCategory === "전체" || f.category === selectedCategory));
  }, [market, selectedCategory]);

  const items = useMemo(() => {
    if (sentiment === "ALL") return baseItems;
    return baseItems.filter((f) => f.direction === sentiment);
  }, [baseItems, sentiment]);

  const counts = useMemo(() => {
    return baseItems.reduce(
      (acc, it) => {
        acc[it.direction as "POS" | "NEG" | "NEU"] = (acc[it.direction as "POS" | "NEG" | "NEU"] || 0) + 1;
        return acc;
      },
      { POS: 0, NEG: 0, NEU: 0 } as Record<"POS" | "NEG" | "NEU", number>
    );
  }, [baseItems]);
  const total = baseItems.length;

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900 md:text-xl">
            최근 공시/보고서 시그널 — {market === "US" ? "미국" : "한국"} <span className="ml-2 text-xs text-gray-400">({asOf})</span>
          </h2>
          <button className="inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 bg-indigo-50 hover:bg-indigo-100">
            자세히 보기<span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">필터 결과:</span>
            <button className={classNames("rounded-full px-2.5 py-1 font-semibold ring-1", sentiment === "ALL" ? "bg-gray-900 text-white ring-gray-900" : "bg-gray-50 text-gray-700 ring-gray-200 hover:bg-gray-100")} onClick={() => setSentiment("ALL")}>
              전체 {total}
            </button>
            <button className={classNames("rounded-full px-2.5 py-1 font-semibold ring-1", sentiment === "POS" ? "bg-emerald-600 text-white ring-emerald-600" : "bg-gray-50 text-gray-700 ring-gray-200 hover:bg-gray-100")} onClick={() => setSentiment("POS")}>
              긍정 {counts.POS}
            </button>
            <button className={classNames("rounded-full px-2.5 py-1 font-semibold ring-1", sentiment === "NEG" ? "bg-red-600 text-white ring-red-600" : "bg-gray-50 text-gray-700 ring-gray-200 hover:bg-gray-100")} onClick={() => setSentiment("NEG")}>
              부정 {counts.NEG}
            </button>
            <button className={classNames("rounded-full px-2.5 py-1 font-semibold ring-1", sentiment === "NEU" ? "bg-gray-700 text-white ring-gray-700" : "bg-gray-50 text-gray-700 ring-gray-200 hover:bg-gray-100")} onClick={() => setSentiment("NEU")}>
              횡보 {counts.NEU}
            </button>
          </div>
          <CategoryChips value={selectedCategory} onChange={setSelectedCategory} categories={[...CATEGORIES]} />
        </div>
      </div>

      <div className="grid gap-3">
        {items.map((it) => (
          <FilingCard key={it.id} item={it} onClick={() => {}} isFavorite={!!favorites[it.symbol]} onToggleFavorite={() => toggleFavorite(it.symbol)} />
        ))}
        {items.length === 0 && <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">해당 카테고리에 대한 공시/보고서 시그널이 없습니다.</div>}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------
// 섹션: 저평가 우량주 랭킹 (시장별, 100일 수익률, 즐겨찾기)
// ------------------------------------------------------------------
function RankingSectionByMarket({
  market,
  selectedCategory,
  setSelectedCategory,
  favorites,
  toggleFavorite,
  asOf,
}: {
  market: "US" | "KR";
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  favorites: Record<string, boolean>;
  toggleFavorite: (s: string) => void;
  asOf?: string;
}) {
  const rows = useMemo(() => {
    return mockUndervalued.filter((r) => r.market === market && (selectedCategory === "전체" || r.category === selectedCategory));
  }, [market, selectedCategory]);

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900 md:text-xl">
            저평가 우량주 랭킹 — {market === "US" ? "미국" : "한국"} <span className="ml-2 text-xs text-gray-400">({asOf})</span>
          </h2>
          <button className="inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 bg-indigo-50 hover:bg-indigo-100">
            자세히 보기<span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            이름 · 카테고리 · 순위 · <b>100일 수익률</b>
          </p>
          <CategoryChips value={selectedCategory} onChange={setSelectedCategory} categories={[...CATEGORIES]} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
              <th className="px-3 py-2">순위</th>
              <th className="px-3 py-2">종목</th>
              <th className="px-3 py-2">100일 수익률</th>
              <th className="px-3 py-2">스코어</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <UndervaluedRow key={r.symbol} item={r} isFavorite={!!favorites[r.symbol]} onToggleFavorite={() => toggleFavorite(r.symbol)} onClick={() => {}} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-sm text-gray-500">
                  해당 카테고리에 대한 저평가 우량주가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------
// 헤더 + 하단 네비
// ------------------------------------------------------------------
function Header({ mode, setMode }: { mode: "stock" | "coin"; setMode: (m: "stock" | "coin") => void }) {
  const isStock = mode === "stock";
  const isCoin = mode === "coin";
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-xl font-extrabold tracking-tight">DDalKKak</div>
            <div className="rounded-full border border-gray-200 bg-gray-50 p-1">
              <button className={classNames("rounded-full px-3 py-1 text-sm font-semibold", isStock ? "shadow" : "text-gray-700")} style={{ backgroundColor: isStock ? "#a7f3d0" : "#ffffff", color: isStock ? "#065f46" : undefined }} onClick={() => setMode("stock")}>
                주식
              </button>
              <button className={classNames("rounded-full px-3 py-1 text-sm font-semibold", isCoin ? "shadow" : "text-gray-700")} style={{ backgroundColor: isCoin ? "#d4af37" : "#ffffff", color: isCoin ? "#111827" : undefined }} onClick={() => setMode("coin")}>
                코인
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-gray-50">로그인</button>
            <button className="rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700">회원가입</button>
          </div>
        </div>
      </div>
    </header>
  );
}

function BottomNav({ active = "home", onChange }: { active?: TabKey; onChange: (k: TabKey) => void }) {
  const itemCls = (key: TabKey) => classNames("block w-full h-14 py-3 text-sm font-semibold touch-manipulation", key === active ? "text-indigo-700 bg-indigo-50 ring-1 ring-indigo-200" : "text-gray-600 hover:text-gray-900");
  const click = (key: TabKey) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onChange && onChange(key);
  };
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl">
        <ul className="grid grid-cols-5">
          <li>
            <button className={itemCls("news")} onClick={click("news")} aria-current={active === "news" ? "page" : undefined}>
              뉴스 요약
            </button>
          </li>
          <li>
            <button className={itemCls("reports")} onClick={click("reports")} aria-current={active === "reports" ? "page" : undefined}>
              공시/보고서 목록
            </button>
          </li>
          <li>
            <button className={itemCls("home")} onClick={click("home")} aria-current={active === "home" ? "page" : undefined}>
              홈
            </button>
          </li>
          <li>
            <button className={itemCls("list")} onClick={click("list")} aria-current={active === "list" ? "page" : undefined}>
              종목 목록
            </button>
          </li>
          <li>
            <button className={itemCls("detail")} onClick={click("detail")} aria-current={active === "detail" ? "page" : undefined}>
              종목 상세
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

// ----------------------------
// 뉴스 요약 (카테고리·정렬·날짜·모달 포함) — 이전 대화 버전 그대로
// ----------------------------
const NEWS_CATEGORIES = ["전체", "거시경제", "금융시장", "기업/산업", "부동산", "소비/고용", "정책/제도", "정치"];

const mockNews = [
  { id: "n1", date: "2025-10-14", category: "거시경제", title: "미 연준 의사록: 추가 인상 가능성 낮아", body: "...", summary: "금리 동결 기조 유지, 물가 둔화 확인.", link: "#", importance: 9, reason: "시장 변동성 직접 영향" },
  { id: "n2", date: "2025-10-15", category: "기업/산업", title: "삼성전자 HBM 생산 증설 발표", body: "...", summary: "AI 수요 대응 위해 생산능력 확대.", link: "#", importance: 8, reason: "AI 공급망 영향" },
  { id: "n3", date: "2025-10-13", category: "금융시장", title: "달러/원 1,330원대 재진입", body: "...", summary: "위험선호 회복으로 환율 하락.", link: "#", importance: 7, reason: "수출/수입주 실적 민감" },
  { id: "n4", date: "2025-10-12", category: "부동산", title: "수도권 전세가 상승세 둔화", body: "...", summary: "거래량 감소, 금리 부담 지속.", link: "#", importance: 5, reason: "가계 소비 여력 관련" },
  { id: "n5", date: "2025-10-15", category: "정책/제도", title: "정부, 데이터센터 전력 요금 인센티브 검토", body: "...", summary: "친AI 인프라 정책 일환.", link: "#", importance: 6, reason: "산업 전반 비용 구조" },
  { id: "n6", date: "2025-10-11", category: "정치", title: "미-중 정상 통화, 통상 이슈 완화 시사", body: "...", summary: "관세 이슈 일부 진전 가능성.", link: "#", importance: 7, reason: "대외 불확실성 완화" },
  { id: "n7", date: "2025-10-15", category: "소비/고용", title: "9월 고용, 예상치 하회", body: "...", summary: "임금 상승률도 둔화.", link: "#", importance: 8, reason: "소비 사이클 전환 신호" },
  { id: "n8", date: "2025-10-10", category: "기업/산업", title: "테슬라, FSD 구독가 인하", body: "...", summary: "시장 점유율 확대 전략 분석.", link: "#", importance: 6, reason: "경쟁 구도 변화" },
  // 추가 더미 (초 단위 포함, .000000 제거)
  { id: "n9", date: "2025-10-16 12:00:45", category: "거시경제", title: '트럼프, 다음달 관세 재판에 "현장 방청할 생각"…美 대통령 최초 사례 되나', summary: "트럼프 美 대통령, 관세 부과 적법성 심리하는 연방대법원 재판(다음달 5일) 현장 방청 의사 밝힘. 하급심은 IEEPA 근거 관세 부과 위법 판결. 대법원서 하급심 유지 시 美 유효 관세율 16.3%의 절반 이하로 하락 및 수백억 달러 환급 가능성.", link: "https://www.hankyung.com/article/2025101626227", importance: 8, reason: "IEEPA 근거 관세 부과 적법성 여부가 결정됨. 관세는 무역·물가 등 거시경제에 직접적이고 광범위한 영향을 미치는 중대 사안이며, 수백억 달러 환급 가능성도 있음." },
  { id: "n10", date: "2025-10-16 07:23:33", category: "거시경제", title: "'10일 내' 무역협상 타결 기대감…'3500억달러 패키지' 운명은", summary: "한미 무역협상이 최종 타결 단계에 근접, 미국 베선트 재무부 장관이 10일 내 협상 결과 예상. 주요 쟁점은 3500억 달러 대미 투자 패키지 구성 및 한미 통화스와프 등 외환시장 안정장치. 양측이 세부 사항 조율 중이며, 한국 외환시장 안전장치 마련에 긍정적 언급 나옴.", link: "https://www.hankyung.com/article/2025101615667", importance: 8, reason: "무역 협상 타결 임박 소식은 관세 및 대규모 대미 투자의 확정으로 이어져 거시경제 및 무역에 직접적 영향. 외환시장 안전장치는 금융시장 변동성 완화에 중요." },
  { id: "n11", date: "2025-10-16 05:26:38", category: "거시경제", title: '베선트 "한미 관세협상, 열흘 내 어떤 결과 나올 것" [이상은의 워싱턴나우]', summary: '베선트 美 재무장관 "한미 관세협상, APEC 정상회담 전 열흘 내 결과 나올 것" 언급. 한국 측 3500억 달러 일시 투자 및 외환시장 영향 우려 관련 양측 의견 좁혀. 협상 마무리 단계, 구체적 투자 방식(펀드 등)이 최종 타결의 관건 예상.', link: "https://www.hankyung.com/article/202510161460i", importance: 8, reason: "한미 간 대규모 관세협상 및 투자 관련 논의가 마무리 단계에 진입, 외환시장 및 무역 환경 등 거시경제 지표에 즉각적이고 중요한 영향을 미칠 가능성 높음." },
  { id: "n12", date: "2025-10-16 11:30:06", category: "거시경제", title: "韓협상단, 내일 美백악관 예산국 방문…관세 협상 막바지", summary: "한미 관세 협상 막바지로, 韓 협상단 내일(17일 새벽) 美 백악관 관리예산국 방문 예정. 협상 최종 문구 조율 관측 속, 美 요구 투자액($3500억) 조달 방식(통화스와프, 외평채 등)이 외환보유액 및 국가부채에 미칠 영향이 핵심 쟁점.", link: "https://www.hankyung.com/article/2025101625437", importance: 7, reason: "한미 관세 협상의 최종 단계, $3500억 대미 투자금 조달 방식은 외환보유액, 통화스와프 등 거시경제 핵심 변수에 직접적 영향 예상." },
  { id: "n13", date: "2025-10-16 11:19:29", category: "거시경제", title: `트럼프 "한국 '3500억달러 선불' 합의" 또 다시 거론 [HK영상]`, summary: `트럼프 美 대통령, 백악관 기자회견서 한국이 무역 합의 일환으로 대미 투자금 3500억 달러(약 500조 원)를 '선불(up front)' 지급하기로 했다고 재차 주장.`, link: "https://www.hankyung.com/article/202510162536i", importance: 7, reason: "한국의 3500억 달러 대미 투자금 관련, 지급 방식(선불 여부)에 대한 미국 대통령의 직접적 압박 발언으로 거시경제 변수(무역/환율)에 잠재적 불확실성 증폭." },
];

function NewsImportanceBadge({ score }: { score: number }) {
  const tone = score >= 8 ? { c: "bg-rose-50 text-rose-700 ring-rose-200" } : score >= 5 ? { c: "bg-amber-50 text-amber-800 ring-amber-200" } : { c: "bg-gray-50 text-gray-700 ring-gray-200" };
  return <span className={classNames("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1", tone.c)}>중요도 {score}/10</span>;
}

// ✅ 모달(정중앙) — 제목/업로드일자/요약/닫기/원문보기(새탭)
function NewsModal({ open, onClose, item }: { open: boolean; onClose: () => void; item: any | null }) {
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
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm">
            닫기
          </button>
          <button
            type="button"
            onClick={() => {
              const url = item.link;
              if (url && url !== "#") {
                if (typeof window !== "undefined") window.open(String(url), "_blank", "noopener,noreferrer");
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

// 카드 포맷
function NewsCard({ item, onOpen }: { item: any; onOpen: (it: any) => void }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md" onClick={() => onOpen && onOpen(item)}>
      <div className="flex items-start gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 ring-1 ring-gray-200">{item.category}</span>
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

// 카테고리별 페이지네이션(4개/페이지) + 드래그 스와이프 + 버튼
function CategoryPager({ items, onOpen }: { items: any[]; onOpen: (n: any) => void }) {
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
    <div className="relative" onTouchStart={onStart} onTouchEnd={onEnd} onMouseDown={onStart as any} onMouseUp={onEnd as any}>
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
            className={classNames("absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-white/70 ring-1 ring-gray-300 h-16 w-8 md:h-20 md:w-10 p-0 flex items-center justify-center transition-opacity", canPrev ? "opacity-40 hover:opacity-100" : "opacity-0 pointer-events-none")}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="다음 페이지"
            onClick={next}
            className={classNames("absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/70 ring-1 ring-gray-300 h-16 w-8 md:h-20 md:w-10 p-0 flex items-center justify-center transition-opacity", canNext ? "opacity-40 hover:opacity-100" : "opacity-0 pointer-events-none")}
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

function inDateRange(iso: string, startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return true;
  const datePart = (iso || "").split(" ")[0];
  const d = new Date(`${datePart}T00:00:00`);
  if (startDate) {
    const s = new Date(`${startDate}T00:00:00`);
    if (d < s) return false;
  }
  if (endDate) {
    const e = new Date(`${endDate}T23:59:59`);
    if (d > e) return false;
  }
  return true;
}

function NewsSummaryTab() {
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

// ======================= DemoHome (메인) =======================
const TAB_KEYS = ["home", "news", "reports", "list", "detail"] as const;
type TabKey = (typeof TAB_KEYS)[number];

export default function DemoHome() {
  const [mode, setMode] = useState<"stock" | "coin">("stock");

  const fearGreedUS = usFearGreedSeries[usFearGreedSeries.length - 1];
  const fearGreedKR = krFearGreedSeries[krFearGreedSeries.length - 1];
  const asOfUS = formatAsOf(new Date());
  const asOfKR = asOfUS;
  const asOf = asOfUS;

  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabKey>("home");

  // ✅ 탭별 스크롤 위치 저장용
  const scrollPositions = useRef<Record<TabKey, number>>({
    home: 0,
    news: 0,
    reports: 0,
    list: 0,
    detail: 0,
  });

  // ✅ 탭별 개별 스크롤 컨테이너 ref
  const homeRef = useRef<HTMLDivElement>(null);
  const newsRef = useRef<HTMLDivElement>(null);
  const reportsRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // 2) ⬇️ 여기 타입을 RefObject<HTMLDivElement> → MutableRefObject<HTMLDivElement | null> 로 수정
  const refMap: Record<TabKey, React.MutableRefObject<HTMLDivElement | null>> = {
    home: homeRef,
    news: newsRef,
    reports: reportsRef,
    list: listRef,
    detail: detailRef,
  };

  // ✅ 탭 전환 시: 현재 탭 스크롤 저장 → 다음 탭 스크롤 복원
  const switchTab = (next: TabKey) => {
    const currEl = refMap[activeTab].current;
    if (currEl) scrollPositions.current[activeTab] = currEl.scrollTop;

    setActiveTab(next);

    // 다음 프레임에서 복원 (DOM 업데이트 후)
    requestAnimationFrame(() => {
      const nextEl = refMap[next].current;
      if (nextEl) nextEl.scrollTo({ top: scrollPositions.current[next] || 0 });
    });
  };

  // 시그널 섹션 카테고리(미국/한국) + 감성
  const [filingCatUS, setFilingCatUS] = useState("전체");
  const [filingCatKR, setFilingCatKR] = useState("전체");
  const [filingSentUS, setFilingSentUS] = useState<"ALL" | "POS" | "NEG" | "NEU">("ALL");
  const [filingSentKR, setFilingSentKR] = useState<"ALL" | "POS" | "NEG" | "NEU">("ALL");

  // 랭킹 섹션 카테고리(미국/한국)
  const [rankCatUS, setRankCatUS] = useState("전체");
  const [rankCatKR, setRankCatKR] = useState("전체");

  // 즐겨찾기
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const toggleFavorite = (symbol: string) => setFavorites((prev) => ({ ...prev, [symbol]: !prev[symbol] }));

  // URL → 상태 복원
  useEffect(() => {
    const trySet = (key: string, setter: (v: any) => void, whitelist?: readonly string[]) => {
      const v = getQueryParam(key);
      if (!v) return;
      if (!whitelist || whitelist.includes(v)) setter(v);
    };
    trySet("filings_us", setFilingCatUS, CATEGORIES as unknown as string[]);
    trySet("filings_kr", setFilingCatKR, CATEGORIES as unknown as string[]);
    trySet("ranking_us", setRankCatUS, CATEGORIES as unknown as string[]);
    trySet("ranking_kr", setRankCatKR, CATEGORIES as unknown as string[]);
    trySet("filings_sentiment_us", setFilingSentUS, ["ALL", "POS", "NEG", "NEU"]);
    trySet("filings_sentiment_kr", setFilingSentKR, ["ALL", "POS", "NEG", "NEU"]);
  }, []);

  // 상태 → URL 동기화
  useEffect(() => {
    setQueryParams({
      filings_us: filingCatUS,
      filings_kr: filingCatKR,
      ranking_us: rankCatUS,
      ranking_kr: rankCatKR,
      filings_sentiment_us: filingSentUS,
      filings_sentiment_kr: filingSentKR,
    });
  }, [filingCatUS, filingCatKR, rankCatUS, rankCatKR, filingSentUS, filingSentKR]);

  // 간단 테스트
  useEffect(() => {
    console.assert(["home", "news", "reports", "list", "detail"].includes(activeTab), "activeTab should be valid");
  }, [activeTab]);

  return (
    // ✅ 전체 레이아웃: 헤더 / (탭별 개별 스크롤 영역) / 고정 하단 네비
    <div className="h-screen w-full bg-gray-50 flex flex-col overflow-hidden">
      {/* 상단 고정 헤더 */}
      <Header mode={mode} setMode={setMode} />

      {/* ✅ 중앙: 탭별 개별 스크롤 컨테이너들 (겹쳐 놓고, active만 표시) */}
      <div className="relative flex-1 overflow-hidden">
        {/* HOME */}
        <div
          ref={homeRef}
          className={classNames(
            "absolute inset-0 overflow-y-auto overscroll-contain",
            activeTab === "home" ? "block" : "hidden"
          )}
        >
          <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 pb-24">
            <div className="grid gap-4 md:grid-cols-2">
              <FearGreedCard title="미국 공포·탐욕 지수" index={fearGreedUS} asOf={asOfUS} variant="US" series={usFearGreedSeries} />
              <FearGreedCard title="한국 공포·탐욕 지수" index={fearGreedKR} asOf={asOfKR} variant="KR" series={krFearGreedSeries} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <BuffettCard title="미국 버핏지수" asOf={asOf} data={usBuffettSeries} />
              <BuffettCard title="한국 버핏지수" asOf={asOf} data={krBuffettSeries} />
            </div>

            <CategoryHeatmapCard movesUS={mockCategoryMovesUS} movesKR={mockCategoryMovesKR} asOf={asOf} />

            <div className="grid gap-4 md:grid-cols-2">
              <LineChartCard title="원·달러 환율" unit="KRW" asOf={asOf} data={mockUSDKRW} />
              <LineChartCard title="금 시세" unit="USD/oz" asOf={asOf} data={mockGoldUSD} />
            </div>

            <div className="space-y-6">
              <FilingsSectionByMarket
                market="US"
                selectedCategory={filingCatUS}
                setSelectedCategory={setFilingCatUS}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                asOf={asOf}
                sentiment={filingSentUS}
                setSentiment={setFilingSentUS}
              />
              <FilingsSectionByMarket
                market="KR"
                selectedCategory={filingCatKR}
                setSelectedCategory={setFilingCatKR}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                asOf={asOf}
                sentiment={filingSentKR}
                setSentiment={setFilingSentKR}
              />
            </div>

            <div className="space-y-6">
              <RankingSectionByMarket
                market="US"
                selectedCategory={rankCatUS}
                setSelectedCategory={setRankCatUS}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                asOf={asOf}
              />
              <RankingSectionByMarket
                market="KR"
                selectedCategory={rankCatKR}
                setSelectedCategory={setRankCatKR}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                asOf={asOf}
              />
            </div>

            <p className="text-xs text-gray-500">
              ※ 본 서비스는 투자 자문이 아니며, 제공 정보는 참고용입니다. 데이터 출처, 산출 로직, 스냅샷 생성시각을 각 화면에 명시합니다.
            </p>
          </main>
        </div>

        {/* NEWS */}
        <div
          ref={newsRef}
          className={classNames(
            "absolute inset-0 overflow-y-auto overscroll-contain",
            activeTab === "news" ? "block" : "hidden"
          )}
        >
          <NewsSummaryTab />
        </div>

        {/* REPORTS */}
        <div
          ref={reportsRef}
          className={classNames(
            "absolute inset-0 overflow-y-auto overscroll-contain",
            activeTab === "reports" ? "block" : "hidden"
          )}
        >
          <main className="mx-auto max-w-7xl px-4 py-8 pb-24">
            <h1 className="text-xl font-bold">보고서 목록 (준비중)</h1>
            <p className="mt-2 text-sm text-gray-600">최근 공시/보고서의 전체 리스트/검색 화면이 들어갈 자리입니다.</p>
            <div className="mt-6 h-[1200px] rounded-2xl border border-dashed border-gray-200 bg-white/50" />
          </main>
        </div>

        {/* LIST */}
        <div
          ref={listRef}
          className={classNames(
            "absolute inset-0 overflow-y-auto overscroll-contain",
            activeTab === "list" ? "block" : "hidden"
          )}
        >
          <main className="mx-auto max-w-7xl px-4 py-8 pb-24">
            <h1 className="text-xl font-bold">종목 목록 (준비중)</h1>
            <div className="mt-6 h-[1200px] rounded-2xl border border-dashed border-gray-200 bg-white/50" />
          </main>
        </div>

        {/* DETAIL */}
        <div
          ref={detailRef}
          className={classNames(
            "absolute inset-0 overflow-y-auto overscroll-contain",
            activeTab === "detail" ? "block" : "hidden"
          )}
        >
          <main className="mx-auto max-w-7xl px-4 py-8 pb-24">
            <h1 className="text-xl font-bold">종목 상세 (준비중)</h1>
            <div className="mt-6 h-[1200px] rounded-2xl border border-dashed border-gray-200 bg-white/50" />
          </main>
        </div>
      </div>

      {/* 하단 고정 네비 */}
      <BottomNav active={activeTab} onChange={switchTab} />
    </div>
  );
}