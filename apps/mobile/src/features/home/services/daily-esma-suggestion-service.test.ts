import { describe, expect, it } from "vitest";
import type { EsmaulHusnaItem } from "../../focus/types";
import {
  buildDailyEsmaWelcomeStorageKey,
  resolveDailyEsmaSuggestions,
  toLocalDateKey
} from "./daily-esma-suggestion-service";

const esmaItems: EsmaulHusnaItem[] = Array.from({ length: 10 }, (_, index) => ({
  nameArabic: `اسم ${index + 1}`,
  transliteration: `Esma ${index + 1}`,
  meaning: `Meaning ${index + 1}`,
  virtue: `Virtue ${index + 1}`,
  dhikrDay: "Pazartesi"
}));

describe("daily-esma-suggestion-service", () => {
  it("uses a local date key for the daily welcome storage marker", () => {
    const date = new Date(2026, 5, 3, 22, 15);

    expect(toLocalDateKey(date)).toBe("2026-06-03");
    expect(buildDailyEsmaWelcomeStorageKey(date)).toBe("daily-esma-welcome:2026-06-03");
  });

  it("returns the same three suggestions for the same day", () => {
    const morning = new Date(2026, 5, 3, 8, 0);
    const evening = new Date(2026, 5, 3, 21, 0);

    const first = resolveDailyEsmaSuggestions(esmaItems, morning);
    const second = resolveDailyEsmaSuggestions(esmaItems, evening);

    expect(first).toHaveLength(3);
    expect(first.map((item) => item.transliteration)).toEqual(
      second.map((item) => item.transliteration)
    );
  });

  it("rotates suggestions on the next day without duplicates", () => {
    const today = resolveDailyEsmaSuggestions(esmaItems, new Date(2026, 5, 3));
    const tomorrow = resolveDailyEsmaSuggestions(esmaItems, new Date(2026, 5, 4));

    expect(new Set(today.map((item) => item.transliteration)).size).toBe(3);
    expect(tomorrow.map((item) => item.transliteration)).not.toEqual(
      today.map((item) => item.transliteration)
    );
  });
});
