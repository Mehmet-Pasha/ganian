import { ArrowLeft, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/Skeleton";
import { SurfaceStatsCard } from "@/components/SurfaceStatsCard";
import { getHorseProfile, searchRacing } from "@/lib/api";
import { parseAgeText } from "@/lib/format";
import type { HorseProfile, SearchHit } from "@/lib/types";

export function ComparePage() {
  const [params, setParams] = useSearchParams();
  const aId = params.get("a") || "";
  const bId = params.get("b") || "";

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex h-11 items-center gap-2 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" />
        Program
      </Link>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-subtle">Karşılaştır</p>
        <h1 className="mt-1 font-display text-4xl text-fg sm:text-5xl">İki atı karşılaştır</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Slot
          id={aId}
          onPick={(id) =>
            setParams((p) => {
              const n = new URLSearchParams(p);
              if (id) n.set("a", id);
              else n.delete("a");
              return n;
            })
          }
        />
        <Slot
          id={bId}
          onPick={(id) =>
            setParams((p) => {
              const n = new URLSearchParams(p);
              if (id) n.set("b", id);
              else n.delete("b");
              return n;
            })
          }
        />
      </div>

      {aId && bId ? <CompareBody aId={aId} bId={bId} /> : null}
    </div>
  );
}

function Slot({ id, onPick }: { id: string; onPick: (id: string) => void }) {
  const [horse, setHorse] = useState<HorseProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setHorse(null);
      return;
    }
    let alive = true;
    setLoading(true);
    getHorseProfile(id)
      .then((h) => alive && setHorse(h))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  if (!id) return <PickBox onPick={onPick} />;
  if (loading || !horse) return <Skeleton className="h-24 w-full rounded-xl" />;

  const age = parseAgeText(horse.ageText);
  return (
    <div className="rounded-xl bg-surface p-4 ring-1 ring-border">
      <p className="font-display text-2xl">{horse.name}</p>
      <p className="text-sm text-muted">{age.label || horse.ageText}</p>
      <button type="button" onClick={() => onPick("")} className="mt-2 text-xs text-subtle hover:text-fg">
        Değiştir
      </button>
    </div>
  );
}

function PickBox({ onPick }: { onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const curId = ++reqIdRef.current;
    const snapshot = q;
    const t = setTimeout(() => {
      searchRacing(snapshot)
        .then((res) => {
          if (curId !== reqIdRef.current) return;
          setHits(res.filter((h) => h.kind === "at"));
        })
        .catch(() => {
          if (curId !== reqIdRef.current) return;
          setHits([]);
        });
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="rounded-xl bg-surface p-4 ring-1 ring-border">
      <div className="flex items-center gap-2 rounded-full bg-surface2 px-3 ring-1 ring-border">
        <Search className="size-4 text-subtle" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="At ara…"
          className="h-10 w-full bg-transparent text-sm text-fg placeholder:text-subtle focus:outline-none"
        />
      </div>
      {hits.length ? (
        <div className="mt-2 max-h-56 space-y-0.5 overflow-y-auto">
          {hits.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => onPick(h.id)}
              className="block w-full truncate rounded-lg px-3 py-2 text-left text-sm text-fg hover:bg-surface2"
            >
              {h.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CompareBody({ aId, bId }: { aId: string; bId: string }) {
  const [a, setA] = useState<HorseProfile | null>(null);
  const [b, setB] = useState<HorseProfile | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([getHorseProfile(aId), getHorseProfile(bId)]).then(([ha, hb]) => {
      if (!alive) return;
      setA(ha);
      setB(hb);
    });
    return () => {
      alive = false;
    };
  }, [aId, bId]);

  if (!a || !b) return <Skeleton className="h-64 w-full rounded-xl" />;

  const totalA = a.career.find((c) => /toplam|kariyer/i.test(c.label)) || a.career[0];
  const totalB = b.career.find((c) => /toplam|kariyer/i.test(c.label)) || b.career[0];

  const headToHead = a.races.filter((ra) =>
    b.races.some((rb) => rb.dateIso === ra.dateIso && rb.raceNo === ra.raceNo && rb.city === ra.city),
  );

  const rows: { label: string; a: string; b: string }[] = [
    { label: "Yaş", a: parseAgeText(a.ageText).label || a.ageText, b: parseAgeText(b.ageText).label || b.ageText },
    { label: "HP", a: a.hp || "—", b: b.hp || "—" },
    { label: "Koşu / 1.", a: totalA ? `${totalA.starts} / ${totalA.first}` : "—", b: totalB ? `${totalB.starts} / ${totalB.first}` : "—" },
    {
      label: "En iyi zemin",
      a: a.surfaceStats.bestSurface ? String(a.surfaceStats.bestSurface) : "—",
      b: b.surfaceStats.bestSurface ? String(b.surfaceStats.bestSurface) : "—",
    },
    {
      label: "En iyi mesafe",
      a: a.surfaceStats.bestDistance || "—",
      b: b.surfaceStats.bestDistance || "—",
    },
    { label: "Antrenör", a: a.trainer || "—", b: b.trainer || "—" },
    { label: "Sahip", a: a.owner || "—", b: b.owner || "—" },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl bg-surface ring-1 ring-border">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border px-4 py-4">
          <Link to={`/at/${a.id}`} className="truncate text-right font-display text-xl hover:underline">
            {a.name}
          </Link>
          <span className="text-xs text-subtle">vs</span>
          <Link to={`/at/${b.id}`} className="truncate font-display text-xl hover:underline">
            {b.name}
          </Link>
        </div>
        <div className="divide-y divide-border">
          {rows.map((r) => (
            <div key={r.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 text-sm">
              <span className="truncate text-right tabular">{r.a}</span>
              <span className="text-xs text-subtle">{r.label}</span>
              <span className="truncate tabular">{r.b}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <SurfaceStatsCard stats={a.surfaceStats} />
        <SurfaceStatsCard stats={b.surfaceStats} />
      </div>

      {headToheadNote(headToHead.length)}
    </div>
  );
}

function headToheadNote(count: number) {
  if (count === 0) {
    return (
      <p className="rounded-xl bg-surface px-4 py-6 text-center text-sm text-muted ring-1 ring-border">
        Bu iki at şimdiye kadar aynı koşuda yarışmamış (koşu geçmişi verisine göre).
      </p>
    );
  }
  return (
    <p className="rounded-xl bg-surface px-4 py-6 text-center text-sm text-muted ring-1 ring-border">
      Bu iki at koşu geçmişlerine göre {count} kez aynı yarışta koştu.
    </p>
  );
}
