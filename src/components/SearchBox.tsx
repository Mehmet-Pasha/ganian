import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchRacing } from "@/lib/api";
import type { SearchHit } from "@/lib/types";

const KIND_LABEL: Record<SearchHit["kind"], string> = {
  at: "At",
  jokey: "Jokey",
  antrenor: "Antrenör",
  sahip: "Sahip",
};

const KIND_PATH: Record<SearchHit["kind"], string> = {
  at: "/at",
  jokey: "/jokey",
  antrenor: "/kisi/antrenor",
  sahip: "/kisi/sahip",
};

export function SearchBox({ onDone }: { onDone?: () => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const reqIdRef = useRef(0);
  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const curId = ++reqIdRef.current;
    const snapshot = q;
    const t = setTimeout(() => {
      searchRacing(snapshot)
        .then((res) => {
          if (curId !== reqIdRef.current) return;
          setHits(Array.isArray(res) ? res : []);
        })
        .catch(() => {
          if (curId !== reqIdRef.current) return;
          setHits([]);
        })
        .finally(() => {
          if (curId === reqIdRef.current) setLoading(false);
        });
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function select(hit: SearchHit) {
    navigate(`${KIND_PATH[hit.kind]}/${hit.id}${hit.kind === "jokey" ? `?ad=${encodeURIComponent(hit.name)}` : ""}`);
    setQ("");
    setHits([]);
    setOpen(false);
    onDone?.();
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-full bg-surface px-4 ring-1 ring-border focus-within:ring-gold/50">
        <Search className="size-4 shrink-0 text-subtle" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="At, jokey, antrenör veya sahip ara…"
          className="h-11 w-full bg-transparent text-sm text-fg placeholder:text-subtle focus:outline-none"
        />
        {q ? (
          <button type="button" onClick={() => setQ("")} aria-label="Temizle" className="text-subtle hover:text-fg">
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      {open && (q.trim().length >= 2) ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-80 overflow-y-auto rounded-xl bg-surface2 p-1 shadow-2xl ring-1 ring-border">
          {loading ? <p className="px-3 py-3 text-sm text-subtle">Aranıyor…</p> : null}
          {!loading && hits.length === 0 ? (
            <p className="px-3 py-3 text-sm text-subtle">Son 5 günün programında sonuç bulunamadı.</p>
          ) : null}
          {hits.map((h) => (
            <button
              key={`${h.kind}-${h.id}`}
              type="button"
              onClick={() => select(h)}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-surface"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-fg">{h.name}</span>
                {h.extra ? <span className="block truncate text-xs text-subtle">{h.extra}</span> : null}
              </span>
              <span className="shrink-0 rounded-full bg-bg px-2 py-0.5 text-[11px] text-muted ring-1 ring-border">
                {KIND_LABEL[h.kind]}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
