// TJK verilerini biçimlendirme ve yorumlama yardımcıları.
// Grok'un ilk taslağından alınmış, hataları düzeltilmiş ve genişletilmiştir.

const COLOR = {
  a: "Al",
  d: "Doru",
  k: "Kır",
  y: "Yağız",
  g: "Gri",
  s: "Siyah",
  al: "Al",
  do: "Doru",
};

const SEX = {
  k: "Kısrak",
  a: "Aygır",
  d: "Dişi Tay",
  e: "Erkek Tay",
  g: "İğdiş",
};

export function parseAgeText(yas) {
  const compact = (yas || "").replaceAll("&nbsp;", " ").replace(/\s+/g, " ").trim();
  const m = compact.match(/(\d+)\s*y\s*([a-zçğıöşü]+)?\s*([a-zçğıöşü]+)?/i);
  if (!m) return { age: compact, color: "", sex: "", label: compact };
  const age = m[1] || "";
  const color = COLOR[(m[2] || "").toLowerCase()] || (m[2] || "");
  const sex = SEX[(m[3] || "").toLowerCase()] || (m[3] || "");
  const label = [age ? `${age} yaş` : "", color, sex].filter(Boolean).join(" · ");
  return { age, color, sex, label: label || compact };
}

export function trackKindOf(pist, adi = "") {
  const s = `${pist || ""} ${adi || ""}`.toLocaleLowerCase("tr-TR");
  if (s.includes("çim") || s.includes("cim") || s.includes("turf")) return "cim";
  if (s.includes("sentetik") || s.includes("synthetic") || s.includes("all weather") || s.includes("polytrack")) {
    return "sentetik";
  }
  if (s.includes("kum") || s.includes("sand") || s.includes("dirt") || s.includes("fiber")) {
    return "kum";
  }
  return "diger";
}

// Mesafe kovaları için TJK resmi bir eşik yayınlamıyor; Türkiye'deki yaygın
// koşu mesafeleri (1000/1200/1300/1400/1600/1800/2000/2200/2400/3200 m) göz
// önünde bulundurularak makul bir bölme yapıldı. Bu bir yaklaşımdır.
export function distanceBucket(distance) {
  const n = typeof distance === "number" ? distance : Number.parseInt(String(distance).replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n <= 1400) return "kisa";
  if (n <= 2000) return "orta";
  return "uzun";
}

export const DISTANCE_LABEL = {
  kisa: "Kısa (≤1400 m)",
  orta: "Orta (1401–2000 m)",
  uzun: "Uzun (>2000 m)",
};

export function trackKindFromShort(label) {
  const s = (label || "").toLocaleLowerCase("tr-TR");
  if (s.startsWith("ç") || s.startsWith("c:") || s.includes("çim")) return "cim";
  if (s.startsWith("s") || s.includes("sentetik")) return "sentetik";
  if (s.startsWith("k") || s.includes("kum")) return "kum";
  return trackKindOf(label);
}

export function trackLabel(kind, fallback = "") {
  if (kind === "cim") return "Çim";
  if (kind === "kum") return "Kum";
  if (kind === "sentetik") return "Sentetik";
  return fallback || "Pist";
}

export function prizeText(value) {
  const t = (value || "").replace(/,00$/, "").trim();
  if (!t) return "";
  return `${t} ₺`;
}

export function decodeHtml(input) {
  return (input || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&uuml;/gi, "ü")
    .replace(/&Uuml;/gi, "Ü")
    .replace(/&ouml;/gi, "ö")
    .replace(/&Ouml;/gi, "Ö")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&Ccedil;/gi, "Ç")
    .replace(/&scedil;/gi, "ş")
    .replace(/&Scedil;/gi, "Ş")
    .replace(/&iacute;/gi, "ı")
    .replace(/&Iacute;/gi, "İ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripTags(html) {
  return decodeHtml((html || "").replace(/<[^>]+>/g, " "));
}

export function trDateToIso(value) {
  const m = (value || "").match(/(\d{2})[./](\d{2})[./](\d{4})/);
  if (!m) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
}

export function isoToYmd(iso) {
  return (iso || "").replaceAll("-", "");
}

export function ymdToIso(ymd) {
  if (!ymd || ymd.length !== 8) return "";
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

export function istanbulTodayIso() {
  // Doğru yöntem: Europe/Istanbul timeZone ile.
  try {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
  } catch {
    const now = new Date();
    const ist = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    return ist.toISOString().slice(0, 10);
  }
}

export function shiftIso(iso, days) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return istanbulTodayIso();
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return istanbulTodayIso();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function lastNIsoDates(n) {
  const today = istanbulTodayIso();
  const out = [];
  for (let i = 0; i < n; i++) out.push(shiftIso(today, -i));
  return out;
}

export function isoToTr(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function weekdayTr(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("tr-TR", { weekday: "long", timeZone: "UTC" });
}

export function tjkWatchUrl(atId, kosuKod) {
  return `https://www.tjk.org/TR/YarisSever/Info/YarisVideoAt/At?AtKodu=${encodeURIComponent(atId)}&KosuKodu=${encodeURIComponent(kosuKod)}`;
}

export function tjkHorseUrl(id) {
  return `https://www.tjk.org/TR/YarisSever/Query/ConnectedPage/AtKosuBilgileri?1=1&QueryParameter_AtId=${encodeURIComponent(id)}`;
}

export function tjkJockeyUrl(id, name = "") {
  const q = new URLSearchParams({ "1": "1", QueryParameter_JokeyId: id });
  if (name) q.set("QueryParameter_JokeyAdi", name);
  return `https://www.tjk.org/TR/YarisSever/Query/Page/JokeyIstatistikleri?${q.toString()}`;
}

export function tjkTrainerUrl(id) {
  return `https://www.tjk.org/TR/YarisSever/Query/ConnectedPage/AtKosuBilgileri?1=1&QueryParameter_AntrenorId=${encodeURIComponent(id)}&QueryParameter_SehirId=-1&QueryParameter_YIL=-1`;
}

export function tjkOwnerUrl(id) {
  return `https://www.tjk.org/TR/YarisSever/Query/ConnectedPage/AtKosuBilgileri?1=1&QueryParameter_SahipId=${encodeURIComponent(id)}&QueryParameter_SehirId=-1&QueryParameter_YIL=-1`;
}

export function tjkSireUrl(babaId, babaAdi = "") {
  const q = new URLSearchParams({
    QueryParameter_BabaId: babaId,
    QueryParameter_YIL: "-1",
    QueryParameter_AtGrupKodu: "-1",
    QueryParameter_PistKodu: "-1",
  });
  if (babaAdi) q.set("QueryParameter_BabaAdi", babaAdi);
  return `https://www.tjk.org/TR/YarisSever/Query/ConnectedPage/AtKosuBilgileri?${q.toString()}`;
}

export function positionTone(pos) {
  const n = Number.parseInt(pos, 10);
  if (!Number.isFinite(n) || n <= 0) return pos ? "out" : "none";
  if (n === 1) return "win";
  if (n === 2) return "place";
  if (n === 3) return "show";
  return "out";
}

// DÜZELTME: Grok'un orijinal isDomesticMeeting fonksiyonu bozuktu — yabancı
// ülke kontrollerinin hepsi zaten "false" döndüren bir dalın içindeydi ve asla
// devreye girmiyordu (ölü kod). Burada TJK'nın KEY alanına göre net bir liste
// kullanıyoruz: yurt içi hipodromlar sabit bir KEY kümesine sahip, geri kalan
// her şey (Meydan, Wolverhampton, Kranji, vb.) yurt dışıdır.
const DOMESTIC_KEYS = new Set([
  "ISTANBUL",
  "IZMIR",
  "ANKARA",
  "BURSA",
  "ADANA",
  "ANTALYA",
  "KOCAELI",
  "SANLIURFA",
  "ELAZIG",
  "DBAKIR",
  "DIYARBAKIR",
  "KARMA",
  "ELAZIĞ",
]);

export function isDomesticMeeting(key, gun, yer) {
  const k = (key || "").toLocaleUpperCase("tr-TR").replace(/İ/g, "I");
  if (DOMESTIC_KEYS.has(k)) return true;
  // GUN alanı (kaçıncı gün) yalnızca yurt içi çok günlük toplantılarda dolu olur
  if (gun != null && String(gun).trim() !== "" && String(gun) !== "0") return true;
  const y = (yer || "").toLocaleLowerCase("tr-TR");
  const foreignHints = [
    "abd",
    "kanada",
    "avustralya",
    "afrika",
    "birleşik krallık",
    "ingiltere",
    "i̇ngiltere",
    "malezya",
    "fransa",
    "irlanda",
    "almanya",
    "japonya",
    "hong kong",
    "singapur",
    "katar",
    "dubai",
    "suudi",
    "avusturya",
    "i̇spanya",
    "ispanya",
    "italya",
    "güney afrika",
  ];
  if (foreignHints.some((h) => y.includes(h))) return false;
  // Bilinmeyen durumda: KEY yurt içi listesinde değilse ve gün bilgisi yoksa
  // güvenli varsayım yurt dışıdır (TJK'nın ebayi akışında yurt dışı toplantı
  // sayısı çok daha fazladır).
  return false;
}

export function cityKeyGuess(city) {
  const s = (city || "").toLocaleUpperCase("tr-TR").replace(/İ/g, "I");
  if (s.includes("ISTANBUL") || s.includes("VELIEFENDI")) return "ISTANBUL";
  if (s.includes("IZMIR") || s.includes("SIRINYER") || s.includes("ŞIRINYER")) return "IZMIR";
  if (s.includes("ANKARA")) return "ANKARA";
  if (s.includes("BURSA")) return "BURSA";
  if (s.includes("ADANA")) return "ADANA";
  if (s.includes("ANTALYA")) return "ANTALYA";
  if (s.includes("KOCAELI")) return "KOCAELI";
  if (s.includes("SANLIURFA") || s.includes("URFA")) return "SANLIURFA";
  if (s.includes("ELAZIG")) return "ELAZIG";
  if (s.includes("DIYARBAKIR")) return "DBAKIR";
  return s.replace(/\s+/g, "");
}
