import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage
} from "react-native-purchases";
import {
  createSubscription,
  SubscriptionsApiError,
  syncSubscriptionForUser
} from "./subscriptions-api-client";

type PreferredPackage = "annual" | "monthly";

type PremiumSyncResult = {
  isPremium: boolean;
};

export class RevenueCatClientError extends Error {
  constructor(
    public readonly kind: "transient" | "terminal",
    message: string
  ) {
    super(message);
    this.name = "RevenueCatClientError";
  }
}

const REVENUECAT_ENTITLEMENT = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim() || "premium";

let isConfigured = false;
let configuredAppUserId: string | null = null;

export async function purchasePremiumWithRevenueCat(
  userId: string,
  accessToken: string | undefined,
  preferredPackage: PreferredPackage = "annual"
): Promise<PremiumSyncResult> {
  await ensureRevenueCatConfigured(userId);

  const offerings = await Purchases.getOfferings();
  const offering = offerings.current;
  if (!offering || offering.availablePackages.length === 0) {
    throw new RevenueCatClientError("terminal", "Satın alma paketleri henüz hazır değil.");
  }

  const selectedPackage = pickPackage(offering.availablePackages, preferredPackage);
  const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
  return syncBackendFromCustomerInfo(userId, accessToken, customerInfo);
}

export async function syncPremiumStatusWithRevenueCat(
  userId: string,
  accessToken: string | undefined,
  options: { refreshCustomerInfo?: boolean } = {}
): Promise<PremiumSyncResult> {
  await ensureRevenueCatConfigured(userId);
  if (options.refreshCustomerInfo) {
    await Purchases.invalidateCustomerInfoCache();
  }
  const customerInfo = await Purchases.getCustomerInfo();
  return syncBackendFromCustomerInfo(userId, accessToken, customerInfo);
}

async function ensureRevenueCatConfigured(appUserId: string) {
  const apiKey = resolveRevenueCatApiKey();

  if (!isConfigured) {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    Purchases.configure({ apiKey, appUserID: appUserId });
    isConfigured = true;
    configuredAppUserId = appUserId;
    return;
  }

  if (configuredAppUserId && configuredAppUserId !== appUserId) {
    await Purchases.logIn(appUserId);
    configuredAppUserId = appUserId;
  }
}

function resolveRevenueCatApiKey() {
  const key =
    Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS?.trim()
      : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID?.trim();

  if (!key) {
    throw new RevenueCatClientError(
      "terminal",
      Platform.OS === "ios"
        ? "EXPO_PUBLIC_REVENUECAT_API_KEY_IOS tanımlı değil."
        : "EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID tanımlı değil."
    );
  }

  return key;
}

export function isRevenueCatConfigured() {
  const key =
    Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS?.trim()
      : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID?.trim();

  return Boolean(key);
}

function pickPackage(availablePackages: PurchasesPackage[], preferredPackage: PreferredPackage) {
  const normalizedPreferred = preferredPackage === "annual" ? "annual" : "monthly";
  const preferred = availablePackages.find((item) => {
    const identifier = item.identifier.toLocaleLowerCase("en-US");
    const packageType = item.packageType.toLocaleLowerCase("en-US");
    if (normalizedPreferred === "annual") {
      return identifier.includes("annual") || identifier.includes("year") || packageType === "annual";
    }
    return identifier.includes("month") || packageType === "monthly";
  });

  return preferred ?? availablePackages[0];
}

async function syncBackendFromCustomerInfo(
  userId: string,
  accessToken: string | undefined,
  customerInfo: CustomerInfo
): Promise<PremiumSyncResult> {
  const activeEntitlement = resolveActiveEntitlement(customerInfo);

  const provider = Platform.OS === "ios" ? "apple" : "google";

  if (activeEntitlement) {
    const productId = asString(activeEntitlement.productIdentifier) || "revenuecat_premium";
    const purchaseDate = asString(activeEntitlement.latestPurchaseDate) || new Date().toISOString();
    const expirationDate =
      asString(activeEntitlement.expirationDate) ||
      customerInfo.latestExpirationDate ||
      oneMonthLaterIso();

    await createSubscription(
      {
        userId,
        plan: "premium",
        provider,
        status: "active",
        productId,
        startDate: purchaseDate,
        endDate: expirationDate
      },
      accessToken
    );
  }

  const synced = await syncSubscriptionForUser(userId, accessToken, {
    hasActivePremiumEntitlement: Boolean(activeEntitlement),
    provider
  });
  return { isPremium: synced.isPremium };
}

function resolveActiveEntitlement(customerInfo: {
  entitlements?: { active?: Record<string, unknown> };
}) {
  const active = customerInfo.entitlements?.active ?? {};
  const fromConfigured = active[REVENUECAT_ENTITLEMENT];
  if (fromConfigured && typeof fromConfigured === "object") {
    return fromConfigured as Record<string, unknown>;
  }

  const firstActive = Object.values(active).find((item) => item && typeof item === "object");
  return (firstActive as Record<string, unknown> | undefined) ?? null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function oneMonthLaterIso() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

export function toRevenueCatMessage(error: unknown): string | undefined {
  if (error instanceof RevenueCatClientError || error instanceof SubscriptionsApiError) {
    return error.message;
  }

  if (typeof error === "object" && error && "code" in error) {
    const code = (error as { code?: string | number }).code;
    if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return undefined;
    }
  }

  return "Satın alma işlemi tamamlanamadı. Lütfen tekrar dene.";
}
