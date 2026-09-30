import { describe, expect, it } from "vitest";
import { circleEndLabel } from "./circle-end-label";

const t = (key: string, options: { date: string }) => `${key}|${options.date}`;
// 2026-10-06T07:00Z = LA 00:00 (6 Ekim), İstanbul 10:00.
const expiresAt = "2026-10-06T07:00:00.000Z";

describe("circleEndLabel", () => {
  it("shows the last included minute in the given zone (tr)", () => {
    expect(circleEndLabel({ expiresAt, endDate: "2026-10-05" }, "tr", t, "America/Los_Angeles")).toBe(
      "circle:detail.endsAt|5 Eki 23:59"
    );
  });

  it("uses the viewer's own zone (en)", () => {
    const label = circleEndLabel({ expiresAt, endDate: "2026-10-05" }, "en", t, "Europe/Istanbul");
    expect(label).toContain("circle:detail.endsAt|");
    expect(label).toContain("Oct 6");
    expect(label).toContain("09:59");
  });

  it("falls back to the raw endDate without expiresAt", () => {
    expect(circleEndLabel({ endDate: "2026-10-05" }, "tr", t)).toBe("circle:detail.endDate|2026-10-05");
  });
});
