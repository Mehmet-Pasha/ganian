import { describe, expect, it } from "vitest";
import { buildUltraTurPrompt, buildUltraFinalEk, ultraAcilar } from "../../../shared/prompt.ts";
import type { Meeting, Race } from "../types";

const meeting = { city: "Adana", name: "Yeşiloba" } as Meeting;
const race = {
  no: "1",
  date: "12.10.2026",
  time: "14:30",
  distance: "1400",
  trackLabel: "Sentetik",
  horses: [],
} as unknown as Race;

describe("buildUltraTurPrompt", () => {
  it("künye + bilinenler + odağı içerir ve tekrar yasaklarını koyar", () => {
    const p = buildUltraTurPrompt(meeting, race, "- [son-dakika] pist ağırlandı", "pist-hava");
    expect(p).toContain("TAKİP taraması");
    expect(p).toContain("Adana");
    expect(p).toContain("pist ağırlandı");
    expect(p).toContain("Pist & hava");
    expect(p).toContain("TEKRAR RAPORLAMA");
    expect(p).toContain("YENİ BULGU YOK");
  });
  it("20000 karakteri aşmaz", () => {
    const buyuk = "x".repeat(30000);
    const p = buildUltraTurPrompt(meeting, race, buyuk, "uzman");
    expect(p.length).toBeLessThanOrEqual(20000 + 2000);
  });
  it("açı listesi beş açı içerir", () => {
    expect(ultraAcilar()).toHaveLength(5);
  });
});

describe("buildUltraFinalEk", () => {
  it("ULTRA ARŞİV başlığını ve bulguları içerir", () => {
    const ek = buildUltraFinalEk("[10:00] pist ağır\n[12:00] jokey değişti");
    expect(ek).toContain("ULTRA ARŞİV");
    expect(ek).toContain("jokey değişti");
    expect(ek).toContain("SON DURUMU");
  });
  it("boş arşivde boş not ile döner", () => {
    expect(buildUltraFinalEk("")).toContain("(arşiv boş)");
  });
});
