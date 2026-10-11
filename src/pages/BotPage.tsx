import { useEffect, useState } from "react";
import { Bot, Pause, Play, RefreshCw } from "lucide-react";

type BotBet = {
  id: string;
  raceKey: string;
  dateIso: string;
  city: string;
  raceNo: string;
  type: string;
  picks: number[];
  adlar?: string[];
  pct?: number[];
  status: "open" | "won" | "lost";
  source?: string;
  model?: string;
};

type BotOzet = {
  enabled: boolean;
  config: { model: string; effort: string; depth: string; intervalMin: number; maxRacesPerDay: number };
  sonTick: string | null;
  raceCount: number;
  stats: { total: number; open: number; won: number; lost: number; hitPct: number | null; byType: Record<string, { total: number; open: number; won: number; lost: number }> };
  weights: { domain: string; name: string; tests: number; hitPct: number; bankoPct: number }[];
  bets: BotBet[];
};

const TUR_ADI: Record<string, string> = { ganyan: "Ganyan", ikili: "İkili", uclu: "Üçlü" };

export function BotPage() {
  const [ozet, setOzet] = useState<BotOzet | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const [, setTick] = useState(0);

  async function cek() {
    try {
      const r = await fetch("/api/bot/ozet");
      if (r.ok) setOzet((await r.json()) as BotOzet);
    } catch {
      /* sunucu kapalı olabilir */
    }
  }

  useEffect(() => {
    void cek();
    const t = setInterval(() => void cek(), 15_000);
    return () => clearInterval(t);
  }, []);

  async function durumDegistir(enabled: boolean) {
    setYukleniyor(true);
    try {
      await fetch("/api/bot/durum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      await cek();
    } finally {
      setYukleniyor(false);
    }
  }

  async function tetikle() {
    setYukleniyor(true);
    setMesaj("Bot 2 koşu analiz ediyor… (1-3 dakika sürebilir)");
    try {
      const r = await fetch("/api/bot/tetikle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxRaces: 2 }),
      });
      const d = (await r.json()) as { ran?: number; kontrol?: { checked: number }; error?: string };
      setMesaj(
        d.error
          ? `Hata: ${d.error}`
          : `Tamam — ${d.ran ?? 0} koşu analiz edildi, ${d.kontrol?.checked ?? 0} bahis sonuçlandı.`,
      );
      await cek();
    } catch {
      setMesaj("Sunucuya ulaşılamadı (npm run server çalışıyor mu?)");
    } finally {
      setYukleniyor(false);
      setTick((t) => t + 1);
    }
  }

  if (!ozet) {
    return (
      <div className="p-6 text-sm text-muted">
        <Bot className="mb-2 size-5" />
        Bot verisi yükleniyor… (sunucu çalışmıyorsa npm run server ile başlat)
      </div>
    );
  }

  const s = ozet.stats;

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-fg">
          <Bot className="size-6 text-gold" />
          Sanal Bahis Botu
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => durumDegistir(!ozet.enabled)}
            disabled={yukleniyor}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-fg px-4 text-sm font-medium text-bg disabled:opacity-40"
          >
            {ozet.enabled ? <Pause className="size-4" /> : <Play className="size-4" />}
            {ozet.enabled ? "Duraklat" : "Başlat"}
          </button>
          <button
            type="button"
            onClick={tetikle}
            disabled={yukleniyor}
            className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm text-fg ring-1 ring-border hover:bg-surface2 disabled:opacity-40"
          >
            <RefreshCw className={yukleniyor ? "size-4 animate-spin" : "size-4"} />
            Şimdi tara (2 koşu)
          </button>
        </div>
      </div>

      <p className="text-xs text-subtle">
        Bot, analiz + araştırma hattının çıktısını tüketir: her koşu için ganyan/ikili/üçlü'den
        <span className="font-medium text-fg"> 16 sanal bahis </span> kurar, sonuçları kontrol eder,
        kaynakların isabetini ölçüp araştırma prompt'larına geri besler. Bahisler sanaldır (paper
        trading); gerçek para harcamaz. Ayarlar (.env): BOT_MODEL={ozet.config.model} ·
        BOT_EFFORT={ozet.config.effort} · BOT_DEPTH={ozet.config.depth} · aralık {ozet.config.intervalMin} dk
        {mesaj ? <span className="block text-gold">{mesaj}</span> : null}
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kutu label="Toplam bahis" deger={String(s.total)} />
        <Kutu label="Açık" deger={String(s.open)} />
        <Kutu label="Tutan" deger={String(s.won)} />
        <Kutu label="İsabet" deger={s.hitPct != null ? `%${s.hitPct}` : "—"} />
      </div>

      {Object.keys(s.byType).length ? (
        <div className="rounded-xl ring-1 ring-border">
          <div className="border-b border-border px-4 py-2 text-sm font-medium text-fg">Tür bazlı isabet</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-subtle">
                <th className="px-4 py-2">Tür</th>
                <th className="px-4 py-2">Toplam</th>
                <th className="px-4 py-2">Tutan</th>
                <th className="px-4 py-2">İsabet</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(s.byType).map(([t, st]) => {
                const kapali = st.won + st.lost;
                return (
                  <tr key={t} className="border-t border-border/60">
                    <td className="px-4 py-2 text-fg">{TUR_ADI[t] || t}</td>
                    <td className="px-4 py-2 text-muted">{st.total}</td>
                    <td className="px-4 py-2 text-muted">{st.won}</td>
                    <td className="px-4 py-2 text-fg">{kapali ? `%${Math.round((st.won / kapali) * 100)}` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {ozet.weights.length ? (
        <div className="rounded-xl ring-1 ring-border">
          <div className="border-b border-border px-4 py-2 text-sm font-medium text-fg">
            Kaynak isabet tablosu (bot öğrenmesi — en az 3 koşu ölçümü)
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-subtle">
                <th className="px-4 py-2">Kaynak</th>
                <th className="px-4 py-2">Koşu</th>
                <th className="px-4 py-2">İlk-3 isabet</th>
                <th className="px-4 py-2">Banko isabet</th>
              </tr>
            </thead>
            <tbody>
              {ozet.weights.map((w) => (
                <tr key={w.domain} className="border-t border-border/60">
                  <td className="px-4 py-2 text-fg">
                    {w.name} <span className="text-xs text-subtle">({w.domain})</span>
                  </td>
                  <td className="px-4 py-2 text-muted">{w.tests}</td>
                  <td className="px-4 py-2">%{w.hitPct}</td>
                  <td className="px-4 py-2">%{w.bankoPct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-lg bg-surface px-3 py-2 text-xs text-subtle ring-1 ring-border">
          Kaynak isabet tablosu henüz boş — botun/analizlerin sonuçlandığı koşuları izlemesi
          için birkaç gün gerekir. Öğrenme otomatik işler.
        </p>
      )}

      {ozet.bets.length ? (
        <div className="overflow-hidden rounded-xl ring-1 ring-border">
          <div className="border-b border-border px-4 py-2 text-sm font-medium text-fg">Son bahisler</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-subtle">
                <th className="px-4 py-2">Tarih</th>
                <th className="px-4 py-2">Koşu</th>
                <th className="px-4 py-2">Tür</th>
                <th className="px-4 py-2">Kupon</th>
                <th className="px-4 py-2">Durum</th>
              </tr>
            </thead>
            <tbody>
              {ozet.bets.map((b) => (
                <tr key={b.id} className="border-t border-border/60">
                  <td className="px-4 py-2 text-muted">{b.dateIso}</td>
                  <td className="px-4 py-2 text-fg">
                    {b.city} {b.raceNo}
                  </td>
                  <td className="px-4 py-2 text-muted">{TUR_ADI[b.type] || b.type}</td>
                  <td className="px-4 py-2 text-fg">
                    {b.picks.join(" - ")}
                    {b.source === "analiz" ? <span className="ml-1 text-xs text-subtle">(manuel)</span> : null}
                  </td>
                  <td className="px-4 py-2">
                    {b.status === "won" ? (
                      <span className="text-green-600">✓ tuttu</span>
                    ) : b.status === "lost" ? (
                      <span className="text-danger">✗ yat</span>
                    ) : (
                      <span className="text-subtle">açık</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-lg bg-surface px-3 py-2 text-xs text-subtle ring-1 ring-border">
          Henüz bahis yok. "Şimdi tara" ile botu çalıştır ya da normal analiz yap — bot verisi otomatik gelir.
        </p>
      )}
    </div>
  );
}

function Kutu({ label, deger }: { label: string; deger: string }) {
  return (
    <div className="rounded-xl bg-surface px-4 py-3 ring-1 ring-border">
      <div className="text-xs text-subtle">{label}</div>
      <div className="mt-1 text-lg font-semibold text-fg">{deger}</div>
    </div>
  );
}
