// Vird Programı — apps/api/src/modules/vird/{schemas/*, vird.types.ts,
// vird.constants.ts} içindeki tiplerin istemci tarafı aynası. API kendi
// kopyasını tutar (bkz. apps/api/src/common/types/localized-text.ts'teki
// nodenext notu — aynı gerekçe burada da geçerli).
import type { LocalizedText } from "./domain";

export type VirdSlotKey = "morning" | "prayer" | "evening" | "night" | "free";

/** 1=sabah, 2=öğle, 3=ikindi, 4=akşam, 5=yatsı. */
export type VirdPrayerIndex = 1 | 2 | 3 | 4 | 5;

export type VirdProgramKind = "routine" | "journey";

export type VirdProgramStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export type VirdProgramSource = "manual" | "template" | "ai";

export type VirdItem = {
  dhikrId?: string;
  customDhikrId?: string;
  target: number;
};

export type VirdPhaseSlots = Partial<Record<VirdSlotKey, VirdItem[]>>;

export type VirdPhase = {
  fromDay: number;
  /** null = bir sonraki faz başlayana (ya da son fazsa sonsuza) dek sürer. */
  toDay: number | null;
  note?: string;
  slots: VirdPhaseSlots;
};

export type VirdReminders = {
  enabled: boolean;
  slots: {
    morning: boolean;
    prayer: boolean;
    evening: boolean;
    night: boolean;
  };
};

export type VirdAiMeta = {
  flowId: string;
  intent: string;
  durationDays: number;
  summary: string;
};

export type VirdProgram = {
  id: string;
  userId: string;
  clientId?: string;
  kind: VirdProgramKind;
  status: VirdProgramStatus;
  source: VirdProgramSource;
  templateKey?: string;
  title: LocalizedText;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD — yalnızca kind:'journey' için sunucuda türetilir. */
  endDate?: string;
  dayCount?: number;
  phases: VirdPhase[];
  prayerSelection: number[];
  reminders: VirdReminders;
  ai?: VirdAiMeta;
  createdAt: string;
  updatedAt: string;
};

export type VirdItemProgress = {
  itemKey: string;
  dhikrId?: string;
  customDhikrId?: string;
  prayerIndex: number | null;
  count: number;
  target: number;
  completed: boolean;
};

export type VirdSlotProgress = {
  items: VirdItemProgress[];
  done: boolean;
};

export type VirdStreakSnapshot = {
  currentStreak: number;
  longestStreak: number;
};

export type VirdTodayResponse = {
  program: VirdProgram | null;
  dayIndex: number;
  slots: Partial<Record<VirdSlotKey, VirdSlotProgress>>;
  isDayComplete: boolean;
  virdStreak: VirdStreakSnapshot;
};

export type VirdHistoryEntry = {
  /** YYYY-MM-DD */
  date: string;
  isDayComplete: boolean;
};

export type VirdHistoryResponse = {
  items: VirdHistoryEntry[];
};

export type CreateVirdProgramRequest = {
  clientId?: string;
  title: LocalizedText;
  kind: VirdProgramKind;
  /** Belirtilmezse 'manual' kabul edilir. */
  source?: VirdProgramSource;
  templateKey?: string;
  /** Manuel (source:'manual') programlarda zorunludur; template/ai kaynaklı
   * programlarda boş/atlanmış olabilir (çözümleme sonraki sürümdedir). */
  phases?: VirdPhase[];
  /** YYYY-MM-DD */
  startDate: string;
  /** Belirtilmezse [1,2,3,4,5] kabul edilir. */
  prayerSelection?: number[];
  reminders?: VirdReminders;
};

export type UpdateVirdProgramRequest = {
  title?: LocalizedText;
  phases?: VirdPhase[];
  prayerSelection?: number[];
  reminders?: VirdReminders;
  /** 'active' burada kabul edilmez — draft/paused -> active geçişi için
   * POST /v1/vird/programs/:id/activate kullanılır. */
  status?: Exclude<VirdProgramStatus, "active">;
};

export const VIRD_ERROR_CODE = {
  FREE_LIMIT_DHIKRS: "VIRD_FREE_LIMIT_DHIKRS",
  FREE_LIMIT_ACTIVE: "VIRD_FREE_LIMIT_ACTIVE",
  PREMIUM_REQUIRED: "VIRD_PREMIUM_REQUIRED",
  PREMIUM_MAX_ACTIVE_PROGRAMS: "PREMIUM_MAX_ACTIVE_PROGRAMS",
} as const;

export type VirdErrorCode =
  (typeof VIRD_ERROR_CODE)[keyof typeof VIRD_ERROR_CODE];

/** Sunucu limitlerinin istemci tarafı aynası (bkz. vird.constants.ts). UI
 * ipuçları için kullanılabilir; asıl zorlama her zaman sunucudadır. */
export const VIRD_FREE_LIMIT_DHIKRS = 3;
export const VIRD_FREE_LIMIT_ACTIVE = 1;
export const PREMIUM_MAX_ACTIVE_PROGRAMS = 10;

// --- Vird Şablonları — apps/api/src/modules/vird/vird-templates.service.ts
// (VirdTemplateSummary/VirdTemplateResolvedItem/VirdTemplateResolvedPhase/
// VirdTemplateDetail) içindeki tiplerin istemci tarafı aynası. Uçlar:
// GET v1/vird/templates (misafir dahil, OptionalJwtAuthGuard) ve
// GET v1/vird/templates/:key. `title`/`description` kasıtlı olarak
// opsiyoneldir (bkz. proje belleği: "İslami içerik kullanıcıya ait").

export type VirdTemplateSummary = {
  key: string;
  kind: VirdProgramKind;
  title?: LocalizedText;
  description?: LocalizedText;
  isPremium: boolean;
  dayCount?: number;
  /** YYYY-MM-DD — özel güne bağlı şablonlarda (ör. Kadir Gecesi) dolu. */
  anchorDate?: string;
};

export type VirdTemplateItemDetail = {
  dhikrId: string;
  key: string;
  name: LocalizedText;
  nameArabic: string;
  transliteration: LocalizedText;
  meaning: LocalizedText;
  target: number;
};

export type VirdTemplatePhaseDetail = {
  fromDay: number;
  toDay: number | null;
  note?: string;
  slots: Partial<Record<VirdSlotKey, VirdTemplateItemDetail[]>>;
};

export type VirdTemplateDetail = VirdTemplateSummary & {
  phases: VirdTemplatePhaseDetail[];
};
