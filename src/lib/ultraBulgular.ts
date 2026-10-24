// Ultra analiz bulgu biriktirme — saf fonksiyonlar (localStorage yok).
// Bulgular kronolojik birikir; tekrarlar filtrelenir; özet şişerse
// en eski bloklar düşürülür (nihai raporda "özetlendi" ibaresiyle işaretlenir).

export type Bulgu = { ts: string; aci: string; metin: string };

export type YeniBulgu = { aci: string; metin: string };

export type EklemeSonucu = { list: Bulgu[]; eklendi: number; sikisti: boolean };

const VARSAYILAN_LIMIT = 24_000;

function trNorm(s: string): string {
  return (s || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[.,;:!?"'()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Normalleştirilmiş cümleler birbirini kapsıyorsa tekrar sayılır
function tekrarMi(metin: string, mevcut: Bulgu[]): boolean {
  const n = trNorm(metin);
  if (n.length < 12) return true; // çok kısa bulgu gürültüdür
  for (const b of mevcut) {
    const m = trNorm(b.metin);
    if (!m) continue;
    if (m.includes(n) || n.includes(m)) return true;
  }
  return false;
}

export function ekleBulgu(
  list: Bulgu[],
  yeni: YeniBulgu[],
  limitKarakter = VARSAYILAN_LIMIT,
): EklemeSonucu {
  let out = [...list];
  let eklendi = 0;
  for (const y of yeni || []) {
    const metin = String(y?.metin || "").trim();
    if (!metin || tekrarMi(metin, out)) continue;
    out.push({ ts: new Date().toISOString(), aci: String(y?.aci || "genel"), metin });
    eklendi += 1;
  }
  // Şişme kontrolü: limit aşılırsa en eski blokları düşür (nihai raporda
  // "[eski turlar özetlendi]" ibaresiyle işaretlenir).
  let sikisti = false;
  const toplam = () => out.reduce((a, b) => a + b.metin.length + b.aci.length + 8, 0);
  while (toplam() > limitKarakter && out.length > 1) {
    out = out.slice(1);
    sikisti = true;
  }
  return { list: out, eklendi, sikisti };
}

// Prompt'a giren kronolojik özet; sınırda en eskiler özet ibaresiyle kırpılır.
export function bulguOzeti(list: Bulgu[], maxKarakter = 16_000): string {
  if (!list?.length) return "";
  const satirlar = list.map(
    (b) => `[${new Date(b.ts).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })} · ${b.aci}] ${b.metin}`,
  );
  let metin = satirlar.join("\n");
  if (metin.length > maxKarakter) {
    // sondan (en yeni) tut, baştan kırp
    const kesik = [];
    let uzunluk = 60;
    for (let i = satirlar.length - 1; i >= 0; i--) {
      if (uzunluk + satirlar[i].length > maxKarakter) break;
      uzunluk += satirlar[i].length + 1;
      kesik.unshift(satirlar[i]);
    }
    metin = `[eski turlar özetlendi — ${satirlar.length - kesik.length} blok atlandı]\n${kesik.join("\n")}`;
  }
  return metin;
}

// Birikmiş bulgulardan "bilinenler" özeti (araştırma prompt'una gider)
export function bilinenlerOzeti(list: Bulgu[], maxKarakter = 6_000): string {
  if (!list?.length) return "Şu ana kadar kayda değer bulgu yok.";
  const son = list.slice(-12).map((b) => `- [${b.aci}] ${trNorm(b.metin).slice(0, 200)}`);
  let metin = son.join("\n");
  if (metin.length > maxKarakter) metin = metin.slice(-maxKarakter);
  return metin;
}
