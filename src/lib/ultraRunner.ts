// Ultra analiz oturum motoru — tarayıcıda çalışır, durum localStorage'a
// snapshot'lanır (sayfa yenilenince kaldığı yerden devam eder). Analiz ve
// araştırma modüllerini TÜKETİR; onları değiştirmez.

import {
  buildRaceAnalysisPrompt,
  buildResearchPromptOrta,
  buildUltraFinalEk,
  buildUltraTurPrompt,
  buildResearchQueries,
  extractBotVeri,
} from "../../shared/prompt.ts";
import type { Meeting, PedigreeStats, Race } from "./types";
import {
  kosuBaslangici,
  kalanDakika,
  turAraligiDk,
  sonTurZamani,
} from "./ultraZaman";
import {
  ekleBulgu,
  bilinenlerOzeti,
  bulguOzeti,
  type Bulgu,
} from "./ultraBulgular";
import { postResearch, getPedigreeBatch, getLeaderboard } from "./api";
import { callGpt, collectRaceProfiles, getGptKey } from "./gpt";
import { saveAnalysisRemote } from "./analyses";
import { raceKeyOf } from "./analysisRunner";

// ---- saf çekirdek: ultraKarar ----

export type UltraFaz = "temel" | "takip" | "bitti" | "iptal";

export type UltraSession = {
  id: string;
  raceKey: string;
  meeting: Meeting;
  race: Race;
  model: string;
  effort: string;
  faz: UltraFaz;
  bulgular: Bulgu[];
  sonTurAt: number | null;
  turHatasi: number;
  aciIndex: number;
  olusturma: string;
  degisme: string;
  progress: string;
  result: string;
  error: string;
  turKayitlari: { ts: string; baslik: string; aci: string }[];
};

export type UltraKarar = {
  islem: "tur" | "final" | "bekle" | "iptal";
  delayMs?: number;
  neden?: string;
};

// Oturumun bir andaki kararını hesaplar (saf — zamanlayıcı bunu uygular).
export function ultraKarar(s: UltraSession, now: number = Date.now()): UltraKarar {
  if (s.race.finished) return { islem: "iptal", neden: "koşu sonuçlandı" };
  const bas = kosuBaslangici(s.race.date, s.race.time);
  if (!bas) return { islem: "iptal", neden: "koşu saati bilinmiyor/çözülemedi" };
  const kalan = kalanDakika(bas, now);
  if (kalan == null) return { islem: "iptal", neden: "kalan süre hesaplanamadı" };
  if (kalan <= 0) return { islem: "iptal", neden: "koşu başladı" };

  if (s.faz === "temel") return { islem: "tur" };
  if (s.faz === "bitti" || s.faz === "iptal") {
    return { islem: "iptal", neden: "oturum tamamlandı" };
  }

  // faz takip — son zorunlu tur zamanı aşıldıysa hemen tur
  const sonTur = sonTurZamani(bas).getTime();
  if (now >= sonTur && (!s.sonTurAt || s.sonTurAt < sonTur)) return { islem: "tur" };

  if (kalan <= 5) return { islem: "final" };

  let aralik = turAraligiDk(kalan);
  // tur hatası varsa geri çekilme: aralığı 2^hata katına çıkar (en fazla ×8)
  aralik = aralik * Math.pow(2, Math.min(s.turHatasi, 3));

  const sonTurMs = s.sonTurAt ?? 0;
  const nextAt = sonTurMs + aralik * 60_000;
  if (now >= nextAt) return { islem: "tur" };
  return { islem: "bekle", delayMs: nextAt - now };
}

// ---- depolama ----

const ULTRA_KEY = "ultra:oturumlar";

function oturumlariYukle(): UltraSession[] {
  try {
    const raw = localStorage.getItem(ULTRA_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as UltraSession[]) : [];
  } catch {
    return [];
  }
}

function oturumlariKaydet(list: UltraSession[]) {
  try {
    // apiKey asla depolanmaz (resume'da güncel cihaz anahtarı/ sunucu anahtarı kullanılır)
    localStorage.setItem(ULTRA_KEY, JSON.stringify(list.slice(-20)));
  } catch {
    /* depolama hatası: oturum bellekte sürer */
  }
}

// ---- canlı motor ----

const sessions = new Map<string, UltraSession>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* yok say */
    }
  });
}

export function subscribeUltra(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function degis(s: UltraSession) {
  s.degisme = new Date().toISOString();
  emit();
  snapshot();
}

// her değişimde diske yazmak pahalı; 2 sn kısılmış yazma
let snapshotTimer: number | null = null;
function snapshot() {
  if (snapshotTimer != null) return;
  snapshotTimer = window.setTimeout(() => {
    snapshotTimer = null;
    anlikSnapshot();
  }, 2000);
}

function anlikSnapshot() {
  if (snapshotTimer != null) {
    window.clearTimeout(snapshotTimer);
    snapshotTimer = null;
  }
  oturumlariKaydet([...sessions.values()]);
}

export function getUltraSession(raceKey: string): UltraSession | undefined {
  return sessions.get(raceKey);
}

export function ultraOturumlar(): UltraSession[] {
  return [...sessions.values()];
}

const ACILAR = ["son-dakika", "jokey-taki", "pist-hava", "uzman", "oran-agf"];

export function startUltra(opts: {
  apiKey: string;
  meeting: Meeting;
  race: Race;
  model: string;
  effort: string;
}): UltraSession {
  const { meeting, race } = opts;
  const raceKey = `${meeting.key}::${race.id || race.no}`;
  const mevcut = sessions.get(raceKey);
  if (mevcut && (mevcut.faz === "temel" || mevcut.faz === "takip")) return mevcut;

  const bas = kosuBaslangici(race.date, race.time);
  if (!bas) {
    throw new Error(
      "ULTRA analiz için koşu başlangıç saati gerekli ama çözülemedi. Normal analiz kullanabilirsin.",
    );
  }
  if (race.finished || bas.getTime() <= Date.now()) {
    throw new Error("Bu koşu başlamış/sonuçlanmış; ULTRA analiz başlatılamaz.");
  }

  const s: UltraSession = {
    id: `ultra-${Date.now()}-${race.id || race.no}`,
    raceKey,
    meeting,
    race,
    model: opts.model,
    effort: opts.effort,
    faz: "temel",
    bulgular: [],
    sonTurAt: null,
    turHatasi: 0,
    aciIndex: 0,
    olusturma: new Date().toISOString(),
    degisme: new Date().toISOString(),
    progress: "ULTRA başlıyor — temel tarama…",
    result: "",
    error: "",
    turKayitlari: [],
  };
  sessions.set(raceKey, s);
  anlikSnapshot();
  emit();
  void dongu(s);
  return s;
}

export function durdurUltra(raceKey: string): void {
  const s = sessions.get(raceKey);
  if (!s) return;
  if (s.faz === "temel" || s.faz === "takip") {
    s.faz = "iptal";
    s.progress = "Durduruldu — birikmiş bulgular saklandı";
    anlikSnapshot();
    emit();
  }
}

export async function resumeUltraSessions(): Promise<number> {
  const kayitli = oturumlariYukle();
  let devam = 0;
  for (const s of kayitli) {
    if (!valid(s)) continue;
    if (s.faz === "bitti" || s.faz === "iptal") continue;
    sessions.set(s.raceKey, s);
    void dongu(s);
    devam += 1;
  }
  emit();
  return devam;
}

function valid(s: UltraSession): boolean {
  return (
    typeof s === "object" &&
    s !== null &&
    typeof s.raceKey === "string" &&
    typeof s.race === "object" &&
    Array.isArray(s.bulgular) &&
    typeof s.faz === "string"
  );
}

// ---- döngü ----

async function dongu(s: UltraSession): Promise<void> {
  const apiKey = getGptKey();
  for (;;) {
    const karar = ultraKarar(s);
    if (karar.islem === "iptal") {
      s.faz = "iptal";
      s.progress = karar.neden || "iptal";
      anlikSnapshot();
      emit();
      return;
    }
    if (karar.islem === "final") {
      s.progress = "🌊 Nihai mega rapor: tüm birikmiş veri modele gidiyor…";
      anlikSnapshot();
      emit();
      try {
        await finalRapor(s, apiKey);
        s.faz = "bitti";
        s.progress = "";
        anlikSnapshot();
        emit();
        bildir("🏁 ULTRA analiz hazır", `${s.meeting.city} ${s.race.no}. koşu nihai raporu depoda.`);
        return;
      } catch (e1) {
        try {
          await finalRapor(s, apiKey); // bir kez yeniden dene
          s.faz = "bitti";
          s.progress = "";
          anlikSnapshot();
          emit();
          bildir("🏁 ULTRA analiz hazır", `${s.meeting.city} ${s.race.no}. koşu nihai raporu depoda.`);
          return;
        } catch (e2) {
          s.faz = "bitti";
          s.error = e2 instanceof Error ? e2.message : "nihai rapor başarısız";
          await yarimKaydet(s, s.error).catch(() => {});
          anlikSnapshot();
          emit();
          bildir("⚠️ ULTRA analiz yarım kaydedildi", `${s.meeting.city} ${s.race.no}. koşu`);
          return;
        }
      }
    }
    if (karar.islem === "tur") {
      try {
        await tur(s);
        s.turHatasi = 0;
      } catch (e) {
        s.turHatasi = (s.turHatasi || 0) + 1;
        s.progress = `Tur hatası (${s.turHatasi}) — ${e instanceof Error ? e.message.slice(0, 80) : "bilinmiyor"}; bir sonra tekrar`;
      }
      degis(s);
      continue;
    }
    // bekle
    s.progress = `Takip modu — sonraki tur: ${new Date(Date.now() + (karar.delayMs || 60_000)).toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul" })}`;
    emit();
    await new Promise((r) => setTimeout(r, Math.min(karar.delayMs ?? 60_000, 60_000)));
  }
}

async function tur(s: UltraSession) {
  const aci = ACILAR[s.aciIndex % ACILAR.length];
  s.aciIndex = (s.aciIndex || 0) + 1;
  const bas = kosuBaslangici(s.race.date, s.race.time);
  const kalan = bas ? (kalanDakika(bas) ?? 0) : 0;
  s.progress = `ULTRA · Tur ${s.aciIndex} · ${aci} · koşuya ${kalan} dk · araştırılıyor…`;
  emit();

  const p = buildUltraTurPrompt(s.meeting, s.race, bilinenlerOzeti(s.bulgular), aci);
  const r = await postResearch({
    depth: "orta",
    queries: buildResearchQueries(s.meeting, s.race),
    sonarPrompts: [p],
  });
  if (!r.digest) throw new Error("araştırma boş döndü");

  const sonuc = ekleBulgu(s.bulgular, [{ aci, metin: r.digest }], 24_000);
  s.bulgular = sonuc.list;
  s.sonTurAt = Date.now();
  s.turKayitlari = [
    ...s.turKayitlari,
    {
      ts: new Date().toISOString(),
      baslik: `Tur ${s.aciIndex} · ${aci}${sonuc.eklendi ? "" : " (yeni bulgu yok)"}`,
      aci,
    },
  ].slice(-100);
  s.progress = `ULTRA · Tur ${s.aciIndex} bitti · koşuya ${kalan} dk · ${sonuc.eklendi ? `${sonuc.eklendi} yeni bulgu` : "yeni bulgu yok"}`;
}

async function finalRapor(s: UltraSession, apiKey: string) {
  // nihai rapordan hemen önce son bir tarama
  try {
    await tur(s);
  } catch {
    /* son tur opsiyonel */
  }

  const enriched = await collectRaceProfiles(s.race, () => {});
  let forms: Parameters<typeof buildRaceAnalysisPrompt>[3];
  try {
    const lb = await getLeaderboard(30);
    forms = { jockeys: lb.jockeys, trainers: lb.trainers };
  } catch {
    /* opsiyonel */
  }
  let pedigree: Record<string, PedigreeStats | undefined> | undefined;
  try {
    pedigree = await getPedigreeBatch(s.race.horses.map((h) => h.id).filter(Boolean));
  } catch {
    /* opsiyonel */
  }

  const base = buildRaceAnalysisPrompt(s.meeting, s.race, enriched, forms, pedigree);
  const ek = buildUltraFinalEk(bulguOzeti(s.bulgular, 16_000));

  s.progress = "🌊 Mega rapor: tüm birikmiş veri modele gidiyor…";
  emit();
  const { text: finalText } = await callGpt(base + ek, apiKey, s.model, "high", true);

  s.result = finalText;
  await saveAnalysisRemote({
    id: `ultra-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    savedAt: new Date().toISOString(),
    dateLabel: s.race.date,
    city: s.meeting.city,
    meetingName: s.meeting.name,
    meetingKey: s.meeting.key,
    raceNo: s.race.no,
    model: s.model,
    effort: "high",
    analysis: finalText,
    meeting: s.meeting,
    race: s.race,
    kaynak: "ultra",
  });
  try {
    const botVeri = extractBotVeri(finalText);
    if (botVeri) {
      await fetch("/api/bot/veri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raceKey: raceKeyOf(s.meeting, s.race),
          dateIso: s.race.date,
          meetingKey: s.meeting.key,
          raceNo: s.race.no,
          city: s.meeting.city,
          model: s.model,
          effort: "high",
          depth: "yuksek",
          botVeri,
          digest: bulguOzeti(s.bulgular, 16_000),
          raceHorses: s.race.horses.map((h) => ({ no: h.number, name: h.name, agfRank: h.agfRank })),
        }),
        signal: AbortSignal.timeout(10_000),
      });
    }
  } catch {
    /* kupon opsiyonel */
  }
}

async function yarimKaydet(s: UltraSession, hataMesaji: string) {
  await saveAnalysisRemote({
    id: `ultra-yarim-${Date.now()}`,
    savedAt: new Date().toISOString(),
    dateLabel: s.race.date,
    city: s.meeting.city,
    meetingName: s.meeting.name,
    meetingKey: s.meeting.key,
    raceNo: s.race.no,
    model: s.model,
    effort: "high",
    analysis: `# ULTRA ANALİZ (YARIM — nihai rapor başarısız)\n\nHata: ${hataMesaji}\n\n## Birikmiş bulgular\n\n${bulguOzeti(s.bulgular, 16_000)}`,
    meeting: s.meeting,
    race: s.race,
    kaynak: "ultra",
  });
}

function bildir(title: string, body: string) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  } catch {
    /* yok say */
  }
}
