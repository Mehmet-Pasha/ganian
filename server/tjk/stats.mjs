import { distanceBucket } from "./format.mjs";

// Bir "en iyi zemin/mesafe" iddiasında bulunabilmek için gereken minimum koşu
// sayısı. Bunun altında (örn. 2-3 koşuda 1-2 galibiyet) yanıltıcı olur;
// karşılaştırma yapılamayacak kadar az koşmuş at/jokeyde vurgu çalışmaz.
const MIN_SAMPLE = 5;
const SURFACES = ["cim", "kum", "sentetik"];
const BUCKETS = ["kisa", "orta", "uzun"];

function emptyStat() {
  return { starts: 0, wins: 0, winPct: 0 };
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

// entries: [{ track: "cim"|"kum"|"sentetik"|"diger", distance: string|number, position: string }]
export function computeSurfaceDistanceStats(entries) {
  const bySurface = { cim: emptyStat(), kum: emptyStat(), sentetik: emptyStat() };
  const byDistance = { kisa: emptyStat(), orta: emptyStat(), uzun: emptyStat() };
  let sample = 0;

  for (const e of entries || []) {
    const pos = Number.parseInt(e.position, 10);
    const hasResult = e.position != null && e.position !== "" && Number.isFinite(pos) && pos > 0;
    if (!hasResult) continue;
    sample += 1;
    const isWin = pos === 1;

    if (bySurface[e.track]) {
      bySurface[e.track].starts += 1;
      if (isWin) bySurface[e.track].wins += 1;
    }
    const bucket = distanceBucket(e.distance);
    if (bucket && byDistance[bucket]) {
      byDistance[bucket].starts += 1;
      if (isWin) byDistance[bucket].wins += 1;
    }
  }

  for (const k of SURFACES) {
    bySurface[k].winPct = bySurface[k].starts ? round1((bySurface[k].wins / bySurface[k].starts) * 100) : 0;
  }
  for (const k of BUCKETS) {
    byDistance[k].winPct = byDistance[k].starts ? round1((byDistance[k].wins / byDistance[k].starts) * 100) : 0;
  }

  return {
    bySurface,
    byDistance,
    bestSurface: pickBest(bySurface, SURFACES),
    bestDistance: pickBest(byDistance, BUCKETS),
    sample,
  };
}

function pickBest(map, keys) {
  let best = null;
  for (const k of keys) {
    const s = map[k];
    if (s.starts < MIN_SAMPLE) continue;
    if (!best || s.winPct > map[best].winPct || (s.winPct === map[best].winPct && s.starts > map[best].starts)) {
      best = k;
    }
  }
  return best;
}

export { MIN_SAMPLE };
