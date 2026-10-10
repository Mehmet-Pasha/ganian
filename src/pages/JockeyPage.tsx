import { ArrowLeft, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { PositionBadge } from "@/components/PositionBadge";
import { ShareBar } from "@/components/ShareBar";
import { Skeleton } from "@/components/Skeleton";
import { StarButton } from "@/components/StarButton";
import { SurfaceStatsCard } from "@/components/SurfaceStatsCard";
import { TrackBadge } from "@/components/TrackBadge";
import { VideoDialog } from "@/components/VideoDialog";
import { getJockeyProfile } from "@/lib/api";
import type { JockeyProfile, JockeyRide } from "@/lib/types";

export function JockeyPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const ad = params.get("ad") || "";
  const [jokey, setJokey] = useState<JockeyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [watch, setWatch] = useState<JockeyRide | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getJockeyProfile(id, ad)
      .then((j) => alive && setJokey(j))
      .catch(() => alive && setJokey(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, ad]);

  if (loading || !jokey) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  const stats = [
    { label: "Koşu", value: jokey.starts },
    { label: "1.", value: jokey.first },
    { label: "2.", value: jokey.second },
    { label: "3.", value: jokey.third },
    { label: "1. %", value: jokey.winPct ? `%${jokey.winPct}` : "—" },
    { label: "2. %", value: jokey.placePct ? `%${jokey.placePct}` : "—" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="inline-flex h-11 items-center gap-2 text-sm text-muted hover:text-fg">
          <ArrowLeft className="size-4" />
          Program
        </Link>
        <ShareBar title={jokey.name} text={`${jokey.name} — TJK jokey profili`} />
      </div>

      <header className="rounded-xl bg-surface p-5 ring-1 ring-border sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-subtle">Jokey</p>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl">{jokey.name}</h1>
            <p className="mt-2 text-muted">
              {[jokey.licenseType, jokey.birthDate ? `Doğum ${jokey.birthDate}` : "", jokey.city]
                .filter(Boolean)
                .join(" · ") || "Ek kimlik bilgisi TJK sayfasında bulunamadı"}
            </p>
          </div>
          <StarButton kind="jokey" id={jokey.id} name={jokey.name} />
        </div>
        <dl className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="text-xs uppercase tracking-wide text-subtle">{s.label}</dt>
              <dd className="mt-1 font-display text-2xl tabular">{s.value || "—"}</dd>
            </div>
          ))}
        </dl>
        {jokey.error ? <p className="mt-4 text-sm text-danger">{jokey.error}</p> : null}
      </header>

      {jokey.periods.length > 1 ? (
        <section className="overflow-hidden rounded-xl bg-surface ring-1 ring-border">
          <h2 className="border-b border-border px-4 py-3 font-display text-xl">Dönemsel istatistik</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-xs uppercase tracking-wide text-subtle">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left font-medium">Dönem</th>
                  <th className="px-3 py-2 text-left font-medium">K</th>
                  <th className="px-3 py-2 text-left font-medium">1</th>
                  <th className="px-3 py-2 text-left font-medium">2</th>
                  <th className="px-3 py-2 text-left font-medium">3</th>
                  <th className="px-3 py-2 text-left font-medium">1. %</th>
                </tr>
              </thead>
              <tbody>
                {jokey.periods.map((p) => (
                  <tr key={p.label} className="border-b border-border/70 last:border-0">
                    <td className="px-3 py-2">{p.label}</td>
                    <td className="px-3 py-2 tabular">{p.starts}</td>
                    <td className="px-3 py-2 tabular">{p.first}</td>
                    <td className="px-3 py-2 tabular">{p.second}</td>
                    <td className="px-3 py-2 tabular">{p.third}</td>
                    <td className="px-3 py-2 tabular text-muted">{p.winPct ? `%${p.winPct}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <SurfaceStatsCard
        stats={jokey.surfaceStats}
        note={`Son 10 günün binişlerine göre (${jokey.surfaceStats.sample} koşu)`}
      />

      <section className="overflow-hidden rounded-xl bg-surface ring-1 ring-border">
        <h2 className="border-b border-border px-4 py-3 font-display text-xl">
          Son binişler
          <span className="ml-2 text-sm font-sans font-normal text-muted">son 10 gün · {jokey.rides.length}</span>
        </h2>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="text-xs uppercase tracking-wide text-subtle">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left font-medium">Tarih</th>
                <th className="px-3 py-2 text-left font-medium">Şehir</th>
                <th className="px-3 py-2 text-left font-medium">At</th>
                <th className="px-3 py-2 text-left font-medium">Sıra</th>
                <th className="px-3 py-2 text-left font-medium">Kg</th>
                <th className="px-3 py-2 text-left font-medium">HP</th>
                <th className="px-3 py-2 text-left font-medium">Pist</th>
                <th className="px-3 py-2 text-left font-medium">İzle</th>
              </tr>
            </thead>
            <tbody>
              {jokey.rides.map((ride, i) => (
                <tr key={`${ride.dateIso}-${ride.raceId}-${ride.horseId}-${i}`} className="border-b border-border/70 last:border-0">
                  <td className="px-3 py-2.5 tabular text-muted">
                    {ride.date || ride.dateIso} {ride.raceTime}
                  </td>
                  <td className="px-3 py-2.5">{ride.city}</td>
                  <td className="px-3 py-2.5">
                    <Link to={`/at/${ride.horseId}`} className="hover:underline">
                      {ride.horseName}
                    </Link>
                    <p className="text-xs text-muted">
                      {ride.raceNo}. koşu · {ride.raceType}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <PositionBadge pos={ride.position} />
                  </td>
                  <td className="px-3 py-2.5 tabular">{ride.kg ?? "—"}</td>
                  <td className="px-3 py-2.5 tabular">{ride.hp || "—"}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <TrackBadge kind={ride.track} label={ride.trackLabel} />
                      <span className="tabular text-muted">{ride.distance} m</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    {ride.horseId && ride.raceId ? (
                      <button
                        type="button"
                        onClick={() => setWatch(ride)}
                        aria-label="İzle"
                        className="inline-flex size-9 items-center justify-center text-gold"
                      >
                        <Play className="size-4" />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-border md:hidden">
          {jokey.rides.map((ride, i) => (
            <article key={`${ride.raceId}-${i}`} className="flex gap-3 px-4 py-3">
              <PositionBadge pos={ride.position} />
              <div className="min-w-0 flex-1">
                <Link to={`/at/${ride.horseId}`} className="font-medium hover:underline">
                  {ride.horseName}
                </Link>
                <p className="text-xs text-muted">
                  {ride.date || ride.dateIso} · {ride.city} · {ride.kg ?? "—"} kg · HP {ride.hp || "—"}
                </p>
                <div className="mt-2">
                  <TrackBadge kind={ride.track} label={ride.trackLabel} />
                </div>
              </div>
              {ride.horseId && ride.raceId ? (
                <button
                  type="button"
                  onClick={() => setWatch(ride)}
                  aria-label="İzle"
                  className="inline-flex size-10 items-center justify-center text-gold"
                >
                  <Play className="size-4" />
                </button>
              ) : null}
            </article>
          ))}
        </div>
        {jokey.rides.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">Son 10 günde biniş kaydı bulunamadı.</p>
        ) : null}
      </section>

      {watch ? (
        <VideoDialog
          atId={watch.horseId}
          kosuKod={watch.raceId}
          fallbackUrl={watch.videoUrl}
          title={`${watch.horseName} · ${jokey.name}`}
          onClose={() => setWatch(null)}
        />
      ) : null}
    </div>
  );
}
