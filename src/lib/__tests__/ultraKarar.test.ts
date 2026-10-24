import { describe, expect, it } from "vitest";
import { ultraKarar, type UltraSession } from "../ultraRunner";
import type { Meeting, Race } from "../types";

// 2030-01-01 09:00 İstanbul (+03) → 06:00 UTC; NOW = 06:00 UTC → kalan 360 dk... hayır:
// koşu 12:00 İstanbul = 09:00 UTC; NOW = 06:00 UTC → kalan 180 dk ✓
const NOW = new Date("2030-01-01T06:00:00.000Z").getTime();

function oturum(over: Partial<UltraSession> = {}): UltraSession {
  const race = {
    id: "r1",
    no: "1",
    date: "01.01.2030",
    time: "12:00",
    finished: false,
    horses: [],
  } as unknown as Race;
  return {
    id: "t",
    raceKey: "K::r1",
    meeting: { key: "K" } as Meeting,
    race,
    model: "m",
    effort: "low",
    faz: "takip",
    bulgular: [],
    sonTurAt: null,
    turHatasi: 0,
    aciIndex: 0,
    olusturma: "",
    degisme: "",
    progress: "",
    result: "",
    error: "",
    turKayitlari: [],
    ...over,
  };
}

describe("ultraKarar", () => {
  it("faz temel → hemen tur", () => {
    expect(ultraKarar(oturum({ faz: "temel" }), NOW).islem).toBe("tur");
  });
  it("takip, son tur 16 dk önce (aralık 15) → tur", () => {
    const s = oturum({ faz: "takip", sonTurAt: NOW - 16 * 60_000 });
    expect(ultraKarar(s, NOW).islem).toBe("tur");
  });
  it("takip, son tur 5 dk önce → bekle ~10 dk", () => {
    const s = oturum({ faz: "takip", sonTurAt: NOW - 5 * 60_000 });
    const k = ultraKarar(s, NOW);
    expect(k.islem).toBe("bekle");
    expect(k.delayMs).toBeCloseTo(10 * 60_000, -3);
  });
  it("tur hatası varsa geri çekilme (aralık ×4)", () => {
    const s = oturum({ faz: "takip", sonTurAt: NOW - 5 * 60_000, turHatasi: 2 });
    const k = ultraKarar(s, NOW);
    expect(k.islem).toBe("bekle");
    expect(k.delayMs).toBeCloseTo(55 * 60_000, -3);
  });
  it("kalan ≤ 5 dk ve son tur yeni yapıldıysa → final", () => {
    const s = oturum({ faz: "takip", sonTurAt: new Date("2030-01-01T08:57:00.000Z").getTime() });
    const now = new Date("2030-01-01T08:56:00.000Z").getTime(); // kalan 4 dk
    expect(ultraKarar(s, now).islem).toBe("final");
  });
  it("son zorunlu tur zamanı aşıldıysa final'den önce tur", () => {
    const s = oturum({ faz: "takip", sonTurAt: null });
    const now = new Date("2030-01-01T08:56:00.000Z").getTime(); // kalan 4 dk
    expect(ultraKarar(s, now).islem).toBe("tur");
  });
  it("koşu başladı → iptal", () => {
    const now = new Date("2030-01-01T11:01:00.000Z").getTime(); // 14:01 İstanbul, kalan -121
    expect(ultraKarar(oturum(), now).islem).toBe("iptal");
  });
  it("koşu sonuçlandı → iptal", () => {
    const s = oturum({ race: { finished: true, date: "01.01.2030", time: "12:00", no: "1", id: "r1", horses: [] } as unknown as Race });
    expect(ultraKarar(s, NOW).islem).toBe("iptal");
  });
  it("koşu saati çözülemedi → iptal + neden", () => {
    const s = oturum({ race: { finished: false, date: "01.01.2030", time: "", no: "1", id: "r1", horses: [] } as unknown as Race });
    const k = ultraKarar(s, NOW);
    expect(k.islem).toBe("iptal");
    expect(k.neden).toContain("saat");
  });
});
