import { DISTANCE_LABEL, SURFACE_LABEL } from "@/lib/format";
import type { SurfaceDistanceStats } from "@/lib/types";
import { cn } from "@/lib/date";

export function SurfaceStatsCard({ stats, note }: { stats: SurfaceDistanceStats; note?: string }) {
  const surfaces = (["cim", "kum", "sentetik"] as const).map((k) => ({ key: k, ...stats.bySurface[k] }));
  const distances = (["kisa", "orta", "uzun"] as const).map((k) => ({ key: k, ...stats.byDistance[k] }));

  return (
    <section className="overflow-hidden rounded-xl bg-surface ring-1 ring-border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="font-display text-xl">Zemin ve mesafe performansı</h2>
        {note ? <p className="text-xs text-subtle">{note}</p> : null}
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-subtle">Zemine göre kazanma oranı</p>
          <div className="space-y-2">
            {surfaces.map((s) => (
              <Bar key={s.key} label={SURFACE_LABEL[s.key]} stat={s} best={stats.bestSurface === s.key} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-subtle">Mesafeye göre kazanma oranı</p>
          <div className="space-y-2">
            {distances.map((d) => (
              <Bar key={d.key} label={DISTANCE_LABEL[d.key]} stat={d} best={stats.bestDistance === d.key} />
            ))}
          </div>
        </div>
      </div>
      {stats.sample < 3 ? (
        <p className="border-t border-border px-4 py-3 text-xs text-subtle">
          Sonuçlanmış koşu sayısı az olduğu için "en iyi zemin/mesafe" belirlenemedi.
        </p>
      ) : null}
    </section>
  );
}

function Bar({ label, stat, best }: { label: string; stat: { starts: number; wins: number; winPct: number }; best: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg px-3 py-2 ring-1",
        best ? "bg-gold/10 ring-gold/40" : "bg-surface2 ring-border",
      )}
    >
      <div className="flex items-center justify-between text-sm">
        <span className={cn("font-medium", best ? "text-gold" : "text-fg")}>
          {label}
          {best ? " ★" : ""}
        </span>
        <span className="tabular text-muted">
          {stat.wins}/{stat.starts} · %{stat.winPct}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg">
        <div
          className={cn("h-full rounded-full", best ? "bg-gold" : "bg-subtle")}
          style={{ width: `${Math.min(100, stat.winPct)}%` }}
        />
      </div>
    </div>
  );
}
