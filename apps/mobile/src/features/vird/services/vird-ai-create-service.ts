// AI ile Vird Programı oluşturma akışının SAF (side-effect'siz) parçaları —
// istek gövdesi kurma, hata sınıflandırma, aktifleştirilen sunucu programını
// yerel VirdProgramLocal + dhikrs (denormalize) snapshot'ına çevirme. Ağ
// çağrıları YOKTUR — bunlar hooks/use-vird-ai-create.ts'de yapılır, burada
// yalnızca test edilebilir dönüşümler tutulur (bkz. vird-day.ts ile aynı
// "saf katman" deseni).
import type { VirdProgram } from "@zikirmatik/shared";
import {
  AiApiError,
  AI_CREDIT_INSUFFICIENT_CODE,
  AI_UNAVAILABLE_CODE,
  type CreateAiVirdProgramPayload
} from "../../ai-guide/services/ai-api-client";
import type { BackendDhikr } from "../../dhikrs/services/dhikrs-api-client";
import { toLocalVirdProgram } from "./vird-sync";
import type { DhikrSnapshot, VirdPhase, VirdProgramLocal, VirdSlotKey } from "../types";

export type VirdAiCreateFormState = {
  freeText: string;
  durationDays: 7 | 14 | 30;
  slots: VirdSlotKey[];
  /** Yalnızca `slots` 'prayer' içeriyorsa gönderilir (bkz. buildCreateAiVirdProgramPayload). */
  prayerSelection: number[];
  locale?: "tr" | "en";
};

/**
 * Form state'ini `POST /v1/ai/vird-programs` gövdesine çevirir. `freeText`
 * boşsa alan hiç gönderilmez (DTO `@IsOptional()`); `prayerSelection` yalnızca
 * `slots` 'prayer' içeriyorsa VE en az bir vakit seçiliyse gönderilir —
 * sunucunun promptHash'i de kendi tarafında sıralayıp hesapladığından
 * (bkz. ai-vird.service.ts computePromptHash) burada da sıralı gönderilir.
 */
export function buildCreateAiVirdProgramPayload(
  state: VirdAiCreateFormState,
  flowId: string
): CreateAiVirdProgramPayload {
  const trimmedText = state.freeText.trim();
  const includesPrayer = state.slots.includes("prayer");
  const sortedPrayerSelection = includesPrayer && state.prayerSelection.length > 0
    ? [...state.prayerSelection].sort((a, b) => a - b)
    : undefined;

  return {
    flowId,
    ...(trimmedText ? { freeText: trimmedText } : {}),
    durationDays: state.durationDays,
    slots: state.slots,
    ...(sortedPrayerSelection ? { prayerSelection: sortedPrayerSelection } : {}),
    ...(state.locale ? { locale: state.locale } : {})
  };
}

export type AiVirdCreateErrorClassification =
  | { kind: "creditInsufficient" }
  | { kind: "unavailable"; message: string }
  | { kind: "terminal"; message: string };

/**
 * `AiApiError`'ı (bkz. ai-api-client.ts) hook'un davranış dallarına eşler:
 * kredi yetersiz → premium sheet, 503 (AI_UNAVAILABLE_CODE) → aynı flowId ile
 * "tekrar dene", diğer her şey → terminal hata mesajı. Sözleşme:
 * docs/vird-programi.md §3 "Hata kodları".
 */
export function mapAiVirdCreateError(error: unknown, fallbackMessage: string): AiVirdCreateErrorClassification {
  if (error instanceof AiApiError) {
    if (error.code === AI_CREDIT_INSUFFICIENT_CODE) {
      return { kind: "creditInsufficient" };
    }
    if (error.code === AI_UNAVAILABLE_CODE) {
      return { kind: "unavailable", message: error.message || fallbackMessage };
    }
    return { kind: "terminal", message: error.message || fallbackMessage };
  }
  return { kind: "terminal", message: fallbackMessage };
}

/**
 * Aktifleştirilmiş sunucu programının (`phases[*].slots[*]` — `VirdItem`,
 * yalnızca dhikrId/customDhikrId/target) fazlarında referans verilen HER
 * `dhikrId` için katalogdan (bkz. listVerifiedActiveDhikrs) ad/anlam/harekeli
 * metin çözer. AI ajanı yalnızca katalog zikirleri kullandığından (bkz.
 * vird-program-agent.service.ts) `customDhikrId` beklenmez — böyle bir öğe
 * (ileride bir agent değişikliğiyle) gelirse snapshot'ı BOŞ bırakılır; UI genel
 * yer tutucuya düşer (bkz. features/vird/README.md "sunucu-only program" notu).
 */
export function buildAiVirdDhikrSnapshots(
  phases: VirdPhase[],
  catalog: BackendDhikr[]
): Record<string, DhikrSnapshot> {
  const catalogById = new Map(catalog.map((dhikr) => [dhikr._id, dhikr]));
  const snapshots: Record<string, DhikrSnapshot> = {};

  for (const phase of phases) {
    for (const items of Object.values(phase.slots)) {
      for (const item of items ?? []) {
        const ref = item.dhikrId ?? item.customDhikrId;
        if (!ref || snapshots[ref]) {
          continue;
        }

        const dhikr = item.dhikrId ? catalogById.get(item.dhikrId) : undefined;
        if (!dhikr) {
          continue;
        }

        snapshots[ref] = {
          ref,
          isCustom: false,
          name: dhikr.name,
          nameArabic: dhikr.nameArabic,
          transliteration: dhikr.transliteration,
          meaning: dhikr.meaning
        };
      }
    }
  }

  return snapshots;
}

/**
 * Aktifleştirme sonrası dönen sunucu `VirdProgram`'ını, ana ekranın (bkz.
 * components/todays-vird-card.tsx) okuduğu `VirdProgramLocal` şekline çevirir.
 * `toLocalVirdProgram` (vird-sync.ts) `previousLocal` verilmediğinden `dhikrs`'i
 * boş döner — burada katalogdan taze çözülen snapshot ile üzerine yazılır.
 */
export function toActivatedAiVirdProgramLocal(server: VirdProgram, catalog: BackendDhikr[]): VirdProgramLocal {
  const base = toLocalVirdProgram(server);
  return { ...base, dhikrs: buildAiVirdDhikrSnapshots(server.phases, catalog) };
}

/**
 * 403 VIRD_FREE_LIMIT_ACTIVE çakışmasında duraklatılacak programlar: sunucu
 * `status: 'active'` olan HER programı sayar (tür fark etmez; bkz. apps/api
 * vird-programs.service.ts activate), bu yüzden hedef dışındaki tüm aktifler.
 */
export function selectProgramsToPause<T extends Pick<VirdProgram, "id" | "status">>(
  programs: readonly T[],
  targetId: string
): T[] {
  return programs.filter((program) => program.status === "active" && program.id !== targetId);
}
