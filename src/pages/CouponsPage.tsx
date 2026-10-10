import { Bell, Ticket, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getDayCard } from "@/lib/api";
import {
  BET_TYPES,
  betMeta,
  deleteCoupon,
  loadCoupons,
  notifyWin,
  requestNotifyPermission,
  saveCoupon,
  updateCoupons,
  type Coupon,
  type CouponLeg,
} from "@/lib/coupons";
import { istanbulTodayIso, isoToTr, cn } from "@/lib/date";
import type { DayCard, HorseEntry, Race } from "@/lib/types";

const hkey = (h: HorseEntry) => h.id || `no-${h.number}`;

function parseNum(v: string): number | null {
  const n = Number.parseFloat(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

// Tek koşuluk oyunu değerlendir: true=kazandı, false=kaybetti, null=belirsiz
function evalSingle(bet: string, picks: string[], race: Race): boolean | null {
  if (!race.finished) return null;
  const byKey = new Map(race.horses.map((h) => [hkey(h), h]));
  const pos = (k: string) => byKey.get(k)?.position || "";
  const ordered = ["1", "2", "3", "4", "5"].map(
    (p) => race.horses.find((h) => h.position === p)?.id || race.horses.find((h) => h.position === p)?.number || "",
  );
  const hasPos = (arr: string[]) => picks.some((k) => arr.includes(pos(k)));
  switch (bet) {
    case "ganyan":
      if (!ordered[0]) return null;
      return picks.some((k) => pos(k) === "1");
    case "plase":
      if (!ordered[0]) return null;
      return hasPos(["1", "2"]);
    case "plase-ikili": {
      if (!ordered[0]) return null;
      const n = picks.filter((k) => ["1", "2", "3"].includes(pos(k))).length;
      if (picks.some((k) => !pos(k))) return null;
      return n >= 2;
    }
    case "ikili":
      if (!ordered[0] || !ordered[1]) return null;
      return picks.includes(ordered[0]) && picks.includes(ordered[1]);
    case "sirali-ikili":
      if (!ordered[0] || !ordered[1]) return null;
      return picks[0] === ordered[0] && picks[1] === ordered[1];
    case "uclu":
      if (!ordered[0] || !ordered[1] || !ordered[2]) return null;
      return ordered.slice(0, 3).every((k) => picks.includes(k));
    case "sirali-uclu":
      if (!ordered[0] || !ordered[1] || !ordered[2]) return null;
      return picks[0] === ordered[0] && picks[1] === ordered[1] && picks[2] === ordered[2];
    case "tabela-sirasiz":
      if (!ordered[0] || !ordered[1] || !ordered[2] || !ordered[3]) return null;
      return ordered.slice(0, 4).every((k) => picks.includes(k));
    case "tabela":
      if (!ordered[0] || !ordered[1] || !ordered[2] || !ordered[3]) return null;
      return [0, 1, 2, 3].every((i) => picks[i] === ordered[i]);
    case "sirali-besli":
      if (!ordered[4]) return null;
      return [0, 1, 2, 3, 4].every((i) => picks[i] === ordered[i]);
    default:
      return null;
  }
}

function legLabel(l: CouponLeg): string {
  const names = l.horseNames.length ? l.horseNames.join(", ") : "—";
  return `${l.raceNo}.k: ${names}`;
}

export function CouponsPage() {
  const today = istanbulTodayIso();
  const [items, setItems] = useState<Coupon[]>(() => loadCoupons());
  const [betType, setBetType] = useState("ganyan");
  const meta = betMeta(betType);
  const multi = meta.group === "cok";

  const [dateISO, setDateISO] = useState(today);
  const [day, setDay] = useState<DayCard | null>(null);
  const [loadingDay, setLoadingDay] = useState(false);
  const [hip, setHip] = useState("");
  const [raceNo, setRaceNo] = useState("");
  const [singleSel, setSingleSel] = useState<string[]>([]);
  const [legSel, setLegSel] = useState<Record<number, string[]>>({});
  const [odds, setOdds] = useState("");
  const [stake, setStake] = useState("");
  const [checking, setChecking] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    requestNotifyPermission();
  }, []);

  useEffect(() => {
    let alive = true;
    setLoadingDay(true);
    setHip("");
    setRaceNo("");
    setSingleSel([]);
    setLegSel({});
    getDayCard(dateISO, "all")
      .then((d) => alive && setDay(d))
      .catch(() => alive && setDay({ date: dateISO, meetings: [] }))
      .finally(() => alive && setLoadingDay(false));
    return () => {
      alive = false;
    };
  }, [dateISO]);

  const meeting = useMemo(
    () => day?.meetings.find((m) => m.key === hip) ?? day?.meetings[0],
    [day, hip],
  );
  const races = meeting?.races || [];
  const race = useMemo(
    () => races.find((r) => r.no === raceNo) ?? races[0],
    [races, raceNo],
  );
  const startIdx = useMemo(
    () => Math.max(0, races.findIndex((r) => r.no === (race?.no || ""))),
    [races, race],
  );
  const legRaces = useMemo(
    () => (multi ? Array.from({ length: meta.legs }, (_, i) => races[startIdx + i]).filter(Boolean) : []),
    [multi, meta.legs, races, startIdx],
  );

  function resetSel() {
    setSingleSel([]);
    setLegSel({});
  }

  function toggleSingle(k: string) {
    setSingleSel((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  }

  function toggleLeg(i: number, k: string) {
    setLegSel((p) => {
      const cur = p[i] || [];
      return { ...p, [i]: cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k] };
    });
  }

  function addCoupon() {
    if (!meeting) return;
    const o = parseNum(odds);
    if (o == null) {
      setNote("Oranı gir (örn. 3.50). Oranlar elle yazılır.");
      return;
    }
    const legs: CouponLeg[] = [];
    if (!multi) {
      if (!race) return;
      if (singleSel.length < meta.minPicks) {
        setNote(`${meta.label} için en az ${meta.minPicks} at seç.`);
        return;
      }
      const byKey = new Map(race.horses.map((h) => [hkey(h), h]));
      legs.push({
        meetingKey: meeting.key,
        city: meeting.city,
        raceNo: race.no,
        horseIds: singleSel,
        horseNames: singleSel.map((k) => {
          const h = byKey.get(k);
          return h ? `${h.number} - ${h.name}` : k;
        }),
      });
    } else {
      if (legRaces.length < meta.legs) {
        setNote(`Bu toplantıda ${meta.legs} ayak için yeterli koşu yok.`);
        return;
      }
      for (let i = 0; i < meta.legs; i++) {
        const r = legRaces[i];
        const sel = legSel[i] || [];
        if (!sel.length) {
          setNote(`${i + 1}. ayak (${r.no}. koşu) için en az 1 at seç.`);
          return;
        }
        const byKey = new Map(r.horses.map((h) => [hkey(h), h]));
        legs.push({
          meetingKey: meeting.key,
          city: meeting.city,
          raceNo: r.no,
          horseIds: sel,
          horseNames: sel.map((k) => {
            const h = byKey.get(k);
            return h ? `${h.number} - ${h.name}` : k;
          }),
        });
      }
    }
    const c: Coupon = {
      id: `${Date.now()}-${betType}`,
      createdAt: new Date().toISOString(),
      dateISO,
      dateLabel: races[0]?.date || isoToTr(dateISO),
      betType: meta.id,
      legs,
      odds: o,
      stake: stake.trim() ? parseNum(stake) : null,
      status: "pending",
    };
    setItems(saveCoupon(c));
    resetSel();
    setOdds("");
    setStake("");
    setNote(`${meta.label} kuponu eklendi. Sonuçlar sayfasından kontrol edebilirsin.`);
  }

  async function checkResults() {
    const pending = items.filter((c) => c.status === "pending");
    if (!pending.length) {
      setNote("Bekleyen kupon yok.");
      return;
    }
    setChecking(true);
    setNote("");
    try {
      const byDate = new Map<string, Coupon[]>();
      for (const c of pending) {
        const arr = byDate.get(c.dateISO) || [];
        arr.push(c);
        byDate.set(c.dateISO, arr);
      }
      const dayCache = new Map<string, DayCard>();
      const updated = [...items];
      let wins = 0;
      for (const [iso, list] of byDate) {
        let d = dayCache.get(iso);
        if (!d) {
          try {
            d = await getDayCard(iso, "all");
          } catch {
            continue;
          }
          dayCache.set(iso, d);
        }
        for (const c of list) {
          const m = betMeta(c.betType);
          const results: (boolean | null)[] = c.legs.map((leg) => {
            const mt = d.meetings.find((x) => x.key === leg.meetingKey);
            const r = mt?.races.find((x) => x.no === leg.raceNo);
            if (!r) return null;
            if (m.group === "tek") return evalSingle(c.betType, leg.horseIds, r);
            if (c.betType === "plase-7") {
              if (!r.finished) return null;
              const p1 = r.horses.find((h) => h.position === "1");
              const p2 = r.horses.find((h) => h.position === "2");
              if (!p1) return null;
              const winKeys = [hkey(p1), ...(p2 ? [hkey(p2)] : [])];
              return leg.horseIds.some((k) => winKeys.includes(k));
            }
            // çok ayaklı ganyan oyunları: her ayakta birinci
            if (!r.finished) return null;
            const w = r.horses.find((h) => h.position === "1");
            if (!w) return null;
            return leg.horseIds.includes(hkey(w));
          });
          const idx = updated.findIndex((x) => x.id === c.id);
          if (idx < 0) continue;
          if (results.some((r) => r === false)) updated[idx] = { ...updated[idx], status: "lost" };
          else if (results.some((r) => r === null)) continue;
          else {
            updated[idx] = { ...updated[idx], status: "won" };
            wins += 1;
            if (!updated[idx].notified) {
              updated[idx].notified = true;
              notifyWin("Kupon tuttu! 🎉", `${m.label} (${c.legs.map((l) => l.raceNo).join("-")}. koşular) tuttu.`);
            }
          }
        }
      }
      setItems(updateCoupons(updated));
      setNote(wins > 0 ? `${wins} kupon tuttu, bildirim gönderildi.` : "Kontrol bitti. Sonuçlanan kuponlar işlendi.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-subtle">Lokal takip</p>
        <h1 className="mt-1 font-display text-4xl text-fg sm:text-5xl">Kuponlarım</h1>
        <p className="mt-1 text-muted">
          Tüm TJK oyunları: tek koşu ve çok ayaklı. Kuponlar bu cihazda saklanır, oranları kendin yazarsın.
        </p>
      </div>

      <section className="space-y-3 rounded-xl bg-surface p-4 ring-1 ring-border">
        <h2 className="font-display text-xl text-fg">Yeni kupon</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs text-subtle">Oyun türü</span>
            <select
              value={betType}
              onChange={(e) => {
                setBetType(e.target.value);
                resetSel();
              }}
              className="h-10 w-full rounded-lg bg-bg px-2 text-sm text-fg ring-1 ring-border"
            >
              <optgroup label="Tek koşu">
                {BET_TYPES.filter((b) => b.group === "tek").map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Çok ayaklı">
                {BET_TYPES.filter((b) => b.group === "cok").map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-subtle">Tarih</span>
            <input
              type="date"
              value={dateISO}
              onChange={(e) => e.target.value && setDateISO(e.target.value)}
              className="h-10 w-full rounded-lg bg-bg px-2 text-sm text-fg ring-1 ring-border [color-scheme:dark]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-subtle">Hipodrom</span>
            <select
              value={meeting?.key || ""}
              onChange={(e) => {
                setHip(e.target.value);
                resetSel();
              }}
              disabled={loadingDay}
              className="h-10 w-full rounded-lg bg-bg px-2 text-sm text-fg ring-1 ring-border"
            >
              {(day?.meetings || []).map((m) => (
                <option key={m.key} value={m.key}>
                  {m.city} ({m.races.length} koşu)
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-subtle">{multi ? "Başlangıç koşusu" : "Koşu"}</span>
            <select
              value={race?.no || ""}
              onChange={(e) => {
                setRaceNo(e.target.value);
                resetSel();
              }}
              className="h-10 w-full rounded-lg bg-bg px-2 text-sm text-fg ring-1 ring-border"
            >
              {races.map((r) => (
                <option key={r.id || r.no} value={r.no}>
                  {r.no}. koşu · {r.time} {r.finished ? "(sonuçlandı)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-subtle">Oran (elle)</span>
            <input
              value={odds}
              onChange={(e) => setOdds(e.target.value)}
              inputMode="decimal"
              placeholder="örn. 3.50"
              className="h-10 w-full rounded-lg bg-bg px-3 text-sm text-fg ring-1 ring-border placeholder:text-subtle"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-subtle">Tutar ₺ (opsiyonel)</span>
            <input
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              inputMode="decimal"
              placeholder="örn. 50"
              className="h-10 w-full rounded-lg bg-bg px-3 text-sm text-fg ring-1 ring-border placeholder:text-subtle"
            />
          </label>
        </div>
        <p className="text-xs text-gold">{meta.hint}</p>

        {!multi && race ? (
          <HorsePicker horses={race.horses} selected={singleSel} onToggle={toggleSingle} />
        ) : null}
        {multi
          ? legRaces.map((r, i) => (
              <div key={r.id || r.no} className="rounded-lg bg-bg p-3 ring-1 ring-border">
                <p className="mb-2 text-sm font-medium text-fg">
                  {i + 1}. ayak · {r.no}. koşu {r.time ? `(${r.time})` : ""}
                </p>
                <HorsePicker
                  horses={r.horses}
                  selected={legSel[i] || []}
                  onToggle={(k) => toggleLeg(i, k)}
                />
              </div>
            ))
          : null}
        {multi && legRaces.length < meta.legs ? (
          <p className="text-xs text-danger">
            Seçtiğin koşudan itibaren {meta.legs} ayak için yeterli koşu yok ({legRaces.length} bulundu).
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addCoupon}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-fg px-5 text-sm font-medium text-bg"
          >
            <Ticket className="size-4" />
            Kupona ekle
          </button>
          {note ? <p className="text-sm text-muted">{note}</p> : null}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-fg">Kuponlarım ({items.length})</h2>
          <button
            type="button"
            onClick={checkResults}
            disabled={checking || !items.some((c) => c.status === "pending")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm text-fg ring-1 ring-border hover:bg-surface2 disabled:opacity-40"
          >
            <Bell className="size-4" />
            {checking ? "Kontrol ediliyor…" : "Sonuçları kontrol et"}
          </button>
        </div>
        {items.length === 0 ? (
          <p className="rounded-xl bg-surface px-4 py-8 text-center text-sm text-muted ring-1 ring-border">
            Henüz kupon yok. Yukarıdan ilk kuponunu oluştur.
          </p>
        ) : (
          <div className="grid gap-2">
            {items.map((c) => {
              const m = betMeta(c.betType);
              return (
                <article key={c.id} className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3 ring-1 ring-border">
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ring-1",
                      c.status === "won" && "bg-gold/15 text-gold ring-gold/30",
                      c.status === "lost" && "bg-surface2 text-subtle ring-border",
                      c.status === "pending" && "bg-surface2 text-muted ring-border",
                    )}
                  >
                    {c.status === "won" ? "Tuttu" : c.status === "lost" ? "Tutmadı" : "Bekliyor"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">
                      {m.label}
                      <span className="font-normal text-muted"> · {c.legs.map(legLabel).join(" • ")}</span>
                    </p>
                    <p className="truncate text-xs text-muted">
                      {c.legs[0]?.city} · {c.dateLabel} · Oran {c.odds ?? "—"}
                      {c.stake != null ? ` · Tutar ${c.stake} ₺` : ""}
                      {c.status === "won" && c.odds != null && c.stake != null
                        ? ` · Kazanç ${(c.odds * c.stake).toFixed(2)} ₺`
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setItems(deleteCoupon(c.id))}
                    aria-label="Sil"
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted ring-1 ring-border hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </article>
              );
            })}
          </div>
        )}
        <p className="text-xs text-subtle">
          Kontrol basitleştirilmiştir: eküri ve dead-heat (ölü ısı) kuralları uygulanmaz. Bildirimler site açıkken ve
          tarayıcı izniyle gelir. Bu sayfa bahis oynatmaz.
        </p>
      </section>
    </div>
  );
}

function HorsePicker({
  horses,
  selected,
  onToggle,
}: {
  horses: HorseEntry[];
  selected: string[];
  onToggle: (k: string) => void;
}) {
  if (!horses.length) return <p className="text-xs text-muted">Bu koşuda at bulunamadı.</p>;
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
      {horses.map((h) => {
        const k = hkey(h);
        const on = selected.includes(k);
        return (
          <button
            key={k}
            type="button"
            disabled={h.scratched}
            onClick={() => onToggle(k)}
            className={cn(
              "truncate rounded-lg px-2.5 py-2 text-left text-xs ring-1 transition-colors",
              on ? "bg-gold/20 text-fg ring-gold/50" : "bg-bg text-muted ring-border hover:text-fg",
              h.scratched && "opacity-40",
            )}
            title={h.scratched ? "Koşmaz" : `${h.name}`}
          >
            <span className="font-medium tabular">{h.number}</span> - {h.name}
            {h.scratched ? " (koşmaz)" : ""}
          </button>
        );
      })}
    </div>
  );
}
