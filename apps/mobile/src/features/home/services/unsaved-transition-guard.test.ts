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
});
