import { describe, expect, it } from "vitest";
import { hasUnsavedActiveProgress, resolveCollectionSaveRoute, shouldConfirmUnsavedDhikrTransition } from "./unsaved-transition-guard";

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

  it("MOB-KAY-18 / M-03: guests get no warning for a dhikr (free mode: see below), members do", () => {
    expect(shouldConfirmUnsavedDhikrTransition({ ...base, currentCount: 4, isMember: false })).toBe(false);
    expect(shouldConfirmUnsavedDhikrTransition({ ...base, currentCount: 4, isMember: true })).toBe(true);
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

describe("unsaved-transition-guard — misafir serbest mod", () => {
  const free = { selectedDhikrId: "", unsavedProgressDhikrIds: [], hasUnsavedFreeMode: true, isLeavingFreeMode: true };

  it("warns a guest leaving a free-mode count > 0 (not a saved dhikr)", () => {
    expect(shouldConfirmUnsavedDhikrTransition({ ...free, currentCount: 5, isMember: false })).toBe(true);
  });

  it("does not warn a guest at free-mode count 0", () => {
    expect(shouldConfirmUnsavedDhikrTransition({ ...free, currentCount: 0, isMember: false })).toBe(false);
  });
});

describe("resolveCollectionSaveRoute (MOB-KOL-04 / B-47)", () => {
  it("serbest modda kaydedilmemiş sayım: üye de misafir de ad formuna gider (loginRequired değil)", () => {
    expect(resolveCollectionSaveRoute({ hasSelectedDhikr: false, freeModeCount: 5, isMember: true })).toBe("free-save-form");
    expect(resolveCollectionSaveRoute({ hasSelectedDhikr: false, freeModeCount: 5, isMember: false })).toBe("free-save-form");
  });
  it("seçili zikir: üye log kaydeder, oturumsuz giriş ister", () => {
    expect(resolveCollectionSaveRoute({ hasSelectedDhikr: true, freeModeCount: 0, isMember: true })).toBe("save-log");
    expect(resolveCollectionSaveRoute({ hasSelectedDhikr: true, freeModeCount: 0, isMember: false })).toBe("login-required");
  });
  it("serbest mod boşsa kaydedilecek bir şey yok", () => {
    expect(resolveCollectionSaveRoute({ hasSelectedDhikr: false, freeModeCount: 0, isMember: true })).toBe("login-required");
  });
});
