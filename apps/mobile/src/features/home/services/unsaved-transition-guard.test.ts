import { describe, expect, it } from "vitest";
import { hasUnsavedActiveProgress, shouldConfirmUnsavedDhikrTransition } from "./unsaved-transition-guard";

describe("unsaved-transition-guard", () => {
  it("asks for confirmation when switching away from an unsaved selected dhikr", () => {
    expect(
      shouldConfirmUnsavedDhikrTransition({
        selectedDhikrId: "dhikr-a",
        targetDhikrId: "dhikr-b",
        unsavedProgressDhikrIds: ["dhikr-a"]
      })
    ).toBe(true);
  });

  it("does not ask when selecting the same dhikr", () => {
    expect(
      shouldConfirmUnsavedDhikrTransition({
        selectedDhikrId: "dhikr-a",
        targetDhikrId: "dhikr-a",
        unsavedProgressDhikrIds: ["dhikr-a"]
      })
    ).toBe(false);
  });

  it("asks for confirmation when leaving unsaved free mode", () => {
    expect(
      shouldConfirmUnsavedDhikrTransition({
        selectedDhikrId: "",
        unsavedProgressDhikrIds: [],
        hasUnsavedFreeMode: true,
        isLeavingFreeMode: true
      })
    ).toBe(true);
  });

  it("does not ask when staying in free mode", () => {
    expect(
      shouldConfirmUnsavedDhikrTransition({
        selectedDhikrId: "",
        unsavedProgressDhikrIds: [],
        hasUnsavedFreeMode: true,
        isLeavingFreeMode: false
      })
    ).toBe(false);
  });
});

describe("unsaved-transition-guard — QA kararları", () => {
  const base = { selectedDhikrId: "dhikr-a", targetDhikrId: "dhikr-b", unsavedProgressDhikrIds: ["dhikr-a"] };

  it("MOB-KAY-14 / M-04: no modal when the unsaved dhikr is at 0", () => {
    expect(shouldConfirmUnsavedDhikrTransition({ ...base, currentCount: 0 })).toBe(false);
    expect(shouldConfirmUnsavedDhikrTransition({ ...base, currentCount: 4 })).toBe(true);
  });

  it("MOB-KAY-18 / M-03: guests never get the unsaved warning, members do", () => {
    expect(shouldConfirmUnsavedDhikrTransition({ ...base, currentCount: 4, isMember: false })).toBe(false);
    expect(shouldConfirmUnsavedDhikrTransition({ ...base, currentCount: 4, isMember: true })).toBe(true);
    expect(
      shouldConfirmUnsavedDhikrTransition({
        selectedDhikrId: "",
        unsavedProgressDhikrIds: [],
        hasUnsavedFreeMode: true,
        isLeavingFreeMode: true,
        currentCount: 3,
        isMember: false
      })
    ).toBe(false);
  });
});

describe("hasUnsavedActiveProgress", () => {
  const input = { selectedDhikrId: "a", unsavedProgressDhikrIds: ["a"], currentCount: 5, isMember: true };

  it("MOB-ESM-07 / M-03: a guest is never 'unsaved', so the daily Esma welcome is not blocked", () => {
    expect(hasUnsavedActiveProgress({ ...input, isMember: false })).toBe(false);
    expect(hasUnsavedActiveProgress({ ...input, selectedDhikrId: "", isMember: false })).toBe(false);
  });

  it("members: unsaved only with a positive count", () => {
    expect(hasUnsavedActiveProgress(input)).toBe(true);
    expect(hasUnsavedActiveProgress({ ...input, currentCount: 0 })).toBe(false);
    expect(hasUnsavedActiveProgress({ ...input, selectedDhikrId: "", unsavedProgressDhikrIds: [] })).toBe(true);
  });
});
