import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBadgeCelebrationStore } from "./badge-celebration-store";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
}));

describe("badge-celebration-store", () => {
  beforeEach(() => {
    useBadgeCelebrationStore.setState({ celebratedBadgeKeys: [] });
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
});
