// Sunucu tetikli push kampanyaları — paylaşılan tipler.
//
// Uç nokta: POST /internal/campaigns/:campaign (bkz. push-campaigns.controller.ts).
// Akış: her kampanya kendi aday listesini üretir (CampaignBuildResult),
// push-campaigns.service.ts bu adayları sessiz saat + dedupe (push_dispatches)
// kurallarından geçirip gönderir ve CampaignRunResult döner.

export type CampaignKey =
  | 'winback'
  | 'kandil-eve'
  | 'kandil-day'
  | 'weekly-summary';

export const CAMPAIGN_KEYS: CampaignKey[] = [
  'winback',
  'kandil-eve',
  'kandil-day',
  'weekly-summary',
];

/** Gönderime hazır tek bir aday (bir cihaz + kişiselleştirilmiş metin). */
export type CampaignCandidate = {
  deviceId: string;
  // Kampanya kurucuları (campaign builder) her zaman bir değer atar; cihazda
  // token yoksa boş string ('') kullanılır ve dispatch döngüsü bunu savunma
  // amaçlı `skipped.noToken` olarak eler (aday sorguları zaten yalnız token'lı
  // cihazları döndürür, bkz. her *.campaign.ts).
  expoPushToken: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  // push_dispatches.meta içine aynen yazılır (ör. winback penceresi, kandil id'si).
  meta?: Record<string, unknown>;
};

/** Bir kampanyanın aday üretim adımının çıktısı. */
export type CampaignBuildResult = {
  candidates: CampaignCandidate[];
  // Temel iş kuralına (pencere/tarih/aktivite) uyan ama cihaz bildirim
  // tercihi (prefs) nedeniyle elenen aday sayısı.
  skippedPrefs: number;
};

export type CampaignSkipCounts = {
  dedupe: number;
  quietHours: number;
  noToken: number;
  prefs: number;
  // Rezervasyon (push_dispatches insert) başarılı olduktan sonra gerçek
  // gönderim (PushSenderService.sendToDevices) throw ederse burada sayılır;
  // rezervasyon kasıtlı olarak silinmez (bkz. push-campaigns.service.ts).
  error: number;
};

export type CampaignRunResult = {
  campaign: CampaignKey;
  // İstanbul günü (YYYY-MM-DD) — push_dispatches.dayKey ile birebir.
  dayKey: string;
  // buildCandidates()'ın döndürdüğü toplam aday sayısı (prefs sonrası).
  candidates: number;
  sent: number;
  skipped: CampaignSkipCounts;
  dryRun: boolean;
};

export type CampaignTriggerOptions = {
  // true ise hiçbir push gönderilmez ve push_dispatches'a yazılmaz; sadece
  // (salt-okunur) dedupe kontrolüyle "kaç tanesi gönderilirdi" önizlenir.
  dryRun?: boolean;
  // true ise sessiz saat (22:00-08:00 İstanbul) kontrolü atlanır.
  force?: boolean;
};

/** POST /internal/campaigns/:campaign body'si. Bilinçli olarak class değil,
 * salt tip: global ValidationPipe (whitelist:true) yalnızca gerçek sınıf
 * metatype'larını dönüştürür/whitelist'ler, salt interface/type parametreleri
 * içinse metatype `Object`e düşer ve pipe dokunmadan geçirir (bkz.
 * webhooks.controller.ts'teki RevenueCatWebhookPayload ile aynı desen). Bir
 * class-validator DTO'su kullanmak dryRun/force alanlarının whitelist'te
 * sessizce elenmesine yol açardı. */
export type TriggerCampaignBody = {
  dryRun?: boolean;
  force?: boolean;
};
