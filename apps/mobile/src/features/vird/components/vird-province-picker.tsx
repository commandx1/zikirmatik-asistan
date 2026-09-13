import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "@zikirmatik/ui";
import { ThemedInput } from "../../../components/ui/themed-input";
import { TR_PROVINCES, type TrProvince } from "../data/tr-provinces";

type VirdProvincePickerProps = {
  visible: boolean;
  selectedKey: string | null;
  onSelect: (province: TrProvince) => void;
  onRequestClose: () => void;
};

// data/tr-provinces.ts'teki 81 il için basit arama listesi — reminderPrefs.
// provinceKey'i seçmek için (bkz. vird-reminder-settings.tsx). AppSelectBox
// ile aynı bottom-sheet Modal deseni, tek fark: 81 öğelik listede arama
// gerektiğinden özel bir bileşen (arama kutusu + FlatList).
export function VirdProvincePicker({ visible, selectedKey, onSelect, onRequestClose }: VirdProvincePickerProps) {
  const { t } = useTranslation("vird");
  const { tokens } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr");
    if (!normalized) {
      return TR_PROVINCES;
    }
    return TR_PROVINCES.filter((province) => province.name.toLocaleLowerCase("tr").includes(normalized));
  }, [query]);

  const close = () => {
    setQuery("");
    onRequestClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable className="flex-1 bg-black/55" onPress={close}>
        <View className="flex-1 justify-end">
          <Pressable
            onPress={() => undefined}
            className="rounded-t-3xl border-t px-5 pt-5"
            style={{
              borderColor: withAlpha(tokens.textPrimary, 0.08),
              backgroundColor: tokens.bg,
              maxHeight: "80%",
              paddingBottom: Math.max(20, insets.bottom + 12)
            }}
          >
            <Text className="mb-3 text-base font-semibold" style={{ color: tokens.textPrimary }}>
              {t("vird:reminders.provinceModalTitle")}
            </Text>

            <ThemedInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("vird:reminders.provinceSearchPlaceholder")}
              className="mb-3 rounded-xl bg-[--card] px-3"
              autoFocus
            />

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.key}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 4 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text className="py-6 text-center text-sm" style={{ color: tokens.textMuted }}>
                  {t("vird:reminders.provinceSearchEmpty")}
                </Text>
              }
              renderItem={({ item }) => {
                const isActive = item.key === selectedKey;
                return (
                  <Pressable
                    onPress={() => {
                      onSelect(item);
                      close();
                    }}
                    className="mb-2 rounded-xl border px-4 py-3"
                    style={{
                      borderColor: isActive ? withAlpha(tokens.accent, 0.45) : withAlpha(tokens.textPrimary, 0.12),
                      backgroundColor: isActive ? withAlpha(tokens.accent, 0.12) : tokens.card
                    }}
                  >
                    <Text className="text-base font-medium" style={{ color: isActive ? tokens.accent : tokens.textPrimary }}>
                      {item.name}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return hex;
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}
