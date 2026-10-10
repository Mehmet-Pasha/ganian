import type { DistanceBucket, TrackKind } from "./types";

const COLOR: Record<string, string> = { a: "Al", d: "Doru", k: "Kır", y: "Yağız", g: "Gri", s: "Siyah" };
const SEX: Record<string, string> = { k: "Kısrak", a: "Aygır", d: "Dişi Tay", e: "Erkek Tay", g: "İğdiş" };

export const SURFACE_LABEL: Record<"cim" | "kum" | "sentetik", string> = {
  cim: "Çim",
  kum: "Kum",
  sentetik: "Sentetik",
};

export const DISTANCE_LABEL: Record<DistanceBucket, string> = {
  kisa: "Kısa (≤1400 m)",
  orta: "Orta (1401–2000 m)",
  uzun: "Uzun (>2000 m)",
};

export function distanceBucket(distance: string | number): DistanceBucket | null {
  if (distance == null || distance === "") return null;
  const raw = String(distance).trim();
  // Türkçe sayılarda virgül içerebilir, ama mesafe tam sayıdır; yine de handle et
  const cleaned = raw.includes(",") ? raw.replaceAll(".", "").replaceAll(",", ".") : raw;
  const n = typeof distance === "number" ? distance : Number.parseInt(cleaned.replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n <= 1400) return "kisa";
  if (n <= 2000) return "orta";
  return "uzun";
}

export function parseAgeText(yas: string): { age: string; color: string; sex: string; label: string } {
  const compact = (yas || "").replaceAll("&nbsp;", " ").replace(/\s+/g, " ").trim();
  const m = compact.match(/(\d+)\s*y\s*([a-zçğıöşü]+)?\s*([a-zçğıöşü]+)?/i);
  if (!m) return { age: compact, color: "", sex: "", label: compact };
  const age = m[1] ?? "";
  const color = COLOR[(m[2] ?? "").toLowerCase()] ?? (m[2] ?? "");
  const sex = SEX[(m[3] ?? "").toLowerCase()] ?? (m[3] ?? "");
  const label = [age ? `${age} yaş` : "", color, sex].filter(Boolean).join(" · ");
  return { age, color, sex, label: label || compact };
}

export function trackLabel(kind: TrackKind, fallback = ""): string {
  if (kind === "cim") return "Çim";
  if (kind === "kum") return "Kum";
  if (kind === "sentetik") return "Sentetik";
  return fallback || "Pist";
}

export function positionTone(pos: string): "win" | "place" | "show" | "out" | "none" {
  const n = Number.parseInt(pos, 10);
  if (!Number.isFinite(n) || n <= 0) return pos ? "out" : "none";
  if (n === 1) return "win";
  if (n === 2) return "place";
  if (n === 3) return "show";
  return "out";
}
