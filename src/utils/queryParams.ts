// URL 쿼리 유틸
export function setQueryParams(updates: Record<string, string | null | undefined>) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  Object.entries(updates).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "" || v === "전체" || v === "ALL") url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  });
  window.history.replaceState({}, "", url);
}

export function getQueryParam(key: string) {
  if (typeof window === "undefined") return null;
  return new URL(window.location.href).searchParams.get(key);
}
