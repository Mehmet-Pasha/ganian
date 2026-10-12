// Arka plan analiz motoru: dialog kapansa bile iş devam eder.
// Sayfa açık olduğu sürece çalışır; biten iş Analizler sekmesine kaydedilir.
// (#9'daki toplu/toplantı kuyruğu da bu motoru kullanacak.)

import { saveAnalysis } from "./analyses";
import { getLeaderboard, getPedigreeBatch, postResearch } from "./api";
import type { PedigreeStats } from "./types";
import {
  buildRaceAnalysisPrompt,
  buildResearchPromptOrta,
  buildResearchPromptSonDakika,
  buildResearchPromptUzman,
  buildResearchQueries,
  callGpt,
  collectRaceProfiles,
  extractBotVeri,
  getArastirmaDerinlik,
  nanoSentezCihaz,
} from "./gpt";
import type { Meeting, Race } from "./types";

export type JobState = "running" | "done" | "error";

export type Job = {
  id: string;
  raceKey: string;
  meeting: Meeting;
  race: Race;
  model: string;
  effort: string;
  state: JobState;
  progress: string;
  result: string;
  error: string;
};

const jobs = new Map<string, Job>();
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

export function subscribeJobs(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function raceKeyOf(meeting: Meeting, race: Race): string {
  return `${meeting.key}::${race.id || race.no}`;
}

export function getJob(raceKey: string): Job | undefined {
  return jobs.get(raceKey);
}

export function runningJobCount(): number {
  let n = 0;
  jobs.forEach((j) => {
    if (j.state === "running") n += 1;
  });
  return n;
}

function notifyDone(title: string, body: string) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  } catch {
    /* yok say */
  }
}

export function startAnalysis(opts: {
  apiKey: string;
  meeting: Meeting;
  race: Race;
  model: string;
  effort: string;
}): Job {
  const { apiKey, meeting, race, model, effort } = opts;
  const raceKey = raceKeyOf(meeting, race);
  const existing = jobs.get(raceKey);
  if (existing && existing.state === "running") return existing;

  const job: Job = {
    id: `${Date.now()}-${race.id || race.no}`,
    raceKey,
    meeting,
    race,
    model,
    effort,
    state: "running",
    progress: "Başlıyor…",
    result: "",
    error: "",
  };
  jobs.set(raceKey, job);
  emit();
  void runJobBody(job, apiKey, true);
  return job;
}

async function runJobBody(job: Job, apiKey: string, notify: boolean): Promise<void> {
  const { meeting, race, model, effort } = job;
  try {
    const enriched = await collectRaceProfiles(race, (done, total) => {
      job.progress = `Veriler toplanıyor… ${done}/${total}`;
      emit();
    });
    job.progress = `${model} analiz ediyor…`;
    emit();

    // Uygulamanın kendi 30 günlük liderlik verisi: jokey/antrenör yakın dönem
    // formu prompt'a BURADAN gider — web'de aranması boşuna (ücretsiz + kesin).
    let forms: Parameters<typeof buildRaceAnalysisPrompt>[3];
    try {
      const lb = await getLeaderboard(30);
      forms = { jockeys: lb.jockeys, trainers: lb.trainers };
    } catch {
      /* liderlik opsiyonel */
    }

    let prompt = buildRaceAnalysisPrompt(meeting, race, enriched, forms);

    // Araştırma katmanı (derinlik: düşük/orta/yüksek): araştırma ekibi kendi
    // prompt'uyla çalışır, yapılandırılmış özet üretir; özet prompt şablonundaki
    // {{ARASTIRMA_VERISI}} yuvasına girer. Analist web'e çıkmaz.
    let arastirmaVerisi = "";
    try {
      const depth = getArastirmaDerinlik();
      const depthLabel = depth === "dusuk" ? "düşük" : depth === "orta" ? "orta" : "yüksek";
      job.progress = `Web araştırması (${depthLabel})…`;
      emit();
      // Yüksek: iki odaklı çağrı; Orta: tek birleşik çağrı.
      const sonarPrompts =
        depth === "yuksek"
          ? [buildResearchPromptSonDakika(meeting, race), buildResearchPromptUzman(meeting, race)]
          : [buildResearchPromptOrta(meeting, race)];
      const research = await postResearch({
        depth,
        queries: buildResearchQueries(meeting, race),
        sonarPrompts,
      });
      let digest = research.digest;
      // Sunucudaki nano özetçi kotasızsa (raw) ham bloğu cihaz anahtarıyla özetle.
      if (research.raw && digest && apiKey) {
        const ozet = await nanoSentezCihaz(digest, apiKey);
        if (ozet) digest = ozet;
      }
      arastirmaVerisi = digest;
    } catch {
      /* araştırma opsiyonel — olmadan da analiz yapılır */
    }

    // Pedigri eğilimi (toplu, bedava): liderlik çağrısı gün kartlarını ısıttığı
    // için bu istek sıcak cache'ten döner.
    let pedigree: Record<string, PedigreeStats | undefined> | undefined;
    try {
      const ids = race.horses.map((h) => h.id).filter(Boolean);
      pedigree = await getPedigreeBatch(ids);
    } catch {
      /* pedigri opsiyonel */
    }

    prompt = buildRaceAnalysisPrompt(meeting, race, enriched, forms, pedigree, arastirmaVerisi);
    const haveResearch = Boolean(arastirmaVerisi.trim());
    const out = await callGpt(prompt, apiKey, model, effort, haveResearch);
    job.result = out;
    job.state = "done";
    job.progress = "";

    // Bot hattı: analistin sonundaki "## 🤖 Bot Verisi" JSON'unu sunucuya
    // gönder; bot sanal bahis kurar + kaynakları kaydeder (sonuç sonrası
    // isabet ölçümü bununla öğrenilir). Bot kapalıysa sunucu yine kaydeder.
    try {
      const botVeri = extractBotVeri(out);
      if (botVeri) {
        await fetch("/api/bot/veri", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            raceKey: raceKeyOf(meeting, race),
            dateIso: race.date,
            meetingKey: meeting.key,
            raceNo: race.no,
            city: meeting.city,
            model,
            effort,
            depth: getArastirmaDerinlik(),
            botVeri,
            digest: arastirmaVerisi,
            raceHorses: race.horses.map((h) => ({ no: h.number, name: h.name, agfRank: h.agfRank })),
          }),
        });
      }
    } catch {
      /* bot kaydı opsiyonel */
    }

    try {
      saveAnalysis({
        id: job.id,
        savedAt: new Date().toISOString(),
        dateLabel: race.date,
        city: meeting.city,
        meetingName: meeting.name,
        meetingKey: meeting.key,
        raceNo: race.no,
        model,
        effort,
        analysis: out,
        meeting,
        race,
      });
    } catch {
      /* depolama dolarsa analizi engelleme */
    }
    if (notify) notifyDone("Analiz hazır ✅", `${meeting.city} ${race.no}. koşu tamamlandı. Analizler sekmesinde.`);
  } catch (e) {
    job.state = "error";
    job.error = e instanceof Error ? e.message : "Analiz başarısız";
  }
  emit();
}

// --- Toplantı kuyruğu: koşuları tek tek, sırayla analiz eder ---

export type MeetingQueue = { total: number; finished: number; running: boolean };
const queues = new Map<string, MeetingQueue>();

export function getQueue(meetingKey: string): MeetingQueue | undefined {
  return queues.get(meetingKey);
}

export function enqueueMeeting(opts: {
  apiKey: string;
  meeting: Meeting;
  model: string;
  effort: string;
}): void {
  const { apiKey, meeting, model, effort } = opts;
  const existing = queues.get(meeting.key);
  if (existing?.running) return;
  const races = [...meeting.races];
  const q: MeetingQueue = { total: races.length, finished: 0, running: true };
  queues.set(meeting.key, q);
  emit();
  void (async () => {
    for (const race of races) {
      const raceKey = raceKeyOf(meeting, race);
      const prev = jobs.get(raceKey);
      if (prev?.state === "done") {
        q.finished += 1;
        emit();
        continue;
      }
      if (prev && prev.state === "running") {
        // Başka yerden başlamış işi bekle
        await waitFor(prev);
        q.finished += 1;
        emit();
        continue;
      }
      const job: Job = {
        id: `${Date.now()}-${race.id || race.no}`,
        raceKey,
        meeting,
        race,
        model,
        effort,
        state: "running",
        progress: "Sırada…",
        result: "",
        error: "",
      };
      jobs.set(raceKey, job);
      emit();
      await runJobBody(job, apiKey, false);
      q.finished += 1;
      emit();
    }
    q.running = false;
    emit();
    notifyDone(
      "Toplantı analizi bitti ✅",
      `${meeting.city}: ${q.finished}/${q.total} koşu hazır. Analizler sekmesinde.`,
    );
  })();
}

function waitFor(job: Job): Promise<void> {
  return new Promise((resolve) => {
    if (job.state !== "running") return resolve();
    const off = subscribeJobs(() => {
      if (job.state !== "running") {
        off();
        resolve();
      }
    });
  });
}
