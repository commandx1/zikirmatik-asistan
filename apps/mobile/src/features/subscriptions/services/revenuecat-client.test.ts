import { beforeEach, describe, expect, it, vi } from "vitest";

const purchases = vi.hoisted(() => ({
  configure: vi.fn(),
  setLogLevel: vi.fn(),
  logIn: vi.fn(),
  getOfferings: vi.fn(),
  purchasePackage: vi.fn(),
  getCustomerInfo: vi.fn(),
  invalidateCustomerInfoCache: vi.fn(),
  getProducts: vi.fn(),
  purchaseStoreProduct: vi.fn()
}));
vi.mock("react-native-purchases", () => ({
  default: purchases,
  LOG_LEVEL: { DEBUG: "DEBUG" },
  PRODUCT_CATEGORY: { NON_SUBSCRIPTION: "NON_SUBSCRIPTION" },
  PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: "1" }
}));

const env = vi.hoisted(() => ({
  REVENUECAT_ENTITLEMENT_ID: undefined as string | undefined,
  REVENUECAT_API_KEY_IOS: "ios-key" as string | undefined,
  REVENUECAT_API_KEY_ANDROID: "android-key" as string | undefined
}));
vi.mock("../../../lib/env", () => env);

const api = vi.hoisted(() => {
  class SubscriptionsApiError extends Error {
    constructor(
      public readonly kind: string,
      message: string
    ) {
      super(message);
    }
  }
  return { createSubscription: vi.fn(), syncSubscriptionForUser: vi.fn(), SubscriptionsApiError };
});
vi.mock("./subscriptions-api-client", () => api);

type Mod = typeof import("./revenuecat-client");
let mod: Mod;

// Modül durumu (isConfigured/configuredAppUserId) testler arasında sızmasın.
async function load(platform: "ios" | "android" = "ios"): Promise<Mod> {
  vi.resetModules();
  vi.doMock("react-native", () => ({ Platform: { OS: platform } }));
  return import("./revenuecat-client");
}

const pkg = (identifier: string, packageType: string, priceString = "1") => ({
  identifier,
  packageType,
  product: { priceString }
});
const offerings = (...packages: ReturnType<typeof pkg>[]) => ({ current: { availablePackages: packages } });
const entitlementInfo = (active: Record<string, unknown>, latestExpirationDate: string | null = null) => ({
  entitlements: { active },
  latestExpirationDate
});

beforeEach(async () => {
  Object.values(purchases).forEach((fn) => fn.mockReset());
  api.createSubscription.mockReset().mockResolvedValue({});
  api.syncSubscriptionForUser.mockReset().mockResolvedValue({ userId: "u1", isPremium: true });
  env.REVENUECAT_API_KEY_IOS = "ios-key";
  env.REVENUECAT_API_KEY_ANDROID = "android-key";
  env.REVENUECAT_ENTITLEMENT_ID = undefined;
  vi.stubGlobal("__DEV__", false);
  mod = await load();
});

describe("toRevenueCatMessage", () => {
  it("kullanıcı iptali sessizdir (mesaj yok)", () => {
    expect(mod.toRevenueCatMessage({ code: "1" })).toBeUndefined();
  });

  it("kendi hata türlerinin mesajını aynen taşır", () => {
    expect(mod.toRevenueCatMessage(new mod.RevenueCatClientError("terminal", "paketler hazır değil"))).toBe(
      "paketler hazır değil"
    );
    expect(mod.toRevenueCatMessage(new api.SubscriptionsApiError("transient", "sunucu yok"))).toBe("sunucu yok");
  });

  it("mağaza/ağ gibi diğer her hata genel satın alma hatasına döner", () => {
    expect(mod.toRevenueCatMessage({ code: "2" })).toBe("subscriptions:errors.purchaseFailed");
    expect(mod.toRevenueCatMessage(new Error("network"))).toBe("subscriptions:errors.purchaseFailed");
    expect(mod.toRevenueCatMessage("düz metin")).toBe("subscriptions:errors.purchaseFailed");
    expect(mod.toRevenueCatMessage(null)).toBe("subscriptions:errors.purchaseFailed");
  });
});

describe("yapılandırma", () => {
  it("anahtar yokken satın alma 'terminal' hatadır ve SDK'ya dokunulmaz (iOS/Android mesajı ayrı)", async () => {
    env.REVENUECAT_API_KEY_IOS = undefined;
    const ios = await load("ios");
    expect(ios.isRevenueCatConfigured()).toBe(false);
    await expect(ios.purchasePremiumWithRevenueCat("u1")).rejects.toMatchObject({
      kind: "terminal",
      message: "subscriptions:errors.apiKeyMissingIos"
    });
    env.REVENUECAT_API_KEY_ANDROID = undefined;
    const android = await load("android");
    expect(android.isRevenueCatConfigured()).toBe(false);
    await expect(android.syncPremiumStatusWithRevenueCat("u1")).rejects.toMatchObject({
      message: "subscriptions:errors.apiKeyMissingAndroid"
    });
    expect(purchases.configure).not.toHaveBeenCalled();
    expect(api.syncSubscriptionForUser).not.toHaveBeenCalled();
  });

  it("platforma uygun anahtarla bir kez yapılandırılır; aynı kullanıcıda logIn yok, farklı kullanıcıda logIn", async () => {
    const android = await load("android");
    expect(android.isRevenueCatConfigured()).toBe(true);
    purchases.getCustomerInfo.mockResolvedValue(entitlementInfo({}));
    await android.syncPremiumStatusWithRevenueCat("u1");
    await android.syncPremiumStatusWithRevenueCat("u1");
    expect(purchases.configure).toHaveBeenCalledTimes(1);
    expect(purchases.configure).toHaveBeenCalledWith({ apiKey: "android-key", appUserID: "u1" });
    expect(purchases.logIn).not.toHaveBeenCalled();
    await android.syncPremiumStatusWithRevenueCat("u2");
    expect(purchases.logIn).toHaveBeenCalledWith("u2");
    expect(purchases.configure).toHaveBeenCalledTimes(1);
  });

  it("geliştirme modunda ilk yapılandırmada log seviyesi DEBUG yapılır", async () => {
    vi.stubGlobal("__DEV__", true);
    purchases.getCustomerInfo.mockResolvedValue(entitlementInfo({}));
    await mod.syncPremiumStatusWithRevenueCat("u1");
    expect(purchases.setLogLevel).toHaveBeenCalledWith("DEBUG");
  });
});

describe("satın alma", () => {
  it("paket yoksa 'terminal' packagesNotReady; satın alma denenmez", async () => {
    purchases.getOfferings.mockResolvedValue({ current: null });
    await expect(mod.purchasePremiumWithRevenueCat("u1")).rejects.toMatchObject({
      kind: "terminal",
      message: "subscriptions:errors.packagesNotReady"
    });
    purchases.getOfferings.mockResolvedValue(offerings());
    await expect(mod.purchasePremiumWithRevenueCat("u1")).rejects.toMatchObject({ kind: "terminal" });
    expect(purchases.purchasePackage).not.toHaveBeenCalled();
  });

  it("varsayılan yıllık paketi seçer; başarıda sunucuya abonelik yazılır ve premium senkronlanır", async () => {
    purchases.getOfferings.mockResolvedValue(offerings(pkg("$rc_monthly", "MONTHLY"), pkg("$rc_annual", "ANNUAL")));
    purchases.purchasePackage.mockResolvedValue({
      customerInfo: entitlementInfo({
        premium: { productIdentifier: "yearly_x", latestPurchaseDate: "2026-10-01T00:00:00Z", expirationDate: "2027-10-01T00:00:00Z" }
      })
    });
    const result = await mod.purchasePremiumWithRevenueCat("u1");
    expect(purchases.purchasePackage.mock.calls[0]![0].identifier).toBe("$rc_annual");
    expect(api.createSubscription).toHaveBeenCalledWith({
      userId: "u1",
      plan: "premium",
      provider: "apple",
      status: "active",
      productId: "yearly_x",
      startDate: "2026-10-01T00:00:00Z",
      endDate: "2027-10-01T00:00:00Z"
    });
    expect(api.syncSubscriptionForUser).toHaveBeenCalledWith("u1", { hasActivePremiumEntitlement: true, provider: "apple" });
    expect(result).toEqual({ isPremium: true });
  });

  it("aylık tercih aylık paketi seçer; eşleşme yoksa ilk pakete düşer", async () => {
    purchases.getOfferings.mockResolvedValue(offerings(pkg("$rc_annual", "ANNUAL"), pkg("$rc_monthly", "MONTHLY")));
    purchases.purchasePackage.mockResolvedValue({ customerInfo: entitlementInfo({}) });
    await mod.purchasePremiumWithRevenueCat("u1", "monthly");
    expect(purchases.purchasePackage.mock.calls[0]![0].identifier).toBe("$rc_monthly");
    purchases.purchasePackage.mockClear();
    purchases.getOfferings.mockResolvedValue(offerings(pkg("lifetime", "LIFETIME")));
    await mod.purchasePremiumWithRevenueCat("u1", "annual");
    expect(purchases.purchasePackage.mock.calls[0]![0].identifier).toBe("lifetime");
  });

  it("mağaza hatası (iptal dahil) olduğu gibi yukarı çıkar; sunucuya hiçbir şey yazılmaz", async () => {
    purchases.getOfferings.mockResolvedValue(offerings(pkg("$rc_annual", "ANNUAL")));
    purchases.purchasePackage.mockRejectedValue({ code: "1" });
    await expect(mod.purchasePremiumWithRevenueCat("u1")).rejects.toEqual({ code: "1" });
    expect(api.createSubscription).not.toHaveBeenCalled();
    expect(api.syncSubscriptionForUser).not.toHaveBeenCalled();
  });

  it("android'de sağlayıcı 'google'", async () => {
    const android = await load("android");
    purchases.getCustomerInfo.mockResolvedValue(entitlementInfo({ premium: {} }));
    await android.syncPremiumStatusWithRevenueCat("u1");
    expect(api.createSubscription).toHaveBeenCalledWith(expect.objectContaining({ provider: "google" }));
  });
});

describe("premium senkronu / geri yükleme", () => {
  it("aktif hak yok → abonelik yazılmaz, sunucuya hasActivePremiumEntitlement:false gider (sunucu süresini bitirir)", async () => {
    purchases.getCustomerInfo.mockResolvedValue(entitlementInfo({}));
    api.syncSubscriptionForUser.mockResolvedValue({ userId: "u1", isPremium: false });
    await expect(mod.syncPremiumStatusWithRevenueCat("u1")).resolves.toEqual({ isPremium: false });
    expect(api.createSubscription).not.toHaveBeenCalled();
    expect(api.syncSubscriptionForUser).toHaveBeenCalledWith("u1", { hasActivePremiumEntitlement: false, provider: "apple" });
  });

  it("refreshCustomerInfo önbelleği geçersiz kılar", async () => {
    purchases.getCustomerInfo.mockResolvedValue(entitlementInfo({}));
    await mod.syncPremiumStatusWithRevenueCat("u1", { refreshCustomerInfo: true });
    await mod.syncPremiumStatusWithRevenueCat("u1");
    expect(purchases.invalidateCustomerInfoCache).toHaveBeenCalledTimes(1);
  });

  it("SDK veya sunucu hatası senkronda yukarı çıkar", async () => {
    purchases.getCustomerInfo.mockRejectedValue(new Error("sdk"));
    await expect(mod.syncPremiumStatusWithRevenueCat("u1")).rejects.toThrow("sdk");
    purchases.getCustomerInfo.mockResolvedValue(entitlementInfo({ premium: {} }));
    api.createSubscription.mockRejectedValue(new api.SubscriptionsApiError("transient", "down"));
    await expect(mod.syncPremiumStatusWithRevenueCat("u1")).rejects.toMatchObject({ message: "down" });
    expect(api.syncSubscriptionForUser).not.toHaveBeenCalled();
  });

  it("yapılandırılmış hak kimliği yoksa ilk aktif hak kullanılır; eksik tarihlerde varsayılanlar üretilir", async () => {
    purchases.getCustomerInfo.mockResolvedValue(
      entitlementInfo({ other: { productIdentifier: "  ", latestPurchaseDate: "", expirationDate: "" } }, "2027-01-01T00:00:00Z")
    );
    await mod.syncPremiumStatusWithRevenueCat("u1");
    const payload = api.createSubscription.mock.calls[0]![0];
    expect(payload.productId).toBe("revenuecat_premium");
    expect(payload.endDate).toBe("2027-01-01T00:00:00Z");
    expect(Number.isNaN(Date.parse(payload.startDate))).toBe(false);
  });

  it("hiç tarih yoksa bitiş bir ay sonrasına düşer; null hak değerleri yok sayılır", async () => {
    purchases.getCustomerInfo.mockResolvedValue(entitlementInfo({ x: null, premium: { productIdentifier: "p" } }));
    await mod.syncPremiumStatusWithRevenueCat("u1");
    const { startDate, endDate } = api.createSubscription.mock.calls[0]![0];
    const days = (Date.parse(endDate) - Date.parse(startDate)) / 86_400_000;
    expect(days).toBeGreaterThanOrEqual(27);
    expect(days).toBeLessThanOrEqual(32);
  });

  it("özel hak kimliği (REVENUECAT_ENTITLEMENT_ID) önceliklidir", async () => {
    env.REVENUECAT_ENTITLEMENT_ID = "pro";
    const custom = await load();
    purchases.getCustomerInfo.mockResolvedValue(
      entitlementInfo({ premium: { productIdentifier: "a" }, pro: { productIdentifier: "b" } })
    );
    await custom.syncPremiumStatusWithRevenueCat("u1");
    expect(api.createSubscription.mock.calls[0]![0].productId).toBe("b");
  });
});

describe("fiyatlar", () => {
  it("aylık ve yıllık fiyatı döner", async () => {
    purchases.getOfferings.mockResolvedValue(offerings(pkg("$rc_monthly", "MONTHLY", "9,99 TL"), pkg("$rc_annual", "ANNUAL", "79,99 TL")));
    await expect(mod.fetchSubscriptionPrices("u1")).resolves.toEqual({ monthly: "9,99 TL", yearly: "79,99 TL" });
  });

  it("belirsiz durumlarda (tek paket, paket yok, SDK hatası, anahtar yok) boş obje döner, hata fırlatmaz", async () => {
    purchases.getOfferings.mockResolvedValue(offerings(pkg("only", "LIFETIME")));
    await expect(mod.fetchSubscriptionPrices("u1")).resolves.toEqual({});
    purchases.getOfferings.mockResolvedValue({ current: null });
    await expect(mod.fetchSubscriptionPrices("u1")).resolves.toEqual({});
    purchases.getOfferings.mockRejectedValue(new Error("x"));
    await expect(mod.fetchSubscriptionPrices("u1")).resolves.toEqual({});
    env.REVENUECAT_API_KEY_IOS = undefined;
    const noKey = await load();
    await expect(noKey.fetchSubscriptionPrices("u1")).resolves.toEqual({});
  });
});

describe("kredi paketleri", () => {
  it("tanımlı ürünleri kredi miktarıyla eşler, bilinmeyenleri eler, krediye göre sıralar", async () => {
    purchases.getProducts.mockResolvedValue([
      { identifier: "topuplarge", priceString: "4,99" },
      { identifier: "mystery", priceString: "1" },
      { identifier: "topupsmall", priceString: "0,99" },
      { identifier: "topupmedium", priceString: "2,49" }
    ]);
    const products = await mod.getCreditTopupProducts("u1");
    expect(products).toEqual([
      { productId: "topupsmall", credits: 10, priceString: "0,99" },
      { productId: "topupmedium", credits: 30, priceString: "2,49" },
      { productId: "topuplarge", credits: 75, priceString: "4,99" }
    ]);
    expect(purchases.getProducts).toHaveBeenCalledWith(["topupsmall", "topupmedium", "topuplarge"], "NON_SUBSCRIPTION");
  });

  it("satın alma: eşleşen ürünü alır; eşleşme yoksa dönenin ilkini; hiç ürün yoksa topupNotFound", async () => {
    purchases.getProducts.mockResolvedValue([{ identifier: "a" }, { identifier: "topupsmall" }]);
    await mod.purchaseCreditTopup("u1", "topupsmall");
    expect(purchases.purchaseStoreProduct).toHaveBeenLastCalledWith({ identifier: "topupsmall" });
    purchases.getProducts.mockResolvedValue([{ identifier: "a" }]);
    await mod.purchaseCreditTopup("u1", "topupsmall");
    expect(purchases.purchaseStoreProduct).toHaveBeenLastCalledWith({ identifier: "a" });
    purchases.purchaseStoreProduct.mockClear();
    purchases.getProducts.mockResolvedValue([]);
    await expect(mod.purchaseCreditTopup("u1", "topupsmall")).rejects.toMatchObject({
      kind: "terminal",
      message: "subscriptions:errors.topupNotFound"
    });
    expect(purchases.purchaseStoreProduct).not.toHaveBeenCalled();
  });
});
