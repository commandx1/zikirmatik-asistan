import { useThemeTokens } from "@zikirmatik/ui";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

type UnsavedDhikrTransitionModalProps = {
  visible: boolean;
  dhikrName: string;
  count: number;
  isSaving: boolean;
  error: string | null;
  onSaveAndContinue: () => void;
  onContinueWithoutSaving: () => void;
  onCancel: () => void;
};

export function UnsavedDhikrTransitionModal({
  visible,
  dhikrName,
  count,
  isSaving,
  error,
  onSaveAndContinue,
  onContinueWithoutSaving,
  onCancel
}: UnsavedDhikrTransitionModalProps) {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("components");
  const title = dhikrName.trim() || t("focus:fallback.thisDhikr");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/55 px-6">
        <View
          className="w-full max-w-[360px] rounded-2xl p-5"
          style={{
            borderWidth: 1,
            borderColor: withAlpha(tokens.textPrimary, 0.12),
            backgroundColor: tokens.card
          }}
        >
          <Text className="mb-2 text-base font-semibold" style={{ color: tokens.textPrimary }}>
            {t("components:unsavedDhikrTransitionModal.title")}
          </Text>
          <Text className="text-sm leading-5" style={{ color: tokens.textMuted }}>
            {t("components:unsavedDhikrTransitionModal.message", { title, count: Math.max(0, Math.floor(count)) })}
          </Text>
          {error ? <Text className="mt-3 text-xs text-[#F97373]">{error}</Text> : null}

          <View className="mt-5 gap-2">
            <Pressable
              disabled={isSaving}
              onPress={onSaveAndContinue}
              className="h-11 items-center justify-center rounded-full px-4"
              style={{ backgroundColor: tokens.accent, opacity: isSaving ? 0.72 : 1 }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={tokens.bg} />
              ) : (
                <Text className="text-sm font-semibold" style={{ color: tokens.bg }}>
                  {t("components:unsavedDhikrTransitionModal.saveAndContinue")}
                </Text>
              )}
            </Pressable>
            <Pressable
              disabled={isSaving}
              onPress={onContinueWithoutSaving}
              className="h-11 items-center justify-center rounded-full border px-4"
              style={{
                borderColor: withAlpha(tokens.textPrimary, 0.18),
                backgroundColor: withAlpha(tokens.textPrimary, 0.06),
                opacity: isSaving ? 0.56 : 1
              }}
            >
              <Text className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                {t("components:unsavedDhikrTransitionModal.continueWithoutSaving")}
              </Text>
            </Pressable>
            <Pressable
              disabled={isSaving}
              onPress={onCancel}
              className="h-10 items-center justify-center rounded-full px-4"
              style={{ opacity: isSaving ? 0.56 : 1 }}
            >
              <Text className="text-sm font-medium" style={{ color: tokens.textMuted }}>
                {t("components:unsavedDhikrTransitionModal.cancel")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (!(normalized.length === 6 || normalized.length === 8)) {
    return hex;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}
