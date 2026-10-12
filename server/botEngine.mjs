// Ganian sanal bahis botu — saf motor (girdi/çıktı, HTTP ve zamanlayıcı yok).
// index.mjs bunu zamanlar; BotPage görselleştirir.
// Not: TJK'nın yasal otomatik bahis API'si yoktur; bahisler SANALDIR (paper
// trading). Motor, ileride lisanslı bir kanal entegre edilirse gereken tüm
// kaydı (bahis, sonuç, isabet) tutar.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data", "bot");
const FILES = {
  bets: path.join(DATA_DIR, "bets.json"),
  weights: path.join(DATA_DIR, "weights.json"),
  state: path.join(DATA_DIR, "state.json"),
  sources: path.join(DATA_DIR, "sources.json"),
  analizler: path.join(DATA_DIR, "analizler"),
};

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(FILES.analizler, { recursive: true });
}

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function saveJson(file, data) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 1));
}

// --- dışa açık depo yardımcıları ---

export function loadBets() {
  return loadJson(FILES.bets, []);
}

export function saveBets(bets) {
  // Sınırsız büyümesin: 45 günden eski kapanmış bahisleri at, en fazla 4000 tut.
  const cutoff = Date.now() - 45 * 24 * 3600 * 1000;
  const kept = bets
    .filter((b) => b.status === "open" || new Date(b.createdAt || 0).getTime() > cutoff)
    .slice(-4000);
  saveJson(FILES.bets, kept);
  return kept;
}

export function loadWeights() {
  return loadJson(FILES.weights, {});
}

export function saveWeights(weights) {
  // Domana göre istatistik; 300 kaynak tavan (gürültü birikmesin).
  const entries = Object.entries(weights || {}).slice(0, 300);
  saveJson(FILES.weights, Object.fromEntries(entries));
}

export function loadState() {
  return loadJson(FILES.state, { enabled: true, analyzedKeys: [], scoredKeys: [] });
}

export function saveState(state) {
  saveJson(FILES.state, state);
}

export function loadSources() {
  return loadJson(FILES.sources, {});
}

export function saveSources(map) {
  // RaceKey başına kaynak listesi; skorlananlar silinebilir (30 gün tavan).
  saveJson(FILES.sources, map);
}

export function saveBotAnalysis(raceKey, text) {
  ensureDir();
  const safe = String(raceKey).replace(/[^A-Za-z0-9_-]+/g, "_").slice(-90);
  fs.writeFileSync(path.join(FILES.analizler, `${safe}.md`), text);
}

// --- bahis üretimi ---

// dd.mm.yyyy | yyyy-mm-dd → yyyy-mm-dd (sonuç kontrolü gün kartı için ISO ister)
function normIso(d) {
  const s = String(d || "").trim();
  const m = /^(\d{2})[./](\d{2})[./](\d{4})$/.exec(s);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
}

export function placeBets(botVeri, raceInfo, raceHorses = []) {
  const { raceKey, dateIso, meetingKey, raceNo, city, model, source } = raceInfo;
  const iso = normIso(dateIso) || normIso(new Date().toLocaleDateString("en-CA"));
  // TJK nesnesinde alan adı number; istemciden gelen özetşte no olabilir.
  const noOf = (h) => Number(h?.no ?? h?.number);
  const mevcut = new Set((raceHorses || []).map(noOf).filter(Boolean));

  let order = [...(botVeri?.siralama || [])];
  // siralama zayıfsa AGF sırasından tamamla (agfRank küçük = favori).
  if (order.length < 4) {
    const varNo = new Set(order.map((o) => o.no));
    const agf = (raceHorses || [])
      .filter((h) => h.agfRank != null && !varNo.has(noOf(h)))
      .sort((a, b) => a.agfRank - b.agfRank);
    for (const h of agf) {
      if (order.length >= 4) break;
      order.push({ no: noOf(h), ad: h.name || `At ${noOf(h)}`, pct: 0 });
    }
  }
  // yine de <4 ise kalan program numaralarından tamamla (son çare).
  if (order.length < 4) {
    for (const n of mevcut) {
      if (order.length >= 4) break;
      if (!order.some((o) => o.no === n)) order.push({ no: n, ad: `At ${n}`, pct: 0 });
    }
  }
  order = order.slice(0, 4);

  const pctOf = (no) => order.find((o) => o.no === no)?.pct ?? 0;
  const adOf = (no) => order.find((o) => o.no === no)?.ad || `At ${no}`;
  const now = new Date().toISOString();
  // Öğrenme boyutları için model/effort/depth bahis kaydına gömülür —
  // bets.json böylece tek kararlı öğrenme günlüğü olur.
  const base = {
    raceKey,
    dateIso: iso,
    meetingKey,
    raceNo: String(raceNo),
    city,
    model: model || "",
    effort: raceInfo.effort || "",
    depth: raceInfo.depth || "",
    source,
    createdAt: now,
  };
  const bets = [];
  const add = (type, picks) => {
    const id = `${raceKey}::${type}::${picks.join("-")}`;
    if (bets.some((b) => b.id === id)) return;
    bets.push({
      ...base,
      id,
      type,
      picks,
      adlar: picks.map(adOf),
      pct: picks.map(pctOf),
      status: "open",
    });
  };

  // Ganyan: ilk 4'ün her biri kazanan (4)
  for (const o of order) add("ganyan", [o.no]);
  // İkili (sıralı): banko ağırlıklı 6 kombinasyon (6)
  for (const [a, b] of [
    [0, 1], [1, 0], [0, 2], [2, 0], [0, 3], [1, 2],
  ]) add("ikili", [order[a].no, order[b].no]);
  // Üçlü (sıralı): ilk 3'ün tüm dizilişleri (6)
  for (const [a, b, c] of [
    [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0],
  ]) add("uclu", [order[a].no, order[b].no, order[c].no]);

  return bets;
}

export function hasBetsForRace(bets, raceKey) {
  return bets.some((b) => b.raceKey === raceKey);
}

// --- sonuç değerlendirme ---

// raceResult: koşudaki atlar [{no, position}] — position sayı ve >0 olmalı.
export function evaluateBet(bet, resMap) {
  const pos = (no) => resMap[Number(no)];
  if (bet.type === "ganyan") return pos(bet.picks[0]) === 1;
  if (bet.type === "ikili") return pos(bet.picks[0]) === 1 && pos(bet.picks[1]) === 2;
  if (bet.type === "uclu") return pos(bet.picks[0]) === 1 && pos(bet.picks[1]) === 2 && pos(bet.picks[2]) === 3;
  return false;
}

// --- kaynak isabet öğrenmesi ---

// sources: [{name, url, picks:[no...]}] (bahis yerleştirilirken kaydedilmiş)
// resMap: no → position. Domana göre ağırlık istatistiği günceller.
export function updateSourceWeights(weights, raceKey, sources, resMap) {
  const w = { ...weights };
  const top3 = new Set(
    Object.entries(resMap).filter(([, p]) => p >= 1 && p <= 3).map(([no]) => Number(no)),
  );
  const winner = Number(Object.entries(resMap).find(([, p]) => p === 1)?.[0] ?? 0);
  let scored = 0;
  for (const s of sources || []) {
    const picks = (s.picks || []).map(Number).filter((n) => Number.isFinite(n) && n > 0);
    if (!picks.length) continue; // haritasız/gürültü kaynak: skorlama yok
    let host = s.url || "";
    try {
      host = new URL(s.url).hostname.replace(/^www\./, "");
    } catch {
      /* url bozuk: ham değerle devam */
    }
    if (!host) continue;
    const e = w[host] || { name: s.name || host, tests: 0, hits: 0, bankoTests: 0, bankoHits: 0, races: [] };
    const hits = picks.filter((n) => top3.has(n)).length;
    const banko = picks[0] === winner ? 1 : 0;
    e.tests += 1;
    e.hits += hits;
    e.bankoTests += 1;
    e.bankoHits += banko;
    e.name = s.name || e.name;
    e.races = [...(e.races || []).slice(-25), { raceKey, hits, banko, ts: Date.now() }];
    w[host] = e;
    scored += 1;
  }
  return { weights: w, scored };
}

// --- genişletilmiş öğrenme: tüm boyutlar bets.json'dan türetilir ---

// Kaynağın son N koşu penceresindeki isabeti (siteler zamanla değişir — tazelik)
export function sonNIsabet(e, n = 10) {
  const rs = (e.races || []).slice(-n);
  if (!rs.length) return null;
  const maxHits = rs.length * 3;
  return {
    hitPct: maxHits ? Math.round((rs.reduce((a, r) => a + (r.hits || 0), 0) / maxHits) * 100) : 0,
    bankoPct: Math.round((rs.reduce((a, r) => a + (r.banko || 0), 0) / rs.length) * 100),
  };
}

// Öğrenme enjeksiyonu v2: ömür boyu + tazelik penceresi + güven sınıfları +
// kapsam (genişlik) hedefi. Arama prompt'larına ve BotPage özetine aynı kaynak.
export function ogrenmeEnjeksiyonu(weights, sourcesMap) {
  const rows = Object.entries(weights || {})
    .filter(([, e]) => e && e.tests >= 3)
    .map(([domain, e]) => {
      const son = sonNIsabet(e) || { hitPct: 0, bankoPct: 0 };
      return {
        domain,
        name: e.name,
        tests: e.tests,
        hitPct: e.tests ? Math.round((e.hits / (e.tests * 3)) * 100) : 0,
        bankoPct: e.bankoTests ? Math.round((e.bankoHits / e.bankoTests) * 100) : 0,
        sonHitPct: son.hitPct,
      };
    })
    .sort((a, b) => b.sonHitPct - a.sonHitPct || b.hitPct - a.hitPct);

  const lines = [];
  const olculer = rows.filter((r) => r.tests >= 3);
  if (olculer.length) {
    lines.push("## GEÇMİŞ İSABET TABLOSU (sistemin kendi ölçümü — ağırlıklandırmada bunu ESAS al)");
    for (const r of olculer.slice(0, 15)) {
      const sinif = r.sonHitPct >= 25 ? "GÜVENİLİR → Yüksek ağırlık" : r.sonHitPct >= 12 ? "ORTA → normal ağırlık" : "ZAYIF → Düşük ağırlık, yalnızca yeni veri sunuyorsa an";
      lines.push(`- ${r.domain}: ömür boyu ilk-3 %${r.hitPct} / banko %${r.bankoPct}; son 10 koşu ilk-3 %${r.sonHitPct} — ${sinif}`);
    }
    lines.push(`En güvenilir kaynaklar (tazelik penceresine göre): ${olculer.slice(0, 3).map((r) => r.domain).join(", ")}.`);
  }

  // Kapsam döngüsü: araştırmacının kaynak bulma verimi de ölçülür ve hedeflenir
  const sonKosular = Object.entries(sourcesMap || {})
    .slice(-5)
    .map(([, v]) => (v?.sources || []).length);
  if (sonKosular.length) {
    const ort = sonKosular.reduce((a, b) => a + b, 0) / sonKosular.length;
    lines.push(
      ort < 4
        ? `## KAPSAM HEDEFİ: son ${sonKosular.length} koşuda ortalama yalnız ${ort.toFixed(1)} isabetli kaynak buldun — bu SAYIYI ARTTIR: daha çok site tara, boş dönen kanallarda farklı anahtar kelimelerle ikinci tur dene (atı adı + galop, antrenör adı + ahır, hipodrom + altılı tahmin).`
        : `## KAPSAM: son ${sonKosular.length} koşuda ortalama ${ort.toFixed(1)} kaynak — bu kapsamı koru.`,
    );
  }
  return lines.length ? lines.join("\n") : "";
}

// Hangi model/derinlik kombinasyonu daha isabetli tahmin üretiyor?
export function configOzeti(bets) {
  const map = new Map();
  for (const b of bets) {
    const key = `${b.model || "?"} | ${b.depth || "?"} | ${b.effort || "?"}`;
    const e = map.get(key) || { model: b.model || "?", depth: b.depth || "?", effort: b.effort || "?", total: 0, won: 0, lost: 0 };
    e.total += 1;
    if (b.status === "won") e.won += 1;
    else if (b.status === "lost") e.lost += 1;
    map.set(key, e);
  }
  return [...map.values()]
    .map((e) => ({ ...e, hitPct: e.won + e.lost ? Math.round((e.won / (e.won + e.lost)) * 100) : null }))
    .sort((a, b) => (b.hitPct ?? -1) - (a.hitPct ?? -1));
}

// Kalibrasyon: yüksek pct'li bankolar gerçekten daha mı sık tutuyor?
export function kalibrasyonOzeti(bets) {
  const buckets = {
    "yuksek (pct≥30)": { n: 0, won: 0 },
    "orta (10-30)": { n: 0, won: 0 },
    "dusuk (pct<10)": { n: 0, won: 0 },
  };
  for (const b of bets) {
    if (b.type !== "ganyan" || b.status === "open") continue;
    const pct = Number(b.pct?.[0] ?? 0);
    const k = pct >= 30 ? "yuksek (pct≥30)" : pct >= 10 ? "orta (10-30)" : "dusuk (pct<10)";
    buckets[k].n += 1;
    if (b.status === "won") buckets[k].won += 1;
  }
  return Object.entries(buckets).map(([k, v]) => ({
    kova: k,
    n: v.n,
    won: v.won,
    isabet: v.n ? Math.round((v.won / v.n) * 100) : null,
  }));
}

// Hipodrom bazında isabet (farklı pistlerde tahmin kalitesi)
export function sehirOzeti(bets) {
  const map = new Map();
  for (const b of bets) {
    if (b.status === "open") continue;
    const key = (b.city || "?").trim() || "?";
    const e = map.get(key) || { city: key, total: 0, won: 0 };
    e.total += 1;
    if (b.status === "won") e.won += 1;
    map.set(key, e);
  }
  return [...map.values()]
    .filter((e) => e.total >= 2)
    .map((e) => ({ ...e, hitPct: Math.round((e.won / e.total) * 100) }))
    .sort((a, b) => b.hitPct - a.hitPct)
    .slice(0, 8);
}

export function ozetHesapla(bets) {
  const stats = { total: bets.length, open: 0, won: 0, lost: 0, byType: {} };
  for (const b of bets) {
    const t = stats.byType[b.type] || (stats.byType[b.type] = { total: 0, open: 0, won: 0, lost: 0 });
    t.total += 1;
    if (b.status === "open") { stats.open += 1; t.open += 1; }
    else if (b.status === "won") { stats.won += 1; t.won += 1; }
    else if (b.status === "lost") { stats.lost += 1; t.lost += 1; }
  }
  const kapali = stats.won + stats.lost;
  stats.hitPct = kapali ? Math.round((stats.won / kapali) * 1000) / 10 : null;
  return stats;
}

// picksRaw → koşu atlarına eşleme: "9 SING SCAT, 8 SAND PIPER" / "2, 3" / isim
export function picksToNos(picksRaw, raceHorses) {
  if (!picksRaw) return [];
  const nos = new Set();
  const noOf = (h) => Number(h?.no ?? h?.number);
  const byNo = new Map((raceHorses || []).map((h) => [noOf(h), h]));
  const norm = (s) => (s || "").toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();
  const tokens = String(picksRaw).split(/[,;/\n]+/);
  for (const raw of tokens) {
    const t = raw.trim();
    if (!t) continue;
    const m = /^(\d{1,2})\b/.exec(t);
    if (m && byNo.has(Number(m[1]))) {
      nos.add(Number(m[1]));
      continue;
    }
    // sadece sayı dizesi ("2, 3" zaten yukarıda) — isim arama:
    const key = norm(t.replace(/^\d{1,2}[\s.\-)]*/, ""));
    if (!key) continue;
    for (const h of raceHorses || []) {
      const hn = norm(h.name);
      if (hn && (hn === key || hn.includes(key) || key.includes(hn))) {
        nos.add(noOf(h));
        break;
      }
    }
  }
  return [...nos];
}
