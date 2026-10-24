// Ultra analiz zaman yardımcıları — saf fonksiyonlar (localStorage yok).
// Türkiye sabit UTC+3 (yaz saati uygulaması 2016'dan beri yok), +03:00 güvenli.

export function kosuBaslangici(date: string, time: string): Date | null {
  const dm = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(String(date || "").trim());
  if (!dm) return null;
  const tm = /^(\d{1,2})[:.](\d{2})/.exec(String(time || "").trim());
  if (!tm) return null;
  const gun = Number(dm[1]);
  const ay = Number(dm[2]);
  const yil = Number(dm[3]);
  const saat = Number(tm[1]);
  const dk = Number(tm[2]);
  if (ay < 1 || ay > 12 || gun < 1 || gun > 31 || saat > 23 || dk > 59) return null;
  const d = new Date(`${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}T${String(saat).padStart(2, "0")}:${String(dk).padStart(2, "0")}:00+03:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// koşu başlangıcına kalan dakika; now verilmezse şu an kullanılır
export function kalanDakika(bas: Date, now: number = Date.now()): number | null {
  const fark = (bas.getTime() - now) / 60_000;
  return Number.isFinite(fark) ? Math.round(fark) : null;
}

// Spec tablosu: ≥4 sa → 30 dk; 1-4 sa → 15 dk; 30-60 dk → 7 dk; <30 dk → 3 dk
export function turAraligiDk(kalanDk: number): number {
  if (kalanDk >= 240) return 30;
  if (kalanDk >= 60) return 15;
  if (kalanDk >= 30) return 7;
  return 3;
}

// Son araştırma turunun zorunlu olduğu an: koşu başlangıcı - 5 dk
export function sonTurZamani(bas: Date): Date {
  return new Date(bas.getTime() - 5 * 60_000);
}

export function formatKalan(dk: number): string {
  const d = Math.max(0, Math.round(dk));
  if (d >= 60) {
    const saat = Math.floor(d / 60);
    const kalan = d % 60;
    return kalan ? `${saat} sa ${kalan} dk` : `${saat} sa`;
  }
  return `${d} dk`;
}
