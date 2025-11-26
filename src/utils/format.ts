// 숫자 포맷팅 유틸리티
export function formatNumber(num: number, options?: { compact?: boolean; decimals?: number }): string;
export function formatNumber(num: number, decimals?: number): string;
export function formatNumber(num: number, optionsOrDecimals?: { compact?: boolean; decimals?: number } | number): string {
  let compact = false;
  let decimals = 2;

  if (typeof optionsOrDecimals === 'number') {
    decimals = optionsOrDecimals;
  } else if (optionsOrDecimals) {
    compact = optionsOrDecimals.compact || false;
    decimals = optionsOrDecimals.decimals !== undefined ? optionsOrDecimals.decimals : 2;
  }

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

// 통화 포맷팅 (달러, 원 등)
export function formatCurrency(num: number, currency: "USD" | "KRW" = "USD", compact: boolean = false): string {
  if (compact) {
    if (Math.abs(num) >= 1000000000) {
      return `${currency === "USD" ? "$" : "₩"}${(num / 1000000000).toFixed(2)}B`;
    } else if (Math.abs(num) >= 1000000) {
      return `${currency === "USD" ? "$" : "₩"}${(num / 1000000).toFixed(2)}M`;
    } else if (Math.abs(num) >= 1000) {
      return `${currency === "USD" ? "$" : "₩"}${(num / 1000).toFixed(2)}K`;
    }
  }

  const symbol = currency === "USD" ? "$" : "₩";
  return `${symbol}${num.toLocaleString("ko-KR", {
    minimumFractionDigits: currency === "USD" ? 2 : 0,
    maximumFractionDigits: currency === "USD" ? 2 : 0
  })}`;
}

// 퍼센트 포맷팅
export function formatPercent(num: number, decimals: number = 1): string {
  if (!isFinite(num)) return "N/A";
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(decimals)}%`;
}

// 상대 시간 표시 (예: "5분 전", "2시간 전")
export function getRelativeTime(date: Date): string {
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

// 날짜 포맷팅
export function formatAsOf(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 퍼센트 문자열
export function pctStr(x: number) {
  const sign = x > 0 ? "+" : x < 0 ? "" : "";
  return `${sign}${x.toFixed(1)}%`;
}

// 히트맵 색상
export function heatColor(pct: number) {
  if (pct <= -3) return { bg: "#1e3a8a", text: "#ffffff" };
  if (pct < -0.3) return { bg: "#3b82f6", text: "#ffffff" };
  if (pct <= 0.3) return { bg: "#e5e7eb", text: "#111827" };
  if (pct < 3) return { bg: "#fecaca", text: "#7f1d1d" };
  return { bg: "#b91c1c", text: "#ffffff" };
}

// classNames 유틸리티
export function classNames(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(" ");
}
