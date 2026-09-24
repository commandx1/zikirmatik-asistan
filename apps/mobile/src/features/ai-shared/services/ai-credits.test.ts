import { describe, expect, it, vi } from "vitest";
import { hasEnoughCredits, normalizeRemainingCredits, pollUntil, resolveCreditsFromQuota } from "./ai-credits";

describe("resolveCreditsFromQuota", () => {
  it("premium → sınırsız bakiye", () => {
    expect(resolveCreditsFromQuota({ used: 5, limit: 3, isPremium: true })).toEqual({
      balance: Number.MAX_SAFE_INTEGER,
      isPremium: true
    });
  });
  it("ücretsiz → limit - used, 0'ın altına inmez", () => {
    expect(resolveCreditsFromQuota({ used: 1, limit: 3, isPremium: false })).toEqual({ balance: 2, isPremium: false });
    expect(resolveCreditsFromQuota({ used: 5, limit: 3, isPremium: false }).balance).toBe(0);
  });
  it("limit null → 1 sayılır", () => {
    expect(resolveCreditsFromQuota({ used: 0, limit: null, isPremium: false }).balance).toBe(1);
    expect(resolveCreditsFromQuota({ used: 1, limit: null, isPremium: false }).balance).toBe(0);
  });
});

describe("hasEnoughCredits", () => {
  it("eşik 1 (Rehber/Sohbet) = balance > 0", () => {
    expect(hasEnoughCredits({ balance: 0, isPremium: false, requiredCredits: 1 })).toBe(false);
    expect(hasEnoughCredits({ balance: 1, isPremium: false, requiredCredits: 1 })).toBe(true);
  });
  it("eşik 3 (Vird) = balance >= 3", () => {
    expect(hasEnoughCredits({ balance: 2, isPremium: false, requiredCredits: 3 })).toBe(false);
    expect(hasEnoughCredits({ balance: 3, isPremium: false, requiredCredits: 3 })).toBe(true);
  });
  it("premium bakiyeden bağımsız geçer", () => {
    expect(hasEnoughCredits({ balance: 0, isPremium: true, requiredCredits: 3 })).toBe(true);
  });
});

describe("normalizeRemainingCredits", () => {
  it("tabana yuvarlar, negatifi 0'a çeker", () => {
    expect(normalizeRemainingCredits(2.9)).toBe(2);
    expect(normalizeRemainingCredits(-4)).toBe(0);
  });
  it("sonlu sayı değilse undefined", () => {
    expect(normalizeRemainingCredits(Number.NaN)).toBeUndefined();
    expect(normalizeRemainingCredits(Number.POSITIVE_INFINITY)).toBeUndefined();
    expect(normalizeRemainingCredits("3")).toBeUndefined();
    expect(normalizeRemainingCredits(undefined)).toBeUndefined();
  });
});

describe("pollUntil", () => {
  it("ilk deneme beklemeden, başarıda erken durur", async () => {
    const sleep = vi.fn(async () => {});
    const check = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await expect(pollUntil(check, { sleep })).resolves.toBe(true);
    expect(check).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledWith(2000);
  });
  it("8 denemede tükenir → false, 7 bekleme", async () => {
    const sleep = vi.fn(async () => {});
    const check = vi.fn().mockResolvedValue(false);
    await expect(pollUntil(check, { sleep })).resolves.toBe(false);
    expect(check).toHaveBeenCalledTimes(8);
    expect(sleep).toHaveBeenCalledTimes(7);
  });
  it("check fırlatırsa durur ve false döner", async () => {
    const sleep = vi.fn(async () => {});
    const check = vi.fn().mockResolvedValueOnce(false).mockRejectedValueOnce(new Error("net"));
    await expect(pollUntil(check, { sleep })).resolves.toBe(false);
    expect(check).toHaveBeenCalledTimes(2);
  });
});
