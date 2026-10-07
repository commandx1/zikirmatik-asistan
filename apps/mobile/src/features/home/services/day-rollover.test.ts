import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { decideDayRollover, isLogFromToday } from "./day-rollover";

const now = new Date(2026, 9, 7, 9, 0); // 7 Oct 2026, local
const at = (y: number, m: number, d: number, h = 21) => new Date(y, m, d, h).toISOString();

describe("decideDayRollover (M-01)", () => {
  it("MOB-HID-06: yesterday's unsaved member count -> ask once with yesterday's date", () => {
    expect(
      decideDayRollover({ current: 30, lastActivityAt: at(2026, 9, 6), isUnsaved: true, isMember: true }, now)
    ).toEqual({ kind: "ask", count: 30, dateKey: "2026-10-06" });
  });

  it("uses the last activity day, not 'yesterday', when the app sat idle for days", () => {
    expect(
      decideDayRollover({ current: 12, lastActivityAt: at(2026, 9, 3), isUnsaved: true, isMember: true }, now)
    ).toEqual({ kind: "ask", count: 12, dateKey: "2026-10-03" });
  });

  it("saved progress from a previous day silently starts today at 0", () => {
    expect(
      decideDayRollover({ current: 30, lastActivityAt: at(2026, 9, 6), isUnsaved: false, isMember: true }, now)
    ).toEqual({ kind: "reset" });
  });

  it("guests start the new day at 0 without a question (local progress counts as saved)", () => {
    expect(
      decideDayRollover({ current: 30, lastActivityAt: at(2026, 9, 6), isUnsaved: true, isMember: false }, now)
    ).toEqual({ kind: "reset" });
  });

  it("same local day, zero count, or no stamp -> nothing to do", () => {
    expect(decideDayRollover({ current: 5, lastActivityAt: at(2026, 9, 7, 1), isUnsaved: true, isMember: true }, now)).toEqual({ kind: "none" });
    expect(decideDayRollover({ current: 0, lastActivityAt: at(2026, 9, 6), isUnsaved: true, isMember: true }, now)).toEqual({ kind: "none" });
    expect(decideDayRollover({ current: 5, isUnsaved: true, isMember: true }, now)).toEqual({ kind: "none" });
  });

  it("day boundary is the device's local midnight", () => {
    const justAfterMidnight = new Date(2026, 9, 7, 0, 5);
    expect(
      decideDayRollover({ current: 3, lastActivityAt: new Date(2026, 9, 6, 23, 55).toISOString(), isUnsaved: true, isMember: true }, justAfterMidnight).kind
    ).toBe("ask");
  });

  it("property: never asks for a guest or a saved dhikr, never acts on count <= 0", () => {
    fc.assert(
      fc.property(fc.integer({ min: -5, max: 500 }), fc.integer({ min: 0, max: 40 }), fc.boolean(), fc.boolean(), (current, daysAgo, isUnsaved, isMember) => {
        const d = decideDayRollover({ current, lastActivityAt: at(2026, 9, 7 - daysAgo), isUnsaved, isMember }, now);
        if (d.kind === "ask") return isMember && isUnsaved && current > 0 && daysAgo > 0;
        if (current <= 0 || daysAgo === 0) return d.kind === "none";
        return d.kind === "reset";
      })
    );
  });
});

describe("isLogFromToday (hydration, MOB-HID-06 member half)", () => {
  it("prefers the log's own day", () => {
    expect(isLogFromToday({ date: "2026-10-07" }, now)).toBe(true);
    expect(isLogFromToday({ date: "2026-10-06T00:00:00.000Z", createdAt: at(2026, 9, 7) }, now)).toBe(false);
  });
  it("falls back to createdAt, and is permissive when nothing is known", () => {
    expect(isLogFromToday({ createdAt: at(2026, 9, 6) }, now)).toBe(false);
    expect(isLogFromToday({}, now)).toBe(true);
  });
});
