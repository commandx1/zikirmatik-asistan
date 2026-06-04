// RevenueCat webhook event türleri:
// - EXPIRATION / BILLING_ISSUE → premium bitti
// - INITIAL_PURCHASE / RENEWAL / UNCANCELLATION → premium aktif
// - CANCELLATION → iptal edildi ama süre dolmadı, EXPIRATION bekle
// Diğerleri (TEST, TRANSFER, PRODUCT_CHANGE, vb.) görmezden gelinir.

export type RevenueCatEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'PRODUCT_CHANGE'
  | 'SUBSCRIPTION_PAUSED'
  | 'TRANSFER'
  | 'TEST'
  | 'NON_SUBSCRIPTION_PURCHASE'
  | string;

export type RevenueCatStore = 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | string;

export type RevenueCatEvent = {
  type: RevenueCatEventType;
  app_user_id: string;
  original_app_user_id: string;
  product_id: string;
  store: RevenueCatStore;
  purchased_at_ms?: number;
  expiration_at_ms?: number;
  environment?: string;
  entitlement_ids?: string[];
};

export type RevenueCatWebhookPayload = {
  api_version: string;
  event: RevenueCatEvent;
};
