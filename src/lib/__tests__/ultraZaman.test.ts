import { describe, expect, it } from "vitest";
import {
  kosuBaslangici,
  kalanDakika,
  turAraligiDk,
  sonTurZamani,
  formatKalan,
} from "../ultraZaman";

describe("kosuBaslangici", () => {
  it("dd.mm.yyyy + HH:mm → UTC+3 Date", () => {
    expect(kosuBaslangici("11.10.2026", "16:45")?.toISOString()).toBe(
      "2026-10-11T13:45:00.000Z",
    );
  });
  it("nokta ayırıcılı saat de geçerli", () => {
    expect(kosuBaslangici("11.10.2026", "16.45")?.toISOString()).toBe(
      "2026-10-11T13:45:00.000Z",
    );
  });
  it("saat yoksa null", () => {
    expect(kosuBaslangici("11.10.2026", "")).toBeNull();
  });
  it("tarih bozuksa null", () => {
    expect(kosuBaslangici("bozuk", "16:45")).toBeNull();
    expect(kosuBaslangici("", "16:45")).toBeNull();
  });
  it("geçersiz saat (25:70) null", () => {
    expect(kosuBaslangici("11.10.2026", "25:70")).toBeNull();
  });
});

describe("kalanDakika", () => {
  it("başlangıca kalan dakikayı döner", () => {
    const bas = new Date("2026-10-11T13:45:00.000Z");
    const now = new Date("2026-10-11T12:15:00.000Z").getTime();
    expect(kalanDakika(bas, now)).toBe(90);
  });
  it("geçmişte negatif", () => {
    const bas = new Date("2026-10-11T13:45:00.000Z");
    const now = new Date("2026-10-11T14:45:00.000Z").getTime();
    expect(kalanDakika(bas, now)).toBe(-60);
  });
});

describe("turAraligiDk", () => {
  it("eşik tablosu", () => {
    expect(turAraligiDk(300)).toBe(30);
    expect(turAraligiDk(240)).toBe(30);
    expect(turAraligiDk(239)).toBe(15);
    expect(turAraligiDk(60)).toBe(15);
    expect(turAraligiDk(45)).toBe(7);
    expect(turAraligiDk(29)).toBe(3);
    expect(turAraligiDk(2)).toBe(3);
  });
});

describe("sonTurZamani", () => {
  it("başlangıç - 5 dakika", () => {
    const bas = new Date("2026-10-11T13:45:00.000Z");
    expect(sonTurZamani(bas).getTime()).toBe(bas.getTime() - 5 * 60_000);
  });
});

describe("formatKalan", () => {
  it("135 dk → '2 sa 15 dk'", () => {
    expect(formatKalan(135)).toBe("2 sa 15 dk");
  });
  it("48 dk → '48 dk'", () => {
    expect(formatKalan(48)).toBe("48 dk");
  });
});
