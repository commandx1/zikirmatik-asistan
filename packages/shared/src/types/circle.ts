import type { LocalizedText } from "./domain";

// --- Zikir Halkası — apps/api/src/modules/circles içindeki tiplerin istemci
// tarafı aynası. Uçlar: v1/circles (JwtAuthGuard) ve v1/circles/preview/:code
// (herkese açık). Bireysel sayılar hiçbir yanıtta yer almaz; yalnız `myTotal`
// / `myTodayCount` (isteği yapan kullanıcının kendi katkısı) döner.

export type CircleStatus = "active" | "completed" | "closed";

export type CircleDhikrSnapshot = {
  name: LocalizedText;
  nameArabic?: string;
  transliteration?: LocalizedText;
  meaning?: LocalizedText;
};

export type CirclePreview = {
  name: string;
  dhikr: CircleDhikrSnapshot;
  goalCount: number;
  totalCount: number;
  memberCount: number;
  status: CircleStatus;
};

export type CircleSummary = CirclePreview & {
  id: string;
  code: string;
  dhikrId: string;
  /** YYYY-MM-DD; yoksa süresiz. */
  endDate?: string;
  myTotal: number;
  creatorId: string;
  isCreator: boolean;
};

export type CircleDetail = CircleSummary & {
  members: { displayName: string; activeToday?: boolean }[];
  activeTodayCount?: number;
  myTodayCount: number;
};

export type CreateCircleRequest = {
  name?: string;
  dhikrId: string;
  goalCount: number;
  endDate?: string;
};

export const CIRCLE_ERROR_CODE = {
  PREMIUM_REQUIRED: "CIRCLE_PREMIUM_REQUIRED",
  NOT_FOUND: "CIRCLE_NOT_FOUND",
  NOT_ACTIVE: "CIRCLE_NOT_ACTIVE",
  FULL: "CIRCLE_FULL",
  MAX_ACTIVE: "CIRCLE_MAX_ACTIVE",
  NOT_MEMBER: "CIRCLE_NOT_MEMBER",
  DHIKR_MISMATCH: "CIRCLE_DHIKR_MISMATCH",
  CREATOR_ONLY: "CIRCLE_CREATOR_ONLY",
} as const;

export type CircleErrorCode =
  (typeof CIRCLE_ERROR_CODE)[keyof typeof CIRCLE_ERROR_CODE];

/** Davet kodu: 8 karakter, 0/O/1/I yok (bkz. circles.constants.ts). */
export const CIRCLE_CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;

/** Sunucu limitlerinin istemci aynası; asıl zorlama sunucudadır. */
export const CIRCLE_MAX_MEMBERS = 200;
export const CIRCLE_MAX_ACTIVE_PER_CREATOR = 10;
