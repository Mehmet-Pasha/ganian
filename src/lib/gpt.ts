import { getHorseProfile, getJockeyProfile } from "./api";
import type { HorseProfile, JockeyProfile, Meeting, PedigreeStats, Race } from "./types";

export const GPT_MODEL = "gpt-6-sol";
export const GPT_MODELS = [
  { id: "gpt-6-sol", label: "GPT-6 Sol (önerilen, dengeli)" },
  { id: "gpt-6-luna", label: "GPT-6 Luna (hızlı + en ucuz)" },
  { id: "gpt-6-astra", label: "GPT-6 Astra (en isabetli, pahalı)" },
  { id: "gpt-5.6-sol", label: "GPT-5.6 Sol (amiral)" },
  { id: "gpt-5.6-terra", label: "GPT-5.6 Terra (dengeli)" },
  { id: "gpt-5.6-luna", label: "GPT-5.6 Luna (hızlı + ucuz)" },
  { id: "gpt-5.5", label: "GPT-5.5 (en yeni amiral)" },
  { id: "gpt-5.4", label: "GPT-5.4" },
  { id: "gpt-5.4-mini", label: "GPT-5.4 Mini" },
  { id: "gpt-5.4-nano", label: "GPT-5.4 Nano" },
  { id: "gpt-5.1", label: "GPT-5.1" },
  { id: "gpt-5", label: "GPT-5" },
  { id: "gpt-5-mini", label: "GPT-5 Mini (hızlı + ucuz)" },
  { id: "gpt-5-nano", label: "GPT-5 Nano (en hızlı/ucuz)" },
  { id: "gpt-5-pro", label: "GPT-5 Pro (en isabetli)" },
  { id: "gpt-5-chat-latest", label: "GPT-5 Chat (sohbet)" },
  { id: "gpt-4.1", label: "GPT-4.1 (klasik, akıl yürütmesiz)" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { id: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
  { id: "gpt-4o", label: "GPT-4o (güvenilir)" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini (en ucuz klasik)" },
  { id: "gpt-4-turbo", label: "GPT-4 Turbo (eski)" },
  { id: "gpt-4", label: "GPT-4 (eski)" },
  { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (eski, ucuz)" },
  { id: "o3", label: "o3 (akıl yürütme)" },
  { id: "o3-mini", label: "o3-mini (akıl yürütme)" },
  { id: "o4-mini", label: "o4-mini (akıl yürütme)" },
  { id: "gpt-oss-120b", label: "gpt-oss-120b (açık ağırlık)" },
  { id: "gpt-oss-20b", label: "gpt-oss-20b (açık ağırlık)" },
] as const;
export const GPT_MODEL_STORAGE = "mahmuz:gpt-model";
export const GPT_EFFORTS = [
  { id: "none", label: "None (muhakemesiz, en hızlı)" },
  { id: "minimal", label: "Minimal (en hızlı, en az kesinti)" },
  { id: "low", label: "Low (önerilen)" },
  { id: "medium", label: "Medium (daha derin)" },
  { id: "high", label: "High (en derin, yavaş)" },
  { id: "xhigh", label: "XHigh (çok derin)" },
] as const;
export const GPT_EFFORT_STORAGE = "mahmuz:gpt-effort";

export function getGptEffort(): string {
  try {
    const v = (localStorage.getItem(GPT_EFFORT_STORAGE) || "").trim();
    if (GPT_EFFORTS.some((m) => m.id === v)) return v;
  } catch {
    /* yok say */
  }
  return "low";
}

export function setGptEffort(id: string) {
  try {
    localStorage.setItem(GPT_EFFORT_STORAGE, id);
  } catch {
    /* yok say */
  }
}

export function getGptModel(): string {
  try {
    const v = (localStorage.getItem(GPT_MODEL_STORAGE) || "").trim();
    // Listede yoksa bile özel ID'ye izin ver (yeni çıkan modeller için)
    if (v) return v;
  } catch {
    /* yok say */
  }
  return GPT_MODEL;
}

export function setGptModel(id: string) {
  try {
    localStorage.setItem(GPT_MODEL_STORAGE, id);
  } catch {
    /* yok say */
  }
}
export const GPT_KEY_STORAGE = "mahmuz:gpt-key";

export function getGptKey(): string {
  try {
    return localStorage.getItem(GPT_KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

export function setGptKey(key: string) {
  try {
    localStorage.setItem(GPT_KEY_STORAGE, key.trim());
  } catch {
    /* yok say */
  }
}

export function clearGptKey() {
  try {
    localStorage.removeItem(GPT_KEY_STORAGE);
  } catch {
    /* yok say */
  }
}

// OpenRouter anahtarları "sk-or-" ile başlar; geri kalan her şey OpenAI sayılır.
export function isOpenRouterKey(key: string): boolean {
  return /^sk-or-/i.test((key || "").trim());
}

// Araştırma derinliği: analizden AYRI bir katman. Düşük = en ucuz.
export type ArastirmaDerinlik = "dusuk" | "orta" | "yuksek";
export const ARASTIRMA_DERINLIK_STORAGE = "mahmuz:arastirma";
export const ARASTIRMA_DERINLIKLERI = [
  { id: "dusuk", label: "Düşük — Tavily + nano özet (en ucuz)" },
  { id: "orta", label: "Orta — Perplexity Sonar (geniş tarama)" },
  { id: "yuksek", label: "Yüksek — Sonar + Tavily hibrit (en geniş kapsam)" },
] as const;

export function getArastirmaDerinlik(): ArastirmaDerinlik {
  try {
    const v = (localStorage.getItem(ARASTIRMA_DERINLIK_STORAGE) || "").trim();
    if (v === "dusuk" || v === "orta" || v === "yuksek") return v;
  } catch {
    /* yok say */
  }
  return "dusuk";
}

export function setArastirmaDerinlik(id: string) {
  try {
    localStorage.setItem(ARASTIRMA_DERINLIK_STORAGE, id);
  } catch {
    /* yok say */
  }
}

// ---------------------------------------------------------------------------
// PROMPT TEK KAYNAK: shared/prompt.ts
// Analist talimatı + veri blokları + araştırma promptları orada; sunucudaki
// an-be-an bot da AYNI modülü kullanır. Burada yalnızca istemci kalır:
// ayarlar (localStorage), çağrı katmanı (callGpt/nanoSentezCihaz) ve veri
// toplama (collectRaceProfiles).
// ---------------------------------------------------------------------------
export {
  buildRaceAnalysisPrompt,
  buildResearchPromptOrta,
  buildResearchPromptSonDakika,
  buildResearchPromptUzman,
  buildResearchQueries,
  extractBotVeri,
  getPromptInstructionOnly,
} from "../../shared/prompt.ts";
export type {
  BotVeri,
  EnrichedHorse,
  FormVerileri,
  ResearchSourceRow,
} from "../../shared/prompt.ts";
import type { EnrichedHorse } from "../../shared/prompt.ts";
// --- veri toplama ---

async function pool<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cur = 0;
  async function worker() {
    while (cur < items.length) {
      const i = cur++;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length || 1) }, worker));
  return out;
}

export async function collectRaceProfiles(
  race: Race,
  onProgress?: (done: number, total: number) => void,
): Promise<EnrichedHorse[]> {
  const ids = race.horses.map((h) => h.id).filter(Boolean);
  let done = 0;
  // Limit 3: 13 atlık patlamada TJK'ya nazik davran (4+'ta rate-limit artıyor).
  const profiles = await pool(ids, 3, async (id) => {
    try {
      const p = await getHorseProfile(id);
      return p;
    } catch {
      return null;
    } finally {
      done += 1;
      onProgress?.(done, ids.length * 2);
    }
  });

  const byId = new Map<string, HorseProfile>();
  for (const p of profiles) if (p) byId.set(p.id, p);

  // TJK profil sayfası bazen ismi boş döndürüyor ("At 115532" gibi görünür);
  // programdaki isimle düzelt.
  profiles.forEach((p, i) => {
    if (p && (!p.name || /^At \d+$/i.test(p.name))) {
      const e = race.horses.find((x) => x.id === ids[i]);
      if (e?.name) p.name = e.name;
    }
  });

  // Jokey profilleri best-effort: benzersiz jokeyler, en fazla 8
  const jockeys = [...new Map(race.horses.filter((h) => h.jockeyId).map((h) => [h.jockeyId, h.jockeyName] as const)).entries()].slice(0, 8);
  const jmap = new Map<string, JockeyProfile>();
  await pool(jockeys, 3, async ([jid, jname]) => {
    try {
      const j = await getJockeyProfile(jid, jname || "");
      jmap.set(jid, j);
    } catch {
      /* yok say */
    } finally {
      done += 1;
      onProgress?.(done, ids.length + jockeys.length);
    }
  });

  return race.horses.map((e, i) => {
    const fallback: HorseProfile = {
      id: e.id || `prog-${i}`,
      name: e.name,
      ageText: e.ageText,
      birthDate: "",
      hp: e.hp,
      sire: e.sire,
      sireId: e.sireId,
      dam: e.dam,
      damsire: e.damsire,
      trainer: e.trainerName,
      trainerId: e.trainerId,
      owner: e.ownerName,
      ownerId: e.ownerId,
      runningOwner: "",
      breeder: e.breeder,
      color: "",
      sex: "",
      career: [],
      races: [],
      idmanlar: [],
      surfaceStats: { bySurface: { cim: { starts: 0, wins: 0, winPct: 0 }, kum: { starts: 0, wins: 0, winPct: 0 }, sentetik: { starts: 0, wins: 0, winPct: 0 } }, byDistance: { kisa: { starts: 0, wins: 0, winPct: 0 }, orta: { starts: 0, wins: 0, winPct: 0 }, uzun: { starts: 0, wins: 0, winPct: 0 } }, bestSurface: null, bestDistance: null, sample: 0 },
    };
    const profile = (e.id && byId.get(e.id)) || fallback;
    return { entryId: e.id, profile, jockey: (e.jockeyId && jmap.get(e.jockeyId)) || null };
  });
}

// --- GPT çağrısı (Responses API + web araması, olmazsa Chat Completions) ---

type ResponsesOutputItem = {
  type?: string;
  content?: { type?: string; text?: string }[];
};

function extractResponsesText(data: unknown): string {
  const out = (data as { output?: ResponsesOutputItem[] })?.output || [];
  const chunks: string[] = [];
  for (const item of out) {
    if (item.type !== "message" || !Array.isArray(item.content)) continue;
    for (const c of item.content) {
      if ((c.type === "output_text" || c.type === "text") && c.text) chunks.push(c.text);
    }
  }
  return chunks.join("").trim();
}

function openAiError(text: string, status: number): Error {
  let msg = `GPT isteği başarısız (HTTP ${status})`;
  try {
    const data = text ? JSON.parse(text) : null;
    const apiMsg =
      (data as { error?: { message?: string } })?.error?.message ||
      (typeof (data as { error?: unknown })?.error === "string" ? (data as { error: string }).error : "") ||
      (data as { message?: string })?.message ||
      "";
    if (apiMsg) msg = apiMsg;
  } catch {
    /* ham metni kullan */
  }
  if (status === 401) return new Error(`API anahtarı geçersiz (401): ${msg}`);
  if (status === 403) return new Error(`API anahtarı reddedildi (403): ${msg}`);
  if (status === 429)
    return new Error("Kota doldu / çok fazla istek (429). Biraz bekleyip tekrar deneyin.");
  return new Error(msg);
}
// tüketim kuralları ANALIST_TALIMATI'nın Bölüm 2'sindedir.

// Sunucudaki nano özetçi kotasız kalırsa (raw:true) ham bloğu cihaz anahtarıyla
// özetleriz. gpt-5-nano: OpenAI'da sk-…, OpenRouter'da sk-or-… anahtarla çalışır.
// Şema, araştırma ekibinin çıktı şemasıyla uyumlu (kompakt).
export const NANO_OZET_GOREVI =
  "Görev: Yukarıdaki ham web sonuçlarını araştırma ekibi şemasına çevir:\n" +
  "## SON DAKİKA — her at için: `at adı — bilgi (kaynak adı)` veya `yok`\n" +
  "## UZMAN TABLOSU — her satır: `[n] kaynak adı | URL | yayın tarihi veya 'belirsiz' | ağırlık | gösterdiği atlar | tek cümle`\n" +
  "## PİST NOTU — tek kısa paragraf (yoksa 'yok')\n" +
  "## BULUNAMAYANLAR — hangi atlar için ne bulunamadı (tek satırlık liste)\n" +
  "Uydurma yasak; ham metinde olmayan bilgiyi yazma. Türkçe, kompakt.";

export async function nanoSentezCihaz(icerik: string, apiKey: string): Promise<string> {
  if (!icerik || !apiKey) return "";
  const talimat =
    "Sen bir araştırma editörüsün: verilen ham web sonuçlarını yapılandırılmış kısa özete çevirirsin. " +
    "Uydurma yasak: kaynakta olmayan bilgiyi yazmazsın; olmayanı 'yok' olarak işaretlersin.\n\n" +
    `${icerik}\n\n---\n${NANO_OZET_GOREVI}`;
  const openRouter = isOpenRouterKey(apiKey);
  const url = openRouter ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
  const body: Record<string, unknown> = openRouter
    ? {
        model: "openai/gpt-5-nano",
        max_tokens: 2000,
        messages: [{ role: "user", content: talimat }],
      }
    : {
        model: "gpt-5-nano",
        max_completion_tokens: 2000,
        messages: [{ role: "user", content: talimat }],
      };
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  if (openRouter) {
    try {
      headers["HTTP-Referer"] = window.location.origin;
      headers["X-Title"] = "Ganian";
    } catch {
      /* yok say */
    }
  }
  try {
    const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const text = await r.text();
    if (!r.ok) return "";
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      return "";
    }
    return (
      (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content?.trim() || ""
    );
  } catch {
    return "";
  }
}

// OpenRouter: OpenAI ile uyumlu /chat/completions uç noktası (Responses API yok).

// OpenRouter: OpenAI ile uyumlu /chat/completions uç noktası (Responses API yok).
// Cihaz anahtarı sk-or-… ise analiz doğrudan OpenRouter'a gider. Web araştırması
// Tavily/Sonar'dan gelmişse (haveResearch) arama eklentisi eklenmez.
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

async function callOpenRouterDevice(
  prompt: string,
  apiKey: string,
  model: string,
  effort: string,
  haveResearch = false,
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  try {
    headers["HTTP-Referer"] = window.location.origin;
    headers["X-Title"] = "Ganian";
  } catch {
    /* yok say */
  }
  const wantReason = !/^(none|minimal)$/i.test(effort) && /^(gpt-6|gpt-5|o[134])/i.test(model);
  const rEffort = effort === "xhigh" ? "high" : effort;
  const maxOut = model.toLowerCase().includes("3.5") ? 4000 : /^(gpt-6|gpt-5|o)/i.test(model) ? 16000 : 8192;

  let msgs: { role: string; content: string }[] = [
    {
      role: "system",
      content:
        "Sen bir spor medyası platformu için çalışan bir at yarışı editörü ve form analistisin. " +
        "Görevin yalnızca bilgilendirici ve eğitsel spor analizi üretmektir: geçmiş performans verilerini " +
        "yorumlar, olasılıkları tartışır, hiçbir sonucu garanti etmezsin. " +
        "At numaralarından oluşan kupon şablonu editoryal içeriktir ve istendiğinde verilir; para miktarı tavsiye edilmez.",
    },
    { role: "user", content: prompt },
  ];
  // Devam turlarında parçalar biriktirilir (sunucu yolundakiyle aynı kural).
  let full = "";

  for (let attempt = 1; attempt <= 6; attempt++) {
    let res: Response;
    try {
      res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: msgs,
          max_tokens: maxOut,
          ...(!haveResearch && msgs.length <= 2 ? { plugins: [{ id: "web" }] } : {}),
          ...(wantReason ? { reasoning: { effort: rEffort } } : {}),
        }),
      });
    } catch {
      throw new Error("OpenRouter'a ulaşılamadı (ağ hatası). İnternet/adblock kontrol et ya da sunucu anahtarını kullan.");
    }
    const text = await res.text();
    if (res.ok) {
      let data: unknown = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(`OpenRouter geçersiz yanıt döndü (HTTP ${res.status})`);
      }
      const choice = (data as { choices?: { message?: { content?: string }; finish_reason?: string }[] })?.choices?.[0];
      const piece = choice?.message?.content?.trim() || "";
      if (!piece) throw new Error("OpenRouter boş yanıt döndü. Tekrar deneyin.");
      full += (full ? "\n" : "") + piece;
      if (choice?.finish_reason === "length" && attempt < 6) {
        msgs = [
          ...msgs,
          { role: "assistant", content: piece },
          { role: "user", content: "Cevabın uzunluk sınırında kesildi. Özetlemeden, baştan başlamadan ve hiçbir şeyi tekrar etmeden, kaldığın yerden doğrudan devam et." },
        ];
        continue;
      }
      return full;
    }
    // reasoning desteklemeyen model: muhakemesiz bir kez daha dene
    if (wantReason && /reasoning|effort/i.test(text)) {
      continue;
    }
    if (/429|rate limit|tokens per min|try again/i.test(text) && attempt < 6) {
      await new Promise((r) => setTimeout(r, Math.min(2000 * attempt, 20000)));
      continue;
    }
    throw openAiError(text, res.status);
  }
  // Turlar bitti ama bir şey biriktiyse onu dön (boşa gitmesin).
  if (full) return full;
  throw new Error("OpenRouter isteği başarısız. Tekrar deneyin.");
}

export async function callGpt(
  prompt: string,
  apiKey: string,
  modelOverride?: string,
  effortOverride?: string,
  haveResearch = false,
): Promise<string> {
  const model = modelOverride || getGptModel();
  const effort = effortOverride || getGptEffort();

  // 0) Önce sunucudaki gömülü anahtarı dene (anahtar tarayıcıya hiç verilmez).
  // Cihazda anahtar varsa sağlayıcısını da bildiririz; sunucuda o sağlayıcının
  // anahtarı yoksa (501 NO_SERVER_KEY) cihaz anahtarıyla devam eder.
  try {
    const r = await fetch("/api/analiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        model,
        effort,
        haveResearch,
        provider: apiKey ? (isOpenRouterKey(apiKey) ? "openrouter" : "openai") : undefined,
      }),
    });
    const t = await r.text();
    let d: unknown = null;
    try {
      d = t ? JSON.parse(t) : null;
    } catch {
      /* sunucu dışı yanıtsa direkt aramaya düş */
    }
    if (r.ok) {
      const out = (d as { text?: string })?.text?.trim() || "";
      if (out) return out;
    } else if (r.status !== 501 && (d as { error?: string })?.error) {
      throw new Error((d as { error: string }).error);
    }
    // 501 ise fallback: cihaz anahtarı
  } catch (e) {
    // Sunucu hatası gerçek bir analiz hatasıysa (401/403/429/kota) direkt göster,
    // yoksa (sunucu kapalı / anahtar yok) cihaz anahtarıyla doğrudan sağlayıcıya düş.
    if (e instanceof Error && /401|403|429|Kota|geçersiz|reddedildi/i.test(e.message)) throw e;
  }

  if (!apiKey) {
    throw new Error(
      "Sunucuda API anahtarı yok ve cihazda anahtar girilmedi. Önce server'a OPENAI_API_KEY ya da OPENROUTER_API_KEY tanımla, ya da Analiz penceresinden anahtar gir (sk-… OpenAI, sk-or-… OpenRouter).",
    );
  }

  // OpenRouter anahtarı (sk-or-…): doğrudan OpenRouter'a git
  if (isOpenRouterKey(apiKey)) {
    return callOpenRouterDevice(prompt, apiKey, model, effort, haveResearch);
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  // GPT-5 / GPT-6 / o-serisi muhakeme (reasoning) tokenlarını da aynı tavandan yer;
  // tavan düşükse cevap yarıda kesilir. Bu modellere daha yüksek tavan + düşük
  // muhakeme eforu veriyoruz ki tokenlar cevaba kalsın.
  const low = model.toLowerCase();
  const canReason = /^(gpt-6([.-]|$)|gpt-5([.-]|$)|o[134](-|mini|$))/.test(low) && !low.includes("chat");
  const maxOut = low.includes("3.5") ? 4000 : /^(gpt-6|gpt-5|o)/i.test(model) ? 16000 : 8192;

  // 1) Responses API + web araması (idman/galop ve güncel form araştırması için)
  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        instructions:
          "Sen bir spor medyası platformu için çalışan bir at yarışı editörü ve form analistisin. " +
          "Görevin yalnızca bilgilendirici ve eğitsel spor analizi üretmektir: geçmiş performans verilerini " +
          "yorumlar, olasılıkları tartışır, hiçbir sonucu garanti etmezsin. Yanıtların gazetecilik ve " +
          "istatistik çerçevesindedir; para miktarı tavsiye etmez, bahis oynatmazsın. " +
          "At numaralarından oluşan kupon şablonu editoryal içeriktir ve istendiğinde verilir.",
        input: prompt,
        ...(haveResearch ? {} : { tools: [{ type: "web_search" }] }),
        ...(canReason ? { reasoning: { effort } } : {}),
        max_output_tokens: maxOut,
      }),
    });
    const text = await res.text();
    if (res.ok) {
      let data: unknown = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(`GPT geçersiz yanıt döndü (HTTP ${res.status})`);
      }
      const out = extractResponsesText(data);
      if (out) return out;
      // Boşsa chat'e düş
    } else if (/reasoning|effort/i.test(text)) {
      // Seçili efor bu modelde yoksa muhakemesiz tekrar dene
      const retry = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          instructions:
            "Sen bir spor medyası platformu için çalışan bir at yarışı editörü ve form analistisin. " +
            "Görevin yalnızca bilgilendirici ve eğitsel spor analizi üretmektir.",
          input: prompt,
          ...(haveResearch ? {} : { tools: [{ type: "web_search" }] }),
          max_output_tokens: maxOut,
        }),
      });
      const text2 = await retry.text();
      if (retry.ok) {
        let data2: unknown = null;
        try {
          data2 = text2 ? JSON.parse(text2) : null;
        } catch {
          throw new Error(`GPT geçersiz yanıt döndü (HTTP ${retry.status})`);
        }
        const out2 = extractResponsesText(data2);
        if (out2) return out2;
        // Boşsa chat'e düş
      } else if (!/tool|web_search|invalid|not supported|unknown/i.test(text2)) {
        throw openAiError(text2, retry.status);
      }
      // tool desteklenmiyorsa aşağıdaki chat'e düş
    } else if (!/tool|web_search|invalid|not supported|unknown/i.test(text)) {
      throw openAiError(text, res.status);
    }
    // tool desteklenmiyorsa aşağıdaki chat'e düş
  } catch (e) {
    if (e instanceof Error && /401|403|429|geçersiz|reddedildi|Kota/i.test(e.message)) throw e;
    // ağ/tool hatasında chat'e düş
  }

  // 2) Fallback: klasik Chat Completions (reasoning modellerle uyumlu parametreler)
  let chat: Response;
  try {
    chat = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Sen bir spor medyası platformu için çalışan bir at yarışı editörü ve form analistisin. " +
            "Görevin yalnızca bilgilendirici ve eğitsel spor analizi üretmektir: geçmiş performans verilerini " +
            "yorumlar, olasılıkları tartışır, hiçbir sonucu garanti etmezsin. " +
            "At numaralarından oluşan kupon şablonu editoryal içeriktir ve istendiğinde verilir; para miktarı tavsiye edilmez.",
          },
          { role: "user", content: prompt },
        ],
        max_completion_tokens: maxOut,
      }),
    });
  } catch {
    throw new Error("OpenAI'ye ulaşılamadı (ağ hatası). İnternet/adblock kontrol et ya da sunucu anahtarını kullan.");
  }
  const chatText = await chat.text();
  if (!chat.ok) throw openAiError(chatText, chat.status);
  let chatData: unknown = null;
  try {
    chatData = chatText ? JSON.parse(chatText) : null;
  } catch {
    throw new Error(`GPT geçersiz yanıt döndü (HTTP ${chat.status})`);
  }
  const out =
    (chatData as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content?.trim() ||
    "";
  if (!out) throw new Error("GPT boş yanıt döndü. Tekrar deneyin.");
  return out;
}
