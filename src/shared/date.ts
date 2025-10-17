export function formatDateOnly(dateTime: string): string {
  return (dateTime || '').slice(0, 10);
}

export function getYesterdayToday() {
  const pad = (n: number) => String(n).padStart(2, '0');
  const today = new Date();
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  const toStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  return { start: toStr(y), end: toStr(today) };
}
