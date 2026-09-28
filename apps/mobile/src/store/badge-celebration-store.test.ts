import { beforeEach, describe, expect, it } from "vitest";
import { useBadgeCelebrationStore } from "./badge-celebration-store";

describe("badge-celebration-store", () => {
  beforeEach(() => {
    useBadgeCelebrationStore.setState({
      celebratedBadgeKeys: [],
      hasHydrated: false,
      seededForOwner: null
    });
  });

  it("records a badge as celebrated", () => {
    useBadgeCelebrationStore.getState().markCelebrated("first-steps");

    expect(useBadgeCelebrationStore.getState().celebratedBadgeKeys).toEqual(["first-steps"]);
  });

  it("is idempotent: marking the same badge twice does not duplicate it", () => {
    useBadgeCelebrationStore.getState().markCelebrated("first-steps");
    useBadgeCelebrationStore.getState().markCelebrated("first-steps");

    expect(useBadgeCelebrationStore.getState().celebratedBadgeKeys).toEqual(["first-steps"]);
  });

  it("tracks multiple distinct badges independently", () => {
    useBadgeCelebrationStore.getState().markCelebrated("first-steps");
    useBadgeCelebrationStore.getState().markCelebrated("steady-streak");

    expect(useBadgeCelebrationStore.getState().celebratedBadgeKeys).toEqual([
      "first-steps",
      "steady-streak"
    ]);
  });

  it("starts not hydrated and not seeded for anyone", () => {
    expect(useBadgeCelebrationStore.getState().hasHydrated).toBe(false);
    expect(useBadgeCelebrationStore.getState().seededForOwner).toBeNull();
  });

  it("markHydrated flips hasHydrated to true", () => {
    useBadgeCelebrationStore.getState().markHydrated();

    expect(useBadgeCelebrationStore.getState().hasHydrated).toBe(true);
  });

  it("markSeeded records the data owner it seeded for", () => {
    useBadgeCelebrationStore.getState().markSeeded("user-a");

    expect(useBadgeCelebrationStore.getState().seededForOwner).toBe("user-a");
  });
});
