// Vird (günlük zikir programı) özelliğinin mobil tarafı için ortak tipler.
// Sunucu sözleşmesi: apps/api/src/modules/vird/ (vird.types.ts,
// schemas/vird-program.schema.ts, vird-templates.service.ts). Paylaşılan
// istemci tipleri @zikirmatik/shared'de (packages/shared/src/types/vird.ts) —
// burada onlardan türetilir, birebir kopyalanmaz.
import type { LocalizedText, VirdPrayerIndex, VirdProgram } from "@zikirmatik/shared";

export type {
  LocalizedText,
  VirdItem,
  VirdPhase,
  VirdPhaseSlots,
  VirdPrayerIndex,
  VirdProgramKind,
  VirdProgramSource,
  VirdProgramStatus,
  VirdReminders,
  VirdSlotKey
} from "@zikirmatik/shared";

/** Beş vakit indeksi -> Türkçe kısa ad (bkz. vird.types.ts VirdPrayerIndex). */
export const VIRD_PRAYER_INDEX_LABEL_TR: Record<VirdPrayerIndex, string> = {
  1: "Sabah",
  2: "Öğle",
  3: "İkindi",
  4: "Akşam",
  5: "Yatsı"
};

export type VirdProgramOrigin = "local" | "server";

/**
 * Bir vird item'ının (dhikrId veya customDhikrId) yerel/denormalize içeriği.
 * Sunucu programı yalnızca referans (dhikrId/customDhikrId) taşır; misafir
 * modunda ve çevrimdışıyken göstermek için ad/anlam/harekeli metin burada
 * saklanır. `ref`, bir VirdItem'ın dhikrId'i (yoksa customDhikrId'i) ile
 * aynı değerdir — bkz. services/vird-day.ts resolveDhikrRef.
 */
export type DhikrSnapshot = {
  ref: string;
  isCustom: boolean;
  name: LocalizedText | string;
  nameArabic?: string;
  transliteration?: LocalizedText | string;
  meaning?: LocalizedText | string;
};

/**
 * Mobil yerel vird programı: sunucu `VirdProgram` (bkz. @zikirmatik/shared)
 * alan kümesi + offline/misafir senaryosu için gereken ek alanlar.
 * - `id`: sunucuya senkronize olduysa sunucunun `_id`'si; olmadıysa
 *   `clientId` ile AYNI değer (bkz. store/vird-store.ts upsertProgram).
 * - `clientId`: expo-crypto (Crypto.randomUUID) ile üretilen kalıcı UUID —
 *   sunucuya POST edilirken idempotency anahtarı olarak gönderilir (bkz.
 *   CreateVirdProgramRequest.clientId, vird-program.schema.ts'teki
 *   {userId,clientId} unique/sparse index — bkz. vird-api-client.ts).
 * - `origin`: 'server' → en az bir kez sunucuya yazıldı/sunucudan geldi;
 *   'local' → yalnızca cihazda (misafir ya da henüz senkronize olmamış).
 * - `userId`/`createdAt`/`updatedAt` sunucu tipinde zorunluyken burada
 *   opsiyonel/yerelde üretilebilir bırakılır (misafirde gerçek userId yok).
 */
export type VirdProgramLocal = Omit<
  VirdProgram,
  "id" | "userId" | "createdAt" | "updatedAt"
> & {
  id: string;
  clientId: string;
  origin: VirdProgramOrigin;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  /** ref (dhikrId|customDhikrId) -> denormalize içerik. */
  dhikrs: Record<string, DhikrSnapshot>;
};

export type VirdReminderSlotPrefs = {
  morning: boolean;
  prayer: boolean;
  evening: boolean;
  night: boolean;
};

/** store/vird-store.ts'in reminderPrefs alanının şekli. */
export type VirdReminderPrefs = {
  enabled: boolean;
  slots: VirdReminderSlotPrefs;
  /** data/tr-provinces.ts TrProvince.key — vakit hesabı için gerekli. */
  provinceKey: string | null;
};

export type VirdDayItemProgress = {
  count: number;
  target: number;
  completed: boolean;
};

/** itemKey (bkz. buildVirdItemKey) -> o günkü ilerleme. */
export type VirdDayProgressMap = Record<string, VirdDayItemProgress>;

/** dateKey (YYYY-MM-DD) -> VirdDayProgressMap. store'un dayProgress alanı. */
export type VirdDayProgressByDate = Record<string, VirdDayProgressMap>;

export type VirdFocusSegment = "vird" | "list";
