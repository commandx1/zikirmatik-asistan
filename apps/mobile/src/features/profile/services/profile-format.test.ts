import { describe, expect, it } from "vitest";
import type { TFunction } from "i18next";
import { normalizeTimeUnit, parseReminderTime, toMemberSinceLabel } from "./profile-format";

const t = ((key: string, opts?: { date?: string }) =>
  opts?.date ? `${key}|${opts.date}` : key) as unknown as TFunction;

describe("profile-format", () => {
  it("toMemberSinceLabel formats month + year per locale", () => {
    const iso = "2025-03-15T12:00:00.000Z";
    expect(toMemberSinceLabel(iso, "tr", t)).toBe("profile:memberSince.since|Mart 2025");
    expect(toMemberSinceLabel(iso, "en", t)).toBe("profile:memberSince.since|March 2025");
    expect(toMemberSinceLabel("not-a-date", "tr", t)).toBe("profile:memberSince.newMember");
  });

  it("parseReminderTime accepts HH:MM in range, falls back to 08:00 otherwise", () => {
    expect(parseReminderTime("07:45")).toEqual({ hour: 7, minute: 45, isValid: true });
    expect(parseReminderTime("24:00")).toEqual({ hour: 8, minute: 0, isValid: false });
    expect(parseReminderTime("12:60")).toEqual({ hour: 8, minute: 0, isValid: false });
    expect(parseReminderTime("7:45")).toEqual({ hour: 8, minute: 0, isValid: false });
  });

  it("normalizeTimeUnit strips non-digits and pads", () => {
    expect(normalizeTimeUnit("7")).toBe("07");
    expect(normalizeTimeUnit("a1b2c3")).toBe("12");
    expect(normalizeTimeUnit("")).toBe("00");
  });
});
