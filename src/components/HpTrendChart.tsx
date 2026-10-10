import { useId, useMemo, useState } from "react";
import type { PastRace } from "@/lib/types";

export function HpTrendChart({ races }: { races: PastRace[] }) {
  const gradientId = useId();
  const points = useMemo(() => {
    // races listesi yeniden eskiye sıralı geliyor; grafik için eskiden yeniye çeviriyoruz.
    return [...races]
      .filter((r) => r.hp && Number.isFinite(Number.parseFloat(String(r.hp).replace(",", "."))))
      .reverse()
      .map((r) => ({ dateIso: r.dateIso, date: r.date, hp: Number.parseFloat(String(r.hp).replace(",", ".")) }));
  }, [races]);

  const [hover, setHover] = useState<number | null>(null);

  if (points.length < 2) return null;

  const w = 640;
  const h = 160;
  const padX = 12;
  const padY = 16;
  const hps = points.map((p) => p.hp);
  const min = Math.min(...hps);
  const max = Math.max(...hps);
  const span = max - min || 1;

  const coords = points.map((p, i) => {
    const x = padX + (i / (points.length - 1)) * (w - padX * 2);
    const y = h - padY - ((p.hp - min) / span) * (h - padY * 2);
    return { x, y, p };
  });

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${path} L${coords[coords.length - 1].x.toFixed(1)},${h - padY} L${coords[0].x.toFixed(1)},${h - padY} Z`;
  const trendUp = points[points.length - 1].hp >= points[0].hp;

  return (
    <section className="overflow-hidden rounded-xl bg-surface ring-1 ring-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-display text-xl">HP puanı seyri</h2>
        <span className="text-sm tabular text-muted">
          {points[0].hp} → {points[points.length - 1].hp}
          <span className={trendUp ? "text-gold" : "text-danger"}> {trendUp ? "▲" : "▼"}</span>
        </span>
      </div>
      <div className="p-4">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full touch-none"
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label="HP puanı zaman içindeki değişim grafiği"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d8a94e" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#d8a94e" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradientId})`} />
          <path d={path} fill="none" stroke="#d8a94e" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={hover === i ? 4 : 3}
              fill={hover === i ? "#f0c874" : "#d8a94e"}
              className="cursor-pointer"
              onMouseEnter={() => setHover(i)}
              onTouchStart={() => setHover(i)}
            />
          ))}
        </svg>
        <div className="mt-1 flex justify-between text-xs text-subtle">
          <span>{points[0].date}</span>
          <span>{points[points.length - 1].date}</span>
        </div>
        {hover != null ? (
          <p className="mt-2 text-sm text-fg">
            {points[hover].date}: <span className="tabular font-medium">HP {points[hover].hp}</span>
          </p>
        ) : null}
      </div>
    </section>
  );
}
