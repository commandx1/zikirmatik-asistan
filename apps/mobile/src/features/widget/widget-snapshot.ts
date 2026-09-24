import { resolveLocalizedText, resolveThemeTokens, toDateKey } from "@zikirmatik/shared";
import { calculateLocalCompletionStreak, resolveActivityDateKey } from "../home/services/local-streak";
import {
  dayIndexFor,
  expectedItemsForDay,
  isDayComplete,
  isJourneyFinished,
  slotProgress,
  type VirdJourneyProgramLike
} from "../vird/services/vird-day";
import { resolveNowSlot } from "../vird/services/vird-now";
import { calculateVirdStreak } from "../vird/services/vird-streak";
import { getPrayerTimes } from "../vird/services/prayer-times";
import type { VirdDayProgressByDate, VirdProgramLocal, VirdSlotKey } from "../vird/types";

// Headless widget task ne zaman çalışır bilinmez (uygulama kapalıyken de
// çalışabilir) ve zustand store modüllerini import edemez: auth-store ->
// api istemcisi/push/RevenueCat zincirini, dhikr-store -> i18n'i çeker. Bu
// yüzden handler AsyncStorage'daki ham JSON string'lerini okuyup burada
// tanımlı saf fonksiyona verir.

export { WIDGET_STORAGE_KEYS } from "../../lib/storage/keys";

export type WidgetRawInput = {
  dhikrStore: string | null;
  virdStore: string | null;
  circleStore: string | null;
  profileStore: string | null;
  themeStore: string | null;
  widgetState: string | null;
};

export type VirdWidgetSnapshot =
  | { kind: "locked" }
  | { kind: "noProgram" }
  | { kind: "noItemsToday"; streak: number }
  | { kind: "done"; streak: number }
  | {
      kind: "active";
      slot: VirdSlotKey;
      done: number;
      total: number;
      nextName: string;
      nextCount: number;
      nextTarget: number;
      streak: number;
      uri: string;
    };

export type WidgetSnapshot = {
  colors: { bg: string; card: string; text: string; muted: string; accent: string };
  locale: "tr" | "en";
  todayTotal: number;
  streak: number;
  vird: VirdWidgetSnapshot;
};

type DhikrItemLike = {
  current?: number;
  target?: number;
  lastActivityLabel?: string;
  lastActivityAt?: string;
};

type ServerStreak = { value: number; fetchedOn: string; lastActiveDate?: string };

function safeParseState(json: string | null): Record<string, unknown> | null {
  if (!json) {
    return null;
  }
  try {
    const parsed = JSON.parse(json);
    const state = (parsed as { state?: unknown })?.state;
    return state && typeof state === "object" ? (state as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function shiftDateKey(key: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) {
    return key;
  }
  // regex capture groups always match when exec succeeds
  const year = Number.parseInt(match[1]!, 10);
  const month = Number.parseInt(match[2]!, 10);
  const day = Number.parseInt(match[3]!, 10);
  return toDateKey(new Date(year, month - 1, day + days));
}

function safeNonNegativeInt(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

// ponytail: yerel toplam; sunucu periods.today'den İstanbul TZ + çoklu cihaz
// + henüz flush edilmemiş tıklar kadar sapabilir. Şikâyet gelirse sunucu
// özetini önbellekle.
//
// use-stats.ts buildLocalStatsSummary'nin "bugün" formülüyle aynı hizada:
// ana sayaç (aktivite günü bugün olan items[].current) + vird seansı
// (dayProgress[bugün]) + halka seansı (todayCounts, dateKey bugün) + serbest
// mod sayacı (freeModeActivityAt bugünse, ya da damga hiç yoksa — eski
// persist). Vird/halka kendi ayrı sayımlarıdır, ana sayaçla MAX alınmaz,
// toplanır (K2 sonrası ana sayaç zaten bunları içermiyor).
function computeTodayTotal(
  dhikrState: Record<string, unknown> | null,
  virdState: Record<string, unknown> | null,
  circleState: Record<string, unknown> | null,
  today: Date
): number {
  const todayKey = toDateKey(today);
  let total = 0;

  const items = Array.isArray(dhikrState?.items) ? (dhikrState!.items as DhikrItemLike[]) : [];
  for (const item of items) {
    if (typeof item !== "object" || item === null) {
      continue;
    }
    const safeCount = safeNonNegativeInt(item.current);
    if (safeCount <= 0) {
      continue;
    }
    const dayKey = resolveActivityDateKey(item, today) ?? todayKey;
    if (dayKey === todayKey) {
      total += safeCount;
    }
  }

  const freeModeCount = safeNonNegativeInt(dhikrState?.freeModeCount);
  if (freeModeCount > 0) {
    const freeModeActivityAt = typeof dhikrState?.freeModeActivityAt === "string" ? dhikrState.freeModeActivityAt : undefined;
    const freeModeDayKey = freeModeActivityAt
      ? (resolveActivityDateKey({ lastActivityAt: freeModeActivityAt }, today) ?? todayKey)
      : todayKey;
    if (freeModeDayKey === todayKey) {
      total += freeModeCount;
    }
  }

  const dayProgress = virdState?.dayProgress;
  const todayVirdItems =
    dayProgress && typeof dayProgress === "object" ? (dayProgress as Record<string, unknown>)[todayKey] : undefined;
  if (todayVirdItems && typeof todayVirdItems === "object") {
    for (const entry of Object.values(todayVirdItems as Record<string, unknown>)) {
      if (entry && typeof entry === "object") {
        total += safeNonNegativeInt((entry as { count?: unknown }).count);
      }
    }
  }

  const todayCounts = circleState?.todayCounts;
  if (todayCounts && typeof todayCounts === "object" && !Array.isArray(todayCounts)) {
    for (const entry of Object.values(todayCounts as Record<string, unknown>)) {
      if (entry && typeof entry === "object" && (entry as { dateKey?: unknown }).dateKey === todayKey) {
        total += safeNonNegativeInt((entry as { count?: unknown }).count);
      }
    }
  }

  return total;
}

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function collectLocalCompletedDays(
  dhikrState: Record<string, unknown> | null,
  virdState: Record<string, unknown> | null,
  today: Date
): Set<string> {
  const days = new Set<string>();

  const items = Array.isArray(dhikrState?.items) ? (dhikrState!.items as DhikrItemLike[]) : [];
  for (const item of items) {
    if (typeof item !== "object" || item === null) {
      continue;
    }
    const safeCount = Math.max(0, Math.floor(item.current ?? 0));
    const target = Math.max(0, Math.floor(item.target ?? 0));
    if (target > 0 && safeCount >= target) {
      const dayKey = resolveActivityDateKey(item, today);
      if (dayKey) {
        days.add(dayKey);
      }
    }
  }

  const dayProgress = virdState?.dayProgress;
  if (dayProgress && typeof dayProgress === "object" && !Array.isArray(dayProgress)) {
    for (const [dateKey, itemsForDay] of Object.entries(dayProgress as Record<string, unknown>)) {
      if (!DATE_KEY_RE.test(dateKey) || !itemsForDay || typeof itemsForDay !== "object" || Array.isArray(itemsForDay)) {
        continue;
      }
      const hasCompleted = Object.values(itemsForDay as Record<string, unknown>).some(
        (entry) => !!entry && typeof entry === "object" && (entry as { completed?: unknown }).completed === true
      );
      if (hasCompleted) {
        days.add(dateKey);
      }
    }
  }

  return days;
}

// Senaryo (K-emülatör QA): sabah açılışta serverStreak önbelleğe alınır
// (value=12, lastActiveDate=dün), sonra kullanıcı zikrini tamamlar ama
// önbellek tazelenmez (çevrimdışı/yalnız halka seansı). Ertesi gün
// lastActiveDate 2 gün önceye düşer ve seri 0 görünür, oysa yerelde
// kanıtlanan tamamlanmış günlerle zincir hâlâ canlıdır. Bu yüzden önbellek
// değerini, yereldeki tamamlanmış günlerle (ana sayaç + vird) ileri doğru
// uzatıyoruz.
function computeStreak(
  dhikrState: Record<string, unknown> | null,
  virdState: Record<string, unknown> | null,
  widgetState: Record<string, unknown> | null,
  today: Date
): number {
  const todayKey = toDateKey(today);
  const yesterdayKey = shiftDateKey(todayKey, -1);
  const serverStreak = widgetState?.serverStreak as ServerStreak | undefined;
  const localCompletedDays = collectLocalCompletedDays(dhikrState, virdState, today);

  if (serverStreak && typeof serverStreak.value === "number") {
    if (typeof serverStreak.lastActiveDate === "string" && DATE_KEY_RE.test(serverStreak.lastActiveDate)) {
      // lastActiveDate gelecekteyse (saat geri alınmış/TZ) önbelleği yok say.
      if (serverStreak.lastActiveDate <= todayKey) {
        let cursor = serverStreak.lastActiveDate;
        let streak = Math.max(0, Math.floor(serverStreak.value));
        for (let steps = 0; steps < 400; steps += 1) {
          const next = shiftDateKey(cursor, 1);
          if (next > todayKey || !localCompletedDays.has(next)) {
            break;
          }
          cursor = next;
          streak += 1;
        }
        if (cursor === todayKey || cursor === yesterdayKey) {
          return streak;
        }
      }
    } else if (
      typeof serverStreak.lastActiveDate !== "string" &&
      (serverStreak.fetchedOn === todayKey || serverStreak.fetchedOn === yesterdayKey)
    ) {
      return Math.max(0, Math.floor(serverStreak.value));
    }
  }

  return calculateLocalCompletionStreak(Array.from(localCompletedDays), today).currentStreak;
}

function resolveLocale(profileState: Record<string, unknown> | null): "tr" | "en" {
  return profileState?.locale === "en" ? "en" : "tr";
}

function extractCoords(virdState: Record<string, unknown> | null): { lat: number; lng: number } | null {
  const prefs = virdState?.reminderPrefs;
  const coords = prefs && typeof prefs === "object" ? (prefs as Record<string, unknown>).coords : null;
  if (
    coords &&
    typeof coords === "object" &&
    typeof (coords as Record<string, unknown>).lat === "number" &&
    typeof (coords as Record<string, unknown>).lng === "number"
  ) {
    return { lat: (coords as { lat: number }).lat, lng: (coords as { lng: number }).lng };
  }
  return null;
}

// todays-vird-card.tsx ile BİREBİR aynı hesap sırası: premium -> aktif
// program -> dayIndexFor -> expectedItemsForDay -> isDayComplete ->
// resolveNowSlot -> o dilimin slotProgress'i. Her adım savunmacı: bozuk/
// eksik veri throw etmez, "noProgram"a düşer.
function computeVird(
  profileState: Record<string, unknown> | null,
  virdState: Record<string, unknown> | null,
  now: Date
): VirdWidgetSnapshot {
  if (profileState?.isPremium !== true) {
    return { kind: "locked" };
  }

  try {
    const programs = Array.isArray(virdState?.programs) ? (virdState!.programs as VirdProgramLocal[]) : [];
    const activeProgramId = typeof virdState?.activeProgramId === "string" ? virdState.activeProgramId : null;
    const activeProgram = activeProgramId
      ? (programs.find((p) => p && typeof p === "object" && p.id === activeProgramId) ?? null)
      : null;

    if (!activeProgram || !Array.isArray(activeProgram.phases) || typeof activeProgram.startDate !== "string") {
      return { kind: "noProgram" };
    }
    if (activeProgram.status && activeProgram.status !== "active") {
      return { kind: "noProgram" };
    }

    const todayKey = toDateKey(now);
    if (isJourneyFinished(activeProgram as VirdJourneyProgramLike, todayKey)) {
      return { kind: "noProgram" };
    }

    const dayIndex = dayIndexFor(activeProgram, todayKey);
    const expected = expectedItemsForDay(activeProgram, dayIndex);

    const dayProgress: VirdDayProgressByDate =
      virdState?.dayProgress && typeof virdState.dayProgress === "object"
        ? (virdState.dayProgress as VirdDayProgressByDate)
        : {};
    const todayProgress = dayProgress[todayKey];
    const streak = calculateVirdStreak(activeProgram, dayProgress, now).currentStreak;

    if (expected.length === 0) {
      return { kind: "noItemsToday", streak };
    }

    if (isDayComplete(expected, todayProgress)) {
      return { kind: "done", streak };
    }

    const progress = slotProgress(expected, todayProgress);
    const coords = extractCoords(virdState);
    const prayerTimes = coords ? getPrayerTimes(coords, now) : undefined;
    // ponytail: resolveNowSlot içinde prayer dilimi bitmişse ilk eksik
    // dilime düşülür; gerçek vakte göre seçim gerekirse getPrayerTimes ile
    // eşle (bkz. vird-now.ts timeBucketSlot).
    const slot = resolveNowSlot(progress, now, prayerTimes);
    const view = slot ? progress[slot] : undefined;
    if (!slot || !view) {
      return { kind: "noProgram" };
    }

    const locale = resolveLocale(profileState);
    const nextItem = view.items.find((item) => !item.completed);
    let nextName = "—";
    let nextCount = 0;
    let nextTarget = 0;
    let prayerIndex: number | null = null;
    if (nextItem) {
      nextCount = nextItem.count;
      nextTarget = nextItem.target;
      prayerIndex = nextItem.prayerIndex;
      const dhikrSnapshot = activeProgram.dhikrs?.[nextItem.ref];
      const resolved = dhikrSnapshot ? resolveLocalizedText(dhikrSnapshot.name, locale) : "";
      nextName = resolved || "—";
    }

    const uriParams = [
      `programId=${encodeURIComponent(activeProgram.id)}`,
      `slot=${encodeURIComponent(slot)}`,
      ...(prayerIndex != null ? [`prayerIndex=${encodeURIComponent(String(prayerIndex))}`] : []),
      "src=widget",
      "w=vird"
    ];

    return {
      kind: "active",
      slot,
      done: view.done,
      total: view.total,
      nextName,
      nextCount,
      nextTarget,
      streak,
      uri: `zikirmatik://vird/session?${uriParams.join("&")}`
    };
  } catch {
    return { kind: "noProgram" };
  }
}

function resolveColors(themeState: Record<string, unknown> | null): WidgetSnapshot["colors"] {
  const themeName = typeof themeState?.themeName === "string" ? themeState.themeName : undefined;
  const tokens = resolveThemeTokens(themeName);
  return {
    bg: tokens.bg,
    card: tokens.card,
    text: tokens.textPrimary,
    muted: tokens.textMuted,
    accent: tokens.accent
  };
}

export function buildWidgetSnapshot(raw: WidgetRawInput, now: Date): WidgetSnapshot {
  const dhikrState = safeParseState(raw.dhikrStore);
  const virdState = safeParseState(raw.virdStore);
  const circleState = safeParseState(raw.circleStore);
  const profileState = safeParseState(raw.profileStore);
  const themeState = safeParseState(raw.themeStore);
  const widgetState = safeParseState(raw.widgetState);

  return {
    colors: resolveColors(themeState),
    locale: resolveLocale(profileState),
    todayTotal: computeTodayTotal(dhikrState, virdState, circleState, now),
    streak: computeStreak(dhikrState, virdState, widgetState, now),
    vird: computeVird(profileState, virdState, now)
  };
}

const THOUSAND_SEPARATOR: Record<"tr" | "en", string> = { tr: ".", en: "," };
const DECIMAL_SEPARATOR: Record<"tr" | "en", string> = { tr: ",", en: "." };
const THOUSAND_SUFFIX: Record<"tr" | "en", string> = { tr: " B", en: "K" };
const MILLION_SUFFIX: Record<"tr" | "en", string> = { tr: " Mn", en: "M" };

function groupThousands(digits: string, separator: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

// Intl KULLANMA — headless Hermes'te garanti değil (bkz. widget-task-handler
// yorumu). < 10000 → binlik ayraçlı; 10000–999999 → bir ondalıklı bin
// kısaltması; >= 1e6 → bir ondalıklı milyon kısaltması.
export function formatWidgetCount(n: number, locale: "tr" | "en"): string {
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) {
    return "0";
  }

  const value = Math.floor(n);

  if (value < 10000) {
    return groupThousands(String(value), THOUSAND_SEPARATOR[locale]);
  }

  // 999.950+ bin ölçeğinde "1.000 B"ye yuvarlanır; o sınırda milyona geç.
  const isMillion = value >= 999_950;
  const scale = isMillion ? 1_000_000 : 1000;
  const suffix = isMillion ? MILLION_SUFFIX[locale] : THOUSAND_SUFFIX[locale];
  const scaled = value / scale;
  const rounded = Math.round(scaled * 10) / 10;
  const wholePart = Math.trunc(rounded);
  const decimalDigit = Math.round((rounded - wholePart) * 10);

  const groupedWhole = groupThousands(String(wholePart), THOUSAND_SEPARATOR[locale]);
  if (decimalDigit === 0) {
    return `${groupedWhole}${suffix}`;
  }

  return `${groupedWhole}${DECIMAL_SEPARATOR[locale]}${decimalDigit}${suffix}`;
}
