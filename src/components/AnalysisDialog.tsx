import { Sparkles, X, StopCircle, Waves, FileDown } from "lucide-react";
import { startUltra, getUltraSession, durdurUltra, subscribeUltra, type UltraSession } from "@/lib/ultraRunner";
import { formatKalan } from "@/lib/ultraZaman";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJob, raceKeyOf, startAnalysis, subscribeJobs } from "@/lib/analysisRunner";
import {
  ARASTIRMA_DERINLIKLERI,
  GPT_EFFORTS,
  GPT_MODELS,
  getArastirmaDerinlik,
  getGptEffort,
  getGptKey,
  getGptModel,
  setArastirmaDerinlik,
  setGptEffort,
  setGptKey,
  setGptModel,
} from "@/lib/gpt";
import { buildReportHtml, printReport } from "@/lib/report";
import type { Meeting, Race } from "@/lib/types";

export function AnalysisDialog({
  meeting,
  race,
  onClose,
}: {
  meeting: Meeting;
  race: Race;
  onClose: () => void;
}) {
  const [apiKey, setApiKey] = useState(() => getGptKey());
  const [keyInput, setKeyInput] = useState("");
  const [model, setModel] = useState(() => getGptModel());
  const [effort, setEffort] = useState(() => getGptEffort());
  const [depth, setDepth] = useState(() => getArastirmaDerinlik());
  const [ultraHata, setUltraHata] = useState("");
  const [ultraS, setUltraS] = useState<UltraSession | undefined>(() =>
    getUltraSession(raceKeyOf(meeting, race)),
  );
  const [, setTick] = useState(0);

  const raceKey = raceKeyOf(meeting, race);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Arka plan motorundaki gelişmeleri canlı takip et
  useEffect(() => subscribeJobs(() => setTick((t) => t + 1)), []);
  useEffect(() => subscribeUltra(() => setUltraS(getUltraSession(raceKey))), [raceKey]);

  function saveKey() {
    const k = keyInput.trim();
    if (!k) return;
    setGptKey(k);
    setApiKey(k);
    setKeyInput("");
  }

  function changeModel(id: string) {
    setModel(id);
    setGptModel(id);
  }

  function changeEffort(id: string) {
    setEffort(id);
    setGptEffort(id);
  }

  function runAnalysis() {
    setUltraHata("");
    if (depth === "ultra") {
      try {
        startUltra({ apiKey, meeting, race, model: model || "gpt-6-sol", effort });
      } catch (e) {
        setUltraHata(e instanceof Error ? e.message : "Ultra analiz başlatılamadı");
      }
      return;
    }
    startAnalysis({ apiKey, meeting, race, model: model || "gpt-6-sol", effort });
  }

  const job = getJob(raceKeyOf(meeting, race));
  const stage = job?.state === "running"
      ? "loading"
      : job?.state === "done"
        ? "done"
        : job?.state === "error"
          ? "error"
          : "ready";
  const error = job?.state === "error" ? job.error : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-surface ring-1 ring-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h3 className="flex min-w-0 items-center gap-2 truncate text-sm font-medium text-fg">
            <Sparkles className="size-4 shrink-0 text-gold" />
            <span className="truncate">
              AI Analiz · {meeting.city} {race.no}. koşu ({race.distance} m {race.trackLabel})
            </span>
          </h3>
          <button type="button" onClick={onClose} aria-label="Kapat" className="shrink-0 text-muted hover:text-fg">
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4">
          {ultraS && (ultraS.faz === "temel" || ultraS.faz === "takip") ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-2 text-sm text-gold ring-1 ring-gold/40">
                <Waves className="size-4 shrink-0 animate-pulse" />
                <span className="font-medium">🌊 ULTRA oturum aktif</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-fg">{ultraS.progress}</p>
              <div className="space-y-1.5">
                {ultraS.turKayitlari
                  .slice(-6)
                  .reverse()
                  .map((t) => (
                    <div key={t.ts} className="rounded-lg bg-bg px-3 py-2 text-xs text-muted ring-1 ring-border">
                      {t.baslik}
                    </div>
                  ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => durdurUltra(raceKey)}
                  className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm text-fg ring-1 ring-border hover:bg-surface2"
                >
                  <StopCircle className="size-4" />
                  Durdur
                </button>
                <Link
                  to="/analizler"
                  onClick={onClose}
                  className="inline-flex h-9 items-center rounded-full px-4 text-sm text-gold underline underline-offset-4"
                >
                  Analizler sekmesini aç
                </Link>
              </div>
              <p className="text-xs text-subtle">
                Pencereyi kapatıp sayfayı yenilesen bile oturum devam eder (durum cihazında saklanır).
                Koşu başlamadan 5 dk önce son tur yapılıp nihai mega rapor otomatik hazırlanır ve Analizler
                sekmesine düşer.
              </p>
            </div>
          ) : ultraS && ultraS.faz === "bitti" && ultraS.result ? (
            <div className="space-y-3">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{ultraS.result}</div>
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() =>
                    printReport(buildReportHtml(ultraS.meeting, ultraS.race, ultraS.result, ultraS.model, "high"))
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gold px-4 text-sm font-medium text-bg hover:bg-gold2"
                >
                  <FileDown className="size-4" />
                  PDF Rapor İndir
                </button>
              </div>
              <p className="text-xs text-subtle">Bu rapor Analizler sekmesine kaydedildi (ULTRA).</p>
            </div>
          ) : (
          stage === "ready" ? (
            <div className="space-y-3 text-sm">
              <p className="text-muted">
                <span className="font-medium text-fg">{race.horses.length} at</span> için TJK profilleri (son
                koşular, HP, zemin/mesafe, jokey ikilisi) + jokey profilleri toplanıp AI'ya gönderilecek. Bu birkaç
                saniye sürebilir.
              </p>
              {!apiKey ? (
                <p className="rounded-lg bg-gold/10 px-3 py-2 text-xs text-gold ring-1 ring-gold/30">
                  Sunucudaki gömülü anahtar kullanılacak. İstersen aşağıdan kendi anahtarını girip onu kullanabilirsin.
                </p>
              ) : null}
              <details className="rounded-lg ring-1 ring-border">
                <summary className="cursor-pointer px-3 py-2 text-xs text-muted">
                  {apiKey ? "Cihaz anahtarı tanımlı (isteğe bağlı, değiştirmek için aç)" : "Kendi API anahtarını kullan (isteğe bağlı)"}
                </summary>
                <div className="space-y-2 px-3 pb-3">
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveKey()}
                    placeholder="sk-… (boş bırakırsan sunucu anahtarı kullanılır)"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-10 w-full rounded-lg bg-bg px-3 font-mono text-sm text-fg ring-1 ring-border placeholder:text-subtle focus:outline-none focus:ring-gold/60"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={saveKey}
                      disabled={!keyInput.trim()}
                      className="h-9 rounded-full bg-fg px-4 text-xs font-medium text-bg disabled:opacity-40"
                    >
                      Kaydet
                    </button>
                  </div>
                </div>
              </details>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs text-subtle">Model (listeden seç veya alta elle yaz)</span>
                  <select
                    value={GPT_MODELS.some((m) => m.id === model) ? model : "__ozel"}
                    onChange={(e) => e.target.value !== "__ozel" && changeModel(e.target.value)}
                    className="h-10 w-full rounded-lg bg-bg px-2 text-sm text-fg ring-1 ring-border"
                  >
                    {GPT_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                    <option value="__ozel">Özel model ID…</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-subtle">Özel model ID (örn. gpt-5.6-terra, snapshot)</span>
                  <input
                    value={GPT_MODELS.some((m) => m.id === model) ? "" : model}
                    onChange={(e) => changeModel(e.target.value.trim())}
                    placeholder="Boş bırakırsan liste seçimi geçerli"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-10 w-full rounded-lg bg-bg px-3 font-mono text-sm text-fg ring-1 ring-border placeholder:text-subtle focus:outline-none focus:ring-gold/60"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs text-subtle">Muhakeme seviyesi (GPT-5 / o-serisi, diğerlerinde etkisiz)</span>
                  <select
                    value={effort}
                    onChange={(e) => changeEffort(e.target.value)}
                    className="h-10 w-full rounded-lg bg-bg px-2 text-sm text-fg ring-1 ring-border"
                  >
                    {GPT_EFFORTS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs text-subtle">
                    Araştırma derinliği — analizden ayrı, aramayı bu kadarla sınırlar
                  </span>
                  <select
                    value={depth}
                    onChange={(e) => {
                      setDepth(e.target.value as typeof depth);
                      setArastirmaDerinlik(e.target.value);
                    }}
                    className="h-10 w-full rounded-lg bg-bg px-2 text-sm text-fg ring-1 ring-border"
                  >
                    {ARASTIRMA_DERINLIKLERI.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-[11px] text-subtle">
                    Düşük: Tavily + nano özet (ücretsiz kota). Orta/Yüksek için sunucuda
                    OPENROUTER_API_KEY gerekir; yoksa otomatik Düşük'e düşer.
                  </span>
                  {depth === "ultra" ? (
                    <span className="mt-1 block text-[11px] text-gold">
                      🌊 ULTRA: başlatınca koşu başlamadan 5 dk öncesine kadar sürekli araştırma
                      yapılır — saatler sürebilir ve çok sayıda sorgu harcanır. Sekmeyi kapatıp
                      yenilesen bile oturum kaldığı yerden devam eder; nihai rapor otomatik
                      kaydedilir ve bot kuponu kurulur.
                    </span>
                  ) : null}
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={runAnalysis}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-fg px-5 text-sm font-medium text-bg"
                >
                  <Sparkles className="size-4" />
                  Analizi başlat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.removeItem("mahmuz:gpt-key");
                    } catch {
                      /* yok say */
                    }
                    setApiKey("");
                  }}
                  className="h-10 rounded-full px-4 text-sm text-muted ring-1 ring-border hover:text-fg"
                >
                  Anahtarı değiştir
                </button>
              </div>
              <p className="text-xs text-subtle">
                Penceriyi kapatırsan bile analiz arka planda devam eder; bitince Analizler sekmesine düşer.
              </p>
            </div>
          ) : stage === "loading" ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Sparkles className="size-6 animate-pulse text-gold" />
              <p className="text-sm text-muted">{job?.progress || "Analiz ediliyor…"}</p>
              <p className="max-w-md text-xs text-subtle">
                Penceriyi kapatabilirsin — analiz arka planda devam eder, bitince Analizler sekmesine kaydedilir.
              </p>
              <Link to="/analizler" onClick={onClose} className="text-sm text-gold underline underline-offset-4">
                Analizler sekmesini aç
              </Link>
            </div>
          ) : stage === "done" && job ? (
            <div className="space-y-3">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{job.result}</div>
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => printReport(buildReportHtml(meeting, race, job.result, job.model, job.effort))}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gold px-4 text-sm font-medium text-bg hover:bg-gold2"
                >
                  PDF Rapor İndir
                </button>
                <button
                  type="button"
                  onClick={runAnalysis}
                  className="h-9 rounded-full px-4 text-sm text-fg ring-1 ring-border hover:bg-surface2"
                >
                  Tekrar analiz et
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      navigator.clipboard.writeText(job.result);
                    } catch {
                      /* yok say */
                    }
                  }}
                  className="h-9 rounded-full px-4 text-sm text-muted ring-1 ring-border hover:text-fg"
                >
                  Kopyala
                </button>
                <Link
                  to="/analizler"
                  onClick={onClose}
                  className="inline-flex h-9 items-center rounded-full px-4 text-sm text-gold ring-1 ring-gold/40 hover:bg-gold/10"
                >
                  Analizler sekmesinde gör
                </Link>
              </div>
              <p className="text-xs text-subtle">
                Bu analiz bilgilendirme amaçlıdır, kazanç garantisi vermez. Sorumlu oynayın.
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="text-danger">{error || "Analiz başarısız"}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={runAnalysis}
                  className="h-10 rounded-full bg-fg px-5 text-sm font-medium text-bg"
                >
                  Tekrar dene
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 rounded-full px-4 text-sm text-muted ring-1 ring-border hover:text-fg"
                >
                  Kapat
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
