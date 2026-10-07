import { describe, expect, it } from "vitest";

// reminder-offer.ts imports native modules; only the pure predicate is tested here.
import { vi } from "vitest";
vi.mock("@react-native-async-storage/async-storage", () => ({ default: { getItem: vi.fn(), setItem: vi.fn() } }));
vi.mock("../../../store/profile-store", () => ({ useProfileStore: { getState: () => ({ dailyReminderEnabled: false }) } }));
vi.mock("expo-notifications", () => ({ getPermissionsAsync: vi.fn() }));

const { shouldOfferReminderCard } = await import("./reminder-offer");

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
