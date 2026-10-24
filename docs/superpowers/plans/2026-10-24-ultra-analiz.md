# Ultra Analiz — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Koşu başlangıcının 5 dk öncesine kadar kesintisiz, birikimli ve akıllı web araştırması yapan; nihayetinde tüm veriyi tek mega prompt'ta ana modele verip nihai rapor üreten "ULTRA" analiz modu.

**Architecture:** Tarayıcı tarafında bağımsız `src/lib/ultraRunner.ts` oturum motoru; durum `localStorage["ultra:oturumlar"]`'a snapshot'lanır (sayfa yenilenince kaldığı yerden devam). Araştırma turları mevcut `/api/analiz/arastirma` uç noktası üzerinden; nihai rapor mevcut `callGpt` + `saveAnalysisRemote` + `/api/bot/veri` boru hattını kullanır. Prompt'lar `shared/prompt.ts`'e eklenir (tek kaynak kuralı).

**Tech Stack:** TypeScript, Vitest (yeni test altyapısı), mevcut React + Express yığını.

**Spec:** `docs/superpowers/specs/2026-10-24-ultra-analiz-design.md`

## Global Constraints

- Sunucu yalnızca `dusuk|orta|yuksek` derinliğini tanır; `ultra` yalnızca istemci modudur — her araştırma turu sunucuya `depth: "yuksek"` (temel) veya `"orta"` (artımlı) gönderir.
- Nihai rapor çağrısı `effort: "high"` ile yapılır (spec Bölüm 6).
- Tüm kullanıcıya görünen metinler Türkçe.
- Tarayıcı localStorage yalnızca oturum durumu için; analiz arşivi sunucu diskinde (`saveAnalysisRemote`).
- Testler `vitest` ile `src/**/*.test.ts` deseninde; saf fonksiyonlar localStorage'a dokunmaz.

## Review Focus

1. Koşu saati yok/bozuk (`race.time` boş, "—" vb.) → oturum reddedilmeli, kullanıcıya net hata. [Task 2 test `kosuBaslangici returns null`; Task 5 test `ultraKarar iptal saat bilinmiyor`]
2. Koşu geçmiş/sonuçlanmış → oturum başlatılamaz, mevcut oturum iptal olur. [Task 5 test `ultraKarar iptal koşu başladı`]
3. Sayfa yenileme tur ortasında → oturum snapshot'tan kaldığı yerden devam etmeli, birikmiş bulgular korunmalı. [Task 5 test `snapshot round-trip`]
4. Araştırma turu hatası (ağ/limit) → oturum ölmemeli, geri çekilme ile tekrar. [Task 5 test `ultraKarar backoff`]
5. Birikmiş özet şişmesi → sıkıştırma/eski düşürme devreye girmeli; mega prompt sınırları aşmamalı. [Task 3 test `sikistirma`]

---

### Task 1: Test altyapısı (vitest)

**Files:**
- Modify: `package.json` (devDependency + test script)
- Create: `vitest.config.ts`
- Create: `src/lib/__tests__/sanity.test.ts`

**Interfaces:**
- Produces: `npm test` komutu; sonraki görevlerin testleri bu altyapıda çalışır.

- [ ] **Step 1: vitest kurulumu**

```bash
npm i -D vitest
```

- [ ] **Step 2: script + config**

`package.json` scripts'a ekle: `"test": "vitest run"`. `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node", include: ["src/**/*.test.ts"] } });
```

- [ ] **Step 3: sanity test**

`src/lib/__tests__/sanity.test.ts`: `buildResearchQueries` (shared/prompt.ts) çağrısı; çıktının "Adana 1. koşu 11 Ekim 2026" içerdiğini doğrular (shared modülün TS test ortamında çalıştığını kanıtlar).

- [ ] **Step 4: çalıştır**

Run: `npm test`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "test: vitest altyapısı"
```

### Task 2: Zaman yardımcıları

**Files:**
- Create: `src/lib/ultraZaman.ts`
- Test: `src/lib/__tests__/ultraZaman.test.ts`

**Interfaces:**
- Produces: `kosuBaslangici(date: string, time: string): Date | null`, `kalanDakika(bas: Date, now?: number): number | null`, `turAraligiDk(kalanDk: number): number`, `sonTurZamani(bas: Date): Date`, `formatKalan(dk: number): string` — Task 5 ve Task 6 bunları kullanır.

- [ ] **Step 1: failing test yaz**

`src/lib/__tests__/ultraZaman.test.ts`:
- `kosuBaslangici("11.10.2026", "16:45")` → ISO `2026-10-11T13:45:00.000Z` (UTC+3 sabit)
- `kosuBaslangici("11.10.2026", "16.45")` → aynı sonuç (nokta ayırıcı da geçerli)
- `kosuBaslangici("11.10.2026", "")` → `null`; `kosuBaslangici("bozuk", "16:45")` → `null`
- `turAraligiDk(300)` → 30; `(240)` → 30; `(239)` → 15; `(60)` → 15; `(45)` → 7; `(29)` → 3
- `sonTurZamani(bas)` → `bas - 5*60_000`
- `formatKalan(135)` → "2 sa 15 dk"; `(48)` → "48 dk"

- [ ] **Step 2: çalıştır, FAIL** — `npm test` (modül yok)

- [ ] **Step 3: implement** — `ultraZaman.ts`: tarih `dd.mm.yyyy` parse → `${y}-${m}-${d}T${HH}:${mm}:00+03:00`; `turAraligiDk` eşikleri spec tablosundan.

- [ ] **Step 4: çalıştır PASS** — `npm test`

- [ ] **Step 5: Commit** — `git commit -m "feat(ultra): zaman yardımcıları"`

### Task 3: Bulgu biriktirme

**Files:**
- Create: `src/lib/ultraBulgular.ts`
- Test: `src/lib/__tests__/ultraBulgular.test.ts`

**Interfaces:**
- Produces: `type Bulgu = { ts: string; aci: string; metin: string }`; `ekleBulgu(list: Bulgu[], yeni: {aci: string; metin: string}[], limitKarakter = 24000): { list: Bulgu[]; eklendi: number; sikisti: boolean }`; `bulguOzeti(list: Bulgu[], maxKarakter = 16000): string` — Task 5 ve Task 4 kullanır.

- [ ] **Step 1: failing test**

Testler: aynı cümlenin normalize edilmiş hali ikinci kez eklenmez (`eklendi: 0`); kronolojik sıra korunur; toplam `limitKarakter` aşılınca en eski bloklar düşürülür ve `sikisti: true` döner; `bulguOzeti` kronolojik metni döner ve sınırda "[eski turlar özetlendi]" ibaresi başa eklenir.

- [ ] **Step 2: FAIL** — `npm test`

- [ ] **Step 3: implement** — `trNorm` (küçük harf tr, noktalama/space temizliği), cümle-benzerliği (normalized birbirini içeriyorsa tekrar), düşürme döngüsü.

- [ ] **Step 4: PASS** — `npm test`

- [ ] **Step 5: Commit** — `feat(ultra): bulgu biriktirme`

### Task 4: Ultra prompt'ları (shared/prompt.ts)

**Files:**
- Modify: `shared/prompt.ts` (dosya sonuna ek)
- Test: `src/lib/__tests__/ultraPrompt.test.ts`

**Interfaces:**
- Produces: `buildUltraTurPrompt(meeting: Meeting, race: Race, bilinenOzet: string, aci: string): string`, `buildUltraFinalEk(bulgularMetin: string): string` — Task 5 kullanır.

- [ ] **Step 1: failing test**

Testler: `buildUltraTurPrompt` çıktısı künyeyi (şehir + koşu no), bilinen özeti, `aci` adını ve "Bilinenleri tekrar etme" ibaresini içerir; `buildUltraFinalEk` "## 🌊 ULTRA ARŞİV" başlığını ve bulgular metnini içerir; prompt uzunluğu ≤ 20000 karakter.

- [ ] **Step 2: FAIL** — `npm test`

- [ ] **Step 3: implement** — `araştırmaKünye` yeniden kullanılır; açı adları: `["son-dakika", "jokey-taki", "pist-hava", "uzman", "oran-agf"]`.

- [ ] **Step 4: PASS** — `npm test`

- [ ] **Step 5: Commit** — `feat(ultra): tur ve nihai promptlar`

### Task 5: ultraRunner çekirdeği

**Files:**
- Create: `src/lib/ultraRunner.ts`
- Test: `src/lib/__tests__/ultraKarar.test.ts`

**Interfaces:**
- Produces: `type UltraFaz = "temel" | "takip" | "nihai" | "bitti" | "iptal"`; `type UltraSession = { id, raceKey, meeting, race, model, effort, faz, bulgular: Bulgu[], sonTurAt: number | null, turHatasi: number, olusturma: string, degisme: string, result: string, error: string, aciIndex: number }`; `ultraKarar(s: UltraSession, now: number): { islem: "tur" | "final" | "bekle" | "iptal"; delayMs?: number; neden?: string }`; `startUltra({apiKey, meeting, race, model, effort}): UltraSession`; `getUltraSession(raceKey): UltraSession | undefined`; `durdurUltra(raceKey): void`; `resumeUltraSessions(): void`; `subscribeUltra(fn): () => void` — Task 6 kullanır.

- [ ] **Step 1: failing test** — `ultraKarar.test.ts`:
- faz `temel`, kalan 300 dk → `{ islem: "tur" }`
- faz `takip`, `sonTurAt = now - 10 dk` → `{ islem: "tur" }`
- faz `takip`, `sonTurAt = now - 5 dk` → `{ islem: "bekle", delayMs ≈ 10*60_000 }`
- `turHatasi = 2`, `sonTurAt = now - 5 dk` → `delayMs ≈ 10*60_000*4` (backoff ×4)
- kalan ≤ 5 dk, faz `takip` → `{ islem: "final" }`
- kalan ≤ 0 → `{ islem: "iptal" }`
- `race.finished = true` → `{ islem: "iptal" }`
- `kosuBaslangici(null)` → `{ islem: "iptal", neden: saat }`

- [ ] **Step 2: FAIL** — `npm test`

- [ ] **Step 3: implement** — `ultraKarar` saf (yukarıdaki sıra); oturum depolama `localStorage["ultra:oturumlar"]` (array, apiKey PERSIST EDİLMEZ); `dongu` async döngü: `ultraKarar` → tur: `buildUltraTurPrompt` + `postResearch({depth: "orta", sonarPrompts: [p], queries: buildResearchQueries})` → `ekleBulgu` → `sonTurAt = Date.now()` → sonraki `setTimeout`; final: `buildRaceAnalysisPrompt` + `buildUltraFinalEk` → `callGpt(model, "high")` → `saveAnalysisRemote(kaynak:"ultra")` → `extractBotVeri` → `/api/bot/veri` → faz `bitti`; `resumeUltraSessions` açık oturumları yeniden kurar (apiKey `getGptKey()`'den alınır, depolanmaz).

- [ ] **Step 4: PASS** — `npm test`

- [ ] **Step 5: Commit** — `feat(ultra): oturum motoru + zamanlayıcı çekirdeği`

### Task 6: UI ve boru hattı bağlantısı

**Files:**
- Modify: `src/lib/gpt.ts:115-134` (`ArastirmaDerinlik` + getter)
- Modify: `src/lib/types.ts` (`SavedAnalysis.kaynak` tipi)
- Modify: `src/lib/analysisRunner.ts` (depth "ultra" → "yuksek" eşlemesi)
- Modify: `src/components/AnalysisDialog.tsx`

**Interfaces:**
- Consumes: Task 5 `startUltra/getUltraSession/durdurUltra/subscribeUltra`; Task 2 `formatKalan`.

- [ ] **Step 1:** `gpt.ts`: `ArastirmaDerinlik = "dusuk" | "orta" | "yuksek" | "ultra"`; getter/selecter `ultra` kabul eder; `AnalysisDialog` seçim listesine `ULTRA — koşuya 5 dk kalana dek sürekli araştırma` + uyarı metni.
- [ ] **Step 2:** `runJobBody`/`enqueueMeeting` araştırma çağrısında `depth === "ultra" ? "yuksek" : depth` (sunucu uyumu).
- [ ] **Step 3:** `AnalysisDialog.runAnalysis`: `depth === "ultra"` ise `startUltra(...)` çağırır (normal `startAnalysis` yerine); `job` yerine oturum görünümü: faz, tur no, `formatKalan`, sonraki tur zamanı, son bulgu, `Durdur` düğmesi (`durdurUltra`), `subscribeUltra` ile canlı.
- [ ] **Step 4:** `npm test` + `npm run build` — PASS.
- [ ] **Step 5: Commit** — `feat(ultra): arayüz + boru hattı bağlantısı`

### Task 7: Manuel doğrulama + README

- [ ] **Step 1:** `npm run server` + `npm run dev`; gerçek koşu seç → ULTRA → başlat; canlı tur akışını, sayfa yenilemede devamı, Durdur'u doğrula.
- [ ] **Step 2:** `README.md`'ye "Ultra Analiz" bölümü; commit + push.

---

## Plan Sonrası Not

Execution yöntemi: kullanıcı "başka soru sorma" dediği için **Native** (bu oturumda doğrudan implementasyon) seçilir.
