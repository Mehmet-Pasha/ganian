export function istanbulTodayIso(): string {
  // Doğru yöntem: Europe/Istanbul saat dilimine göre tarihi al.
  // Eski yöntem (now + 3h) yaz saati olmayan ülkelerde yaklaşık çalışsa da
  // Intl ile timeZone kullanmak DST ve sunucu/istemci yerel saatinden bağımsızdır.
  try {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
  } catch {
    const now = new Date();
    const ist = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    return ist.toISOString().slice(0, 10);
  }
}

export function shiftIso(iso: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return istanbulTodayIso();
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return istanbulTodayIso();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isoToTr(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function weekdayTr(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("tr-TR", { weekday: "long", timeZone: "UTC" });
}

export function cn(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(" ");
}
