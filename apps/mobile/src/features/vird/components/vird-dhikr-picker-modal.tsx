import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useThemeTokens } from "@zikirmatik/ui";
import { KeyboardAwareBottomSheetModal } from "../../../components/ui/keyboard-aware-bottom-sheet-modal";
import { ThemedInput } from "../../../components/ui/themed-input";
import { useDhikrStore } from "../../../store/dhikr-store";
import { resolveLocalizedText, withAlpha, type ThemeTokens } from "@zikirmatik/shared";
import { trackEvent } from "../../../lib/analytics";
import type { BackendDhikr } from "../../dhikrs/services/dhikrs-api-client";
import { fetchDhikrCatalog } from "../../dhikrs/services/dhikr-queries";
import { VIRD_ERROR_CODE } from "../services/vird-error-codes";
import { wouldExceedFreeDhikrLimit } from "../services/vird-editor-helpers";
import type { DhikrSnapshot } from "../types";
import { TEST_IDS } from "../../../test-ids";
import { useAppLocale } from "../../../i18n";

type PickerRow = {
  ref: string;
  isCustom: boolean;
  label: string;
  secondary?: string;
  defaultTarget: number;
  snapshot: DhikrSnapshot;
};

export type VirdDhikrPickerSelection = { ref: string; isCustom: boolean; target: number; snapshot: DhikrSnapshot };

type PickerRowViewProps = {
  item: PickerRow;
  alreadyInSlot: boolean;
  tokens: ThemeTokens;
  t: (key: string) => string;
  onPress: (item: PickerRow) => void;
};

const PickerRowView = memo(function PickerRowView({ item, alreadyInSlot, tokens, t, onPress }: PickerRowViewProps) {
  return (
    <Pressable
      onPress={() => onPress(item)}
      testID={TEST_IDS.vird.pickerRow}
      className="mb-2 flex-row items-center justify-between rounded-xl border px-3.5 py-3"
      style={{
        borderColor: alreadyInSlot ? withAlpha(tokens.textPrimary, 0.06) : withAlpha(tokens.textPrimary, 0.12),
        backgroundColor: tokens.bg,
        opacity: alreadyInSlot ? 0.7 : 1
      }}
    >
      <View className="flex-1 pr-3">
        <Text className="text-sm font-medium text-text-primary" numberOfLines={1}>
          {item.label}
        </Text>
        {item.secondary ? (
          <Text className="mt-0.5 text-xs text-text-muted" numberOfLines={1}>
            {item.secondary}
          </Text>
        ) : null}
      </View>
      <Text className="text-xs font-semibold" style={{ color: tokens.accent }}>
        {alreadyInSlot ? t("vird:editor.alreadyAdded") : t("vird:editor.addAction")}
      </Text>
    </Pressable>
  );
});

type VirdDhikrPickerModalProps = {
  visible: boolean;
  onRequestClose: () => void;
  /** Programın TÜMÜNDEKİ mevcut ref'ler — ücretsiz 3-farklı-zikir kontrolü için. */
  existingRefs: readonly string[];
  /** Yalnızca içinde bulunulan dilimdeki ref'ler — aynı zikri aynı dilime iki kez eklemeyi engellemek için. */
  slotRefs: readonly string[];
  isPremium: boolean;
  onRequirePremium: () => void;
  onAdd: (selection: VirdDhikrPickerSelection) => void;
  /** "Eklendi" satırına dokunma: zikri bulunulan dilimden geri çıkarır. */
  onRemove: (ref: string) => void;
  /** true ise kişisel/özel zikirler (personalRows) listelenmez — yalnız
   * doğrulanmış katalog gösterilir (bkz. circle-create-screen.tsx: halka
   * zikri katalogdan seçilir, kişisel zikirler paylaşılamaz). */
  catalogOnly?: boolean;
};

// Vird editörünün "zikir ekle" arama modalı: katalog (listVerifiedActiveDhikrs)
// + dhikr-store'daki kişisel zikirler birleşik listede aranır. Seçim ANINDA
// eklenir (varsayılan hedefle — kişisel zikrin kendi hedefi ya da katalog
// zikrinin recommendedCount'u); kullanıcı hedefi eklendikten sonra slot
// kartındaki sayı alanından değiştirebilir. Modal, birden çok zikir art arda
// eklenebilsin diye ekleme sonrası KAPANMAZ.
export function VirdDhikrPickerModal({
  visible,
  onRequestClose,
  existingRefs,
  slotRefs,
  isPremium,
  onRequirePremium,
  onAdd,
  onRemove,
  catalogOnly = false
}: VirdDhikrPickerModalProps) {
  const { t } = useTranslation("vird");
  const locale = useAppLocale();
  const { tokens } = useThemeTokens();
  // Zustand seçicisi her render'da yeni dizi döndürmemeli (useSyncExternalStore
  // sonsuz döngüye girer); ham listeyi seç, kişisel zikirleri useMemo ile türet.
  const allItems = useDhikrStore((state) => state.items);
  const personalItems = useMemo(() => allItems.filter((item) => item.source === "personal"), [allItems]);

  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<BackendDhikr[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | undefined>();

  useEffect(() => {
    if (!visible) {
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setLoadError(undefined);

    fetchDhikrCatalog()
      .then((data) => {
        if (!isCancelled) {
          setCatalog(data);
        }
      })
      .catch((error: unknown) => {
        console.warn("[vird-picker] katalog yüklenemedi", error);
        if (!isCancelled) {
          setLoadError(t("vird:editor.searchLoadError"));
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [visible, t]);

  const rows = useMemo<PickerRow[]>(() => {
    const personalRows: PickerRow[] = catalogOnly ? [] : personalItems.map((item) => ({
      ref: item.id,
      isCustom: true,
      label: resolveLocalizedText(item.transliteration, locale) || resolveLocalizedText(item.name, locale),
      defaultTarget: item.target > 0 ? item.target : 33,
      snapshot: {
        ref: item.id,
        isCustom: true,
        name: item.name,
        nameArabic: item.arabic,
        transliteration: item.transliteration,
        meaning: item.meaning
      }
    }));

    const catalogRows: PickerRow[] = catalog.map((dhikr) => ({
      ref: dhikr._id,
      isCustom: false,
      label: resolveLocalizedText(dhikr.transliteration, locale) || resolveLocalizedText(dhikr.name, locale),
      secondary: resolveLocalizedText(dhikr.meaning, locale),
      defaultTarget: dhikr.recommendedCount > 0 ? dhikr.recommendedCount : 33,
      snapshot: {
        ref: dhikr._id,
        isCustom: false,
        name: dhikr.name,
        nameArabic: dhikr.nameArabic,
        transliteration: dhikr.transliteration,
        meaning: dhikr.meaning
      }
    }));

    const all = [...personalRows, ...catalogRows];
    const normalizedQuery = query.trim().toLocaleLowerCase(locale);
    if (!normalizedQuery) {
      return all;
    }
    return all.filter((row) => row.label.toLocaleLowerCase(locale).includes(normalizedQuery));
  }, [personalItems, catalog, query, locale, catalogOnly]);

  const handlePick = (row: PickerRow) => {
    if (slotRefs.includes(row.ref)) {
      onRemove(row.ref);
      return;
    }
    if (wouldExceedFreeDhikrLimit(existingRefs, row.ref, isPremium)) {
      void trackEvent("vird_limit_hit", { code: VIRD_ERROR_CODE.FREE_LIMIT_DHIKRS });
      onRequirePremium();
      return;
    }
    onAdd({ ref: row.ref, isCustom: row.isCustom, target: row.defaultTarget, snapshot: row.snapshot });
  };

  const renderItem = useCallback(
    ({ item }: { item: PickerRow }) => (
      <PickerRowView
        item={item}
        alreadyInSlot={slotRefs.includes(item.ref)}
        tokens={tokens}
        t={t}
        onPress={handlePick}
      />
    ),
    [slotRefs, tokens, t, handlePick]
  );

  return (
    <KeyboardAwareBottomSheetModal
      visible={visible}
      onRequestClose={onRequestClose}
      showHandle
      overlayClassName="flex-1 justify-end bg-black/55"
      sheetClassName="rounded-t-3xl border-t border-white/10 bg-card p-5 pb-8"
      sheetStyle={{ maxHeight: "82%" }}
    >
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-text-primary">{t("vird:editor.pickerTitle")}</Text>
        <Pressable onPress={onRequestClose} hitSlop={8} accessibilityRole="button" testID={TEST_IDS.vird.pickerDone}>
          <Text className="text-sm font-semibold" style={{ color: tokens.accent }}>
            {t("vird:editor.pickerDone")}
          </Text>
        </Pressable>
      </View>
      <ThemedInput
        value={query}
        onChangeText={setQuery}
        placeholder={t("vird:editor.searchPlaceholder")}
        className="mb-3 rounded-xl bg-bg px-3"
        autoFocus
      />

      {isLoading ? (
        <Text className="py-6 text-center text-xs text-text-muted">{t("vird:editor.searchLoading")}</Text>
      ) : loadError ? (
        <Text className="py-6 text-center text-xs text-text-muted">{loadError}</Text>
      ) : rows.length === 0 ? (
        <Text className="py-6 text-center text-xs text-text-muted">{t("vird:editor.searchEmpty")}</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.ref}
          scrollEnabled={false}
          renderItem={renderItem}
        />
      )}
    </KeyboardAwareBottomSheetModal>
  );
}

