import { beforeEach, describe, expect, it } from "vitest";
import { useDhikrStore } from "../../../store/dhikr-store";
import { registerDhikrStoreText } from "../../../store/dhikr-store-text";
import type { AiGuideRecommendation } from "../types";
import { buildRecommendationStart } from "./recommendation-start";

registerDhikrStoreText({
  saved: () => "Kayıtlı",
  notStarted: () => "Henüz başlanmadı",
  todayAt: () => "Bugün",
  lowercase: (value) => value.toLocaleLowerCase("tr-TR")
});

const rec = (over: Partial<AiGuideRecommendation> = {}): AiGuideRecommendation => ({
  id: "srv-1",
  title: "Sübhanallah",
  chipEmoji: "",
  chipLabel: "",
  arabic: "سبحان الله",
  transliteration: "Subhanallah",
  meaning: "Allah'ı tenzih ederim",
  recommendedCount: 100,
  ...over
});

beforeEach(() => {
  useDhikrStore.getState().resetSessionScoped();
  useDhikrStore.setState({
    items: [
      { id: "srv-1", source: "ready", name: "x", transliteration: "x", current: 5, target: 33, lastActivityLabel: "-", streakDays: 0, isFavorite: false }
    ]
  });
});

const start = (r: AiGuideRecommendation, fresh: boolean) => {
  const { fallback, target } = buildRecommendationStart(r, fresh, "Henüz başlanmadı");
  useDhikrStore.getState().selectDhikr(r.id, undefined, { fallback, target });
  return useDhikrStore.getState().items.find((i) => i.id === r.id);
};

describe("AI recommendation start (M-06 / B-25 / B-26)", () => {
  it("MOB-KAY-19: 'Sıfırdan başla' applies the recommended target", () => {
    expect(start(rec(), true)?.target).toBe(100);
  });

  it("'Kaldığı yerden' keeps the current target", () => {
    expect(start(rec(), false)?.target).toBe(33);
  });

  it("no recommended count -> the target is left alone even on a fresh start", () => {
    expect(start(rec({ recommendedCount: undefined }), true)?.target).toBe(33);
  });

  it("B-26: a recommendation missing from the local catalog is added and selected, not a silent no-op", () => {
    const item = start(rec({ id: "srv-new", recommendedCount: 21 }), true);
    expect(useDhikrStore.getState().selectedDhikrId).toBe("srv-new");
    expect(item).toMatchObject({ source: "ready", target: 21, current: 0 });
  });
});
