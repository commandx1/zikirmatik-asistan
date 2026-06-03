import { describe, expect, it } from "vitest";
import { shouldConfirmUnsavedDhikrTransition } from "./unsaved-transition-guard";

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
