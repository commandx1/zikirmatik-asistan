import { toDateKey } from "@zikirmatik/shared";
import type { EsmaulHusnaItem } from "../../focus/types";
import { dailyEsmaWelcomeKey } from "../../../lib/storage/keys";

const DEFAULT_SUGGESTION_COUNT = 3;
const DAY_MS = 86_400_000;

export function buildDailyEsmaWelcomeStorageKey(date: Date) {
  return dailyEsmaWelcomeKey(toLocalDateKey(date));
}

export const toLocalDateKey = toDateKey;

export function resolveDailyEsmaSuggestions(
  items: EsmaulHusnaItem[],
  date: Date,
  count = DEFAULT_SUGGESTION_COUNT
) {
  if (items.length === 0 || count <= 0) {
    return [];
  }

  const safeCount = Math.min(count, items.length);
  const daySeed = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS
  );
  const startIndex = daySeed % items.length;

  return Array.from({ length: safeCount }, (_, offset) => {
    const index = (startIndex + offset * 17) % items.length;
    return items[index];
  });
}
