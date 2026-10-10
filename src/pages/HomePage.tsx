import { ChevronLeft, ChevronRight, CloudSun, Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RaceCard } from "@/components/RaceCard";
import { Skeleton } from "@/components/Skeleton";
import { TrackBadge } from "@/components/TrackBadge";
import { VideoDialog } from "@/components/VideoDialog";
import { getDayCard, getHorseFavorites, getJockeyFavorites } from "@/lib/api";
import { enqueueMeeting, getQueue, subscribeJobs } from "@/lib/analysisRunner";
import { getGptEffort, getGptKey, getGptModel } from "@/lib/gpt";
import { istanbulTodayIso, isoToTr, shiftIso, weekdayTr, cn } from "@/lib/date";
import { useFavorites } from "@/lib/favorites";
import type { DayCard, Favorites, HorseEntry, Meeting, Race, Region } from "@/lib/types";

export function HomePage() {
  const [params, setParams] = useSearchParams();
  const tarih = /^\d{4}-\d{2}-\d{2}$/.test(params.get("tarih") || "") ? (params.get("tarih") as string) : istanbulTodayIso();
  const bolge: Region = params.get("bolge") === "dunya" ? "dunya" : "tr";
  const hip = params.get("hip") || undefined;

  const [data, setData] = useState<DayCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [watch, setWatch] = useState<{ horse: HorseEntry; race: Race } | null>(null);

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

  const activeKey = useMemo(() => {
    if (!data) return undefined;
    return hip && data.meetings.some((m) => m.key === hip) ? hip : data.meetings[0]?.key;
  }, [data, hip]);

  const meeting = data?.meetings.find((m) => m.key === activeKey);
  const { items: favItems } = useFavorites();

  const favoriteRunners = useMemo(() => {
    if (!data || !favItems.length) return [];
    const favHorseIds = new Set(favItems.filter((f) => f.kind === "at").map((f) => f.id));
    const favJockeyIds = new Set(favItems.filter((f) => f.kind === "jokey").map((f) => f.id));
    const hits: { meeting: Meeting; race: Race; horse: HorseEntry; reason: "at" | "jokey" }[] = [];
    for (const m of data.meetings) {
      for (const race of m.races) {
        for (const horse of race.horses) {
          if (favHorseIds.has(horse.id)) hits.push({ meeting: m, race, horse, reason: "at" });
          else if (favJockeyIds.has(horse.jockeyId)) hits.push({ meeting: m, race, horse, reason: "jokey" });
        }
      }
    }
    return hits;
  }, [data, favItems]);

  function setDate(iso: string) {
    setParams((p) => {
      const n = new URLSearchParams(p);
      n.set("tarih", iso);
      n.delete("hip");
      return n;
    });
  }
  function setRegion(r: Region) {
    setParams((p) => {
      const n = new URLSearchParams(p);
      n.set("bolge", r);
      n.delete("hip");
      return n;
    });
  }
  function setHip(key: string) {
    setParams((p) => {
      const n = new URLSearchParams(p);
      n.set("hip", key);
      return n;
    });
  }

  return (
    <div className="space-y-6">
      <DateBar date={tarih} region={bolge} onDate={setDate} onRegion={setRegion} />

      {!loading && favoriteRunners.length > 0 ? <FavoriteReminder runners={favoriteRunners} onSelectHip={setHip} /> : null}

      {loading ? (
        <DaySkeleton />
      ) : !data || data.meetings.length === 0 ? (
        <EmptyDay date={tarih} />
      ) : (
        <>
          <HippodromeTabs meetings={data.meetings} active={activeKey} onSelect={setHip} />
          {meeting ? <MeetingPanel meeting={meeting} onWatch={(h, r) => setWatch({ horse: h, race: r })} /> : null}
        </>
      )}

      {watch ? (
        <VideoDialog
          atId={watch.horse.id}
          kosuKod={watch.race.id}
          fallbackUrl={watch.race.videoUrl}
          title={`${watch.horse.name} · ${watch.race.no}. koşu`}
          onClose={() => setWatch(null)}
        />
      ) : null}
    </div>
  );
}

function DateBar({
  date,
  region,
  onDate,
  onRegion,
}: {
  date: string;
  region: Region;
  onDate: (iso: string) => void;
  onRegion: (r: Region) => void;
}) {
  const today = istanbulTodayIso();
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-subtle">Yarış programı</p>
        <h1 className="mt-1 font-display text-4xl capitalize text-fg sm:text-5xl">{weekdayTr(date)}</h1>
        <p className="mt-1 text-muted">{isoToTr(date)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-full bg-surface ring-1 ring-border">
          <button
            type="button"
            onClick={() => onDate(shiftIso(date, -1))}
            aria-label="Önceki gün"
            className="inline-flex size-11 items-center justify-center text-muted hover:text-fg"
          >
            <ChevronLeft className="size-5" />
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && onDate(e.target.value)}
            className="h-11 bg-transparent text-sm text-fg [color-scheme:dark]"
          />
          <button
            type="button"
            onClick={() => onDate(shiftIso(date, 1))}
            aria-label="Sonraki gün"
            className="inline-flex size-11 items-center justify-center text-muted hover:text-fg"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
        {date !== today ? (
          <button
            type="button"
            onClick={() => onDate(today)}
            className="h-11 rounded-full px-4 text-sm text-fg ring-1 ring-border hover:bg-surface"
          >
            Bugün
          </button>
        ) : null}
        <div className="flex rounded-full bg-surface p-1 ring-1 ring-border">
          <button
            type="button"
            className={cn("h-9 rounded-full px-3 text-sm", region === "tr" ? "bg-fg text-bg" : "text-muted")}
            onClick={() => onRegion("tr")}
          >
            Türkiye
          </button>
          <button
            type="button"
            className={cn("h-9 rounded-full px-3 text-sm", region === "dunya" ? "bg-fg text-bg" : "text-muted")}
            onClick={() => onRegion("dunya")}
          >
            Yurt dışı
          </button>
        </div>
      </div>
    </div>
  );
}

function FavoriteReminder({
  runners,
  onSelectHip,
}: {
  runners: { meeting: Meeting; race: Race; horse: HorseEntry; reason: "at" | "jokey" }[];
  onSelectHip: (key: string) => void;
}) {
  return (
    <div className="rounded-xl bg-gold/10 p-4 ring-1 ring-gold/30">
      <div className="flex items-center gap-2">
        <Star className="size-4 fill-gold text-gold" />
        <h2 className="font-medium text-fg">Favorilerin bugün koşuyor</h2>
      </div>
      <div className="mt-2 space-y-1.5">
        {runners.slice(0, 6).map((r, i) => (
          <button
            key={`${r.horse.id}-${i}`}
            type="button"
            onClick={() => onSelectHip(r.meeting.key)}
            className="block w-full truncate rounded-lg px-2 py-1 text-left text-sm text-fg hover:bg-gold/10"
          >
            <span className="font-medium">{r.horse.name}</span>
            <span className="text-muted">
              {" "}
              · {r.meeting.city} · {r.race.no}. koşu {r.race.time}
              {r.reason === "jokey" ? ` · jokey ${r.horse.jockeyName}` : ""}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function HippodromeTabs({
  meetings,
  active,
  onSelect,
}: {
  meetings: Meeting[];
  active?: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {meetings.map((m) => {
        const selected = m.key === active;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onSelect(m.key)}
            className={cn(
              "flex min-w-40 shrink-0 flex-col rounded-lg px-4 py-3 text-left ring-1 transition-colors",
              selected ? "bg-fg text-bg ring-fg" : "bg-surface text-fg ring-border",
            )}
          >
            <span className="text-sm font-medium">{m.city}</span>
            <span className={cn("text-xs", selected ? "text-bg/70" : "text-muted")}>
              {m.races.length} koşu{m.night ? " · gece" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MeetingPanel({
  meeting,
  onWatch,
}: {
  meeting: Meeting;
  onWatch: (horse: HorseEntry, race: Race) => void;
}) {
  const w = meeting.weather;
  const surfaces = useMemo(() => [...new Set(meeting.races.map((r) => r.track))], [meeting.races]);
  const [horseFav, setHorseFav] = useState<Record<string, Favorites>>({});
  const [jockeyFav, setJockeyFav] = useState<Record<string, Favorites>>({});
  const [, setTick] = useState(0);
  useEffect(() => subscribeJobs(() => setTick((t) => t + 1)), []);
  const queue = getQueue(meeting.key);

  function queueAll() {
    enqueueMeeting({ apiKey: getGptKey(), meeting, model: getGptModel(), effort: getGptEffort() });
  }

  useEffect(() => {
    setHorseFav({});
    setJockeyFav({});
    const horseIds = [...new Set(meeting.races.flatMap((r) => r.horses.map((h) => h.id)).filter(Boolean))];
    const jockeyIds = [...new Set(meeting.races.flatMap((r) => r.horses.map((h) => h.jockeyId)).filter(Boolean))];
    let alive = true;
    // Bu istek arka planda çalışır; sayfa favori vurgusu olmadan hemen görünür,
    // veriler geldikçe isimler sarıya döner. Her koşu için ayrı ayrı değil,
    // toplantı başına tek seferde toplu sorgulanır.
    getHorseFavorites(horseIds)
      .then((r) => alive && setHorseFav(r))
      .catch(() => alive && setHorseFav({}));
    getJockeyFavorites(jockeyIds)
      .then((r) => alive && setJockeyFav(r))
      .catch(() => alive && setJockeyFav({}));
    return () => {
      alive = false;
    };
    // meeting.races referansı her render'da değişebilir; sadece key'e göre tetikle
    // içeride zaten meeting.races'ten türetilen id'ler kullanılıyor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meeting.key]);

  return (
    <section className="space-y-4">
      <div className="rounded-xl bg-surface p-4 ring-1 ring-border">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl">{meeting.name}</h2>
            <p className="text-sm text-muted">
              {meeting.city}
              {meeting.dayNo ? ` · ${meeting.dayNo}. gün` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {surfaces.map((s) => (
              <TrackBadge key={s} kind={s} />
            ))}
            <button
              type="button"
              onClick={queueAll}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gold/15 px-3 text-sm font-medium text-gold ring-1 ring-gold/30 hover:bg-gold/25"
            >
              <Sparkles className="size-4" />
              {queue?.running
                ? `Analiz ediliyor ${queue.finished}/${queue.total}`
                : `Toplantıyı analiz et (${meeting.races.length} koşu)`}
            </button>
          </div>
        </div>
        {w ? (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CloudSun className="size-4" />
              {w.sky || "Hava"}
              {w.temp != null ? ` ${w.temp}°` : ""}
              {w.humidity != null ? ` · nem %${w.humidity}` : ""}
            </span>
            {w.turf ? (
              <span>
                Çim: {w.turf}
                {w.turfDepth ? ` ${w.turfDepth}` : ""}
              </span>
            ) : null}
            {w.dirt ? (
              <span>
                Kum: {w.dirt}
                {w.dirtDepth ? ` ${w.dirtDepth}` : ""}
              </span>
            ) : null}
          </div>
        ) : null}
        <p className="mt-3 text-xs text-subtle">
          <span className="text-gold">Sarı isimler</span>, o atın veya jokeyin geçmişte en başarılı olduğu zeminde ya
          da mesafede koştuğunu gösterir.
        </p>
        {queue && !queue.running && queue.finished > 0 ? (
          <p className="mt-2 text-xs text-muted">
            {queue.finished}/{queue.total} koşu hazır — Analizler sekmesinden PDF indirebilirsin.
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        {meeting.races.map((race) => (
          <RaceCard
            key={race.id || race.no}
            race={race}
            meeting={meeting}
            onWatch={onWatch}
            horseFav={horseFav}
            jockeyFav={jockeyFav}
          />
        ))}
      </div>
    </section>
  );
}

function EmptyDay({ date }: { date: string }) {
  // TJK programı genelde yalnızca bugün + yarın için yayınlanır; ilerisi 404'tür.
  const isFuture = date > istanbulTodayIso();
  return (
    <div className="rounded-xl bg-surface px-6 py-16 text-center ring-1 ring-border">
      <p className="font-display text-2xl">{isFuture ? "Program henüz açıklanmadı" : "Bu tarihte yarış yok"}</p>
      <p className="mt-2 text-sm text-muted">
        {isFuture
          ? `${isoToTr(date)} için TJK henüz program yayınlamadı. Programlar genelde 1-2 gün önceden açıklanır, daha sonra tekrar bak.`
          : `${isoToTr(date)} için TJK programında koşu bulunamadı.`}
      </p>
    </div>
  );
}

function DaySkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-16 w-40 rounded-lg" />
        <Skeleton className="h-16 w-40 rounded-lg" />
        <Skeleton className="h-16 w-40 rounded-lg" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}
