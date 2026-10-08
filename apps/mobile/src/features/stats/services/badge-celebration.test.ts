import { describe, expect, it } from "vitest";
import type { StatsBadge } from "@zikirmatik/shared";
import {
  canShowBadgeCelebration,
  enqueueBadges,
  evaluateBadgeCelebration,
  resolveCelebrationBadges,
  resolveBadgeDataOwner,
  selectNewlyAchievedBadges,
  shouldSkipReviewForDay7Offer
} from "./badge-celebration";

function makeBadge(overrides: Partial<StatsBadge>): StatsBadge {
  return { key: "k", label: "L", achieved: false, progress: 0, ...overrides };
}

describe("selectNewlyAchievedBadges", () => {
  it("returns achieved badges that have not been celebrated yet", () => {
    const badges = [
      makeBadge({ key: "count-100", achieved: true }),
      makeBadge({ key: "streak-7", achieved: false })
    ];

    expect(selectNewlyAchievedBadges(badges, [])).toEqual([badges[0]]);
  });

  it("excludes badges already in the celebrated set", () => {
    const badges = [makeBadge({ key: "count-100", achieved: true })];

    expect(selectNewlyAchievedBadges(badges, ["count-100"])).toEqual([]);
  });

  it("is idempotent: calling twice with the same celebrated set yields the same result", () => {
    const badges = [
      makeBadge({ key: "count-100", achieved: true }),
      makeBadge({ key: "count-1k", achieved: true })
    ];
    const celebrated = ["count-100"];

    const first = selectNewlyAchievedBadges(badges, celebrated);
    const second = selectNewlyAchievedBadges(badges, celebrated);

    expect(first).toEqual(second);
    expect(first.map((b) => b.key)).toEqual(["count-1k"]);
  });

  it("returns an empty array when nothing is achieved", () => {
    const badges = [makeBadge({ key: "count-100", achieved: false })];

    expect(selectNewlyAchievedBadges(badges, [])).toEqual([]);
  });
});

describe("evaluateBadgeCelebration", () => {
  const achieved = [makeBadge({ key: "count-100", achieved: true }), makeBadge({ key: "streak-7", achieved: false })];

  it("waits while data is not settled", () => {
    expect(
      evaluateBadgeCelebration({ badges: achieved, celebratedBadgeKeys: [], owner: "guest", seededForOwner: null, isDataSettled: false })
    ).toEqual({ action: "wait" });
  });

  it("waits while the owner is unknown (sign-in in flight)", () => {
    expect(
      evaluateBadgeCelebration({ badges: achieved, celebratedBadgeKeys: [], owner: null, seededForOwner: "guest", isDataSettled: true })
    ).toEqual({ action: "wait" });
  });

  it("silently seeds already-achieved badges for a never-seeded store (fresh install / upgrade)", () => {
    expect(
      evaluateBadgeCelebration({ badges: achieved, celebratedBadgeKeys: [], owner: "guest", seededForOwner: null, isDataSettled: true })
    ).toEqual({ action: "seed", owner: "guest", keysToMarkCelebrated: ["count-100"] });
  });

  it("re-seeds silently when the owner changes (guest -> signed-in user), so old badges never pop", () => {
    expect(
      evaluateBadgeCelebration({ badges: achieved, celebratedBadgeKeys: [], owner: "user-a", seededForOwner: "guest", isDataSettled: true })
    ).toEqual({ action: "seed", owner: "user-a", keysToMarkCelebrated: ["count-100"] });
  });

  it("seeds nothing for a genuinely new guest, so their first real badge still fires later", () => {
    const none = [makeBadge({ key: "count-100", achieved: false })];
    expect(
      evaluateBadgeCelebration({ badges: none, celebratedBadgeKeys: [], owner: "guest", seededForOwner: null, isDataSettled: true })
    ).toEqual({ action: "seed", owner: "guest", keysToMarkCelebrated: [] });
    expect(
      evaluateBadgeCelebration({ badges: achieved, celebratedBadgeKeys: [], owner: "guest", seededForOwner: "guest", isDataSettled: true })
    ).toEqual({ action: "celebrate", badges: [achieved[0]] });
  });

  it("celebrates only badges not celebrated yet once seeded for the same owner", () => {
    const both = [makeBadge({ key: "count-100", achieved: true }), makeBadge({ key: "streak-7", achieved: true })];
    expect(
      evaluateBadgeCelebration({ badges: both, celebratedBadgeKeys: ["count-100"], owner: "user-a", seededForOwner: "user-a", isDataSettled: true })
    ).toEqual({ action: "celebrate", badges: [both[1]] });
  });
});

describe("rozet kuyruğu uygulama öldürülünce (MOB-ROZ-08)", () => {
  it("gösterilmeden (celebrated'a yazılmadan) kalan rozet yeniden açılışta tekrar celebrate döner", () => {
    const badges = [makeBadge({ key: "count-100", achieved: true })];
    const params = { badges, celebratedBadgeKeys: [], owner: "guest", seededForOwner: "guest", isDataSettled: true } as const;
    const firstRun = evaluateBadgeCelebration(params);
    // Kuyruk yalnız React state'inde; gösterilene kadar kalıcı store'a yazılmaz → "yeniden açılış" aynı girdidir.
    const afterRestart = evaluateBadgeCelebration(params);
    expect(firstRun).toEqual({ action: "celebrate", badges });
    expect(afterRestart).toEqual(firstRun);
  });
});

describe("resolveBadgeDataOwner", () => {
  it("maps auth state to the data owner", () => {
    expect(resolveBadgeDataOwner("signed_out", undefined)).toBe("guest");
    expect(resolveBadgeDataOwner("authenticated", "user-a")).toBe("user-a");
    expect(resolveBadgeDataOwner("authenticating", "user-a")).toBeNull();
    expect(resolveBadgeDataOwner("authenticated", undefined)).toBeNull();
  });
});

describe("resolveCelebrationBadges", () => {
  const local = [makeBadge({ key: "count-100", achieved: true })];
  const server = [makeBadge({ key: "count-1k", achieved: true })];
  const base = { storesHydrated: true, localBadges: local, serverBadges: undefined };

  it("guest uses the local badges once the persisted stores are restored", () => {
    expect(resolveCelebrationBadges({ ...base, authStatus: "signed_out", serverBadges: server })).toBe(local);
    expect(resolveCelebrationBadges({ ...base, authStatus: "signed_out", storesHydrated: false })).toBeNull();
  });

  it("never settles mid sign-in", () => {
    expect(resolveCelebrationBadges({ ...base, authStatus: "authenticating", serverBadges: server })).toBeNull();
  });

  it("member uses the server badges and waits (never falls back to local) until they load", () => {
    expect(resolveCelebrationBadges({ ...base, authStatus: "authenticated" })).toBeNull();
    expect(resolveCelebrationBadges({ ...base, authStatus: "authenticated", serverBadges: server })).toBe(server);
  });
});

describe("canShowBadgeCelebration", () => {
  const ok = { isCounterIdle: true, pathname: "/home", isHomeOverlayOpen: false };

  it("shows on an idle home or stats tab with no home overlay", () => {
    expect(canShowBadgeCelebration(ok)).toBe(true);
    expect(canShowBadgeCelebration({ ...ok, pathname: "/stats" })).toBe(true);
  });

  it("holds while the counter is still being tapped", () => {
    expect(canShowBadgeCelebration({ ...ok, isCounterIdle: false })).toBe(false);
  });

  it("holds on any other route", () => {
    expect(canShowBadgeCelebration({ ...ok, pathname: "/vird/session" })).toBe(false);
    expect(canShowBadgeCelebration({ ...ok, pathname: "/circle/session" })).toBe(false);
  });

  it("holds while a home overlay is open", () => {
    expect(canShowBadgeCelebration({ ...ok, isHomeOverlayOpen: true })).toBe(false);
  });
});

describe("shouldSkipReviewForDay7Offer", () => {
  it("skips when the day-7 offer is still due (non-premium, streak >= 7, never shown)", () => {
    expect(shouldSkipReviewForDay7Offer({ isPremium: false, streak: 7, day7OfferShownAt: null })).toBe(true);
  });

  it("does not skip once the offer was already shown", () => {
    expect(
      shouldSkipReviewForDay7Offer({ isPremium: false, streak: 7, day7OfferShownAt: "2026-01-01T00:00:00.000Z" })
    ).toBe(false);
  });

  it("does not skip for a premium user", () => {
    expect(shouldSkipReviewForDay7Offer({ isPremium: true, streak: 7, day7OfferShownAt: null })).toBe(false);
  });

  it("does not skip when the streak has not reached 7", () => {
    expect(shouldSkipReviewForDay7Offer({ isPremium: false, streak: 6, day7OfferShownAt: null })).toBe(false);
  });
});

describe("enqueueBadges", () => {
  it("dedupes by key and keeps the same reference when nothing is new", () => {
    const queue = [makeBadge({ key: "count-100", achieved: true })];
    expect(enqueueBadges(queue, [makeBadge({ key: "count-100", achieved: true })])).toBe(queue);
    expect(enqueueBadges(queue, [makeBadge({ key: "count-1k", achieved: true })]).map((b) => b.key)).toEqual([
      "count-100",
      "count-1k"
    ]);
  });
});
