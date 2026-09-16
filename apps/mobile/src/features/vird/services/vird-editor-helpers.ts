// Vird editörü (features/vird/screens/vird-editor-screen.tsx) ve şablon
// başlatma (template-detail-screen.tsx) akışları için saf (side-effect'siz)
// yardımcılar. Sunucu I/O YOK — network çağrıları çağıran ekranlarda yapılır,
// bu dosya yalnızca hesaplama/dönüşüm içerir (test edilebilirlik).
import {
  VIRD_FREE_LIMIT_DHIKRS,
  type LocalizedText,
  type VirdPhase,
  type VirdPhaseSlots,
  type VirdSlotKey,
  type VirdTemplateDetail
} from "@zikirmatik/shared";
import type { VirdEditorSlotItem } from "../components/vird-editor-slot-card";
import type { DhikrSnapshot, VirdProgramLocal } from "../types";
import { resolveDhikrRef, VIRD_SLOT_KEYS } from "./vird-day";

export type EditorSlots = Partial<Record<VirdSlotKey, VirdEditorSlotItem[]>>;

/** Kullanıcının girdiği tek bir başlık metnini {tr,en} çiftine aynalar —
 * dhikr-store.ts'teki (dışa açık olmayan) toLocalizedText ile aynı kural:
 * kişisel/kullanıcı içeriği tek dilli tutulur, iki alana da aynı değer yazılır. */
export function toLocalizedText(value: string): LocalizedText {
  const trimmed = value.trim();
  return { tr: trimmed, en: trimmed };
}

/**
 * Bir fazın slots'undaki TÜM item'ların benzersiz (dhikrId|customDhikrId)
 * referans sayısı — ücretsiz plan 3-farklı-zikir kontrolü için kullanılır.
 */
export function countDistinctDhikrRefs(slots: VirdPhaseSlots): number {
  const refs = new Set<string>();
  for (const items of Object.values(slots)) {
    for (const item of items ?? []) {
      const ref = resolveDhikrRef(item);
      if (ref) {
        refs.add(ref);
      }
    }
  }
  return refs.size;
}

/**
 * Ücretsiz planda yeni bir zikir eklemenin 3-farklı-zikir sınırını
 * (VIRD_FREE_LIMIT_DHIKRS) aşıp aşmayacağını saf olarak kontrol eder —
 * sunucudaki assertDhikrLimit'in (apps/api/.../vird-programs.service.ts)
 * istemci ön-kontrol ikizi. Aynı ref halihazırda programda varsa (başka bir
 * dilime ikinci kez ekleniyor) YENİ bir zikir SAYILMAZ. Premium
 * kullanıcılar için her zaman false.
 */
export function wouldExceedFreeDhikrLimit(
  existingRefs: ReadonlySet<string> | readonly string[],
  newRef: string,
  isPremium: boolean
): boolean {
  if (isPremium) {
    return false;
  }

  const refs = existingRefs instanceof Set ? existingRefs : new Set(existingRefs);
  if (refs.has(newRef)) {
    return false;
  }

  return refs.size >= VIRD_FREE_LIMIT_DHIKRS;
}

export type BuildLocalProgramFromTemplateOptions = {
  /** Yerel kayıt kimliği — sunucuya hiç gitmeyeceği için clientId ile aynı olur. */
  id: string;
  clientId: string;
  /** YYYY-MM-DD — şablonun anchorDate'i yoksa kullanılır. */
  startDateKey: string;
  /** ISO timestamp (createdAt/updatedAt için). */
  nowIso: string;
  /** template.title tanımsızsa (bkz. proje kuralı: içerik alanları opsiyonel) kullanılacak başlık. */
  fallbackTitle: LocalizedText;
};

/**
 * Bir VirdTemplateDetail'i (GET /v1/vird/templates/:key — TAM şablon
 * içeriği, katalog dhikr'lerinin ad/anlam/hareke bilgisi dahil) misafir/yerel
 * bir VirdProgramLocal'a çevirir. Şablon zaten dhikr içeriğinin tamamını
 * taşıdığından `dhikrs` denormalizasyonu EK bir ağ isteği olmadan buradan
 * doldurulur — bkz. features/vird/README.md "sonraki worker" notu.
 * `status:'draft'` döner (bkz. aşağıdaki alan yorumu) — aktivasyon her zaman
 * ayrı bir adımdır.
 */
export function buildLocalProgramFromTemplate(
  template: VirdTemplateDetail,
  options: BuildLocalProgramFromTemplateOptions
): VirdProgramLocal {
  const dhikrs: Record<string, DhikrSnapshot> = {};

  const phases: VirdPhase[] = template.phases.map((phase) => {
    const slots: VirdPhaseSlots = {};

    for (const slot of VIRD_SLOT_KEYS) {
      const items = phase.slots[slot];
      if (!items || items.length === 0) {
        continue;
      }

      slots[slot] = items.map((item) => {
        dhikrs[item.dhikrId] = {
          ref: item.dhikrId,
          isCustom: false,
          name: item.name,
          nameArabic: item.nameArabic,
          transliteration: item.transliteration,
          meaning: item.meaning
        };
        return { dhikrId: item.dhikrId, target: item.target };
      });
    }

    return { fromDay: phase.fromDay, toDay: phase.toDay, note: phase.note, slots };
  });

  return {
    id: options.id,
    clientId: options.clientId,
    origin: "local",
    kind: template.kind,
    // 'draft' kasıtlı — çağıran (template-detail-screen.tsx) bunu HER ZAMAN
    // useVirdProgramActions().activateProgram() üzerinden aktive eder, bu da
    // ücretsiz "1 aktif program" limitini misafir için de member ile AYNI
    // (vird-swap-active-modal.tsx) akışla emüle eder — burada doğrudan
    // 'active' yazmak bu kontrolü atlardı.
    status: "draft",
    source: "template",
    templateKey: template.key,
    title: template.title ?? options.fallbackTitle,
    startDate: template.anchorDate ?? options.startDateKey,
    phases,
    prayerSelection: [1, 2, 3, 4, 5],
    reminders: { enabled: false, slots: { morning: false, prayer: false, evening: false, night: false } },
    dhikrs,
    createdAt: options.nowIso,
    updatedAt: options.nowIso
  };
}

/**
 * Bir fazın (journey/şablon fazı ya da bir rutin programın tek fazı)
 * slots'unu editörün düz {ref,isCustom,target} liste şekline çevirir —
 * hem `vird-editor-screen.tsx`'in kendi programını yüklerken (tek fazlı
 * rutinler) hem de "Kopyala ve uyarla" akışında (bir journey fazından yeni
 * bir taslak rutin tohumlarken) kullanılan TEK ortak dönüşüm.
 */
export function buildEditorSlotsFromPhase(phase: VirdPhase | undefined): EditorSlots {
  const sourceSlots = phase?.slots ?? {};
  const next: EditorSlots = {};

  for (const slot of VIRD_SLOT_KEYS) {
    const items = sourceSlots[slot];
    if (!items || items.length === 0) {
      continue;
    }
    const mapped = items
      .map((item) => ({ ref: resolveDhikrRef(item) ?? "", isCustom: Boolean(item.customDhikrId), target: item.target }))
      .filter((item) => item.ref.length > 0);
    if (mapped.length > 0) {
      next[slot] = mapped;
    }
  }

  return next;
}

const AUTO_TITLE_SLOT_LABEL: Record<VirdSlotKey, LocalizedText> = {
  morning: { tr: "Sabah", en: "Morning" },
  prayer: { tr: "Namaz sonrası", en: "After prayer" },
  evening: { tr: "Akşam", en: "Evening" },
  night: { tr: "Gece", en: "Night" },
  free: { tr: "Serbest", en: "Free" }
};

/**
 * Kullanıcı bir başlık girmediyse editörün önerdiği otomatik başlık: seçili
 * dilimlerin (enabledSlots, VIRD_SLOT_KEYS sırasıyla) kısa adlarını "-" ile
 * birleştirip sonuna "virdi"/"Vird" ekler (ör. "Sabah-Akşam virdi"). Hiç
 * dilim seçili değilse genel bir yer tutucuya düşer.
 */
export function buildAutoVirdTitle(enabledSlots: readonly VirdSlotKey[]): LocalizedText {
  const ordered = VIRD_SLOT_KEYS.filter((slot) => enabledSlots.includes(slot));
  if (ordered.length === 0) {
    return { tr: "Vird Programım", en: "My Vird Program" };
  }

  const tr = ordered.map((slot) => AUTO_TITLE_SLOT_LABEL[slot].tr).join("-");
  const en = ordered.map((slot) => AUTO_TITLE_SLOT_LABEL[slot].en).join("-");
  return { tr: `${tr} virdi`, en: `${en} vird` };
}
