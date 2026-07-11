import { describe, expect, it } from "vitest";
import type { StatsBadge } from "@zikirmatik/shared";
import { selectNewlyAchievedBadges } from "./badge-celebration";

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
