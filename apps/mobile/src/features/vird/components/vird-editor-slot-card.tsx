import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useThemeTokens } from "@zikirmatik/ui";
import type { VirdSlotKey } from "@zikirmatik/shared";
import { ThemedCard } from "../../../components/ui/themed-card";
import { ThemedInput } from "../../../components/ui/themed-input";
import { resolveLocalizedText, withAlpha } from "@zikirmatik/shared";
import type { DhikrSnapshot } from "../types";
import { TEST_IDS } from "../../../test-ids";
import { useAppLocale } from "../../../i18n";

export type VirdEditorSlotItem = {
  ref: string;
  isCustom: boolean;
  target: number;
};

const PRAYER_INDEXES = [1, 2, 3, 4, 5] as const;

type VirdEditorSlotCardProps = {
  slot: VirdSlotKey;
  items: VirdEditorSlotItem[];
  displaySnapshots: Record<string, DhikrSnapshot>;
  onAddPress: () => void;
  onRemove: (ref: string) => void;
  onTargetChange: (ref: string, target: number) => void;
  /** Yalnız slot === 'prayer' için: seçili vakitler + toggle handler'ı. */
  prayerSelection?: number[];
  onTogglePrayerIndex?: (index: number) => void;
};

// vird-editor-screen.tsx'teki tek bir dilim bölümü: başlık + (yalnız
// 'prayer' dilimi için) 5 vakit toggle'ı + eklenen zikirlerin adı/hedef
// sayısı/kaldır düğmesi. Ad çözümlemesi `displaySnapshots`ten yapılır —
// yeni eklenen bir zikir için ANINDA (picker'dan gelen tam içerikle), sunucu
// kökenli bir programda henüz hidrasyon tamamlanmamışsa geçici olarak genel
// yer tutucuyla gösterilir (bkz. hooks/use-hydrate-vird-snapshots.ts).
export function VirdEditorSlotCard({
  slot,
  items,
  displaySnapshots,
  onAddPress,
  onRemove,
  onTargetChange,
  prayerSelection,
  onTogglePrayerIndex
}: VirdEditorSlotCardProps) {
  const { t } = useTranslation("vird");
  const locale = useAppLocale();
  const { tokens } = useThemeTokens();

  return (
    <ThemedCard className="mb-4 rounded-2xl p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-text-primary">{t(`vird:slots.${slot}`)}</Text>
        <Pressable
          onPress={onAddPress}
          testID={`${TEST_IDS.vird.slotAdd}-${slot}`}
          className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ backgroundColor: withAlpha(tokens.accent, 0.15) }}
        >
          <FontAwesome6 name="plus" iconStyle="solid" size={10} color={tokens.accent} />
          <Text className="text-xs font-semibold" style={{ color: tokens.accent }}>
            {t("vird:editor.addDhikrButton")}
          </Text>
        </Pressable>
      </View>

      {slot === "prayer" && prayerSelection && onTogglePrayerIndex ? (
        <View className="mb-3">
          <Text className="mb-1.5 text-xs font-semibold text-text-muted">{t("vird:editor.prayerSelectionHeading")}</Text>
          <View className="flex-row flex-wrap gap-2">
            {PRAYER_INDEXES.map((index) => {
              const isSelected = prayerSelection.includes(index);
              return (
                <Pressable
                  key={index}
                  onPress={() => onTogglePrayerIndex(index)}
                  className="rounded-full border px-3 py-1.5"
                  style={{
                    borderColor: isSelected ? tokens.accent : withAlpha(tokens.textPrimary, 0.15),
                    backgroundColor: isSelected ? withAlpha(tokens.accent, 0.15) : "transparent"
                  }}
                >
                  <Text className="text-xs font-medium" style={{ color: isSelected ? tokens.accent : tokens.textMuted }}>
                    {t(`vird:prayerIndex.${index}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {items.length === 0 ? (
        <Text className="text-xs text-text-muted">{t("vird:editor.slotEmpty")}</Text>
      ) : (
        <View className="gap-2">
          {items.map((item) => {
            const snapshot = displaySnapshots[item.ref];
            const name = snapshot ? resolveLocalizedText(snapshot.name, locale) : t("vird:home.itemFallbackName");
            return (
              <View key={item.ref} className="flex-row items-center gap-2">
                <Text className="flex-1 text-sm text-text-primary" numberOfLines={1}>
                  {name}
                </Text>
                <ThemedInput
                  value={String(item.target)}
                  onChangeText={(value) => onTargetChange(item.ref, Number.parseInt(value.replace(/\D+/g, ""), 10) || 0)}
                  keyboardType="number-pad"
                  testID={TEST_IDS.vird.itemTarget}
                  className="w-16 rounded-lg bg-bg px-2 py-1.5 text-center"
                />
                <Pressable
                  onPress={() => onRemove(item.ref)}
                  className="h-8 w-8 items-center justify-center rounded-full border border-white/15"
                >
                  <FontAwesome6 name="xmark" iconStyle="solid" size={12} color={tokens.textMuted} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </ThemedCard>
  );
}

