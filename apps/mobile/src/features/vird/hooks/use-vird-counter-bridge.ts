// Sayaç <-> vird köprüsü. home-context.tsx İÇİNDEN (HomeProvider gövdesinde)
// çağrılır ve şu üç şeyi sağlar:
//  (a) recordProgress: her sayaç artışında (activeVirdContext doluysa)
//      useVirdStore.recordProgress'i tetikler — misafirde de yerel ilerleme
//      kaydedilir, sunucuya bağımlı değildir.
//  (b) buildLogFields: saveSelectedDhikrLog'un payload'ına eklenecek
//      virdProgramId/virdSlot/virdDayIndex/virdPrayerIndex alanlarını üretir
//      (bkz. dhikr-logs-api-client.ts VirdLogFields — bağlam yoksa boş obje).
//  (c) ensureVirdItemSnapshot: bir vird item'ının zikri dhikr-store'da yoksa
//      denormalize snapshot'tan ekler (SEÇMEZ, activeVirdContext'e
//      DOKUNMAZ).
//
// activeVirdContext'in KENDİSİ burada set EDİLMEZ: dhikr-store.ts'teki
// selectDhikr artık AiDhikrContext ile aynı desende üçüncü bir opsiyonel
// virdContext parametresi alıyor, çünkü seçim `requestDhikrTransition`
// üzerinden ERTELENEBİLİR (unsaved-guard modalı) — bağlamı burada ayrı bir
// set() ile önceden yazmak, seçim gerçekleşene kadar (ya da hiç
// gerçekleşmezse) YANLIŞ zikre bağlı kalırdı, üstelik selectDhikr zaten HER
// çağrısında activeVirdContext'i (verilmemişse) sıfırlıyor — iki ayrı set()
// birbirini ezerdi. Bunun yerine home-context.tsx'in startVirdItem'ı saf
// buildActiveVirdContext'i kullanıp bağlamı DOĞRUDAN seçimle birlikte
// (`requestDhikrTransition({kind:'select', id, virdContext})` ->
// `selectDhikr(id, undefined, virdContext)`) atomik olarak kurar.
//
// Bu dosya home-context.tsx'in hedef/auto-save/haptik/ses/tur mantığına HİÇ
// dokunmaz — sadece ek/yan etkidir.
import { useCallback, useMemo } from "react";
import { toDateKey } from "@zikirmatik/shared";
import { i18n } from "../../../i18n";
import { useDhikrStore, type ActiveVirdContext } from "../../../store/dhikr-store";
import { useVirdStore } from "../../../store/vird-store";
import type { VirdLogFields } from "../../dhikrs/services/dhikr-logs-api-client";
import type { ZikirItem } from "../../focus/types";
import type { ExpectedVirdItem } from "../services/vird-day";
import type { VirdProgramLocal } from "../types";

/**
 * saveSelectedDhikrLog'un payload'ına eklenecek alanlar. Bağlam yoksa boş
 * obje döner (spread edilebilir) — "yalnız bağlam varsa gönder" kuralı.
 */
export function buildVirdLogFields(context: ActiveVirdContext | null): VirdLogFields {
  if (!context) {
    return {};
  }

  return {
    virdProgramId: context.programId,
    virdSlot: context.slot,
    virdDayIndex: context.dayIndex,
    ...(context.prayerIndex != null ? { virdPrayerIndex: context.prayerIndex } : {})
  };
}

/**
 * Bir vird item'ı seçilirken selectDhikr'e (üçüncü parametre) atomik olarak
 * geçirilecek ActiveVirdContext'i saf olarak kurar. `dayIndex` çağıran
 * tarafından (bkz. vird-day.ts dayIndexFor) hesaplanır — bu fonksiyon bir
 * hook olmadığından store/tarih erişimi yoktur, kasıtlı olarak saftır.
 */
export function buildActiveVirdContext(
  program: Pick<VirdProgramLocal, "id">,
  item: Pick<ExpectedVirdItem, "itemKey" | "slot" | "prayerIndex" | "target">,
  dayIndex: number
): ActiveVirdContext {
  return {
    programId: program.id,
    itemKey: item.itemKey,
    slot: item.slot,
    ...(item.prayerIndex != null ? { prayerIndex: item.prayerIndex } : {}),
    dayIndex,
    target: item.target
  };
}

/**
 * startVirdItem'ın dhikr-store'a eklemesi gereken snapshot'ı hesaplar.
 * `item.ref` zaten `existingItemIds` içindeyse (zikir dhikr-store'da hâlâ
 * varsa) undefined döner — çağıran bu durumda upsertDhikrSnapshot'ı
 * ATLAMALIDIR, aksi halde var olan ilerleme (current) sıfırlanır.
 * Denormalize içerik program.dhikrs[ref]'te yoksa (bkz. features/vird/README.md
 * — sunucudan taze çekilmiş, bu cihazda hiç yerel karşılığı olmayan bir
 * program) `vird:home.itemFallbackName` genel adıyla güvenli bir yer
 * tutucuya düşer; sayaç yine de doğru itemKey/ref ile çalışır.
 */
export function resolveVirdStartSnapshot(
  program: Pick<VirdProgramLocal, "dhikrs">,
  item: Pick<ExpectedVirdItem, "ref" | "target">,
  existingItemIds: readonly string[]
): ZikirItem | undefined {
  if (existingItemIds.includes(item.ref)) {
    return undefined;
  }

  const snapshot = program.dhikrs[item.ref];
  const fallbackName = i18n.t("vird:home.itemFallbackName");

  return {
    id: item.ref,
    source: snapshot?.isCustom ? "personal" : "ready",
    name: snapshot?.name ?? fallbackName,
    arabic: snapshot?.nameArabic,
    transliteration: snapshot?.transliteration ?? snapshot?.name ?? fallbackName,
    meaning: snapshot?.meaning,
    current: 0,
    target: item.target,
    lastActivityLabel: i18n.t("focus:relativeDate.notStarted"),
    streakDays: 0,
    isFavorite: false
  };
}

export function useVirdCounterBridge() {
  const activeVirdContext = useDhikrStore((state) => state.activeVirdContext);
  const upsertDhikrSnapshot = useDhikrStore((state) => state.upsertDhikrSnapshot);
  const items = useDhikrStore((state) => state.items);
  const recordVirdProgress = useVirdStore((state) => state.recordProgress);

  /** home-context.tsx onCountPress içinde, sayı GERÇEKTEN değiştiğinde
   * (haptik/tur ile aynı koşulda) çağrılır. */
  const recordProgress = useCallback(
    (nextCount: number) => {
      if (!activeVirdContext) {
        return;
      }

      recordVirdProgress(toDateKey(new Date()), activeVirdContext.itemKey, nextCount, activeVirdContext.target);
    },
    [activeVirdContext, recordVirdProgress]
  );

  const buildLogFields = useCallback((): VirdLogFields => buildVirdLogFields(activeVirdContext), [activeVirdContext]);

  /**
   * home-context.tsx'in startVirdItem'ı BUNU çağırır (item'ın zikri
   * dhikr-store'da yoksa ekler), ARDINDAN buildActiveVirdContext + kendi
   * requestDhikrTransition'ıyla ATOMIK olarak seçer — bkz. dosya başı notu.
   */
  const ensureVirdItemSnapshot = useCallback(
    (program: VirdProgramLocal, item: ExpectedVirdItem) => {
      const snapshotToAdd = resolveVirdStartSnapshot(program, item, items.map((value) => value.id));
      if (snapshotToAdd) {
        upsertDhikrSnapshot(snapshotToAdd);
      }
    },
    [items, upsertDhikrSnapshot]
  );

  // Referans kararlılığı: home-context.tsx bu objeyi kendi (çok daha büyük)
  // useMemo'sunun bağımlılık dizisine ekler — burada yeni bir literal
  // dönmek o memo'yu HER render'da (activeVirdContext değişmese bile)
  // gereksiz yere geçersiz kılardı.
  return useMemo(
    () => ({ recordProgress, buildLogFields, ensureVirdItemSnapshot }),
    [recordProgress, buildLogFields, ensureVirdItemSnapshot]
  );
}

export type VirdCounterBridge = ReturnType<typeof useVirdCounterBridge>;
