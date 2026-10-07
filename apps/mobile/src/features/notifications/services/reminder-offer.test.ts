import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// reminder-offer.ts imports native modules; they are mocked here.
const storage = new Map<string, string>();
const perms = { granted: false, canAskAgain: true };
const badge = { isCelebrationVisible: false };
const badgeListeners = new Set<(s: typeof badge) => void>();
const setNextReason = vi.fn();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (k: string) => storage.get(k) ?? null),
    setItem: vi.fn(async (k: string, v: string) => void storage.set(k, v))
  }
}));
vi.mock("../../../store/profile-store", () => ({ useProfileStore: { getState: () => ({ dailyReminderEnabled: false }) } }));
vi.mock("../../../store/notification-prompt-store", () => ({ useNotificationPromptStore: { getState: () => ({ setNextReason }) } }));
vi.mock("../../../store/badge-celebration-store", () => ({
  useBadgeCelebrationStore: {
    getState: () => badge,
    subscribe: (fn: (s: typeof badge) => void) => {
      badgeListeners.add(fn);
      return () => badgeListeners.delete(fn);
    }
  }
}));
vi.mock("expo-notifications", () => ({ getPermissionsAsync: vi.fn(async () => ({ ...perms })) }));

const { shouldOfferReminderCard, offerDailyReminderAfterSave } = await import("./reminder-offer");

const base = { permissionGranted: false, canAskAgain: true, alreadyOffered: false, reminderEnabled: false };

describe("shouldOfferReminderCard (B-11)", () => {
  it("offers once for an undetermined, reminder-less user", () => {
    expect(shouldOfferReminderCard(base)).toBe(true);
  });
  it("never offers when permission is granted, permanently denied, already offered or reminder is on", () => {
    expect(shouldOfferReminderCard({ ...base, permissionGranted: true })).toBe(false);
    expect(shouldOfferReminderCard({ ...base, canAskAgain: false })).toBe(false);
    expect(shouldOfferReminderCard({ ...base, alreadyOffered: true })).toBe(false);
    expect(shouldOfferReminderCard({ ...base, reminderEnabled: true })).toBe(false);
  });
});

describe("offerDailyReminderAfterSave (B-11)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    storage.clear();
    perms.granted = false;
    perms.canAskAgain = true;
    badge.isCelebrationVisible = false;
    setNextReason.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it("shows the card after the first save, never twice (even for overlapping calls)", async () => {
    const optIn = vi.fn();
    await Promise.all([
      offerDailyReminderAfterSave(optIn),
      offerDailyReminderAfterSave(optIn),
      vi.runAllTimersAsync()
    ]);
    await offerDailyReminderAfterSave(optIn).then(() => undefined, () => undefined);
    await vi.runAllTimersAsync();
    expect(optIn).toHaveBeenCalledTimes(1);
    expect(setNextReason).toHaveBeenCalledWith("dailyReminder");
  });

  it("does not show when permission is already granted", async () => {
    perms.granted = true;
    const optIn = vi.fn();
    const run = offerDailyReminderAfterSave(optIn);
    await vi.runAllTimersAsync();
    await run;
    expect(optIn).not.toHaveBeenCalled();
  });

  it("queues behind the badge celebration modal instead of skipping", async () => {
    badge.isCelebrationVisible = true;
    const optIn = vi.fn();
    const run = offerDailyReminderAfterSave(optIn);
    await vi.runAllTimersAsync();
    expect(optIn).not.toHaveBeenCalled();
    badge.isCelebrationVisible = false;
    badgeListeners.forEach((fn) => fn(badge));
    await run;
    expect(optIn).toHaveBeenCalledTimes(1);
  });
});
