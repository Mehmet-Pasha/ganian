import { ChevronDown, FileDown, FileText, FolderDown, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteAnalysisRemote,
  eskiKayitSayisi,
  listAnalyses,
  migrateLocalToServer,
  type SavedAnalysis,
} from "@/lib/analyses";
import { buildFolderReportHtml, buildReportHtml, printReport } from "@/lib/report";
import { cn } from "@/lib/date";

type Folder = { key: string; label: string; items: SavedAnalysis[] };

function group(items: SavedAnalysis[]): Folder[] {
  const map = new Map<string, Folder>();
  for (const a of items) {
    const label = `${a.dateLabel || "tarihsiz"} · ${a.city || a.meetingName}`;
    const key = `${a.dateLabel}||${a.meetingKey || a.city}`;
    const f = map.get(key) || { key, label, items: [] };
    f.items.push(a);
    map.set(key, f);
  }
  return [...map.values()].map((f) => ({
    ...f,
    items: [...f.items].sort((x, y) => Number(x.raceNo) - Number(y.raceNo)),
  }));
}

export function AnalysesPage() {
  const [items, setItems] = useState<SavedAnalysis[]>([]);
  const [hata, setHata] = useState("");
  const [not, setNot] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const folders = useMemo(() => group(items), [items]);

  async function yukle() {
    try {
      const list = await listAnalyses();
      setItems(list);
      setHata("");
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Analizler alınamadı (sunucu çalışıyor mu?)");
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    let iptal = false;
    (async () => {
      setYukleniyor(true);
      const eski = eskiKayitSayisi();
      if (eski > 0) {
        setNot(`${eski} eski analiz tarayıcıdan cihaz deposuna taşınıyor…`);
        const tasinan = await migrateLocalToServer();
        setNot(tasinan > 0 ? `${tasinan} eski analiz cihaz deposuna taşındı.` : "");
      }
      await yukle();
      if (!iptal) setYukleniyor(false);
    })();
    const t = setInterval(() => void yukle(), 30_000);
    return () => {
      iptal = true;
      clearInterval(t);
    };
  }, []);

  async function onDelete(id: string) {
    await deleteAnalysisRemote(id).catch(() => {});
    await yukle();
  }

  function toggle(key: string) {
    setOpen((p) => ({ ...p, [key]: !(p[key] ?? true) }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-subtle">Kayıtlı raporlar</p>
          <h1 className="mt-1 font-display text-4xl text-fg sm:text-5xl">Analizler</h1>
          <p className="mt-1 text-muted">
            Analizler tarih + yarış klasörlerinde otomatik toplanır ve <span className="text-gold">cihazına kaydedilir</span>{" "}
            (sunucu diski — tarayıcı belleği kullanılmaz). Tek koşuyu ya da tüm klasörü PDF indirebilirsin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void yukle()}
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm text-fg ring-1 ring-border hover:bg-surface2"
        >
          <RefreshCw className={yukleniyor ? "size-4 animate-spin" : "size-4"} />
          Yenile
        </button>
      </div>

      {hata ? (
        <div className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger ring-1 ring-danger/40">
          {hata} — "Yenile" ile tekrar dene.
        </div>
      ) : null}
      {not ? <div className="rounded-lg bg-surface px-3 py-2 text-xs text-gold ring-1 ring-border">{not}</div> : null}

      {folders.length === 0 ? (
        <div className="rounded-xl bg-surface px-6 py-16 text-center ring-1 ring-border">
          <FileText className="mx-auto size-8 text-subtle" />
          <p className="mt-3 font-display text-2xl">{yukleniyor ? "Yükleniyor…" : "Henüz analiz yok"}</p>
          <p className="mt-2 text-sm text-muted">
            Yarış programından bir koşunun <span className="text-gold">AI Analiz</span> butonuna bas, sonuç buraya
            düşsün.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block h-10 rounded-full bg-fg px-5 text-sm font-medium leading-10 text-bg"
          >
            Programa git
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {folders.map((f) => {
            const isOpen = open[f.key] ?? true;
            return (
              <section key={f.key} className="overflow-hidden rounded-xl bg-surface ring-1 ring-border">
                <header className="flex flex-wrap items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(f.key)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <ChevronDown
                      className={cn("size-4 shrink-0 text-muted transition-transform", !isOpen && "-rotate-90")}
                    />
                    <span className="truncate font-display text-xl text-fg">{f.label}</span>
                    <span className="shrink-0 rounded-full bg-surface2 px-2 py-0.5 text-xs text-muted ring-1 ring-border">
                      {f.items.length} analiz
                    </span>
                  </button>                  <button
                    type="button"
                    onClick={() => printReport(buildFolderReportHtml(f.label, f.items))}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-gold px-4 text-sm font-medium text-bg hover:bg-gold2"
                  >
                    <FolderDown className="size-4" />
                    Klasör PDF
                  </button>
                </header>
                {isOpen ? (
                  <div className="space-y-2 border-t border-border px-4 py-3">
                    {f.items.map((a) => (
                      <article
                        key={a.id}
                        className="flex flex-wrap items-center gap-2 rounded-lg bg-bg px-3 py-2.5 ring-1 ring-border"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-fg">
                            {a.raceNo}. koşu
                            <span className="font-normal text-muted">
                              {" "}
                              · {a.model}
                              {a.effort ? ` (${a.effort})` : ""}
                            </span>
                          </p>
                          <p className="truncate text-xs text-muted">
                            {new Date(a.savedAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => printReport(buildReportHtml(a.meeting, a.race, a.analysis, a.model, a.effort))}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-fg ring-1 ring-border hover:bg-surface2"
                        >
                          <FileDown className="size-3.5" />
                          PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(a.id)}
                          aria-label="Sil"
                          className="inline-flex size-8 items-center justify-center rounded-full text-muted ring-1 ring-border hover:text-danger"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </article>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
