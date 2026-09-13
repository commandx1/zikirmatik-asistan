import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const impactAsync = vi.fn().mockResolvedValue(undefined);
const notificationAsync = vi.fn().mockResolvedValue(undefined);

vi.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy", Rigid: "rigid", Soft: "soft" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
  impactAsync: (...args: unknown[]) => impactAsync(...args),
  notificationAsync: (...args: unknown[]) => notificationAsync(...args)
}));

import { fireLapHaptic, fireTapHaptic, resolveHapticsPattern } from "./haptics";

// resolveHapticsPattern's own behavior is covered exhaustively in
// haptics-pattern.test.ts (no mocking required there). This is just a smoke
// test that the re-export from this native-calling module still works.
describe("resolveHapticsPattern (re-exported from ./haptics)", () => {
  it("is re-exported and still resolves correctly", () => {
    expect(resolveHapticsPattern("tesbih")).toBe("tesbih");
    expect(resolveHapticsPattern(undefined, false)).toBe("off");
  });
});

describe("fireTapHaptic", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    impactAsync.mockClear();
    notificationAsync.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does nothing when pattern is 'off'", () => {
    fireTapHaptic("off");
    expect(impactAsync).not.toHaveBeenCalled();
  });

  it("fires a single light impact for 'hafif'", () => {
    fireTapHaptic("hafif");
    expect(impactAsync).toHaveBeenCalledTimes(1);
    expect(impactAsync).toHaveBeenCalledWith("light");
  });

  it("fires a single medium impact for 'orta'", () => {
    fireTapHaptic("orta");
    expect(impactAsync).toHaveBeenCalledTimes(1);
    expect(impactAsync).toHaveBeenCalledWith("medium");
  });

  it("fires two light impacts ~40ms apart for 'tesbih'", () => {
    fireTapHaptic("tesbih");
    expect(impactAsync).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(40);
    expect(impactAsync).toHaveBeenCalledTimes(2);
    expect(impactAsync).toHaveBeenNthCalledWith(1, "light");
    expect(impactAsync).toHaveBeenNthCalledWith(2, "light");
  });

  it("never throws even when the native call rejects", () => {
    impactAsync.mockRejectedValueOnce(new Error("no native module"));
    expect(() => fireTapHaptic("orta")).not.toThrow();
  });

  it("never throws even when the native call throws synchronously", () => {
    impactAsync.mockImplementationOnce(() => {
      throw new Error("native module missing");
    });
    expect(() => fireTapHaptic("hafif")).not.toThrow();
  });
});

describe("fireLapHaptic", () => {
  beforeEach(() => {
    notificationAsync.mockClear();
  });

  it("does nothing when pattern is 'off'", () => {
    fireLapHaptic("off");
    expect(notificationAsync).not.toHaveBeenCalled();
  });

  it.each(["hafif", "orta", "tesbih"] as const)("fires a success notification for '%s'", (pattern) => {
    fireLapHaptic(pattern);
    expect(notificationAsync).toHaveBeenCalledTimes(1);
    expect(notificationAsync).toHaveBeenCalledWith("success");
  });

  it("never throws even when the native call rejects", () => {
    notificationAsync.mockRejectedValueOnce(new Error("no native module"));
    expect(() => fireLapHaptic("orta")).not.toThrow();
  });
});
