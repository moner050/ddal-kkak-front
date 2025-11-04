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

// 숫자 포맷팅 유틸리티
function formatNumber(num: number, options?: { compact?: boolean; decimals?: number }): string {
  const { compact = false, decimals = 2 } = options || {};

  if (compact && Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(decimals) + "M";
  } else if (compact && Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(decimals) + "K";
  }

  return num.toLocaleString("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

// 상대 시간 표시 (예: "5분 전", "2시간 전")
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return formatAsOf(date);
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

// Cookie helpers for storing favorites
const setCookie = (name: string, value: string, days: number = 365) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

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
// 핵심 지표 대시보드 요약 카드
function DashboardSummaryCard({
  usdkrw,
  gold,
  fearGreedUS,
  fearGreedKR,
  lastUpdate
}: {
  usdkrw: number;
  gold: number;
  fearGreedUS: number;
  fearGreedKR: number;
  lastUpdate: Date;
}) {
  const metrics = [
    { label: "USD/KRW", value: formatNumber(usdkrw, { decimals: 2 }), unit: "원", change: 0 },
    { label: "금 시세", value: formatNumber(gold, { decimals: 2 }), unit: "$/oz", change: 0 },
    { label: "US 공포·탐욕", value: fearGreedUS, unit: "", sentiment: classifyFG(fearGreedUS, "US").label },
    { label: "KR 공포·탐욕", value: fearGreedKR, unit: "", sentiment: classifyFG(fearGreedKR, "KR").label }
  ];

  return (
    <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-gray-900">📊 시장 현황 요약</h2>
        <span className="text-xs text-gray-600 flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          {getRelativeTime(lastUpdate)}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m, idx) => (
          <div key={idx} className="rounded-xl bg-white/80 backdrop-blur p-3 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-xs text-gray-600 mb-1">{m.label}</div>
            <div className="flex items-end gap-1">
              <div className="text-xl font-extrabold text-gray-900">
                {typeof m.value === "number" ? formatNumber(m.value) : m.value}
              </div>
              {m.unit && <div className="text-xs text-gray-500 pb-0.5">{m.unit}</div>}
            </div>
            {m.sentiment && (
              <div className="mt-1 text-xs text-gray-600">
                {m.sentiment}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
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

// 간단 스파크라인 차트 (SVG) - 인터랙티브 툴팁 포함
function Sparkline({ data = [], height = 120, stroke = "#4338ca", fill = "rgba(99,102,241,0.15)", showTooltip = false, unit = "" }: { data: number[]; height?: number; stroke?: string; fill?: string; showTooltip?: boolean; unit?: string }) {
  const width = 500;
  const n = data.length;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

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

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!showTooltip) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const pct = relX / rect.width;
    const idx = Math.round(pct * (n - 1));
    const clampedIdx = Math.max(0, Math.min(n - 1, idx));
    setHoveredIndex(clampedIdx);
    setTooltipPos({ x: relX, y: e.clientY - rect.top });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-28 w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <path d={area} fill={fill} />
        <path d={d} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {showTooltip && hoveredIndex !== null && (
          <>
            <line x1={x(hoveredIndex)} y1={0} x2={x(hoveredIndex)} y2={height} stroke="#6b7280" strokeWidth={1} strokeDasharray="4 2" />
            <circle cx={x(hoveredIndex)} cy={y(data[hoveredIndex])} r={4} fill={stroke} stroke="white" strokeWidth={2} />
          </>
        )}
      </svg>
      {showTooltip && hoveredIndex !== null && (
        <div
          className="absolute z-10 rounded-lg bg-gray-900 px-2 py-1 text-xs text-white shadow-lg pointer-events-none"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 30,
            transform: "translateX(-50%)"
          }}
        >
          {formatNumber(data[hoveredIndex], { decimals: 2 })} {unit}
        </div>
      )}
    </div>
  );
}

function LineChartCard({ title, unit, asOf, data }: { title: string; unit: string; asOf?: string; data: number[] }) {
  const last = data[data.length - 1];
  const first = data[0];
  const diff = last - first;
  const pct = first ? (diff / first) * 100 : 0;
  const up = diff >= 0;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {title} <span className="ml-1 text-xs text-gray-400">({getRelativeTime(new Date())})</span>
        </div>
        <div className={classNames("rounded-full px-2 py-0.5 text-xs font-semibold ring-1", up ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-red-50 text-red-700 ring-red-200")}>
          {up ? "+" : ""}
          {pct.toFixed(2)}%
        </div>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div className="text-2xl font-extrabold text-gray-900">
          {formatNumber(last, { decimals: 2 })} <span className="text-sm font-semibold text-gray-500">{unit}</span>
        </div>
      </div>
      <div className="mt-2">
        <Sparkline data={data} showTooltip={true} unit={unit} />
      </div>
    </div>
  );
}

function BuffettCard({ title, asOf, data }: { title: string; asOf?: string; data: number[] }) {
  const last = data[data.length - 1];
  const pct = last * 100;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {title} <span className="ml-1 text-xs text-gray-400">({getRelativeTime(new Date())})</span>
        </div>
        <div className={classNames("rounded-full px-2 py-0.5 text-xs font-semibold ring-1", pct >= 100 ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200")}>{pct.toFixed(0)}%</div>
      </div>
      <div className="mt-2">
        <Sparkline data={data} stroke="#0f766e" fill="rgba(16,185,129,0.15)" showTooltip={true} unit="%" />
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
// 로딩 스켈레톤 컴포넌트
function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={classNames("animate-pulse rounded-2xl bg-gray-200", className)}>
      <div className="h-full w-full" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-1/3 rounded bg-gray-200" />
        <div className="h-8 w-1/2 rounded bg-gray-200" />
        <div className="h-24 w-full rounded bg-gray-200" />
      </div>
    </div>
  );
}

// 에러 표시 컴포넌트
function ErrorCard({ message = "데이터를 불러오는 중 오류가 발생했습니다.", onRetry }: { message?: string; onRetry?: () => void }) {
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

// 빈 상태 표시 컴포넌트
function EmptyState({ message = "표시할 데이터가 없습니다.", icon = "📭" }: { message?: string; icon?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <div className="text-sm text-gray-600">{message}</div>
    </div>
  );
}

// ================== AI 분석 스코어 컴포넌트 ==================

// AI 분석 점수 게이지 (0-100점)
function AIScoreGauge({ score, sentiment, size = "md" }: { score: number; sentiment: "POS" | "NEG" | "NEU"; size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: { container: "h-16 w-16", text: "text-lg", label: "text-[9px]" },
    md: { container: "h-24 w-24", text: "text-2xl", label: "text-xs" },
    lg: { container: "h-32 w-32", text: "text-3xl", label: "text-sm" }
  };
  const s = sizeMap[size];

  const colorMap = {
    POS: { stroke: "#10b981", bg: "#d1fae5", text: "text-emerald-700" },
    NEG: { stroke: "#ef4444", bg: "#fee2e2", text: "text-red-700" },
    NEU: { stroke: "#6b7280", bg: "#f3f4f6", text: "text-gray-700" }
  };
  const color = colorMap[sentiment];

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={classNames("relative", s.container)}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        {/* 배경 원 */}
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        {/* 점수 원 */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={classNames("font-extrabold", color.text, s.text)}>{score}</div>
        <div className={classNames("text-gray-500", s.label)}>점</div>
      </div>
    </div>
  );
}

// 분석 상태 배지
function AnalysisStatusBadge({ sentiment, confidence }: { sentiment: "POS" | "NEG" | "NEU"; confidence?: number }) {
  const map = {
    POS: { label: "긍정", emoji: "📈", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
    NEG: { label: "부정", emoji: "📉", bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200" },
    NEU: { label: "중립", emoji: "➡️", bg: "bg-gray-50", text: "text-gray-700", ring: "ring-gray-200" }
  };
  const s = map[sentiment];

  return (
    <div className={classNames("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ring-1", s.bg, s.text, s.ring)}>
      <span>{s.emoji}</span>
      <span>{s.label}</span>
      {confidence !== undefined && <span className="text-xs opacity-75">({(confidence * 100).toFixed(0)}%)</span>}
    </div>
  );
}

// 오늘의 주목 종목 카드
function FeaturedStockCard({ stock, onClick }: { stock: any; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-5 shadow-md hover:shadow-xl transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {stock.logoUrl && <img src={stock.logoUrl} alt={stock.name} className="h-10 w-10 rounded-lg" />}
            <div>
              <div className="text-sm text-gray-600">{stock.symbol}</div>
              <div className="text-lg font-bold text-gray-900">{stock.name}</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-700 line-clamp-2">{stock.reason}</p>
          <div className="mt-3 flex items-center gap-2">
            <AnalysisStatusBadge sentiment={stock.sentiment} confidence={stock.confidence} />
            <span className="text-xs text-gray-500">{stock.category}</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AIScoreGauge score={stock.aiScore} sentiment={stock.sentiment} size="md" />
          <div className="text-xs text-gray-600 font-semibold">AI 분석</div>
        </div>
      </div>
    </div>
  );
}

// 공시 분석 리포트 카드
function FilingAnalysisCard({ filing, onClick, favorites, toggleFavorite }: { filing: any; onClick: () => void; favorites?: Record<string, boolean>; toggleFavorite?: (symbol: string) => void }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 flex items-center gap-2">
          {filing.previousScores && filing.previousScores.length > 0 && (
            <div className="flex items-center gap-1.5">
              {filing.previousScores.map((score: number, idx: number) => {
                const getSentiment = (s: number): "POS" | "NEG" | "NEU" => {
                  if (s >= 70) return "POS";
                  if (s < 50) return "NEG";
                  return "NEU";
                };
                return (
                  <div key={idx} className="relative" style={{ width: '32px', height: '32px' }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-[10px] font-bold text-gray-400">{score}</div>
                    </div>
                    <svg className="w-full h-full -rotate-90 opacity-40" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke={getSentiment(score) === "POS" ? "#10b981" : getSentiment(score) === "NEG" ? "#ef4444" : "#f59e0b"}
                        strokeWidth="3"
                        strokeDasharray={`${(score / 100) * 88} 88`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                );
              })}
              <div className="text-gray-400 text-xs">→</div>
            </div>
          )}
          <AIScoreGauge score={filing.aiScore} sentiment={filing.sentiment} size="sm" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium">
              {filing.formType}
            </span>
            <span className="text-xs text-gray-500">{filing.market}</span>
            <span className="text-xs text-gray-400">{filing.date}</span>
          </div>
          <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <span>{filing.symbol} · {filing.company}</span>
            {toggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(filing.symbol);
                }}
                className="flex-shrink-0 hover:scale-110 transition-transform"
              >
                <span className="text-sm">
                  {favorites && favorites[filing.symbol] ? '❤️' : '🤍'}
                </span>
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{filing.summary}</p>
          <div className="flex items-center gap-2">
            <AnalysisStatusBadge sentiment={filing.sentiment} confidence={filing.confidence} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Actions 바
function QuickActionsBar() {
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
      <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-gray-600">빠른 기능</span>
          <div className="flex gap-2">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 px-3 py-2 text-xs hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg">{action.icon}</span>
                <span className="text-[10px] text-gray-600">{action.label}</span>
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
            <p className="mt-1 text-xs text-gray-500">현재 환율: {formatNumber(rate, { decimals: 2 })} KRW/USD</p>

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

export function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than or equal to max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        end = 4;
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('...');
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        &lt;
      </button>

      {getPageNumbers().map((page, idx) => (
        typeof page === 'number' ? (
          <button
            key={idx}
            onClick={() => onPageChange(page)}
            className={classNames(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-colors",
              currentPage === page
                ? "bg-indigo-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            {page}
          </button>
        ) : (
          <span key={idx} className="px-2 text-gray-500">
            {page}
          </span>
        )
      ))}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        &gt;
      </button>
    </div>
  );
}

// Tooltip component for table headers
export function TooltipHeader({ label, tooltip, sortKey, currentSortKey, sortDirection, onSort }: {
  label: string;
  tooltip?: string;
  sortKey?: string;
  currentSortKey: string | null;
  sortDirection: "asc" | "desc";
  onSort?: (key: string) => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isSorted = currentSortKey === sortKey;

  return (
    <div className="flex items-center justify-center gap-1 relative group">
      <button
        className={classNames(
          "font-semibold uppercase tracking-wider transition-colors",
          sortKey && onSort ? "hover:text-indigo-600 cursor-pointer" : "",
          isSorted ? "text-indigo-600" : "text-gray-600"
        )}
        onClick={() => sortKey && onSort && onSort(sortKey)}
      >
        {label}
        {isSorted && (
          <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
        )}
      </button>
      {tooltip && (
        <>
          <button
            className="text-gray-400 hover:text-gray-600"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(!showTooltip)}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>
          {showTooltip && (
            <div className="absolute top-full mt-1 z-50 w-48 p-2 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-normal left-1/2 transform -translate-x-1/2">
              {tooltip}
            </div>
          )}
        </>
      )}
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
// MOCK DATA (AI 분석 점수 포함)
// ------------------------------------------------------------------

// 오늘의 주목 저평가주 (Featured)
const mockFeaturedStocks = [
  {
    id: "fs1",
    market: "US",
    symbol: "NVDA",
    name: "NVIDIA",
    category: "정보기술",
    aiScore: 92,
    sentiment: "POS" as const,
    confidence: 0.88,
    reason: "AI 칩 수요 폭발적 증가, 데이터센터 매출 3분기 연속 150% 성장. 차세대 Blackwell 아키텍처 출시 임박",
    logoUrl: "https://logo.clearbit.com/nvidia.com",
    currentPrice: 487.2,
    targetPrice: 620.0,
    upside: 27.3
  },
  {
    id: "fs2",
    market: "KR",
    symbol: "005930.KS",
    name: "삼성전자",
    category: "정보기술",
    aiScore: 85,
    sentiment: "POS" as const,
    confidence: 0.82,
    reason: "HBM3E 수율 개선 확인, AI 서버용 메모리 공급 본격화. 파운드리 3나노 양산 가시화",
    logoUrl: "https://logo.clearbit.com/samsung.com",
    currentPrice: 73500,
    targetPrice: 95000,
    upside: 29.3
  },
  {
    id: "fs3",
    market: "US",
    symbol: "AMD",
    name: "AMD",
    category: "정보기술",
    aiScore: 78,
    sentiment: "POS" as const,
    confidence: 0.75,
    reason: "MI300 AI 가속기 수주 확대, 데이터센터 CPU 점유율 꾸준한 상승",
    logoUrl: "https://logo.clearbit.com/amd.com",
    currentPrice: 142.8,
    targetPrice: 180.0,
    upside: 26.0
  }
];

// 최근 공시 분석
const mockFilings = [
  {
    id: "f1",
    market: "US",
    symbol: "MSFT",
    company: "Microsoft",
    formType: "10-Q",
    date: "2025-11-03",
    summary: "Azure 클라우드 매출 31% 성장, AI 통합 서비스 확대로 경쟁력 강화",
    direction: "POS",
    sentiment: "POS" as const,
    confidence: 0.85,
    aiScore: 88,
    category: "정보기술",
    logoUrl: "https://logo.clearbit.com/microsoft.com",
    previousScores: [82, 85, 87]
  },
  {
    id: "f2",
    market: "US",
    symbol: "TSLA",
    company: "Tesla",
    formType: "10-Q",
    date: "2025-11-02",
    summary: "차량 인도량 전분기 대비 6% 감소, 마진율 하락 우려",
    direction: "NEG",
    sentiment: "NEG" as const,
    confidence: 0.73,
    aiScore: 42,
    category: "경기소비재",
    logoUrl: "https://logo.clearbit.com/tesla.com",
    previousScores: [68, 52, 48]
  },
  {
    id: "f3",
    market: "KR",
    symbol: "005930.KS",
    company: "삼성전자",
    formType: "분기보고서",
    date: "2025-11-01",
    summary: "메모리 부문 ASP 상승, HBM 매출 비중 확대",
    direction: "POS",
    sentiment: "POS" as const,
    confidence: 0.79,
    aiScore: 82,
    category: "정보기술",
    logoUrl: "https://logo.clearbit.com/samsung.com",
    previousScores: [74, 78, 80]
  },
  {
    id: "f4",
    market: "KR",
    symbol: "068270.KS",
    company: "셀트리온",
    formType: "분기보고서",
    date: "2025-10-31",
    summary: "바이오시밀러 유럽 매출 안정적, 신약 파이프라인 진행 중",
    direction: "NEU",
    sentiment: "NEU" as const,
    confidence: 0.65,
    aiScore: 68,
    category: "헬스케어",
    logoUrl: "https://logo.clearbit.com/celltrion.com",
    previousScores: [65, 67, 69]
  },
  {
    id: "f5",
    market: "US",
    symbol: "META",
    company: "Meta",
    formType: "10-Q",
    date: "2025-10-30",
    summary: "광고 매출 회복세, Reality Labs 투자 지속으로 적자 확대",
    direction: "NEU",
    sentiment: "NEU" as const,
    confidence: 0.58,
    aiScore: 64,
    category: "커뮤니케이션 서비스",
    logoUrl: "https://logo.clearbit.com/meta.com",
    previousScores: [58, 61, 63]
  }
];

// 저평가 우량주 랭킹
const mockUndervalued = [
  {
    market: "US", symbol: "NVDA", name: "NVIDIA", category: "정보기술", industry: "반도체",
    rank: 1, aiScore: 92, sentiment: "POS" as const, introducedAt: "2025-08-12",
    perfSinceIntro: 0.124, perf100d: 0.153, logoUrl: "https://logo.clearbit.com/nvidia.com",
    ROE: 28.5, PER: 45.2, PEG: 0.82, PBR: 12.8, PSR: 18.3,
    RevYoY: 34.2, EPS_Growth_3Y: 55.3, OpMarginTTM: 32.1, FCF_Yield: 2.8
  },
  {
    market: "US", symbol: "MSFT", name: "Microsoft", category: "정보기술", industry: "소프트웨어",
    rank: 2, aiScore: 88, sentiment: "POS" as const, introducedAt: "2025-08-15",
    perfSinceIntro: 0.104, perf100d: 0.132, logoUrl: "https://logo.clearbit.com/microsoft.com",
    ROE: 42.3, PER: 32.5, PEG: 0.95, PBR: 10.5, PSR: 11.2,
    RevYoY: 16.8, EPS_Growth_3Y: 34.2, OpMarginTTM: 42.5, FCF_Yield: 3.5
  },
  {
    market: "US", symbol: "AMD", name: "AMD", category: "정보기술", industry: "반도체",
    rank: 3, aiScore: 78, sentiment: "POS" as const, introducedAt: "2025-09-01",
    perfSinceIntro: 0.067, perf100d: 0.089, logoUrl: "https://logo.clearbit.com/amd.com",
    ROE: 18.2, PER: 38.7, PEG: 1.12, PBR: 5.3, PSR: 7.8,
    RevYoY: 18.5, EPS_Growth_3Y: 34.5, OpMarginTTM: 24.3, FCF_Yield: 2.1
  },
  {
    market: "KR", symbol: "005930.KS", name: "삼성전자", category: "정보기술", industry: "전자기기",
    rank: 1, aiScore: 85, sentiment: "POS" as const, introducedAt: "2025-09-02",
    perfSinceIntro: 0.089, perf100d: 0.112, logoUrl: "https://logo.clearbit.com/samsung.com",
    ROE: 12.8, PER: 18.5, PEG: 0.88, PBR: 1.8, PSR: 1.2,
    RevYoY: 12.3, EPS_Growth_3Y: 21.0, OpMarginTTM: 14.5, FCF_Yield: 4.2
  },
  {
    market: "KR", symbol: "000660.KS", name: "SK하이닉스", category: "정보기술", industry: "반도체",
    rank: 2, aiScore: 81, sentiment: "POS" as const, introducedAt: "2025-08-25",
    perfSinceIntro: 0.095, perf100d: 0.128, logoUrl: "https://logo.clearbit.com/skhynix.com",
    ROE: 15.3, PER: 22.1, PEG: 0.75, PBR: 2.3, PSR: 2.1,
    RevYoY: 28.7, EPS_Growth_3Y: 29.4, OpMarginTTM: 18.9, FCF_Yield: 3.8
  },
  {
    market: "KR", symbol: "068270.KS", name: "셀트리온", category: "헬스케어", industry: "바이오의약품",
    rank: 3, aiScore: 72, sentiment: "NEU" as const, introducedAt: "2025-08-30",
    perfSinceIntro: 0.031, perf100d: 0.064, logoUrl: "https://logo.clearbit.com/celltrion.com",
    ROE: 9.5, PER: 25.3, PEG: 1.35, PBR: 2.8, PSR: 3.5,
    RevYoY: 8.2, EPS_Growth_3Y: 18.7, OpMarginTTM: 21.3, FCF_Yield: 2.5
  },
];

// 종목 상세 정보 (포괄적인 재무/기술적 지표 포함)
const mockStockDetails: Record<string, any> = {
  "NVDA": {
    Ticker: "NVDA",
    Name: "NVIDIA",
    Sector: "정보기술",
    Industry: "반도체",
    Price: 487.20,
    MktCap: 1200.5,
    DollarVol: 3500.2,
    FairValue: 520.00,
    Discount: 6.3,
    PE: 45.2,
    PEG: 0.82,
    PB: 12.8,
    PS: 18.3,
    EV_EBITDA: 38.5,
    ROE: 28.5,
    ROA: 18.3,
    OpMarginTTM: 32.1,
    OperatingMargins: 31.8,
    RevYoY: 34.2,
    EPS_Growth_3Y: 55.3,
    Revenue_Growth_3Y: 42.1,
    EBITDA_Growth_3Y: 48.7,
    FCF_Yield: 2.8,
    DivYield: 0.04,
    PayoutRatio: 0.05,
    Beta: 1.85,
    ShortPercent: 1.2,
    InsiderOwnership: 4.3,
    InstitutionOwnership: 68.5,
    RVOL: 1.15,
    RSI_14: 67.3,
    ATR_PCT: 3.2,
    Volatility_21D: 2.8,
    RET5: 2.1,
    RET20: 8.5,
    RET63: 15.3,
    SMA20: 478.50,
    SMA50: 465.30,
    SMA200: 420.80,
    MACD: 5.2,
    MACD_Signal: 3.8,
    MACD_Histogram: 1.4,
    BB_Position: 0.75,
    High_52W_Ratio: 0.95,
    Low_52W_Ratio: 1.88,
    Momentum_12M: 124.5,
    GrowthScore: 95,
    QualityScore: 88,
    ValueScore: 65,
    MomentumScore: 82,
    TotalScore: 92
  },
  "MSFT": {
    Ticker: "MSFT",
    Name: "Microsoft",
    Sector: "정보기술",
    Industry: "소프트웨어",
    Price: 378.85,
    MktCap: 2850.3,
    DollarVol: 2200.5,
    FairValue: 395.00,
    Discount: 4.1,
    PE: 32.5,
    PEG: 0.95,
    PB: 10.5,
    PS: 11.2,
    EV_EBITDA: 25.8,
    ROE: 42.3,
    ROA: 22.5,
    OpMarginTTM: 42.5,
    OperatingMargins: 42.1,
    RevYoY: 16.8,
    EPS_Growth_3Y: 34.2,
    Revenue_Growth_3Y: 18.5,
    EBITDA_Growth_3Y: 22.3,
    FCF_Yield: 3.5,
    DivYield: 0.82,
    PayoutRatio: 0.28,
    Beta: 0.92,
    ShortPercent: 0.8,
    InsiderOwnership: 0.1,
    InstitutionOwnership: 73.2,
    RVOL: 0.95,
    RSI_14: 58.2,
    ATR_PCT: 2.1,
    Volatility_21D: 1.9,
    RET5: 1.2,
    RET20: 5.8,
    RET63: 13.2,
    SMA20: 375.20,
    SMA50: 368.50,
    SMA200: 355.80,
    MACD: 3.5,
    MACD_Signal: 2.8,
    MACD_Histogram: 0.7,
    BB_Position: 0.62,
    High_52W_Ratio: 0.98,
    Low_52W_Ratio: 1.42,
    Momentum_12M: 32.5,
    GrowthScore: 82,
    QualityScore: 95,
    ValueScore: 72,
    MomentumScore: 75,
    TotalScore: 88
  },
  "005930.KS": {
    Ticker: "005930.KS",
    Name: "삼성전자",
    Sector: "정보기술",
    Industry: "전자기기",
    Price: 72500,
    MktCap: 432.5,
    DollarVol: 850.3,
    FairValue: 78000,
    Discount: 7.1,
    PE: 18.5,
    PEG: 0.88,
    PB: 1.8,
    PS: 1.2,
    EV_EBITDA: 12.3,
    ROE: 12.8,
    ROA: 8.5,
    OpMarginTTM: 14.5,
    OperatingMargins: 14.2,
    RevYoY: 12.3,
    EPS_Growth_3Y: 21.0,
    Revenue_Growth_3Y: 8.5,
    EBITDA_Growth_3Y: 15.2,
    FCF_Yield: 4.2,
    DivYield: 2.3,
    PayoutRatio: 0.35,
    Beta: 1.15,
    ShortPercent: 1.5,
    InsiderOwnership: 21.2,
    InstitutionOwnership: 45.8,
    RVOL: 1.05,
    RSI_14: 52.8,
    ATR_PCT: 2.5,
    Volatility_21D: 2.2,
    RET5: 1.5,
    RET20: 6.2,
    RET63: 11.2,
    SMA20: 71200,
    SMA50: 69800,
    SMA200: 67500,
    MACD: 850,
    MACD_Signal: 620,
    MACD_Histogram: 230,
    BB_Position: 0.68,
    High_52W_Ratio: 0.91,
    Low_52W_Ratio: 1.35,
    Momentum_12M: 18.5,
    GrowthScore: 75,
    QualityScore: 82,
    ValueScore: 88,
    MomentumScore: 68,
    TotalScore: 85
  }
};

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
// 로그인/회원가입 모달
// ------------------------------------------------------------------
function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  if (!open) return null;

  const handleLogin = () => {
    // TODO: Implement login logic
    console.log('Login with ID:', id);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-[1001] w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-gray-200 m-3">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">로그인</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">아이디</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="아이디를 입력하세요"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>
          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            로그인
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">또는</span>
          </div>
        </div>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
            Google로 로그인
          </button>

          <button className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-yellow-400 bg-yellow-300 px-4 py-3 text-sm font-semibold hover:bg-yellow-400 transition-colors">
            <span className="text-lg">💬</span>
            카카오로 로그인
          </button>

          <button className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-green-500 bg-green-500 px-4 py-3 text-sm font-semibold text-white hover:bg-green-600 transition-colors">
            <span className="text-lg font-bold">N</span>
            네이버로 로그인
          </button>
        </div>

        <div className="mt-6 text-center">
          <button onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function SignupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timer, setTimer] = useState(0);
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
      setId('');
      setPassword('');
      setEmail('');
      setVerificationCode('');
      setIsCodeSent(false);
      setIsVerified(false);
      setTimer(0);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [open]);

  if (!open) return null;

  const handleSendCode = () => {
    // TODO: Implement send verification code logic
    console.log('Sending verification code to:', email);
    setIsCodeSent(true);
    setTimer(300); // 5 minutes = 300 seconds
  };

  const handleVerify = () => {
    // TODO: Implement verification logic
    console.log('Verifying code:', verificationCode);
    setIsVerified(true);
    setTimer(0);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleSignup = () => {
    // TODO: Implement signup logic
    console.log('Signup with ID:', id);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-[1001] w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-gray-200 m-3 my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">회원가입</h2>
        <p className="text-sm text-gray-600 mb-6">AI 기업 분석을 무료로 시작하세요</p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">아이디</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="아이디를 입력하세요"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                disabled={isCodeSent}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors disabled:bg-gray-100"
              />
              <button
                onClick={handleSendCode}
                disabled={!email || isCodeSent}
                className="px-4 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
              >
                인증번호 발송
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              인증번호
              {timer > 0 && <span className="ml-2 text-red-600 font-bold">{formatTimer(timer)}</span>}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="인증번호를 입력하세요"
                disabled={!isCodeSent || isVerified}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors disabled:bg-gray-100"
              />
              <button
                onClick={handleVerify}
                disabled={!isCodeSent || !verificationCode || isVerified}
                className="px-4 py-3 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isVerified ? '인증완료' : '인증'}
              </button>
            </div>
          </div>

          <button
            onClick={handleSignup}
            disabled={!isVerified}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            회원가입
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">또는</span>
          </div>
        </div>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
            Google로 시작하기
          </button>

          <button className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-yellow-400 bg-yellow-300 px-4 py-3 text-sm font-semibold hover:bg-yellow-400 transition-colors">
            <span className="text-lg">💬</span>
            카카오로 시작하기
          </button>

          <button className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-green-500 bg-green-500 px-4 py-3 text-sm font-semibold text-white hover:bg-green-600 transition-colors">
            <span className="text-lg font-bold">N</span>
            네이버로 시작하기
          </button>
        </div>

        <div className="mt-6 text-center">
          <button onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 헤더 + 하단 네비
// ------------------------------------------------------------------
function Header() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-lg shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div>
                <div className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  DDalKKak
                </div>
                <div className="text-[9px] text-gray-500 font-medium">AI 기업 분석 플랫폼</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLoginOpen(true)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                로그인
              </button>
              <button
                onClick={() => setSignupOpen(true)}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 text-sm font-semibold text-white hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                회원가입
              </button>
            </div>
          </div>
        </div>
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} />
    </>
  );
}

function BottomNav({ active = "home", onChange }: { active?: TabKey; onChange: (k: TabKey) => void }) {
  const items = [
    { key: "home" as TabKey, icon: "🏠", label: "홈" },
    { key: "undervalued" as TabKey, icon: "💎", label: "저평가 발굴" },
    { key: "filings" as TabKey, icon: "📊", label: "공시 분석" },
    { key: "watchlist" as TabKey, icon: "⭐", label: "관심 종목" }
  ];

  const itemCls = (key: TabKey) => classNames(
    "flex flex-col items-center justify-center w-full h-16 py-2 text-xs font-semibold touch-manipulation transition-colors",
    key === active ? "text-indigo-700 bg-indigo-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
  );

  const click = (key: TabKey) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onChange && onChange(key);
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-lg shadow-lg">
      <div className="mx-auto max-w-7xl">
        <ul className="grid grid-cols-4">
          {items.map((item) => (
            <li key={item.key}>
              <button
                className={itemCls(item.key)}
                onClick={click(item.key)}
                aria-current={active === item.key ? "page" : undefined}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-[10px]">{item.label}</span>
              </button>
            </li>
          ))}
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
const TAB_KEYS = ["home", "undervalued", "filings", "watchlist"] as const;
type TabKey = (typeof TAB_KEYS)[number];

export default function DemoHome() {
  const fearGreedUS = usFearGreedSeries[usFearGreedSeries.length - 1];
  const fearGreedKR = krFearGreedSeries[krFearGreedSeries.length - 1];
  const asOfUS = formatAsOf(new Date());
  const asOfKR = asOfUS;
  const asOf = asOfUS;

  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabKey>("home");

  // 홈 화면 필터
  const [featuredMarket, setFeaturedMarket] = useState<"US" | "KR">("US");
  const [filingsMarket, setFilingsMarket] = useState<"US" | "KR">("US");

  // 저평가 발굴 페이지 필터
  const [undervaluedSearchQuery, setUndervaluedSearchQuery] = useState("");
  const [undervaluedMarket, setUndervaluedMarket] = useState<"전체" | "US" | "KR">("전체");
  const [undervaluedCategory, setUndervaluedCategory] = useState("전체");
  const [undervaluedPage, setUndervaluedPage] = useState(1);
  const [undervaluedSortBy, setUndervaluedSortBy] = useState<string | null>(null);
  const [undervaluedSortDirection, setUndervaluedSortDirection] = useState<"asc" | "desc">("desc");

  // 공시 분석 페이지 필터
  const [filingsSearchQuery, setFilingsSearchQuery] = useState("");
  const [filingsPage, setFilingsPage] = useState(1);
  const [filingsSortBy, setFilingsSortBy] = useState<string | null>(null);
  const [filingsSortDirection, setFilingsSortDirection] = useState<"asc" | "desc">("desc");
  const [filingsSentimentFilter, setFilingsSentimentFilter] = useState<"ALL" | "POS" | "NEG" | "NEU">("ALL");

  // ✅ 탭별 스크롤 위치 저장용
  const scrollPositions = useRef<Record<TabKey, number>>({
    home: 0,
    undervalued: 0,
    filings: 0,
    watchlist: 0,
  });

  // ✅ 탭별 개별 스크롤 컨테이너 ref
  const homeRef = useRef<HTMLDivElement>(null);
  const undervaluedRef = useRef<HTMLDivElement>(null);
  const filingsRef = useRef<HTMLDivElement>(null);
  const watchlistRef = useRef<HTMLDivElement>(null);

  // 2) ⬇️ 여기 타입을 RefObject<HTMLDivElement> → MutableRefObject<HTMLDivElement | null> 로 수정
  const refMap: Record<TabKey, React.MutableRefObject<HTMLDivElement | null>> = {
    home: homeRef,
    undervalued: undervaluedRef,
    filings: filingsRef,
    watchlist: watchlistRef,
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
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    // Load favorites from cookie on mount
    const cookieValue = getCookie('ddal-kkak-favorites');
    if (cookieValue) {
      try {
        return JSON.parse(decodeURIComponent(cookieValue));
      } catch (e) {
        return {};
      }
    }
    return {};
  });
  const favoriteDebounceRef = useRef<Record<string, boolean>>({});

  const toggleFavorite = (symbol: string) => {
    // Prevent rapid clicks (1 second debounce)
    if (favoriteDebounceRef.current[symbol]) return;

    favoriteDebounceRef.current[symbol] = true;
    const newFavorites = { ...favorites, [symbol]: !favorites[symbol] };
    setFavorites(newFavorites);

    // Save to cookie
    setCookie('ddal-kkak-favorites', encodeURIComponent(JSON.stringify(newFavorites)));

    setTimeout(() => {
      favoriteDebounceRef.current[symbol] = false;
    }, 1000);
  };

  // 정렬 핸들러
  const handleUndervaluedSort = (key: string) => {
    if (undervaluedSortBy === key) {
      setUndervaluedSortDirection(undervaluedSortDirection === "asc" ? "desc" : "asc");
    } else {
      setUndervaluedSortBy(key);
      setUndervaluedSortDirection("desc");
    }
    setUndervaluedPage(1); // Reset to first page on sort
  };

  const handleFilingsSort = (key: string) => {
    if (filingsSortBy === key) {
      setFilingsSortDirection(filingsSortDirection === "asc" ? "desc" : "asc");
    } else {
      setFilingsSortBy(key);
      setFilingsSortDirection("desc");
    }
    setFilingsPage(1); // Reset to first page on sort
  };

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
      <Header />

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
          <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 pb-24">
            {/* Hero Section - AI 분석 플랫폼 소개 */}
            <div className="rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-xl">
              <div className="mb-3">
                <h1 className="text-2xl font-extrabold">AI 기업 분석 플랫폼</h1>
                <p className="text-sm text-indigo-100 mt-1">저평가 우량주 발굴 · 공시 분석 · 투자 기회 탐색</p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <button
                  onClick={() => switchTab("home")}
                  className="rounded-xl bg-white/20 backdrop-blur p-3 hover:bg-white/30 transition-all cursor-pointer"
                >
                  <div className="text-2xl font-bold">{mockFeaturedStocks.length}</div>
                  <div className="text-xs text-indigo-100">오늘의 주목 종목</div>
                </button>
                <button
                  onClick={() => switchTab("filings")}
                  className="rounded-xl bg-white/20 backdrop-blur p-3 hover:bg-white/30 transition-all cursor-pointer"
                >
                  <div className="text-2xl font-bold">{mockFilings.length}</div>
                  <div className="text-xs text-indigo-100">최근 공시 분석</div>
                </button>
                <button
                  onClick={() => switchTab("undervalued")}
                  className="rounded-xl bg-white/20 backdrop-blur p-3 hover:bg-white/30 transition-all cursor-pointer"
                >
                  <div className="text-2xl font-bold">{mockUndervalued.length}</div>
                  <div className="text-xs text-indigo-100">저평가 우량주</div>
                </button>
              </div>
            </div>

            {/* 오늘의 주목 저평가주 */}
            <section>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                    💎 오늘의 주목 저평가주
                  </h2>
                  <button
                    onClick={() => switchTab("undervalued")}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    전체 보기 →
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">AI가 선정한 투자 가치가 높은 종목</p>
                  <div className="rounded-full border border-gray-200 bg-gray-50 p-1 flex gap-1">
                    <button
                      onClick={() => setFeaturedMarket("US")}
                      className={classNames("rounded-full px-3 py-1 text-xs font-semibold transition-all", featuredMarket === "US" ? "bg-indigo-600 text-white shadow" : "text-gray-700 hover:bg-gray-100")}
                    >
                      🇺🇸 미국
                    </button>
                    <button
                      onClick={() => setFeaturedMarket("KR")}
                      className={classNames("rounded-full px-3 py-1 text-xs font-semibold transition-all", featuredMarket === "KR" ? "bg-indigo-600 text-white shadow" : "text-gray-700 hover:bg-gray-100")}
                    >
                      🇰🇷 한국
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {mockFeaturedStocks.filter(s => s.market === featuredMarket).map((stock) => (
                  <FeaturedStockCard key={stock.id} stock={stock} onClick={() => {}} />
                ))}
              </div>
            </section>

            {/* 최근 공시 분석 */}
            <section>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                    📊 최근 공시 분석
                  </h2>
                  <button
                    onClick={() => switchTab("filings")}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    전체 보기 →
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">AI가 분석한 최신 기업 공시 및 보고서</p>
                  <div className="rounded-full border border-gray-200 bg-gray-50 p-1 flex gap-1">
                    <button
                      onClick={() => setFilingsMarket("US")}
                      className={classNames("rounded-full px-3 py-1 text-xs font-semibold transition-all", filingsMarket === "US" ? "bg-indigo-600 text-white shadow" : "text-gray-700 hover:bg-gray-100")}
                    >
                      🇺🇸 미국
                    </button>
                    <button
                      onClick={() => setFilingsMarket("KR")}
                      className={classNames("rounded-full px-3 py-1 text-xs font-semibold transition-all", filingsMarket === "KR" ? "bg-indigo-600 text-white shadow" : "text-gray-700 hover:bg-gray-100")}
                    >
                      🇰🇷 한국
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {mockFilings.filter(f => f.market === filingsMarket).slice(0, 4).map((filing) => (
                  <FilingAnalysisCard key={filing.id} filing={filing} onClick={() => {}} favorites={favorites} toggleFavorite={toggleFavorite} />
                ))}
              </div>
            </section>

            {/* 시장 현황 요약 */}
            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                📈 시장 현황
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <FearGreedCard title="미국 공포·탐욕 지수" index={fearGreedUS} asOf={asOfUS} variant="US" series={usFearGreedSeries} />
                <FearGreedCard title="한국 공포·탐욕 지수" index={fearGreedKR} asOf={asOfKR} variant="KR" series={krFearGreedSeries} />
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <BuffettCard title="미국 버핏지수" asOf={asOf} data={usBuffettSeries} />
                <BuffettCard title="한국 버핏지수" asOf={asOf} data={krBuffettSeries} />
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <LineChartCard title="원·달러 환율" unit="KRW" asOf={asOf} data={mockUSDKRW} />
                <LineChartCard title="금 시세" unit="USD/oz" asOf={asOf} data={mockGoldUSD} />
              </div>
            </section>

            {/* 면책 조항 */}
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-600">
                ⚠️ 본 서비스는 AI 기반 분석 정보를 제공하며, 투자 권유나 자문이 아닙니다.<br />
                모든 투자 결정은 투자자 본인의 판단과 책임 하에 이루어져야 합니다.
              </p>
            </div>
          </main>
        </div>

        {/* UNDERVALUED - 저평가 발굴 */}
        <div
          ref={undervaluedRef}
          className={classNames(
            "absolute inset-0 overflow-y-auto overscroll-contain",
            activeTab === "undervalued" ? "block" : "hidden"
          )}
        >
          <main className="mx-auto max-w-7xl px-4 py-6 pb-24">
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                💎 저평가 우량주 발굴
              </h1>
              <p className="mt-2 text-sm text-gray-600">AI가 선별한 투자 가치가 높은 기업들을 확인하세요</p>
            </div>

            {/* 검색 및 필터 */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 space-y-4">
              {/* 검색창 */}
              <input
                type="text"
                value={undervaluedSearchQuery}
                onChange={(e) => setUndervaluedSearchQuery(e.target.value)}
                placeholder="종목명 또는 티커 검색 (예: 삼성전자, AAPL)"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />

              {/* 시장 선택 */}
              <div>
                <div className="text-xs text-gray-600 mb-2 font-semibold">시장</div>
                <div className="flex gap-2">
                  {(["전체", "US", "KR"] as const).map((market) => (
                    <button
                      key={market}
                      onClick={() => setUndervaluedMarket(market)}
                      className={classNames(
                        "rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                        undervaluedMarket === market
                          ? "bg-indigo-600 text-white shadow"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      {market === "전체" ? "전체" : market === "US" ? "🇺🇸 미국" : "🇰🇷 한국"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 카테고리 선택 */}
              <div>
                <div className="text-xs text-gray-600 mb-2 font-semibold">GICS 섹터</div>
                <CategoryChips
                  value={undervaluedCategory}
                  onChange={setUndervaluedCategory}
                  categories={[...CATEGORIES]}
                />
              </div>
            </div>

            {/* 게시판 형식 테이블 */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs">
                        종목
                      </th>
                      <th className="px-4 py-3 text-left text-xs">
                        섹터
                      </th>
                      <th className="px-4 py-3 text-left text-xs">
                        산업군
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="AI 점수"
                          sortKey="aiScore"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="ROE"
                          tooltip="자기자본이익률 - 높을수록 우수"
                          sortKey="ROE"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="PER"
                          tooltip="주가수익비율 - 낮을수록 저평가"
                          sortKey="PER"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="PEG"
                          tooltip="PEG 비율 (PER/성장률) - 1 이하 매력적"
                          sortKey="PEG"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="PBR"
                          tooltip="주가순자산비율 - 낮을수록 저평가"
                          sortKey="PBR"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="PSR"
                          tooltip="주가매출비율 - 낮을수록 저평가"
                          sortKey="PSR"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="RevYoY"
                          tooltip="매출 YoY 성장률"
                          sortKey="RevYoY"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="EPS 3Y"
                          tooltip="3년 EPS 성장률"
                          sortKey="EPS_Growth_3Y"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="영업이익률"
                          tooltip="영업이익률 - 높을수록 우수"
                          sortKey="OpMarginTTM"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="FCF"
                          tooltip="FCF 수익률 (현금 창출 능력)"
                          sortKey="FCF_Yield"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                      <th className="px-4 py-3 text-center text-xs">
                        <TooltipHeader
                          label="100일 수익률"
                          sortKey="perf100d"
                          currentSortKey={undervaluedSortBy}
                          sortDirection={undervaluedSortDirection}
                          onSort={handleUndervaluedSort}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {(() => {
                      let filteredStocks = mockUndervalued.filter((stock) => {
                        const matchMarket = undervaluedMarket === "전체" || stock.market === undervaluedMarket;
                        const matchCategory = undervaluedCategory === "전체" || stock.category === undervaluedCategory;
                        const matchQuery =
                          !undervaluedSearchQuery ||
                          stock.name.toLowerCase().includes(undervaluedSearchQuery.toLowerCase()) ||
                          stock.symbol.toLowerCase().includes(undervaluedSearchQuery.toLowerCase());
                        return matchMarket && matchCategory && matchQuery;
                      });

                      // Apply sorting
                      if (undervaluedSortBy) {
                        filteredStocks = [...filteredStocks].sort((a: any, b: any) => {
                          const aVal = a[undervaluedSortBy];
                          const bVal = b[undervaluedSortBy];
                          if (aVal === undefined || bVal === undefined) return 0;
                          const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                          return undervaluedSortDirection === "asc" ? comparison : -comparison;
                        });
                      }

                      const itemsPerPage = 10;
                      const startIndex = (undervaluedPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedStocks = filteredStocks.slice(startIndex, endIndex);

                      return paginatedStocks.map((stock) => (
                        <tr key={stock.symbol} className="hover:bg-gray-50 cursor-pointer transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {stock.logoUrl && (
                                <div className="relative">
                                  <img src={stock.logoUrl} alt={stock.name} className="h-10 w-10 rounded-lg" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(stock.symbol);
                                    }}
                                    className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform border border-gray-200"
                                  >
                                    <span className="text-xs">
                                      {favorites[stock.symbol] ? '❤️' : '🤍'}
                                    </span>
                                  </button>
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-bold text-gray-900">{stock.name}</div>
                                <div className="text-xs text-gray-500">
                                  {stock.symbol} · {stock.market === "US" ? "🇺🇸 미국" : "🇰🇷 한국"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                              {stock.category}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-left">
                            <span className="text-xs text-gray-700">{stock.industry}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center">
                              <AIScoreGauge score={stock.aiScore} sentiment={stock.sentiment} size="sm" />
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="text-xs text-gray-900 font-medium">{stock.ROE}%</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="text-xs text-gray-900 font-medium">{stock.PER}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="text-xs text-gray-900 font-medium">{stock.PEG}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="text-xs text-gray-900 font-medium">{stock.PBR}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="text-xs text-gray-900 font-medium">{stock.PSR}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="text-xs text-emerald-600 font-medium">{stock.RevYoY}%</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="text-xs text-emerald-600 font-medium">{stock.EPS_Growth_3Y}%</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="text-xs text-gray-900 font-medium">{stock.OpMarginTTM}%</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="text-xs text-gray-900 font-medium">{stock.FCF_Yield}%</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span
                              className={classNames(
                                "text-xs font-bold",
                                stock.perf100d >= 0 ? "text-emerald-600" : "text-red-600"
                              )}
                            >
                              {stock.perf100d >= 0 ? "+" : ""}
                              {(stock.perf100d * 100).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {(() => {
              const filteredStocks = mockUndervalued.filter((stock) => {
                const matchMarket = undervaluedMarket === "전체" || stock.market === undervaluedMarket;
                const matchCategory = undervaluedCategory === "전체" || stock.category === undervaluedCategory;
                const matchQuery =
                  !undervaluedSearchQuery ||
                  stock.name.toLowerCase().includes(undervaluedSearchQuery.toLowerCase()) ||
                  stock.symbol.toLowerCase().includes(undervaluedSearchQuery.toLowerCase());
                return matchMarket && matchCategory && matchQuery;
              });
              const totalPages = Math.ceil(filteredStocks.length / 10);

              if (totalPages <= 1) return null;

              return (
                <Pagination
                  currentPage={undervaluedPage}
                  totalPages={totalPages}
                  onPageChange={setUndervaluedPage}
                />
              );
            })()}
          </main>
        </div>

        {/* FILINGS - 공시 분석 */}
        <div
          ref={filingsRef}
          className={classNames(
            "absolute inset-0 overflow-y-auto overscroll-contain",
            activeTab === "filings" ? "block" : "hidden"
          )}
        >
          <main className="mx-auto max-w-7xl px-4 py-6 pb-24">
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                <span>📊</span>
                공시 분석 리포트
              </h1>
              <p className="mt-2 text-sm text-gray-600">AI가 분석한 최신 기업 공시 및 보고서를 확인하세요</p>
            </div>

            {/* 검색 및 필터 */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 space-y-4">
              {/* 검색창 */}
              <input
                type="text"
                value={filingsSearchQuery}
                onChange={(e) => setFilingsSearchQuery(e.target.value)}
                placeholder="종목명 또는 티커 검색 (예: 삼성전자, AAPL)"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />

              {/* 감정 필터 */}
              <div>
                <div className="text-xs text-gray-600 mb-2 font-semibold">분석 결과</div>
                <div className="flex gap-2">
                  {(["ALL", "POS", "NEG", "NEU"] as const).map((sentiment) => (
                    <button
                      key={sentiment}
                      onClick={() => setFilingsSentimentFilter(sentiment)}
                      className={classNames(
                        "rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                        filingsSentimentFilter === sentiment
                          ? "bg-indigo-600 text-white shadow"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      {sentiment === "ALL" ? "전체" : sentiment === "POS" ? "긍정" : sentiment === "NEG" ? "부정" : "중립"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 정렬 옵션 */}
              <div>
                <div className="text-xs text-gray-600 mb-2 font-semibold">정렬</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFilingsSort("company")}
                    className={classNames(
                      "rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                      filingsSortBy === "company"
                        ? "bg-indigo-600 text-white shadow"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    종목명 {filingsSortBy === "company" && (filingsSortDirection === "asc" ? "↑" : "↓")}
                  </button>
                  <button
                    onClick={() => handleFilingsSort("aiScore")}
                    className={classNames(
                      "rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                      filingsSortBy === "aiScore"
                        ? "bg-indigo-600 text-white shadow"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    AI 점수 {filingsSortBy === "aiScore" && (filingsSortDirection === "asc" ? "↑" : "↓")}
                  </button>
                </div>
              </div>

              {/* 카테고리 선택 */}
              <div>
                <div className="text-xs text-gray-600 mb-2 font-semibold">GICS 섹터</div>
                <CategoryChips value={filingCatUS} onChange={setFilingCatUS} categories={[...CATEGORIES]} />
              </div>
            </div>

            {/* 공시 목록 */}
            <div className="space-y-3">
              {(() => {
                let filteredFilings = mockFilings.filter((filing) => {
                  const matchCategory = filingCatUS === "전체" || filing.category === filingCatUS;
                  const matchQuery =
                    !filingsSearchQuery ||
                    filing.company.toLowerCase().includes(filingsSearchQuery.toLowerCase()) ||
                    filing.symbol.toLowerCase().includes(filingsSearchQuery.toLowerCase());
                  const matchSentiment = filingsSentimentFilter === "ALL" || filing.sentiment === filingsSentimentFilter;
                  return matchCategory && matchQuery && matchSentiment;
                });

                // Apply sorting
                if (filingsSortBy) {
                  filteredFilings = [...filteredFilings].sort((a: any, b: any) => {
                    let aVal, bVal;
                    if (filingsSortBy === "company") {
                      aVal = a.company.toLowerCase();
                      bVal = b.company.toLowerCase();
                    } else {
                      aVal = a[filingsSortBy];
                      bVal = b[filingsSortBy];
                    }
                    if (aVal === undefined || bVal === undefined) return 0;
                    const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                    return filingsSortDirection === "asc" ? comparison : -comparison;
                  });
                }

                const itemsPerPage = 10;
                const startIndex = (filingsPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedFilings = filteredFilings.slice(startIndex, endIndex);

                return paginatedFilings.map((filing) => (
                  <FilingAnalysisCard key={filing.id} filing={filing} onClick={() => {}} favorites={favorites} toggleFavorite={toggleFavorite} />
                ));
              })()}
            </div>

            {/* Pagination */}
            {(() => {
              const filteredFilings = mockFilings.filter((filing) => {
                const matchCategory = filingCatUS === "전체" || filing.category === filingCatUS;
                const matchQuery =
                  !filingsSearchQuery ||
                  filing.company.toLowerCase().includes(filingsSearchQuery.toLowerCase()) ||
                  filing.symbol.toLowerCase().includes(filingsSearchQuery.toLowerCase());
                const matchSentiment = filingsSentimentFilter === "ALL" || filing.sentiment === filingsSentimentFilter;
                return matchCategory && matchQuery && matchSentiment;
              });
              const totalPages = Math.ceil(filteredFilings.length / 10);

              if (totalPages <= 1) return null;

              return (
                <Pagination
                  currentPage={filingsPage}
                  totalPages={totalPages}
                  onPageChange={setFilingsPage}
                />
              );
            })()}
          </main>
        </div>

        {/* WATCHLIST - 관심 종목 */}
        <div
          ref={watchlistRef}
          className={classNames(
            "absolute inset-0 overflow-y-auto overscroll-contain",
            activeTab === "watchlist" ? "block" : "hidden"
          )}
        >
          <main className="mx-auto max-w-7xl px-4 py-6 pb-24">
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                <span>⭐</span>
                관심 종목
              </h1>
              <p className="mt-2 text-sm text-gray-600">즐겨찾기한 종목의 AI 분석을 한눈에 확인하세요</p>
            </div>

            {(() => {
              // Get favorited symbols
              const favoritedSymbols = Object.keys(favorites).filter(symbol => favorites[symbol]);

              if (favoritedSymbols.length === 0) {
                // Show empty state
                return (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">⭐</div>
                    <p className="text-gray-600 mb-2">아직 관심 종목이 없습니다</p>
                    <p className="text-sm text-gray-500 mb-4">종목 카드의 하트 아이콘을 눌러 관심 종목으로 등록하세요</p>
                    <button
                      onClick={() => switchTab("undervalued")}
                      className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      저평가주 둘러보기
                    </button>
                  </div>
                );
              }

              // Get favorited stocks from mockUndervalued
              const favoritedStocks = mockUndervalued.filter(stock => favorites[stock.symbol]);

              return (
                <div>
                  <div className="mb-4 text-sm text-gray-600">
                    총 {favoritedSymbols.length}개의 관심 종목
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              종목
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              섹터
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              AI 점수
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              분석
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              100일 수익률
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {favoritedStocks.map((stock) => (
                            <tr key={stock.symbol} className="hover:bg-gray-50 cursor-pointer transition-colors">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  {stock.logoUrl && (
                                    <div className="relative">
                                      <img src={stock.logoUrl} alt={stock.name} className="h-10 w-10 rounded-lg" />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleFavorite(stock.symbol);
                                        }}
                                        className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform border border-gray-200"
                                      >
                                        <span className="text-xs">
                                          {favorites[stock.symbol] ? '❤️' : '🤍'}
                                        </span>
                                      </button>
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-sm font-bold text-gray-900">{stock.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {stock.symbol} · {stock.market === "US" ? "🇺🇸 미국" : "🇰🇷 한국"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                  {stock.category}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center">
                                <div className="flex justify-center">
                                  <AIScoreGauge score={stock.aiScore} sentiment={stock.sentiment} size="sm" />
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center">
                                <AnalysisStatusBadge sentiment={stock.sentiment} />
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right">
                                <span
                                  className={classNames(
                                    "text-sm font-bold",
                                    stock.perf100d >= 0 ? "text-emerald-600" : "text-red-600"
                                  )}
                                >
                                  {stock.perf100d >= 0 ? "+" : ""}
                                  {(stock.perf100d * 100).toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </main>
        </div>
      </div>

      {/* 하단 고정 네비 */}
      <BottomNav active={activeTab} onChange={switchTab} />
    </div>
  );
}