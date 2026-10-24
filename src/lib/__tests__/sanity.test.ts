import { describe, expect, it } from "vitest";
import { buildResearchQueries } from "../../../shared/prompt.ts";
import type { Meeting, Race } from "../types";

describe("sanity — shared modül vitest ortamında çalışır", () => {
  it("buildResearchQueries tarihi sorguya katar", () => {
    const meeting = { city: "Adana" } as Meeting;
    const race = {
      no: "1",
      date: "11.10.2026",
      trackLabel: "Sentetik",
      distance: "1400",
      horses: [],
    } as unknown as Race;
    const q = buildResearchQueries(meeting, race);
    expect(q[0]).toContain("Adana 1. koşu");
    expect(q[0]).toContain("11 Ekim 2026");
  });
});
