import { beforeEach, describe, expect, it, vi } from "vitest";

const { removeItemMock } = vi.hoisted(() => ({ removeItemMock: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: removeItemMock
  }
}));

vi.mock("../i18n", () => ({
  i18n: { t: (key: string) => key, changeLanguage: vi.fn() },
  detectDeviceLocale: () => "tr"
}));

import { resetSessionScopedStores } from "./session-boundary";
import { useBadgeCelebrationStore } from "./badge-celebration-store";
import { useStreakReminderStore } from "./streak-reminder-store";

describe("resetSessionScopedStores", () => {
  beforeEach(() => {
    removeItemMock.mockClear();
    useBadgeCelebrationStore.setState({ hasSeeded: true, celebratedBadgeKeys: ["first-steps"] });
    useStreakReminderStore.setState({ streakReminderEnabled: true });
  });

  it("resets badge-celebration-store and streak-reminder-store to their initial state", () => {
    resetSessionScopedStores();

    expect(useBadgeCelebrationStore.getState().hasSeeded).toBe(false);
    expect(useBadgeCelebrationStore.getState().celebratedBadgeKeys).toEqual([]);
    expect(useStreakReminderStore.getState().streakReminderEnabled).toBe(false);
  });

  it("removes the signing-out user's ai-guide cache key when a previousUserId is given", () => {
    resetSessionScopedStores("user-123");

    expect(removeItemMock).toHaveBeenCalledWith("ai-guide:last:user-123");
  });

  it("does not touch AsyncStorage when no previousUserId is given", () => {
    resetSessionScopedStores();

    expect(removeItemMock).not.toHaveBeenCalled();
  });
});
