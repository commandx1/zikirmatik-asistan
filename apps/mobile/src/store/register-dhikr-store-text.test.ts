import { describe, expect, it, vi } from "vitest";
import { getDhikrStoreText } from "./dhikr-store-text";
import "./register-dhikr-store-text";

const profile = vi.hoisted(() => ({ locale: "tr" as "tr" | "en" }));

vi.mock("../i18n", () => ({
  i18n: {
    t: (key: string, opts?: Record<string, unknown>) => (opts ? `${key}|${JSON.stringify(opts)}` : key)
  }
}));
vi.mock("./profile-store", () => ({
  useProfileStore: { getState: () => profile }
}));

// Kalıcı lastActivityLabel biçimi, dhikr-store içindeki eski
// formatLastActivityLabel/slugify koduyla birebir aynı kalmalı.
describe("register-dhikr-store-text", () => {
  const now = new Date(2026, 8, 25, 9, 5);

  it("todayAt formats the time with the profile locale, as the store did", () => {
    profile.locale = "tr";
    const trTime = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    expect(getDhikrStoreText().todayAt(now)).toBe(`focus:relativeDate.todayAt|${JSON.stringify({ time: trTime })}`);

    profile.locale = "en";
    const enTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    expect(getDhikrStoreText().todayAt(now)).toBe(`focus:relativeDate.todayAt|${JSON.stringify({ time: enTime })}`);
  });

  it("saved/notStarted use the same i18n keys", () => {
    expect(getDhikrStoreText().saved()).toBe("focus:relativeDate.saved");
    expect(getDhikrStoreText().notStarted()).toBe("focus:relativeDate.notStarted");
  });

  it("lowercase follows the profile locale (tr dotted/dotless i)", () => {
    profile.locale = "tr";
    expect(getDhikrStoreText().lowercase("IŞIK İ")).toBe("ışık i");
    profile.locale = "en";
    expect(getDhikrStoreText().lowercase("I")).toBe("i");
  });
});
