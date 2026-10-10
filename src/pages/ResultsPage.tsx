import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PositionBadge } from "@/components/PositionBadge";
import { Silk } from "@/components/Silk";
import { Skeleton } from "@/components/Skeleton";
import { TrackBadge } from "@/components/TrackBadge";
import { getDayCard } from "@/lib/api";
import { istanbulTodayIso, isoToTr, shiftIso, weekdayTr, cn } from "@/lib/date";
import type { DayCard, Region } from "@/lib/types";

export function ResultsPage() {
  const [params, setParams] = useSearchParams();
  const tarih = /^\d{4}-\d{2}-\d{2}$/.test(params.get("tarih") || "") ? (params.get("tarih") as string) : shiftIso(istanbulTodayIso(), -0);
  const bolge: Region = params.get("bolge") === "dunya" ? "dunya" : "tr";

  const [data, setData] = useState<DayCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getDayCard(tarih, bolge)
      .then((d) => alive && setData(d))
      .catch(() => alive && setData({ date: tarih, meetings: [] }))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [tarih, bolge]);

  const finishedMeetings = useMemo(
    () =>
      (data?.meetings || [])
        .map((m) => ({ ...m, races: m.races.filter((r) => r.finished) }))
        .filter((m) => m.races.length > 0),
    [data],
  );

  function setDate(iso: string) {
    setParams((p) => {
      const n = new URLSearchParams(p);
      n.set("tarih", iso);
      return n;
    });
  }
  function setRegion(r: Region) {
    setParams((p) => {
      const n = new URLSearchParams(p);
      n.set("bolge", r);
      return n;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-subtle">Sonuçlar</p>
          <h1 className="mt-1 font-display text-4xl capitalize text-fg sm:text-5xl">{weekdayTr(tarih)}</h1>
          <p className="mt-1 text-muted">{isoToTr(tarih)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-full bg-surface ring-1 ring-border">
            <button
              type="button"
              onClick={() => setDate(shiftIso(tarih, -1))}
              className="inline-flex size-11 items-center justify-center text-muted hover:text-fg"
              aria-label="Önceki gün"
            >
              <ChevronLeft className="size-5" />
            </button>
            <input
              type="date"
              value={tarih}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="h-11 bg-transparent text-sm text-fg [color-scheme:dark]"
            />
            <button
              type="button"
              onClick={() => setDate(shiftIso(tarih, 1))}
              className="inline-flex size-11 items-center justify-center text-muted hover:text-fg"
              aria-label="Sonraki gün"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
          <div className="flex rounded-full bg-surface p-1 ring-1 ring-border">
            <button
              type="button"
              className={cn("h-9 rounded-full px-3 text-sm", bolge === "tr" ? "bg-fg text-bg" : "text-muted")}
              onClick={() => setRegion("tr")}
            >
              Türkiye
            </button>
            <button
              type="button"
              className={cn("h-9 rounded-full px-3 text-sm", bolge === "dunya" ? "bg-fg text-bg" : "text-muted")}
              onClick={() => setRegion("dunya")}
            >
              Yurt dışı
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      ) : finishedMeetings.length === 0 ? (
        <div className="rounded-xl bg-surface px-6 py-16 text-center ring-1 ring-border">
          <p className="font-display text-2xl">Bu tarihte sonuçlanmış koşu yok</p>
          <p className="mt-2 text-sm text-muted">Program henüz sonuçlanmamış olabilir.</p>
        </div>
      ) : (
        finishedMeetings.map((meeting) => (
          <section key={meeting.key} className="overflow-hidden rounded-xl bg-surface ring-1 ring-border">
            <header className="border-b border-border px-4 py-3">
              <h2 className="font-display text-xl">{meeting.name}</h2>
              <p className="text-sm text-muted">{meeting.city}</p>
            </header>
            <div className="divide-y divide-border">
              {meeting.races.map((race) => {
                const podium = [...race.horses]
                  .filter((h) => /^[1-3]$/.test(h.position))
                  .sort((a, b) => Number(a.position) - Number(b.position));
                return (
                  <div key={race.id || race.no} className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-lg tabular">{race.no}.</span>
                      <TrackBadge kind={race.track} label={race.trackLabel} />
                      <span className="text-sm text-muted">{race.distance} m</span>
                      {race.named ? <span className="text-sm text-muted">· {race.named}</span> : null}
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {podium.map((h) => (
                        <Link
                          key={h.id || h.number}
                          to={h.id ? `/at/${h.id}` : "#"}
                          className="flex items-center gap-3 rounded-lg bg-surface2 px-3 py-2.5 ring-1 ring-border hover:ring-gold/40"
                        >
                          <PositionBadge pos={h.position} />
                          <Silk src={h.silkUrl} alt="" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-fg">{h.name}</p>
                            <p className="truncate text-xs text-muted">
                              {h.jockeyName} · {h.time || "—"}
                            </p>
                          </div>
                          {h.position === "1" ? <Trophy className="ml-auto size-4 shrink-0 text-gold" /> : null}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
