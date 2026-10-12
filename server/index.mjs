import express from "express";
import compression from "compression";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import {
  horseFavoritesBatch,
  jockeyFavoritesBatch,
  loadDayCard,
  loadHorse,
  loadJockey,
  loadLeaderboard,
  loadPerson,
  loadSiblings,
  loadVideoUrl,
  pedigreeBatch,
  searchNames,
} from "./tjk/client.mjs";
import { loadWeights, loadSources, ogrenmeEnjeksiyonu } from "./botEngine.mjs";
import * as analizDeposu from "./analizDeposu.mjs";
import { initBot } from "./bot.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env dosyasını bağımlılık kullanmadan yükle (herkesin `npm install dotenv`
// etmesi gerekmesin diye). Zaten export edilmiş gerçek ENV değişkeni kazanır.
try {
  const envPath = path.join(__dirname, "..", ".env");
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    // satır içi yorum: tırnaksız değerde " #" sonrasını at (BOT_MODEL=gpt-5-mini # not)
    else if (v.includes(" #")) v = v.split(" #")[0].trim();
    if (k && !(k in process.env)) process.env[k] = v;
  }
} catch {
  /* .env yoksa sorun değil */
}
const app = express();
app.use(compression());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 8787;
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || "").trim();
// OpenRouter (https://openrouter.ai): Orta/Yüksek araştırma derinliği için
// Perplexity Sonar modelini bu anahtarla çalıştırır. OpenRouter anahtarları
// "sk-or-" ile başlar. Tanımlı değilse araştırma otomatik olarak Düşük'e düşer.
const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || "").trim();
// Tavily: Düşük araştırma katmanının arama motoru (tavily.com, ücretsiz kota).
const TAVILY_API_KEY = (process.env.TAVILY_API_KEY || "").trim();

function isoOk(v) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

function idOk(v) {
  return typeof v === "string" && v.length > 0 && v.length <= 32 && /^[A-Za-z0-9_-]+$/.test(v);
}

function safeQueryString(v) {
  if (Array.isArray(v)) return String(v[0] ?? "");
  return String(v ?? "");
}

app.get("/api/gun/:iso", async (req, res) => {
  const { iso } = req.params;
  const region = req.query.bolge === "dunya" ? "dunya" : req.query.bolge === "all" ? "all" : "tr";
  if (!isoOk(iso)) return res.status(400).json({ error: "Geçersiz tarih formatı (YYYY-MM-DD bekleniyor)" });
  try {
    const data = await loadDayCard(iso, region);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Veri alınamadı", date: iso, meetings: [] });
  }
});

app.get("/api/at/:id", async (req, res) => {
  const id = safeQueryString(req.params.id);
  if (!idOk(id)) return res.status(400).json({ error: "Geçersiz at ID" });
  try {
    const data = await loadHorse(id);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "At bilgisi alınamadı" });
  }
});

app.get("/api/jokey/:id", async (req, res) => {
  const id = safeQueryString(req.params.id);
  if (!idOk(id)) return res.status(400).json({ error: "Geçersiz jokey ID" });
  try {
    const data = await loadJockey(id, safeQueryString(req.query.ad));
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Jokey bilgisi alınamadı" });
  }
});

app.get("/api/kisi/:kind/:id", async (req, res) => {
  const kind = safeQueryString(req.params.kind) === "antrenor" ? "antrenor" : "sahip";
  const id = safeQueryString(req.params.id);
  if (!idOk(id)) return res.status(400).json({ error: "Geçersiz ID" });
  try {
    const data = await loadPerson(kind, id);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Bilgi alınamadı" });
  }
});

app.get("/api/video/:atId/:kosuKod", async (req, res) => {
  const atId = safeQueryString(req.params.atId);
  const kosuKod = safeQueryString(req.params.kosuKod);
  if (!idOk(atId) || !kosuKod) return res.status(400).json({ error: "Geçersiz parametre", url: "", page: "" });
  try {
    const data = await loadVideoUrl(atId, kosuKod);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Video bulunamadı", url: "", page: "" });
  }
});

app.get("/api/ara", async (req, res) => {
  const q = safeQueryString(req.query.q);
  if (q.length > 100) return res.status(400).json({ error: "Arama çok uzun" });
  try {
    const data = await searchNames(q);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Arama başarısız", results: [] });
  }
});

app.get("/api/at/:id/kardesler", async (req, res) => {
  const id = safeQueryString(req.params.id);
  if (!idOk(id)) return res.status(400).json({ error: "Geçersiz at ID", sire: "", horses: [] });
  try {
    const data = await loadSiblings(id);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Bilgi alınamadı", sire: "", horses: [] });
  }
});

app.get("/api/liderlik", async (req, res) => {
  const rawGun = safeQueryString(req.query.gun);
  const parsed = Number.parseInt(rawGun, 10);
  const days = Math.min(90, Math.max(7, Number.isFinite(parsed) ? parsed : 30));
  try {
    const data = await loadLeaderboard(days);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Bilgi alınamadı", jockeys: [], trainers: [] });
  }
});

app.get("/api/oz/atlar", async (req, res) => {
  const raw = safeQueryString(req.query.ids);
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter(idOk);
  if (!ids.length) return res.json({});
  try {
    const data = await horseFavoritesBatch(ids);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Bilgi alınamadı" });
  }
});

app.get("/api/oz/jokeyler", async (req, res) => {
  const raw = safeQueryString(req.query.ids);
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter(idOk);
  if (!ids.length) return res.json({});
  try {
    const data = await jockeyFavoritesBatch(ids);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Bilgi alınamadı" });
  }
});

// Pedigri eğilimi (toplu): baba döllerinin son 30 gün zemin/mesafe performansı.
app.get("/api/pedigree/toplu", async (req, res) => {
  const raw = safeQueryString(req.query.ids);
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter(idOk)
    .slice(0, 30);
  if (!ids.length) return res.json({});
  try {
    const data = await pedigreeBatch(ids);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Bilgi alınamadı" });
  }
});

app.get("/api/saglik", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// AI analiz proxy: OPENAI_API_KEY yalnızca sunucuda durur, tarayıcıya hiç verilmez.
// Frontend önce burayı dener; anahtar yoksa 501 döner ve frontend localStorage'daki
// kullanıcı anahtarıyla doğrudan OpenAI'ye gider.
app.get("/api/analiz/durum", (_req, res) => {
  res.json({ serverKey: Boolean(OPENAI_API_KEY) });
});

function openAiErrorText(text, status) {
  let msg = `GPT isteği başarısız (HTTP ${status})`;
  try {
    const data = text ? JSON.parse(text) : null;
    const apiMsg = data?.error?.message || "";
    if (apiMsg) msg = apiMsg;
  } catch {
    /* ham metni kullan */
  }
  return msg;
}

function extractResponsesText(data) {
  const out = data?.output || [];
  const chunks = [];
  for (const item of out) {
    if (item.type !== "message" || !Array.isArray(item.content)) continue;
    for (const c of item.content) {
      if ((c.type === "output_text" || c.type === "text") && c.text) chunks.push(c.text);
    }
  }
  return chunks.join("").trim();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 429 rate-limit'te OpenAI "try again in Xs" der; onu yakala, en az 2 sn bekle.
function retryDelayMs(text, attempt) {
  let ms = 2000 * attempt;
  try {
    const m = /try again in ([\d.]+)s/i.exec(text || "");
    if (m) ms = Math.max(ms, Math.ceil(parseFloat(m[1]) * 1000) + 500);
  } catch {
    /* varsayılan bekleme */
  }
  return Math.min(ms, 20000);
}

function isRateLimit(text, status) {
  return status === 429 || /rate limit|tokens per min|TPM|try again/i.test(text || "");
}

// ---------------------------------------------------------------------------
// Web araştırması (3 derinlik): Düşük = Tavily + gpt-5-nano özet; Orta =
// Perplexity Sonar (OpenRouter); Yüksek = Sonar + Tavily + nano birleştirme.
// Özet bir kez üretilip analiz modeline verilir; analiz modeli web'e çıkamaz —
// arama maliyeti sabit ve öngörülebilir kalır.
// ---------------------------------------------------------------------------

const TAVILY_URL = "https://api.tavily.com/search";
const TAVILY_BASLIK =
  "# HAM WEB SONUÇLARI (Tavily, domain hedefli tarama)\n";
const tavilyCache = new Map(); // sorgu -> { at, data }
const sonarCache = new Map(); // prompt -> { at, digest }

const TAVILY_SONUC_LIMITI = 3; // sorgu başına sonuç
const TAVILY_OZET_SINIRI = 420; // sonuç başına karakter

function cacheGet(map, key, ttlMs) {
  const hit = map.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > ttlMs) {
    map.delete(key);
    return null;
  }
  return hit.data;
}

function cacheSet(map, key, data, maxEntries) {
  map.set(key, { at: Date.now(), data });
  if (map.size > maxEntries) {
    const oldest = [...map.entries()].sort((a, b) => a[1].at - b[1].at).slice(0, Math.ceil(maxEntries / 5));
    for (const [k] of oldest) map.delete(k);
  }
}

async function tavilySearch(query, maxResults) {
  const hit = cacheGet(tavilyCache, query, 30 * 60 * 1000);
  if (hit) return hit;
  const r = await fetch(TAVILY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      max_results: maxResults,
      search_depth: "basic",
      include_answer: false,
      // Türkçe yarış içeriği bu sitelerde yoğun; genel aramada kaçanları yakalar.
      include_domains: ["liderform.com.tr", "yenibeygir.com", "atyarisi.com", "atyarisi.ai", "nesine.com", "hipodrom.com", "tjk.org", "apw.com.tr", "sozcu.com.tr", "sporx.com", "birebin.com", "istinyeganyan.com", "pegadrom.com", "yaristayiz.com"],
    }),
  });
  if (!r.ok) throw new Error(`Tavily HTTP ${r.status}`);
  const data = await r.json();
  const out = (data?.results || []).slice(0, maxResults).map((x) => ({
    title: String(x?.title || "").slice(0, 120),
    url: String(x?.url || ""),
    content: String(x?.content || "").slice(0, TAVILY_OZET_SINIRI),
  }));
  cacheSet(tavilyCache, query, out, 500);
  return out;
}

async function buildTavilyDigest(queries) {
  const list = (queries || []).map((q) => String(q || "").trim().slice(0, 180)).filter(Boolean);
  if (!list.length) return "";
  const groups = await Promise.all(
    list.map((q, i) =>
      tavilySearch(q, i === 0 ? TAVILY_SONUC_LIMITI : 2).catch(() => []),
    ),
  );
  const parts = [TAVILY_BASLIK];
  for (const g of groups) {
    if (!g.length) continue;
    for (const r of g) {
      let host = "";
      try {
        host = new URL(r.url).hostname.replace(/^www\./, "");
      } catch {
        host = r.url.slice(0, 60);
      }
      parts.push(`1. ${r.title} — ${host}\n   ${r.content.replace(/\s+/g, " ").trim()}`);
    }
    parts.push("");
  }
  return parts.join("\n").trim();
}

async function sonarResearch(sonarPrompt) {
  if (!sonarPrompt) return "";
  const hit = cacheGet(sonarCache, sonarPrompt, 30 * 60 * 1000);
  if (hit) return hit;
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://ganian.com",
      "X-Title": "Ganian",
    },
    body: JSON.stringify({
      model: "perplexity/sonar",
      messages: [
        {
          role: "system",
          content:
            "Sen Türkiye at yarışları (TJK) üzerine uzmanlaşmış bir araştırma editörüsün. Verilen görevi web'de araştırıp kaynaklı ve kompakt bir özet üretirsin. Uydurma yasak: bulamadığın bilgiyi 'yok' yazarsın. Sonuç garantisi vermezsin, bahis tavsiyesi yapmazsın.",
        },
        { role: "user", content: sonarPrompt },
      ],
      max_tokens: 8000,
    }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Sonar HTTP ${r.status}: ${text.slice(0, 200)}`);
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Sonar geçersiz yanıt (HTTP ${r.status})`);
  }
  const digest = data?.choices?.[0]?.message?.content?.trim() || "";
  if (digest) cacheSet(sonarCache, sonarPrompt, digest, 50);
  return digest;
}

// gpt-5-nano: ham arama sonuçlarını yapılandırılmış özete çevirir (en ucuz adım).
// Not: talimatı tek user mesajında gönderiyoruz — gpt-5 ailesi chat completions'ta
// system rolünü bazen reddediyor; hata olursa ham blok fallback olarak gider.
async function nanoSentez(gorev, icerik, maxTokens) {
  if (!OPENAI_API_KEY || !icerik) return "";
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-nano",
        max_completion_tokens: maxTokens || 2000,
        messages: [
          {
            role: "user",
            content:
              "Sen bir araştırma editörüsün: verilen ham web sonuçlarını yapılandırılmış kısa özete çevirirsin. " +
              "Uydurma yasak: kaynakta olmayan bilgiyi yazmazsın; olmayanı 'yok' olarak işaretlersin.\n\n" +
              `${icerik}\n\n---\n${gorev}`,
          },
        ],
      }),
    });
    const text = await r.text();
    if (!r.ok) {
      console.error(`[arastirma] nano hatası (${r.status}):`, text.slice(0, 200));
      return "";
    }
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      return "";
    }
    return data?.choices?.[0]?.message?.content?.trim() || "";
  } catch {
    return "";
  }
}

const NANO_GOREV_TAVILY =
  "Görev: Yukarıdaki ham web sonuçlarını araştırma ekibi şemasına çevir:\n" +
  "## SON DAKİKA — her at için: `at adı — bilgi (kaynak adı)` veya `yok`\n" +
  "## UZMAN TABLOSU — her satır: `[n] kaynak adı | URL | yayın tarihi veya 'belirsiz' | ağırlık | gösterdiği atlar | tek cümle`\n" +
  "## PİST NOTU — tek kısa paragraf (yoksa 'yok')\n" +
  "## BULUNAMAYANLAR — hangi atlar için ne bulunamadı (tek satırlık liste)\n" +
  "Uydurma yasak; ham metinde olmayan bilgiyi yazma. Türkçe, kompakt; ≤600 kelime.";

const NANO_GOREV_BIRLESTIR =
  "Görev: Aşağıdaki araştırma çıktılarını TEK bir özette birleştir (şema: SON DAKİKA / UZMAN TABLOSU / PİST NOTU / BULUNAMAYANLAR). " +
  "Kurallar: " +
  "1) Tüm metinde TEK artan [n] numaralandırması kullan; aynı kaynağı tekilleştir, iki kez sayma. " +
  "2) Uzman tablosunda her kaynağın URL + yayın tarihi alanını KORU. " +
  "3) 'Program verisiyle aynı' teyit niteliğindeki son dakika satırlarını at (jokey/antrenör zaten biliniyorsa satır yok sayılır). " +
  "4) Aynı bilgiyi tekilleştir; çelişkiyi 'kaynaklar farklı söylüyor' notuyla koru. " +
  "Uydurma yasak; Türkçe, kompakt; ≤900 kelime.";

// Araştırma katmanı — hem istemci uç noktası hem sunucu botu bu fonksiyonu
// kullanır. Öğrenilmiş kaynak ağırlıkları burada prompt'lara enjekte edilir
// (kendi kendini geliştiren döngünün bağlantı noktası).
async function arastirmaYap({ depth, queries = [], sonarPrompts = [] }) {
  const d = depth === "orta" ? "orta" : depth === "yuksek" ? "yuksek" : "dusuk";
  const qs = (Array.isArray(queries) ? queries : [])
    .map((q) => String(q ?? "").trim())
    .filter(Boolean)
    .slice(0, 6);
  // Yüksek: 2 odaklı prompt (son-dakika, uzman). Orta: 1 birleşik prompt.
  let prompts = (Array.isArray(sonarPrompts) ? sonarPrompts : [])
    .map((p) => String(p ?? "").slice(0, 60000))
    .filter(Boolean);
  if (!qs.length && !prompts.length) return { depth: d, digest: "", raw: false, error: "Sorgu yok" };

  // Anahtar yoksa otomatik güvenli düşüş: orta/yüksek → düşük; düşük için de
  // Tavily yoksa araştırmasız devam edilir (istemci eski davranışa döner).
  let used = d;
  if ((used === "orta" || used === "yuksek") && !OPENROUTER_API_KEY) used = "dusuk";
  if (used === "yuksek" && !TAVILY_API_KEY) used = "orta";
  if (used === "dusuk" && !TAVILY_API_KEY) {
    return { depth: used, digest: "", raw: false, error: "TAVILY_API_KEY tanımlı değil", code: "NO_RESEARCH_KEY" };
  }

  // Öğrenilmiş ağırlıklar + kapsam hedefi (bot ölçümü → araştırmacıya geri besleme)
  const enjeksiyon = ogrenmeEnjeksiyonu(loadWeights(), loadSources());
  if (enjeksiyon) prompts = prompts.map((p) => p + "\n" + enjeksiyon);


  try {
    if (used === "orta") {
      const digest = await sonarResearch(prompts[0]);
      return { depth: used, digest };
    }
    if (used === "yuksek") {
      // İki odaklı çağrı paralel; biri boş döndüğünede diğerinin çıktısı yeter.
      const [sonDakika, uzman] = await Promise.all(prompts.map((p) => sonarResearch(p).catch(() => "")));
      const joined = [sonDakika, uzman].filter(Boolean).join("\n\n---\n\n");
      // Tavily ham sonuçları da kat (domain hedefli — Sonar'ın kaçırabildiği Türkçe siteler).
      const tavilyBlock = TAVILY_API_KEY ? await buildTavilyDigest(qs).catch(() => "") : "";
      const merged = [joined, tavilyBlock].filter(Boolean).join("\n\n---\n\n");
      const digest = merged ? await nanoSentez(NANO_GOREV_BIRLESTIR, merged, 3000) : "";
      return {
        depth: used,
        digest: digest || merged,
        raw: !digest && Boolean(merged),
      };
    }
    // dusuk: Tavily + nano özet; nano başarısızsa (kota vb.) ham blok + raw
    // bayrağı gider — istemci kendi anahtarıyla nano özeti dener.
    const tavilyBlock = await buildTavilyDigest(qs).catch(() => "");
    const digest = tavilyBlock ? await nanoSentez(NANO_GOREV_TAVILY, tavilyBlock, 2000) : "";
    return { depth: used, digest: digest || tavilyBlock, raw: !digest && Boolean(tavilyBlock) };
  } catch (err) {
    return { depth: used, digest: "", raw: false, error: err instanceof Error ? err.message : "Araştırma başarısız" };
  }
}

app.post("/api/analiz/arastirma", async (req, res) => {
  const depth = req.body?.depth === "orta" ? "orta" : req.body?.depth === "yuksek" ? "yuksek" : "dusuk";
  const queries = (Array.isArray(req.body?.queries) ? req.body.queries : [])
    .map((q) => String(q ?? "").trim())
    .filter(Boolean)
    .slice(0, 6);
  const sonarPrompts = (Array.isArray(req.body?.sonarPrompts) ? req.body.sonarPrompts : [])
    .map((p) => String(p ?? "").slice(0, 60000))
    .filter(Boolean);
  if (!queries.length && !sonarPrompts.length) return res.status(400).json({ error: "Sorgu yok", digest: "" });
  const data = await arastirmaYap({ depth, queries, sonarPrompts });
  if (data.code === "NO_RESEARCH_KEY") return res.status(501).json({ error: data.error, code: data.code, digest: "" });
  if (data.error && !data.digest) return res.status(400).json({ error: data.error, digest: "" });
  res.json({ depth: data.depth, digest: data.digest, raw: data.raw });
});

// ---------------------------------------------------------------------------
// Analiz çekirdeği: istemci uç noktası VE bot aynı fonksiyonu kullanır.
// OpenAI anahtarı 401/403/429/kota verirse (varsa) OpenRouter'a otomatik düşer.
// ---------------------------------------------------------------------------

const ANALIZ_SISTEM_METNI =
  "Sen bir spor medyası platformu için çalışan bir at yarışı editörü ve form analistisin. " +
  "Görevin yalnızca bilgilendirici ve eğitsel spor analizi üretmektir: geçmiş performans verilerini " +
  "yorumlar, olasılıkları tartışır, hiçbir sonucu garanti etmezsin. Yanıtların gazetecilik ve " +
  "istatistik çerçevesindedir; para miktarı tavsiye etmez, bahis oynatmazsın. " +
  "At numaralarından oluşan kupon şablonu editoryal içeriktir ve istendiğinde verilir.";

async function analizOpenai(prompt, model, effort, haveResearch) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPENAI_API_KEY}`,
  };
  const low = model.toLowerCase();
  const canReason = /^(gpt-6([.-]|$)|gpt-5([.-]|$)|o[134](-|mini|$))/.test(low) && !low.includes("chat");
  const maxOut = low.includes("3.5") ? 4000 : /^(gpt-6|gpt-5|o)/i.test(model) ? 16000 : 8192;
  const hata = (msg, status = 502) => Object.assign(new Error(msg), { status });

  try {
    for (let attempt = 1; attempt <= 4; attempt++) {
      const r = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          instructions: ANALIZ_SISTEM_METNI,
          input: prompt,
          ...(haveResearch ? {} : { tools: [{ type: "web_search" }] }),
          ...(canReason ? { reasoning: { effort } } : {}),
          max_output_tokens: maxOut,
        }),
      });
      const text = await r.text();
      if (r.ok) {
        let data = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          throw hata(`GPT geçersiz yanıt döndü (HTTP ${r.status})`);
        }
        const out = extractResponsesText(data);
        if (out) return { text: out, via: "responses" };
        break; // boş yanıt: chat'e düş
      }
      if (isRateLimit(text, r.status) && attempt < 4) {
        await sleep(retryDelayMs(text, attempt));
        continue;
      }
      if (!/tool|web_search|invalid|not supported|unknown/i.test(text) || /reasoning|effort/i.test(text)) {
        // tool/effort uyumsuzluğu değilse gerçek hatayı dön; değilse chat fallback'e düş
        if (!/tool|web_search|invalid|not supported|unknown|reasoning|effort|rate limit|tokens per min|try again/i.test(text)) {
          console.error(`[analiz] responses hatası (${r.status}):`, text.slice(0, 300));
          throw hata(openAiErrorText(text, r.status));
        }
        console.error(`[analiz] responses tool uyumsuzluğu, chat yedeğine düşülüyor (${r.status}):`, text.slice(0, 300));
      } else {
        console.error(`[analiz] responses tool hatası, chat yedeğine düşülüyor (${r.status}):`, text.slice(0, 300));
      }
      break;
    }
  } catch (err) {
    // anahtar/kota hatası yukarı taşınır (analizYap sağlayıcı değiştirir); gerisi chat'e düşer
    if (err?.status) throw err;
  }

  let chat = null;
  let chatText = "";
  for (let attempt = 1; attempt <= 4; attempt++) {
    chat = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: ANALIZ_SISTEM_METNI },
          { role: "user", content: prompt },
        ],
        max_completion_tokens: maxOut,
      }),
    });
    chatText = await chat.text();
    if (chat.ok) break;
    if (isRateLimit(chatText, chat.status) && attempt < 4) {
      await sleep(retryDelayMs(chatText, attempt));
      continue;
    }
    break;
  }
  if (!chat.ok) throw hata(openAiErrorText(chatText, chat.status));
  let chatData = null;
  try {
    chatData = chatText ? JSON.parse(chatText) : null;
  } catch {
    throw hata(`GPT geçersiz yanıt döndü (HTTP ${chat.status})`);
  }
  const out = chatData?.choices?.[0]?.message?.content?.trim() || "";
  if (!out) throw hata("GPT boş yanıt döndü. Tekrar deneyin.");
  return { text: out, via: "chat" };
}

async function analizOpenrouter(prompt, model, effort, haveResearch) {
  // Model ID sağlayıcı öneki taşımıyorsa ekle (bot gpt-… yazabilir).
  const orModel = model.includes("/") || model.includes(":") ? model : `openai/${model}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    "HTTP-Referer": "https://ganian.com",
    "X-Title": "Ganian",
  };
  const rEffort = effort === "xhigh" ? "high" : effort;
  let useReason = !/^(none|minimal)$/i.test(effort) && /^(gpt-5|gpt-6|o[134])/i.test(orModel.split("/")[1] || orModel);
  let msgs = [
    { role: "system", content: ANALIZ_SISTEM_METNI },
    { role: "user", content: prompt },
  ];
  // Devam turlarında parçalar BİRİKTİRİLİR — yalnızca son parça dönerse raporun
  // başı kaybolur (canlı tespit: 8 sayfalık rapor "muyorum." diye ortadan başladı).
  let full = "";
  const hata = (msg, status = 502) => Object.assign(new Error(msg), { status });

  for (let attempt = 1; attempt <= 6; attempt++) {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: orModel,
        messages: msgs,
        max_tokens: 16000,
        ...(!haveResearch && msgs.length <= 2 ? { plugins: [{ id: "web" }] } : {}),
        ...(useReason ? { reasoning: { effort: rEffort } } : {}),
      }),
    });
    const text = await r.text();
    if (r.ok) {
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw hata(`OpenRouter geçersiz yanıt döndü (HTTP ${r.status})`);
      }
      const choice = data?.choices?.[0];
      const piece = choice?.message?.content?.trim() || "";
      if (!piece) throw hata("OpenRouter boş yanıt döndü. Tekrar deneyin.");
      // Satır sınırıyla birleştir: kesiği cümle ortasından gelirse de markdown
      // yumuşak satırı zararsızdır; başlık birleşmesi ("\n" olmadan) olmaz.
      full += (full ? "\n" : "") + piece;
      if (choice?.finish_reason === "length" && attempt < 6) {
        // Kesilen yanıt: kaldığı yerden devam (web eklentisi kapalı, maliyet sınırlı)
        msgs = [...msgs, { role: "assistant", content: piece }, { role: "user", content: "Cevabın uzunluk sınırında kesildi. Özetlemeden, baştan başlamadan ve hiçbir şeyi tekrar etmeden, kaldığın yerden doğrudan devam et." }];
        continue;
      }
      return { text: full, via: "openrouter" };
    }
    if (isRateLimit(text, r.status) && attempt < 6) {
      await sleep(retryDelayMs(text, attempt));
      continue;
    }
    if (useReason && /reasoning|effort/i.test(text)) {
      useReason = false;
      continue;
    }
    throw hata(openAiErrorText(text, r.status));
  }
  throw hata("OpenRouter isteği başarısız. Tekrar deneyin.");
}

async function analizYap({ prompt, model, effort, haveResearch, provider }) {
  const openaiOk = Boolean(OPENAI_API_KEY);
  const orOk = Boolean(OPENROUTER_API_KEY);
  if (!openaiOk && !orOk) {
    throw Object.assign(new Error("Sunucuda API anahtarı yok (OPENAI_API_KEY ya da OPENROUTER_API_KEY tanımlı değil)"), {
      status: 501,
      code: "NO_SERVER_KEY",
    });
  }
  let prov =
    provider === "openrouter" ? "openrouter" :
    provider === "openai" ? "openai" :
    openaiOk ? "openai" : "openrouter";
  const dene = (p) => (p === "openai" ? analizOpenai(prompt, model, effort, haveResearch) : analizOpenrouter(prompt, model, effort, haveResearch));
  try {
    return { ...(await dene(prov)), provider: prov };
  } catch (err) {
    const anahtarHatasi = /401|403|429|insufficient|no credits|quota|kota/i.test(err?.message || "");
    const other = prov === "openai" ? "openrouter" : "openai";
    const otherOk = other === "openai" ? openaiOk : orOk;
    if (anahtarHatasi && otherOk) {
      console.error(`[analiz] ${prov} anahtar/kota hatası, ${other} yedeğine geçiliyor:`, (err?.message || "").slice(0, 160));
      return { ...(await dene(other)), provider: other };
    }
    throw err;
  }
}

app.post("/api/analiz", async (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
  const model = typeof req.body?.model === "string" && req.body.model.trim() ? req.body.model.trim() : "gpt-5.6-sol";
  let effort = typeof req.body?.effort === "string" && req.body.effort.trim() ? req.body.effort.trim() : "low";
  if (!prompt || prompt.length < 50) return res.status(400).json({ error: "Geçersiz prompt" });
  if (prompt.length > 200000) return res.status(413).json({ error: "Prompt çok büyük" });
  if (model.length > 120 || /[^A-Za-z0-9._:/-]/.test(model)) return res.status(400).json({ error: "Geçersiz model" });

  // GPT-6 Astra none effort desteklemez
  if (/^gpt-6/i.test(model) && effort === "none") effort = "low";

  // İstemci araştırma özetini prompt'a eklediyse (haveResearch) modelin kendi
  // web_search aracını kapatırız — çifte arama ücreti olmasın.
  const haveResearch = req.body?.haveResearch === true;
  const provider = req.body?.provider === "openrouter" ? "openrouter" : req.body?.provider === "openai" ? "openai" : "";

  try {
    const data = await analizYap({ prompt, model, effort, haveResearch, provider });
    res.json(data);
  } catch (err) {
    const status = Number(err?.status) || 502;
    res.status(status).json({ error: err instanceof Error ? err.message : "Analiz başarısız", code: err?.code });
  }
});

// An-be-an bahis botu (sanal): analiz + araştırma çıktısını tüketir, bahis
// kurar, sonuçları ölçer, kaynak ağırlıklarını öğrenir. Kapatmak için .env:
// BOT_ENABLED=0
const BOT_ACIK = (process.env.BOT_ENABLED ?? "1").trim() !== "0";
initBot({
  app,
  helpers: {
    loadDayCard,
    loadHorse,
    loadJockey,
    loadLeaderboard,
    pedigreeBatch,
    arastirmaYap,
    analizYap,
  },
  ...(BOT_ACIK ? {} : { pasif: true }),
});

// --- Analiz arşivi: cihaz deposu (sunucu diski). Tarayıcı belleği kullanılmaz. ---
app.get("/api/analizler", (_req, res) => {
  res.json(analizDeposu.listAnalizler());
});

app.post("/api/analizler/kaydet", (req, res) => {
  const b = req.body || {};
  if (!b.analysis || typeof b.analysis !== "string") return res.status(400).json({ error: "analysis yok" });
  try {
    const rec = analizDeposu.saveAnaliz(b);
    res.json({ ok: true, id: rec.id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Kayıt başarısız" });
  }
});

app.delete("/api/analizler/:id", (req, res) => {
  try {
    res.json({ ok: analizDeposu.deleteAnaliz(req.params.id) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Silme başarısız" });
  }
});

// Üretimde derlenmiş frontend'i sun
const distDir = path.join(__dirname, "..", "dist");
app.use(express.static(distDir));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`TJK proxy + statik sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
