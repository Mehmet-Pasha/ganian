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
  searchNames,
} from "./tjk/client.mjs";

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

app.post("/api/analiz", async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(501).json({ error: "Sunucuda API anahtarı yok (OPENAI_API_KEY tanımlı değil)", code: "NO_SERVER_KEY" });
  }
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
  let model = typeof req.body?.model === "string" && req.body.model.trim() ? req.body.model.trim() : "gpt-5.6-sol";
  let effort = typeof req.body?.effort === "string" && req.body.effort.trim() ? req.body.effort.trim() : "low";
  if (!prompt || prompt.length < 50) return res.status(400).json({ error: "Geçersiz prompt" });
  if (prompt.length > 200000) return res.status(413).json({ error: "Prompt çok büyük" });
  if (model.length > 80 || /[^A-Za-z0-9._:-]/.test(model)) return res.status(400).json({ error: "Geçersiz model" });

  // GPT-6 Astra none effort desteklemez
  if (/^gpt-6/i.test(model) && effort === "none") effort = "low";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPENAI_API_KEY}`,
  };
  const low = model.toLowerCase();
  const canReason = /^(gpt-6([.-]|$)|gpt-5([.-]|$)|o[134](-|mini|$))/.test(low) && !low.includes("chat");
  const maxOut = low.includes("3.5") ? 4000 : /^(gpt-6|gpt-5|o)/i.test(model) ? 16000 : 8192;

  try {
    for (let attempt = 1; attempt <= 4; attempt++) {
      const r = await fetch("https://api.openai.com/v1/responses", {
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
          tools: [{ type: "web_search" }],
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
          return res.status(502).json({ error: `GPT geçersiz yanıt döndü (HTTP ${r.status})` });
        }
        const out = extractResponsesText(data);
        if (out) return res.json({ text: out, model, via: "responses" });
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
          return res.status(502).json({ error: openAiErrorText(text, r.status) });
        }
        console.error(`[analiz] responses tool uyumsuzluğu, chat yedeğine düşülüyor (${r.status}):`, text.slice(0, 300));
      } else {
        console.error(`[analiz] responses tool hatası, chat yedeğine düşülüyor (${r.status}):`, text.slice(0, 300));
      }
      break;
    }
  } catch {
    /* chat fallback'e düş */
  }

  try {
    let chat = null;
    let chatText = "";
    for (let attempt = 1; attempt <= 4; attempt++) {
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
              "Görevin yalnızca bilgilendirici ve eğitsel spor analizi üretmektir. " +
              "At numaralarından oluşan kupon şablonu editoryal içeriktir ve istendiğinde verilir; para miktarı tavsiye edilmez.",
            },
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
    if (!chat.ok) return res.status(502).json({ error: openAiErrorText(chatText, chat.status) });
    let chatData = null;
    try {
      chatData = chatText ? JSON.parse(chatText) : null;
    } catch {
      return res.status(502).json({ error: `GPT geçersiz yanıt döndü (HTTP ${chat.status})` });
    }
    const out = chatData?.choices?.[0]?.message?.content?.trim() || "";
    if (!out) return res.status(502).json({ error: "GPT boş yanıt döndü. Tekrar deneyin." });
    return res.json({ text: out, model, via: "chat" });
  } catch (err) {
    return res.status(502).json({ error: err instanceof Error ? err.message : "Analiz başarısız" });
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
