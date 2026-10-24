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
  autoPaused: { reason: string; at: string } | null;
  failures: number;
  config: { model: string; effort: string; depth: string; intervalMin: number; maxRacesPerDay: number };
  sonTick: string | null;
  raceCount: number;
  stats: { total: number; open: number; won: number; lost: number; hitPct: number | null; byType: Record<string, { total: number; open: number; won: number; lost: number }> };
  weights: { domain: string; name: string; tests: number; hitPct: number; bankoPct: number; sonHitPct: number; sonBankoPct: number }[];
  ogrenme: {
    config: { model: string; depth: string; effort: string; total: number; won: number; lost: number; hitPct: number | null }[];
    kalibrasyon: { kova: string; n: number; won: number; isabet: number | null }[];
    sehir: { city: string; total: number; won: number; hitPct: number }[];
  };
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

      {ozet.autoPaused ? (
        <div className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger ring-1 ring-danger/40">
          ⚠️ Bot 5 üst üste hata nedeniyle kendini otomatik duraklattı ({ozet.autoPaused.at}):{" "}
          {ozet.autoPaused.reason}. Sorunu çözüp (ör. kota/anahtar) Başlat'a bas.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kutu label="Toplam bahis" deger={String(s.total)} />
        <Kutu label="Açık" deger={String(s.open)} />
        <Kutu label="Tutan" deger={String(s.won)} />
        <Kutu label="İsabet" deger={s.hitPct != null ? `%${s.hitPct}` : "—"} />
      </div>

      {Object.keys(s.byType).length ? (
        <div className="rounded-xl ring-1 ring-border">
          <div className="border-b border-border px-4 py-2 text-sm font-medium text-fg">Tür bazlı isabet</div>
          <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm">
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
        </div>
      ) : null}

      {ozet.weights.length ? (
        <div className="rounded-xl ring-1 ring-border">
          <div className="border-b border-border px-4 py-2 text-sm font-medium text-fg">
            Kaynak isabet tablosu (bot öğrenmesi — ömür boyu + son 10 koşu penceresi)
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-xs text-subtle">
                <th className="px-4 py-2">Kaynak</th>
                <th className="px-4 py-2">Koşu</th>
                <th className="px-4 py-2">İlk-3</th>
                <th className="px-4 py-2">Banko</th>
                <th className="px-4 py-2">Son 10</th>
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
                  <td className="px-4 py-2 text-fg">%{w.sonHitPct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      ) : (
        <p className="rounded-lg bg-surface px-3 py-2 text-xs text-subtle ring-1 ring-border">
          Kaynak isabet tablosu henüz boş — botun/analizlerin sonuçlandığı koşuları izlemesi
          için birkaç gün gerekir. Öğrenme otomatik işler.
        </p>
      )}

      {ozet.ogrenme.config.length ? (
        <div className="rounded-xl ring-1 ring-border">
          <div className="border-b border-border px-4 py-2 text-sm font-medium text-fg">
            Model/derinlik öğrenmesi — hangi kombinasyon daha isabetli?
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-xs text-subtle">
                <th className="px-4 py-2">Model</th>
                <th className="px-4 py-2">Derinlik</th>
                <th className="px-4 py-2">Effort</th>
                <th className="px-4 py-2">Bahis</th>
                <th className="px-4 py-2">İsabet</th>
              </tr>
            </thead>
            <tbody>
              {ozet.ogrenme.config.map((c, i) => (
                <tr key={c.model + c.depth + c.effort + i} className="border-t border-border/60">
                  <td className="px-4 py-2 text-fg">{c.model}</td>
                  <td className="px-4 py-2 text-muted">{c.depth}</td>
                  <td className="px-4 py-2 text-muted">{c.effort}</td>
                  <td className="px-4 py-2 text-muted">{c.total}</td>
                  <td className="px-4 py-2 text-fg">{c.hitPct != null ? `%${c.hitPct}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      ) : null}

      {ozet.ogrenme.kalibrasyon.some((k) => k.n > 0) ? (
        <div className="rounded-xl ring-1 ring-border">
          <div className="border-b border-border px-4 py-2 text-sm font-medium text-fg">
            Kalibrasyon — modelin yüksek verdiği yüzdeler gerçekten tutuyor mu?
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-xs text-subtle">
                <th className="px-4 py-2">Güven kovası</th>
                <th className="px-4 py-2">Ganyan bahsi</th>
                <th className="px-4 py-2">Tutan</th>
                <th className="px-4 py-2">İsabet</th>
              </tr>
            </thead>
            <tbody>
              {ozet.ogrenme.kalibrasyon.map((k) => (
                <tr key={k.kova} className="border-t border-border/60">
                  <td className="px-4 py-2 text-fg">{k.kova}</td>
                  <td className="px-4 py-2 text-muted">{k.n}</td>
                  <td className="px-4 py-2 text-muted">{k.won}</td>
                  <td className="px-4 py-2 text-fg">{k.isabet != null ? `%${k.isabet}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          <p className="px-4 py-2 text-xs text-subtle">
            Sağlıklı kalibrasyon: yuksek kovası orta/dusuk'ten belirgin daha isabetli. Değilse
            modelin yüzdeleri güvenilir sayılmaz.
          </p>
        </div>
      ) : null}

      {ozet.ogrenme.sehir.length ? (
        <div className="rounded-xl ring-1 ring-border">
          <div className="border-b border-border px-4 py-2 text-sm font-medium text-fg">
            Hipodrom bazında isabet
          </div>
          <div className="flex flex-wrap gap-2 px-4 py-3">
            {ozet.ogrenme.sehir.map((c) => (
              <span key={c.city} className="rounded-full bg-surface px-3 py-1 text-xs text-fg ring-1 ring-border">
                {c.city}: {c.won}/{c.total} (%{c.hitPct})
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {ozet.bets.length ? (
        <div className="overflow-hidden rounded-xl ring-1 ring-border">
          <div className="border-b border-border px-4 py-2 text-sm font-medium text-fg">Son bahisler</div>
          <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm">
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
