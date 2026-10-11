import type {
  DayCard,
  Favorites,
  HorseProfile,
  JockeyProfile,
  Leaderboard,
  PedigreeStats,
  PersonProfile,
  Region,
  SearchHit,
  Siblings,
} from "./types";

async function getJson<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("Sunucuya ulaşılamadı (npm run server çalışıyor mu?)");
  }
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Sunucudan geçersiz yanıt (${res.status})`);
  }
  if (!res.ok) {
    const msg = (data as Record<string, unknown>)?.error;
    throw new Error(typeof msg === "string" && msg ? msg : `İstek başarısız (${res.status})`);
  }
  return data as T;
}

export function getDayCard(iso: string, region: Region | "all"): Promise<DayCard> {
  return getJson(`/api/gun/${iso}?bolge=${region}`);
}

export function getHorseProfile(id: string): Promise<HorseProfile> {
  return getJson(`/api/at/${encodeURIComponent(id)}`);
}

export function getJockeyProfile(id: string, name = ""): Promise<JockeyProfile> {
  const q = name ? `?ad=${encodeURIComponent(name)}` : "";
  return getJson(`/api/jokey/${encodeURIComponent(id)}${q}`);
}

export function getPersonProfile(kind: "antrenor" | "sahip", id: string): Promise<PersonProfile> {
  return getJson(`/api/kisi/${kind}/${encodeURIComponent(id)}`);
}

export function getVideoUrl(atId: string, kosuKod: string): Promise<{ url: string; page: string }> {
  return getJson(`/api/video/${encodeURIComponent(atId)}/${encodeURIComponent(kosuKod)}`);
}

export function searchRacing(q: string): Promise<SearchHit[]> {
  return getJson(`/api/ara?q=${encodeURIComponent(q)}`);
}

export function getSiblings(id: string): Promise<Siblings> {
  return getJson(`/api/at/${encodeURIComponent(id)}/kardesler`);
}

export function getLeaderboard(days = 30): Promise<Leaderboard> {
  return getJson(`/api/liderlik?gun=${days}`);
}

export function getHorseFavorites(ids: string[]): Promise<Record<string, Favorites>> {
  if (!ids.length) return Promise.resolve({});
  return getJson(`/api/oz/atlar?ids=${ids.map(encodeURIComponent).join(",")}`);
}

export function getJockeyFavorites(ids: string[]): Promise<Record<string, Favorites>> {
  if (!ids.length) return Promise.resolve({});
  return getJson(`/api/oz/jokeyler?ids=${ids.map(encodeURIComponent).join(",")}`);
}

// Pedigri eğilimi (toplu): baba döllerinin son 30 gün zemin/mesafe performansı.
export function getPedigreeBatch(ids: string[]): Promise<Record<string, PedigreeStats>> {
  if (!ids.length) return Promise.resolve({});
  return getJson(`/api/pedigree/toplu?ids=${ids.map(encodeURIComponent).join(",")}`);
}

// Sunucu taraflı web araştırması (derinlik: dusuk | orta | yuksek).
// Araştırma opsiyoneldir: sunucu araştıramazsa digest boş gelir ve analiz
// eski davranışla (model kendi aramasıyla, anahtar varsa) devam eder.
export async function postResearch(input: {
  depth: string;
  queries: string[];
  sonarPrompts: string[];
}): Promise<{ depth: string; digest: string; raw: boolean }> {
  const empty = { depth: input.depth, digest: "", raw: false };
  let res: Response;
  try {
    res = await fetch("/api/analiz/arastirma", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return empty;
  }
  try {
    const data = (await res.json()) as { depth?: string; digest?: string; raw?: boolean };
    if (!res.ok || !data?.digest) return empty;
    return { depth: data.depth || input.depth, digest: data.digest, raw: data.raw === true };
  } catch {
    return empty;
  }
}
