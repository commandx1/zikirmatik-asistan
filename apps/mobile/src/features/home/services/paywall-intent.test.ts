import { describe, expect, it } from "vitest";
import { decidePaywallIntent } from "./paywall-intent";

const base = { authStatus: "authenticated", guestMode: false, premiumFresh: true, isPremium: false } as const;

describe("decidePaywallIntent (MOB-PRM-13)", () => {
  it("üyede premium tazelenene kadar bekler (eski yerel isPremium=true olsa da)", () => {
    expect(decidePaywallIntent({ ...base, premiumFresh: false, isPremium: false })).toBe("wait");
    expect(decidePaywallIntent({ ...base, premiumFresh: false, isPremium: true })).toBe("wait");
  });
  it("taze + premium: asla göstermez", () => {
    expect(decidePaywallIntent({ ...base, isPremium: true })).toBe("drop");
  });
  it("taze + ücretsiz: gösterir", () => {
    expect(decidePaywallIntent(base)).toBe("show");
  });
  it("misafir gösterir; oturum geri yüklenirken/giriş sürerken bekler", () => {
    expect(decidePaywallIntent({ ...base, authStatus: "signed_out", guestMode: true, premiumFresh: false })).toBe("show");
    expect(decidePaywallIntent({ ...base, authStatus: "signed_out", guestMode: false, premiumFresh: false })).toBe("wait");
    expect(decidePaywallIntent({ ...base, authStatus: "authenticating" })).toBe("wait");
  });
});
