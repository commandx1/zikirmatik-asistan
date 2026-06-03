import type { EsmaulHusnaItem } from "../../focus/types";

const DEFAULT_SUGGESTION_COUNT = 3;
const DAY_MS = 86_400_000;

export function buildDailyEsmaWelcomeStorageKey(date: Date) {
  return `daily-esma-welcome:${toLocalDateKey(date)}`;
}

export function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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
