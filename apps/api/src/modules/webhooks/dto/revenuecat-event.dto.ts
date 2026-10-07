// RevenueCat webhook event türleri:
// - EXPIRATION → premium bitti (yalnız olaydan ÖNCE verilmiş dönemler — sırasız teslim)
// - BILLING_ISSUE → premium DÜŞMEZ (A-09); grace bitişi endDate'e yazılır
// - INITIAL_PURCHASE / RENEWAL / UNCANCELLATION → premium aktif
// - CANCELLATION → iptal edildi ama süre dolmadı, EXPIRATION bekle. İade
//   (cancel_reason CUSTOMER_SUPPORT) kredi paketindeyse kredi geri alınır (A-10).
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
  | 'NON_RENEWING_PURCHASE';

export type RevenueCatStore = 'APP_STORE' | 'PLAY_STORE' | 'STRIPE';

export type RevenueCatEvent = {
  id?: string;
  type: string;
  app_user_id: string;
  original_app_user_id: string;
  product_id: string;
  transaction_id?: string;
  store: string;
  purchased_at_ms?: number;
  expiration_at_ms?: number;
  // Tüm olaylarda var (RC docs: event-types-and-fields).
  event_timestamp_ms?: number;
  // Yalnız BILLING_ISSUE; null olabilir.
  grace_period_expiration_at_ms?: number | null;
  // Yalnız CANCELLATION / EXPIRATION. İade = CUSTOMER_SUPPORT.
  cancel_reason?: string;
  environment?: string;
  entitlement_ids?: string[];
};

export type RevenueCatWebhookPayload = {
  api_version: string;
  event: RevenueCatEvent;
};
