import { ArrowLeft, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/Skeleton";
import { getLeaderboard } from "@/lib/api";
import type { Leaderboard, LeaderboardRow } from "@/lib/types";
import { cn } from "@/lib/date";

const WINDOWS = [7, 30, 90];

export function LeaderboardPage() {
  const [params, setParams] = useSearchParams();
  const days = WINDOWS.includes(Number(params.get("gun"))) ? Number(params.get("gun")) : 30;
  const [data, setData] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"wins" | "winrate">("wins");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getLeaderboard(days)
      .then((d) => alive && setData(d))
      .catch(() => alive && setData({ days, jockeys: [], trainers: [] }))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [days]);

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex h-11 items-center gap-2 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" />
        Program
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-subtle">Liderlik tablosu</p>
          <h1 className="mt-1 font-display text-4xl text-fg sm:text-5xl">En çok kazananlar</h1>
        </div>
        <div className="flex flex-wrap gap-2">
        <div className="flex rounded-full bg-surface p-1 ring-1 ring-border">
          {WINDOWS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() =>
                setParams((p) => {
                  const n = new URLSearchParams(p);
                  n.set("gun", String(w));
                  return n;
                })
              }
              className={cn("h-9 rounded-full px-3 text-sm", days === w ? "bg-fg text-bg" : "text-muted")}
            >
              Son {w} gün
            </button>
          ))}
        </div>
        <div className="flex rounded-full bg-surface p-1 ring-1 ring-border">
          <button
            type="button"
            onClick={() => setSort("wins")}
            className={cn("h-9 rounded-full px-3 text-sm", sort === "wins" ? "bg-fg text-bg" : "text-muted")}
          >
            Galibiyet
          </button>
          <button
            type="button"
            onClick={() => setSort("winrate")}
            title="En az 5 startı olanlar, kazanma yüzdesine göre"
            className={cn("h-9 rounded-full px-3 text-sm", sort === "winrate" ? "bg-fg text-bg" : "text-muted")}
          >
            Winrate
          </button>
        </div>
        </div>
      </div>

      {loading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <RankTable title="Jokeyler" rows={sortRows(data.jockeys, sort)} basePath="/jokey" />
          <RankTable title="Antrenörler" rows={sortRows(data.trainers, sort)} basePath="/kisi/antrenor" />
        </div>
      )}
    </div>
  );
}

function sortRows(rows: LeaderboardRow[], sort: "wins" | "winrate"): LeaderboardRow[] {
  if (sort === "winrate") {
    // 1 koşuda 1 galibiyet = %100 yanıltmasın diye en az 5 start şartı
    return [...rows]
      .filter((r) => r.starts >= 5)
      .sort((a, b) => b.winPct - a.winPct || b.wins - a.wins)
      .slice(0, 20);
  }
  return rows;
}

function RankTable({ title, rows, basePath }: { title: string; rows: LeaderboardRow[]; basePath: string }) {
  return (
    <section className="overflow-hidden rounded-xl bg-surface ring-1 ring-border">
      <h2 className="border-b border-border px-4 py-3 font-display text-xl">{title}</h2>
      {rows.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted">Bu dönemde veri bulunamadı.</p>
      ) : (
        <ol className="divide-y divide-border">
          {rows.map((r, i) => (
            <li key={r.id}>
              <Link to={`${basePath}/${r.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface2">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular",
                    i === 0 ? "bg-gold text-[#241a05]" : "bg-surface2 text-muted ring-1 ring-border",
                  )}
                >
                  {i === 0 ? <Trophy className="size-3.5" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-fg">{r.name}</span>
                <span className="shrink-0 text-xs tabular text-muted">
                  {r.wins}G / {r.starts}K · %{r.winPct}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
