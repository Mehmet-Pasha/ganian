import type { Meeting, Race } from "./types";

export type SavedAnalysis = {
  id: string;
  savedAt: string; // ISO
  dateLabel: string;
  city: string;
  meetingName: string;
  meetingKey: string;
  raceNo: string;
  model: string;
  effort: string;
  analysis: string;
  meeting: Meeting;
  race: Race;
};

const KEY = "mahmuz:analizler";
const MAX = 100;

function valid(a: unknown): a is SavedAnalysis {
  if (typeof a !== "object" || a === null) return false;
  const o = a as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.analysis === "string" &&
    typeof o.meeting === "object" &&
    typeof o.race === "object"
  );
}

export function loadAnalyses(): SavedAnalysis[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const items = parsed.filter(valid);
    // Aynı koşunun birden çok tekrarını tekilleştir (en yenisi kalır) —
    // kota baskısını da azaltır.
    const byKey = new Map<string, SavedAnalysis>();
    for (const a of items) {
      const key = `${a.meetingKey}::${a.raceNo}::${a.dateLabel}`;
      const prev = byKey.get(key);
      if (!prev || new Date(a.savedAt) > new Date(prev.savedAt)) byKey.set(key, a);
    }
    return [...byKey.values()].sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
    );
  } catch {
    return [];
  }
}

function persist(items: SavedAnalysis[]) {
  let deneme = items.slice(0, MAX);
  // Kota dolunca sessizce kaybetme: en eskileri parça parça atıp tekrar dene.
  for (;;) {
    try {
      localStorage.setItem(KEY, JSON.stringify(deneme));
      return true;
    } catch {
      if (deneme.length <= 1) return false; // tek kayıt bile sığmıyorsa teslim
      deneme = deneme.slice(0, Math.max(1, deneme.length - 10));
    }
  }
}

export function saveAnalysis(a: SavedAnalysis): SavedAnalysis[] {
  // Aynı koşunun tekrar analizleri ESKİSİNİ değiştirir (kota şişmesin):
  // anahtar = toplantı::koşu::tarih
  const key = `${a.meetingKey}::${a.raceNo}::${a.dateLabel}`;
  const items = [
    a,
    ...loadAnalyses().filter(
      (x) => x.id !== a.id && `${x.meetingKey}::${x.raceNo}::${x.dateLabel}` !== key,
    ),
  ];
  persist(items);
  return items;
}

export function deleteAnalysis(id: string): SavedAnalysis[] {
  const items = loadAnalyses().filter((x) => x.id !== id);
  persist(items);
  return items;
}
