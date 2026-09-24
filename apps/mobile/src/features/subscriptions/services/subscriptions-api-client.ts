import { i18n } from "../../../i18n";
import { ApiError, request } from "../../../lib/http/client";

type SubscriptionProvider = "apple" | "google";
type SubscriptionStatus = "active" | "expired" | "cancelled";
type SubscriptionPlan = "free" | "premium";

export type CreateSubscriptionPayload = {
  userId: string;
  plan: SubscriptionPlan;
  provider: SubscriptionProvider;
  status: SubscriptionStatus;
  productId: string;
  startDate: string;
  endDate: string;
};

export type SyncSubscriptionPayload = {
  hasActivePremiumEntitlement?: boolean;
  provider?: SubscriptionProvider;
};

export const SubscriptionsApiError = ApiError;
export type SubscriptionsApiError = ApiError;

const errors = () => ({
  failed: i18n.t("subscriptions:errors.requestFailed"),
  unreachable: i18n.t("subscriptions:errors.serverUnreachable")
});

export async function createSubscription(payload: CreateSubscriptionPayload) {
  return request<unknown>("/v1/subscriptions", {
    method: "POST",
    body: payload,
    auth: true,
    errors: errors()
  });
}

export async function syncSubscriptionForUser(
  userId: string,
  payload: SyncSubscriptionPayload = {}
): Promise<{ userId: string; isPremium: boolean }> {
  return request(`/v1/subscriptions/sync-user/${userId}`, {
    method: "POST",
    body: payload,
    auth: true,
    errors: errors()
  });
}
