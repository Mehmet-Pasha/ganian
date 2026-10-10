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
    return parsed.filter(valid);
  } catch {
    return [];
  }
}

function persist(items: SavedAnalysis[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    /* kota dolarsa sessizce yok say */
  }
}

export function saveAnalysis(a: SavedAnalysis): SavedAnalysis[] {
  const items = [a, ...loadAnalyses().filter((x) => x.id !== a.id)];
  persist(items);
  return items;
}

export function deleteAnalysis(id: string): SavedAnalysis[] {
  const items = loadAnalyses().filter((x) => x.id !== id);
  persist(items);
  return items;
}
