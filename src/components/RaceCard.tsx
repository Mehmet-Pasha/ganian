import { Play, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AnalysisDialog } from "@/components/AnalysisDialog";
import { FormPips } from "@/components/FormPips";
import { PositionBadge } from "@/components/PositionBadge";
import { Silk } from "@/components/Silk";
import { TrackBadge } from "@/components/TrackBadge";
import { distanceBucket, parseAgeText } from "@/lib/format";
import type { Favorites, HorseEntry, Meeting, Race } from "@/lib/types";
import { cn } from "@/lib/date";

export function RaceCard({
  race,
  meeting,
  onWatch,
  horseFav = {},
  jockeyFav = {},
}: {
  race: Race;
  meeting?: Meeting;
  onWatch: (horse: HorseEntry, race: Race) => void;
  horseFav?: Record<string, Favorites>;
  jockeyFav?: Record<string, Favorites>;
}) {
  const purse = race.prizes[0];
  const [analysisOpen, setAnalysisOpen] = useState(false);
  return (
    <article className="overflow-hidden rounded-xl bg-surface ring-1 ring-border">
      <header className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-2xl tabular text-fg">{race.no}.</span>
            <span className="text-sm tabular text-muted">{race.time}</span>
            <TrackBadge kind={race.track} label={race.trackLabel} />
            {race.finished ? (
              <span className="rounded-md bg-gold/15 px-2 py-0.5 text-xs font-medium text-gold ring-1 ring-gold/30">
                Sonuçlandı
              </span>
            ) : (
              <span className="rounded-md bg-surface2 px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-border">
                Bekleniyor
              </span>
            )}
          </div>
          <h3 className="mt-1 font-display text-xl leading-snug text-fg">{race.named || race.raceType}</h3>
          <p className="mt-1 text-sm text-muted">
            {race.group}
            {race.gender ? ` · ${race.gender}` : ""} · {race.distance} m
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {purse ? <span className="tabular text-fg">{purse}</span> : null}
          {meeting ? (
            <button
              type="button"
              onClick={() => setAnalysisOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gold/15 px-3 text-sm font-medium text-gold ring-1 ring-gold/30 hover:bg-gold/25"
            >
              <Sparkles className="size-4" />
              AI Analiz
            </button>
          ) : null}
          {race.videoUrl ? (
            <button
              type="button"
              onClick={() => {
                const winner = race.horses.find((h) => h.position === "1") ?? race.horses[0];
                if (winner) onWatch(winner, race);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-fg ring-1 ring-border hover:bg-surface2"
            >
              <Play className="size-4" />
              Koşuyu izle
            </button>
          ) : null}
        </div>
      </header>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-subtle">
            <tr className="border-b border-border">
              {race.finished ? <th className="px-3 py-2 font-medium">Sıra</th> : null}
              <th className="px-3 py-2 font-medium">No</th>
              <th className="px-3 py-2 font-medium">At</th>
              <th className="px-3 py-2 font-medium">Kg</th>
              <th className="px-3 py-2 font-medium">HP</th>
              <th className="px-3 py-2 font-medium">Jokey</th>
              <th className="px-3 py-2 font-medium">Form</th>
              <th className="px-3 py-2 font-medium">Ganyan</th>
              <th className="px-3 py-2 font-medium">AGF</th>
              {race.finished ? <th className="px-3 py-2 font-medium">Derece</th> : null}
            </tr>
          </thead>
          <tbody>
            {race.horses.map((h) => (
              <HorseRow
                key={h.id || h.number}
                horse={h}
                race={race}
                onWatch={onWatch}
                variant="table"
                horseIsFav={isFavorite(horseFav[h.id], race)}
                jockeyIsFav={isFavorite(jockeyFav[h.jockeyId], race)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border md:hidden">
        {race.horses.map((h) => (
          <HorseRow
            key={h.id || h.number}
            horse={h}
            race={race}
            onWatch={onWatch}
            variant="card"
            horseIsFav={isFavorite(horseFav[h.id], race)}
            jockeyIsFav={isFavorite(jockeyFav[h.jockeyId], race)}
          />
        ))}
      </div>

      {race.bets || race.last800 ? (
        <footer className="space-y-1 border-t border-border px-4 py-3 text-xs text-muted">
          {race.last800 ? <p>Son 800 m: {race.last800}</p> : null}
          {race.bets ? <p className="leading-relaxed">{race.bets}</p> : null}
        </footer>
      ) : null}

      {analysisOpen && meeting ? (
        <AnalysisDialog meeting={meeting} race={race} onClose={() => setAnalysisOpen(false)} />
      ) : null}
    </article>
  );
}

function isFavorite(fav: Favorites | undefined, race: Race): boolean {
  if (!fav) return false;
  const bucket = distanceBucket(race.distance);
  return (fav.bestSurface != null && fav.bestSurface === race.track) || (fav.bestDistance != null && fav.bestDistance === bucket);
}

function HorseRow({
  horse,
  race,
  onWatch,
  variant,
  horseIsFav,
  jockeyIsFav,
}: {
  horse: HorseEntry;
  race: Race;
  onWatch: (horse: HorseEntry, race: Race) => void;
  variant: "table" | "card";
  horseIsFav: boolean;
  jockeyIsFav: boolean;
}) {
  const age = parseAgeText(horse.ageText);
  const nameLink = horse.id ? (
    <Link
      to={`/at/${horse.id}`}
      title={horseIsFav ? "Bu at favori zemininde veya mesafesinde koşuyor" : undefined}
      className={cn(
        "font-medium underline-offset-4 hover:underline",
        horseIsFav ? "text-gold" : "text-fg",
        horse.scratched && "text-subtle line-through",
      )}
    >
      {horse.name}
    </Link>
  ) : (
    <span className="font-medium">{horse.name}</span>
  );

  const jokeyLink = horse.jockeyId ? (
    <Link
      to={`/jokey/${horse.jockeyId}?ad=${encodeURIComponent(horse.jockeyName)}`}
      title={jockeyIsFav ? "Bu jokey favori zemininde veya mesafesinde koşuyor" : undefined}
      className={cn(
        "underline-offset-4 hover:underline",
        jockeyIsFav ? "text-gold" : "text-muted hover:text-fg",
      )}
    >
      {horse.jockeyName}
    </Link>
  ) : (
    <span className="text-muted">{horse.jockeyName}</span>
  );

  if (variant === "card") {
    return (
      <div className="flex gap-3 px-4 py-3">
        {race.finished ? <PositionBadge pos={horse.position} /> : null}
        <span className="w-6 pt-1 text-sm tabular text-subtle">{horse.number}</span>
        <Silk src={horse.silkUrl} alt={`${horse.ownerName} forması`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {nameLink}
              <p className="text-xs text-muted">
                {age.label || horse.ageText}
                {horse.sire ? ` · ${horse.sire} — ${horse.dam}` : ""}
              </p>
            </div>
            {horse.id && race.id ? (
              <button
                type="button"
                className="inline-flex size-10 shrink-0 items-center justify-center text-gold"
                onClick={() => onWatch(horse, race)}
                aria-label="Yarışı izle"
              >
                <Play className="size-4" />
              </button>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="tabular text-fg">{horse.kg ?? "—"} kg</span>
            <span className="tabular text-muted">HP {horse.hp || "—"}</span>
            {jokeyLink}
            <FormPips form={horse.form} />
            {horse.ganyan ? <span className="tabular text-muted">{horse.ganyan}</span> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <tr className={cn("border-b border-border/70 last:border-0", horse.scratched && "opacity-50")}>
      {race.finished ? (
        <td className="px-3 py-2.5">
          <PositionBadge pos={horse.position} />
        </td>
      ) : null}
      <td className="px-3 py-2.5 tabular text-subtle">{horse.number}</td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Silk src={horse.silkUrl} alt="" />
          <div className="min-w-0">
            {nameLink}
            <p className="text-xs text-muted">
              {age.label || horse.ageText}
              {horse.stall ? ` · K${horse.stall}` : ""}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 tabular">
        {horse.kg ?? "—"}
        {horse.extraKg && horse.extraKg !== "0" ? <span className="text-xs text-muted"> +{horse.extraKg}</span> : null}
      </td>
      <td className="px-3 py-2.5 tabular">{horse.hp || "—"}</td>
      <td className="px-3 py-2.5">{jokeyLink}</td>
      <td className="px-3 py-2.5">
        <FormPips form={horse.form} />
      </td>
      <td className="px-3 py-2.5 tabular text-muted">{horse.ganyan || "—"}</td>
      <td className="px-3 py-2.5 tabular text-muted">{horse.agf ? `%${horse.agf}` : "—"}</td>
      {race.finished ? (
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="tabular">{horse.time || "—"}</span>
            {horse.id && race.id ? (
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center text-gold"
                onClick={() => onWatch(horse, race)}
                aria-label="İzle"
              >
                <Play className="size-4" />
              </button>
            ) : null}
          </div>
        </td>
      ) : null}
    </tr>
  );
}
