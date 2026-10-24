// Analiz arşivi — sunucu diskinde (cihazda) saklanır; tarayıcı belleği
// (localStorage) KULLANILMAZ. Eski localStorage kayıtları ilk açılışta
// sunucuya taşınır (migrateLocalToServer) ve tarayıcıdan silinir.

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
  kaynak?: "analiz" | "bot" | "ultra";
};

const ESKI_KEY = "mahmuz:analizler";
const TASINDI_KEY = "mahmuz:analizler-tasindi";

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

export async function listAnalyses(): Promise<SavedAnalysis[]> {
  const r = await fetch("/api/analizler");
  if (!r.ok) throw new Error(`Analizler alınamadı (HTTP ${r.status})`);
  const d = (await r.json()) as unknown;
  return Array.isArray(d) ? d.filter(valid) : [];
}

export async function saveAnalysisRemote(a: SavedAnalysis): Promise<void> {
  const r = await fetch("/api/analizler/kaydet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(a),
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) {
    const d = (await r.json().catch(() => null)) as { error?: string } | null;
    throw new Error(d?.error || `Analiz kaydedilemedi (HTTP ${r.status})`);
  }
}

export async function deleteAnalysisRemote(id: string): Promise<void> {
  await fetch(`/api/analizler/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// --- bir kez: eski localStorage kayıtlarını sunucuya taşı ---

export function eskiKayitSayisi(): number {
  try {
    if (localStorage.getItem(TASINDI_KEY)) return 0;
    const raw = localStorage.getItem(ESKI_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(valid).length : 0;
  } catch {
    return 0;
  }
}

export async function migrateLocalToServer(): Promise<number> {
  try {
    if (localStorage.getItem(TASINDI_KEY)) return 0;
    const raw = localStorage.getItem(ESKI_KEY);
    if (!raw) {
      localStorage.setItem(TASINDI_KEY, "1");
      return 0;
    }
    const parsed = JSON.parse(raw) as unknown;
    const items = (Array.isArray(parsed) ? parsed : []).filter(valid);
    let tasinan = 0;
    for (const it of items) {
      try {
        await saveAnalysisRemote(it);
        tasinan += 1;
      } catch {
        /* tek kayıt başarısızsa devam */
      }
    }
    localStorage.setItem(TASINDI_KEY, "1");
    localStorage.removeItem(ESKI_KEY); // tarayıcı belleği boşaltılır
    return tasinan;
  } catch {
    return 0;
  }
}
