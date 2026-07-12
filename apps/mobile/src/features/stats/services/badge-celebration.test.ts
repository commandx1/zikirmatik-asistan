import { describe, expect, it } from "vitest";
import type { StatsBadge } from "@zikirmatik/shared";
import { evaluateBadgeCelebration, selectNewlyAchievedBadges } from "./badge-celebration";

function makeBadge(overrides: Partial<StatsBadge>): StatsBadge {
  return { key: "k", label: "L", achieved: false, progress: 0, ...overrides };
}

describe("selectNewlyAchievedBadges", () => {
  it("returns achieved badges that have not been celebrated yet", () => {
    const badges = [
      makeBadge({ key: "first-steps", achieved: true }),
      makeBadge({ key: "steady-streak", achieved: false })
    ];

    expect(selectNewlyAchievedBadges(badges, [])).toEqual([badges[0]]);
  });

  it("excludes badges already in the celebrated set", () => {
    const badges = [makeBadge({ key: "first-steps", achieved: true })];

    expect(selectNewlyAchievedBadges(badges, ["first-steps"])).toEqual([]);
  });

  it("is idempotent: calling twice with the same celebrated set yields the same result", () => {
    const badges = [
      makeBadge({ key: "first-steps", achieved: true }),
      makeBadge({ key: "active-days", achieved: true })
    ];
    const celebrated = ["first-steps"];

    const first = selectNewlyAchievedBadges(badges, celebrated);
    const second = selectNewlyAchievedBadges(badges, celebrated);

    expect(first).toEqual(second);
    expect(first.map((b) => b.key)).toEqual(["active-days"]);
  });

  it("returns an empty array when nothing is achieved", () => {
    const badges = [makeBadge({ key: "first-steps", achieved: false })];

    expect(selectNewlyAchievedBadges(badges, [])).toEqual([]);
  });
});

describe("evaluateBadgeCelebration", () => {
  it("waits (does not evaluate) before the celebration store has rehydrated", () => {
    const badges = [makeBadge({ key: "first-steps", achieved: true })];

    const result = evaluateBadgeCelebration({
      badges,
      celebratedBadgeKeys: [],
      hasHydrated: false,
      hasSeeded: false,
      isDhikrDataSettled: true
    });

    expect(result).toEqual({ action: "wait" });
  });

  it("waits before dhikr data has settled (e.g. authenticated backend hydration pending)", () => {
    const badges = [makeBadge({ key: "first-steps", achieved: true })];

    const result = evaluateBadgeCelebration({
      badges,
      celebratedBadgeKeys: [],
      hasHydrated: true,
      hasSeeded: false,
      isDhikrDataSettled: false
    });

    expect(result).toEqual({ action: "wait" });
  });

  it("silently seeds already-achieved badges on a fresh store, without queuing a popup", () => {
    const badges = [
      makeBadge({ key: "first-steps", achieved: true }),
      makeBadge({ key: "steady-streak", achieved: false })
    ];

    const result = evaluateBadgeCelebration({
      badges,
      celebratedBadgeKeys: [],
      hasHydrated: true,
      hasSeeded: false,
      isDhikrDataSettled: true
    });

    expect(result).toEqual({ action: "seed", keysToMarkCelebrated: ["first-steps"] });
  });

  it("seeds nothing for a genuinely new user (no badges achieved yet)", () => {
    const badges = [makeBadge({ key: "first-steps", achieved: false })];

    const result = evaluateBadgeCelebration({
      badges,
      celebratedBadgeKeys: [],
      hasHydrated: true,
      hasSeeded: false,
      isDhikrDataSettled: true
    });

    expect(result).toEqual({ action: "seed", keysToMarkCelebrated: [] });
  });

  it("celebrates a badge that newly crosses its threshold after seeding has happened", () => {
    const badges = [
      makeBadge({ key: "first-steps", achieved: true }),
      makeBadge({ key: "steady-streak", achieved: true })
    ];

    const result = evaluateBadgeCelebration({
      badges,
      celebratedBadgeKeys: ["first-steps"],
      hasHydrated: true,
      hasSeeded: true,
      isDhikrDataSettled: true
    });

    expect(result).toEqual({
      action: "celebrate",
      badges: [badges[1]]
    });
  });

  it("never re-celebrates a previously celebrated badge", () => {
    const badges = [makeBadge({ key: "first-steps", achieved: true })];

    const result = evaluateBadgeCelebration({
      badges,
      celebratedBadgeKeys: ["first-steps"],
      hasHydrated: true,
      hasSeeded: true,
      isDhikrDataSettled: true
    });

    expect(result).toEqual({ action: "celebrate", badges: [] });
  });
});
