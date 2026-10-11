// Ganian an-be-an bahis botu — zamanlayıcı + koşu hattı.
// index.mjs initBot(...) ile bağlar; analiz/araştırma modüllerine DOKUNMAZ,
// onların çıktısını tüketir. Bahisler SANALDIR (TJK'nın yasal otomatik bahis
// API'si yoktur; motor kayıt + öğrenme yapar, para harcamaz).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadBets,
  saveBets,
  loadWeights,
  saveWeights,
  loadState,
  saveState,
  loadSources,
  saveSources,
  saveBotAnalysis,
  placeBets,
  hasBetsForRace,
  evaluateBet,
  updateSourceWeights,
  picksToNos,
  ozetHesapla,
} from "./botEngine.mjs";
import {
  buildRaceAnalysisPrompt,
  buildResearchPromptOrta,
  buildResearchPromptSonDakika,
  buildResearchPromptUzman,
  buildResearchQueries,
  extractBotVeri,
  parseResearchSources,
} from "../shared/prompt.ts";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function bugunIso() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
}

function simdiDakika() {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
  return d.getHours() * 60 + d.getMinutes();
}

function kosuDakikasi(time) {
  const m = /^(\d{1,2})[:.](\d{2})/.exec(String(time || ""));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export function initBot({ app, helpers, pasif = false }) {
  const {
    loadDayCard,
    loadHorse,
    loadJockey,
    loadLeaderboard,
    pedigreeBatch,
    arastirmaYap,
    analizYap,
  } = helpers;

  const CFG = {
    model: process.env.BOT_MODEL || "gpt-5-mini",
    effort: process.env.BOT_EFFORT || "low",
    depth: process.env.BOT_DEPTH || "orta",
    intervalMin: Number(process.env.BOT_INTERVAL_MIN || 20),
    maxRacesPerDay: Number(process.env.BOT_MAX_RACES_PER_DAY || 40),
    pencereSaat: Number(process.env.BOT_START_WINDOW_H || 14),
  };

  let tickRunning = false;
  let sonTick = null;

  function fallbackProfil(e, i) {
    return {
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
      pedigree: { source: "yok", sample: 0, surface: null, distance: null },
      surfaceStats: {
        bySurface: { cim: { starts: 0, wins: 0, winPct: 0 }, kum: { starts: 0, wins: 0, winPct: 0 }, sentetik: { starts: 0, wins: 0, winPct: 0 } },
        byDistance: { kisa: { starts: 0, wins: 0, winPct: 0 }, orta: { starts: 0, wins: 0, winPct: 0 }, uzun: { starts: 0, wins: 0, winPct: 0 } },
        bestSurface: null,
        bestDistance: null,
        sample: 0,
      },
    };
  }

  async function topluProfiller(ids) {
    const out = new Array(ids.length);
    let cur = 0;
    async function worker() {
      while (cur < ids.length) {
        const i = cur++;
        try {
          out[i] = await loadHorse(ids[i]);
        } catch {
          out[i] = null;
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(3, ids.length || 1) }, worker));
    return out;
  }

  async function runRaceForBot(meeting, race, kartTarihi = null) {
    const ids = race.horses.map((h) => h.id).filter(Boolean);
    const profiles = await topluProfiller(ids);
    const byId = new Map();
    profiles.forEach((p, i) => {
      if (!p) return;
      if (!p.name || /^At \d+$/i.test(p.name)) {
        const e = race.horses.find((x) => x.id === ids[i]);
        if (e?.name) p.name = e.name;
      }
      byId.set(ids[i], p);
    });

    // Jokey profilleri (en fazla 8 benzersiz, best-effort)
    const jockeys = [...new Map(race.horses.filter((h) => h.jockeyId).map((h) => [h.jockeyId, h.jockeyName])).entries()].slice(0, 8);
    const jmap = new Map();
    for (const [jid, jname] of jockeys) {
      try {
        jmap.set(jid, await loadJockey(jid, jname || ""));
      } catch {
        /* yok say */
      }
    }
    const enriched = race.horses.map((e, i) => ({
      entryId: e.id || `prog-${i}`,
      profile: byId.get(e.id) || fallbackProfil(e, i),
      jockey: jmap.get(e.jockeyId) || null,
    }));

    let forms = null;
    try {
      const lb = await loadLeaderboard(30);
      forms = { jockeys: lb.jockeys, trainers: lb.trainers };
    } catch {
      /* opsiyonel */
    }

    let pedigree = null;
    try {
      pedigree = await pedigreeBatch(ids);
    } catch {
      /* opsiyonel */
    }

    const depth = CFG.depth;
    const prompts =
      depth === "yuksek"
        ? [buildResearchPromptSonDakika(meeting, race), buildResearchPromptUzman(meeting, race)]
        : [buildResearchPromptOrta(meeting, race)];
    const research = await arastirmaYap({
      depth,
      queries: buildResearchQueries(meeting, race),
      sonarPrompts: prompts,
    });

    const prompt = buildRaceAnalysisPrompt(meeting, race, enriched, forms, pedigree, research.digest || "");
    const { text } = await analizYap({
      prompt,
      model: CFG.model,
      effort: CFG.effort,
      haveResearch: Boolean(research.digest),
    });

    const botVeri = extractBotVeri(text);
    const kaynakSatirlari = research.digest ? parseResearchSources(research.digest) : [];
    const sources = kaynakSatirlari
      .map((s) => ({ name: s.name, url: s.url, picks: picksToNos(s.picksRaw, race.horses) }))
      .filter((s) => s.picks.length);

    const raceKey = `${meeting.key}::${race.id || race.no}`;
    const bets = loadBets();
    let yerlesti = 0;
    if (!hasBetsForRace(bets, raceKey)) {
      const yeni = placeBets(
        botVeri,
        {
          raceKey,
          dateIso: kartTarihi || bugunIso(),
          meetingKey: meeting.key,
          raceNo: race.no,
          city: meeting.city,
          model: CFG.model,
          source: "bot",
        },
        race.horses,
      );
      saveBets([...bets, ...yeni]);
      yerlesti = yeni.length;
    }

    const srcMap = loadSources();
    srcMap[raceKey] = {
      dateIso: kartTarihi || bugunIso(),
      city: meeting.city,
      raceNo: race.no,
      sources,
      botVeri,
    };
    saveSources(srcMap);
    saveBotAnalysis(raceKey, text);

    const state = loadState();
    state.analyzedKeys = state.analyzedKeys || [];
    if (!state.analyzedKeys.includes(raceKey)) state.analyzedKeys.push(raceKey);
    saveState(state);

    console.log(
      `[bot] ${meeting.city} ${race.no}. koşu tamam | bahis: ${yerlesti} | botVeri: ${botVeri ? "ok" : "YOK (AGF fallback)"} | kaynak: ${sources.length}`,
    );
  }

  // Sonuç kontrolü: açık bahisleri sonuçlanan koşularda değerlendir + kaynak skorla
  async function checkOpenBets() {
    const bets = loadBets();
    const open = bets.filter((b) => b.status === "open");
    if (!open.length) return { checked: 0 };

    const byDate = new Map();
    for (const b of open) {
      if (!byDate.has(b.dateIso)) byDate.set(b.dateIso, []);
      byDate.get(b.dateIso).push(b);
    }

    const state = loadState();
    const scoredKeys = new Set(state.scoredKeys || []);
    const srcMap = loadSources();
    let weights = loadWeights();
    let checked = 0;

    for (const [dateIso, list] of byDate) {
      let card = null;
      try {
        card = await loadDayCard(dateIso, "tr");
      } catch {
        continue;
      }
      for (const bet of list) {
        const meeting = card?.meetings?.find((m) => m.key === bet.meetingKey);
        const race =
          meeting?.races?.find((r) => `${bet.meetingKey}::${r.id || r.no}` === bet.raceKey) ||
          meeting?.races?.find((r) => r.no === bet.raceNo);
        if (!race || !race.finished) continue;
        const resMap = {};
        for (const h of race.horses) {
          const p = Number.parseInt(h.position, 10);
          if (Number.isFinite(p) && p > 0 && h.no) resMap[Number(h.no)] = p;
        }
        if (!Object.keys(resMap).length) continue;
        bet.status = evaluateBet(bet, resMap) ? "won" : "lost";
        bet.evaluatedAt = new Date().toISOString();
        checked += 1;
        // kaynak skorlama (koşu başına bir kez)
        const info = srcMap[bet.raceKey];
        if (info?.sources && !scoredKeys.has(bet.raceKey)) {
          const { weights: w, scored } = updateSourceWeights(weights, bet.raceKey, info.sources, resMap);
          if (scored) {
            weights = w;
            scoredKeys.add(bet.raceKey);
          }
        }
      }
    }
    saveBets(bets);
    saveWeights(weights);
    saveState({ ...state, scoredKeys: [...scoredKeys].slice(-500) });
    return { checked };
  }

  async function tick({ tarih = null, maxRaces = Infinity } = {}) {
    if (tickRunning) return { skipped: true };
    tickRunning = true;
    try {
      const state = loadState();
      state.analyzedKeys = state.analyzedKeys || [];
      state.scoredKeys = state.scoredKeys || [];
      const today = tarih || bugunIso();
      // gün değişti: analiz anahtarlarını ve günlük sayacı sıfırla
      if (state.lastDay !== today) {
        state.analyzedKeys = [];
        state.raceCount = 0;
        state.lastDay = today;
      }
      state.raceCount = state.raceCount || 0;

      const card = await loadDayCard(today, "tr").catch(() => null);
      let ran = 0;
      const ayniGun = today === bugunIso();
      if (card?.meetings?.length) {
        const now = simdiDakika();
        for (const meeting of card.meetings) {
          if (!meeting.domestic || ran >= maxRaces || state.raceCount >= CFG.maxRacesPerDay) break;
          for (const race of meeting.races) {
            if (ran >= maxRaces || state.raceCount >= CFG.maxRacesPerDay) break;
            if (race.finished) continue;
            const raceKey = `${meeting.key}::${race.id || race.no}`;
            if (state.analyzedKeys.includes(raceKey)) continue;
            const rk = kosuDakikasi(race.time);
            // Gün içi: startına az kaldı/başladıysa geç; pencere dışındaysa sonra tekrar dene.
            // Gelecek gün kartı: saat karşılaştırması gece yarısını kıramaz — sadece gün içi uygulanır.
            if (ayniGun && rk != null && (rk < now + 5 || rk > now + CFG.pencereSaat * 60)) continue;
            try {
              await runRaceForBot(meeting, race, today);
            } catch (err) {
              console.error(`[bot] ${meeting.city} ${race.no}. koşu hata:`, err?.message?.slice(0, 200));
            }
            // maxRaces: BAŞARISIZ denemeleri de say (tek kartı döktürmesin)
            state.raceCount += 1;
            ran += 1;
            await sleep(15_000); // TJK'ya nazik davran
          }
        }
      }
      const kontrol = await checkOpenBets().catch(() => ({ checked: 0 }));
      sonTick = new Date().toISOString();
      saveState({ ...state });
      return { ran, kontrol, sonTick };
    } finally {
      tickRunning = false;
    }
  }

  // --- uç noktalar ---

  app.get("/api/bot/ozet", (_req, res) => {
    const bets = loadBets();
    const weightsList = Object.entries(loadWeights())
      .map(([domain, e]) => ({
        domain,
        name: e.name,
        tests: e.tests,
        hitPct: e.tests ? Math.round((e.hits / (e.tests * 3)) * 100) : 0,
        bankoPct: e.bankoTests ? Math.round((e.bankoHits / e.bankoTests) * 100) : 0,
      }))
      .sort((a, b) => b.hitPct - a.hitPct);
    const state = loadState();
    res.json({
      enabled: state.enabled !== false,
      config: CFG,
      sonTick,
      raceCount: state.raceCount || 0,
      stats: ozetHesapla(bets),
      weights: weightsList,
      bets: [...bets].reverse().slice(0, 60),
    });
  });

  app.post("/api/bot/durum", (req, res) => {
    const state = loadState();
    state.enabled = req.body?.enabled === true;
    saveState(state);
    res.json({ enabled: state.enabled });
  });

  app.post("/api/bot/tetikle", async (req, res) => {
    const state = loadState();
    if (state.enabled === false) return res.status(409).json({ error: "Bot duraklatılmış. Önce aç." });
    const tarih = typeof req.body?.tarih === "string" ? req.body.tarih : null;
    const maxRaces = Math.min(Number(req.body?.maxRaces) || 2, 10);
    try {
      const sonuc = await tick({ tarih, maxRaces });
      res.json({ ok: true, ...sonuc });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Tetikleme başarısız" });
    }
  });

  // İstemcide tamamlanan manuel analizin bot verisi → bahis + kaynak kaydı
  app.post("/api/bot/veri", (req, res) => {
    const b = req.body || {};
    if (!b.raceKey || !b.botVeri) return res.status(400).json({ error: "raceKey/botVeri yok" });
    const bets = loadBets();
    if (hasBetsForRace(bets, b.raceKey)) return res.json({ ok: true, skipped: true });
    const yeni = placeBets(
      b.botVeri,
      {
        raceKey: b.raceKey,
        dateIso: typeof b.dateIso === "string" ? b.dateIso : "",
        meetingKey: b.meetingKey || "",
        raceNo: b.raceNo || "",
        city: b.city || "",
        model: b.model || "manuel",
        source: "analiz",
      },
      Array.isArray(b.raceHorses) ? b.raceHorses : [],
    );
    saveBets([...bets, ...yeni]);
    const srcMap = loadSources();
    srcMap[b.raceKey] = {
      dateIso: typeof b.dateIso === "string" ? b.dateIso : "",
      city: b.city || "",
      raceNo: b.raceNo || "",
      sources: (parseResearchSources(b.digest || "") || [])
        .map((s) => ({
          name: s.name,
          url: s.url,
          picks: picksToNos(s.picksRaw, Array.isArray(b.raceHorses) ? b.raceHorses : []),
        }))
        .filter((s) => s.picks.length),
      botVeri: b.botVeri,
    };
    saveSources(srcMap);
    res.json({ ok: true, bets: yeni.length });
  });

  // Zamanlayıcı (pasif: yalnızca uç noktalar, otomatik tarama kapalı)
  const intervalMs = Math.max(5, CFG.intervalMin) * 60 * 1000;
  if (pasif) {
    console.log("[bot] pasif (BOT_ENABLED=0) — uç noktalar açık, zamanlayıcı kapalı");
  } else {
    setTimeout(() => tick().catch(() => {}), 45_000);
    setInterval(() => tick().catch(() => {}), intervalMs);
    console.log(
      `[bot] an-be-an bot aktif: model=${CFG.model} effort=${CFG.effort} derinlik=${CFG.depth} aralık=${CFG.intervalMin}dk`,
    );
  }

  return { tick };
}
