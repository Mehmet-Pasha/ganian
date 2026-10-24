import { describe, expect, it } from "vitest";
import { ekleBulgu, bulguOzeti, bilinenlerOzeti, type Bulgu } from "../ultraBulgular";

const b = (ts: string, metin: string, aci = "son-dakika"): Bulgu => ({ ts, aci, metin });

describe("ekleBulgu", () => {
  it("yeni bulguları kronolojik ekler", () => {
    const r = ekleBulgu([b("2026-10-12T10:00:00Z", "A pist ağır")], [
      { aci: "pist-hava", metin: "B yağmur başladı" },
    ]);
    expect(r.eklendi).toBe(1);
    expect(r.list).toHaveLength(2);
    expect(r.list[1].metin).toBe("B yağmur başladı");
  });

  it("aynı bulguyu tekrar eklemez", () => {
    const mevcut = [b("2026-10-12T10:00:00Z", "6 numaralı atın jokeyi değişti")];
    const r = ekleBulgu(mevcut, [
      { aci: "jokey-taki", metin: "6 numaralı atın jokeyi değişti" },
      { aci: "jokey-taki", metin: "6 numaralı atın jokeyi değişti." },
    ]);
    expect(r.eklendi).toBe(0);
    expect(r.list).toHaveLength(1);
  });

  it("çok kısa bulguları gürültü sayıp eklemez", () => {
    const r = ekleBulgu([], [{ aci: "son-dakika", metin: "ok" }]);
    expect(r.eklendi).toBe(0);
  });

  it("limit aşılırsa en eski blokları düşer ve sikisti işaretler", () => {
    const mevcut: Bulgu[] = [
      b("2026-10-12T09:00:00Z", "X".repeat(6000)),
      b("2026-10-12T10:00:00Z", "Y".repeat(6000)),
      b("2026-10-12T11:00:00Z", "Z".repeat(6000)),
    ];
    const r = ekleBulgu(mevcut, [{ aci: "son-dakika", metin: "Yeni gelişme " + "W".repeat(5000) }], 20000);
    expect(r.sikisti).toBe(true);
    expect(r.list[r.list.length - 1].metin).toContain("Yeni gelişme");
    expect(r.list.some((x) => x.metin.startsWith("X"))).toBe(false); // en eski düştü
  });
});

describe("bulguOzeti", () => {
  it("kronolojik metni döner", () => {
    const ozet = bulguOzeti([
      b("2026-10-12T10:00:00Z", "A"),
      b("2026-10-12T11:00:00Z", "B"),
    ]);
    expect(ozet).toContain("A");
    expect(ozet).toContain("B");
    expect(ozet.indexOf("A")).toBeLessThan(ozet.indexOf("B"));
  });
  it("sınırda eski blokları özet ibaresiyle kırpılır", () => {
    const list: Bulgu[] = [];
    for (let i = 0; i < 30; i++) {
      list.push(b(`2026-10-12T${String(i % 24).padStart(2, "0")}:00:00Z`, `bulgu-${i} ` + "m".repeat(400)));
    }
    const ozet = bulguOzeti(list, 4000);
    expect(ozet).toContain("[eski turlar özetlendi");
    expect(ozet).toContain("bulgu-29");
    expect(ozet).not.toContain("bulgu-0 ");
  });
});

describe("bilinenlerOzeti", () => {
  it("boşsa standart cümle", () => {
    expect(bilinenlerOzeti([])).toContain("kayda değer bulgu yok");
  });
  it("son 12 bulgunun kısa özetini döner", () => {
    const list: Bulgu[] = [];
    for (let i = 0; i < 20; i++) list.push(b(`2026-10-12T10:00:0${i % 10}Z`, `bulgu-${i}`, "son-dakika"));
    const ozet = bilinenlerOzeti(list);
    expect(ozet).toContain("bulgu-19");
    expect(ozet).not.toContain("bulgu-0");
  });
});
