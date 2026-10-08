import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/storage/zustand-storage", () => ({
  safeAsyncStorage: { getItem: vi.fn(async () => null), setItem: vi.fn(), removeItem: vi.fn() }
}));

vi.mock("../i18n", () => ({
  i18n: { changeLanguage: vi.fn() },
  detectDeviceLocale: () => "tr"
}));

const { useProfileStore } = await import("./profile-store");

describe("profile-store persist (B-3)", () => {
  it("persists dailyReminderEnabled and reminderTime so a guest's reminder survives relaunch", () => {
    useProfileStore.setState({ dailyReminderEnabled: true, reminderTime: "21:30" });
    const partialize = useProfileStore.persist.getOptions().partialize!;
    expect(partialize(useProfileStore.getState())).toMatchObject({
      dailyReminderEnabled: true,
      reminderTime: "21:30"
    });
  });

  it("still persists locale/haptics/isPremium", () => {
    const persisted = useProfileStore.persist.getOptions().partialize!(useProfileStore.getState());
    expect(Object.keys(persisted as object)).toEqual(
      expect.arrayContaining(["locale", "hapticsEnabled", "hapticsPattern", "isPremium"])
    );
  });
});
