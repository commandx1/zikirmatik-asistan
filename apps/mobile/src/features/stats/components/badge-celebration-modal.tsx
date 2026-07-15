import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "@zikirmatik/ui";
import { useTranslation } from "react-i18next";
import type { StatsBadge } from "@zikirmatik/shared";

type BadgeCelebrationModalProps = {
  badge: StatsBadge | null;
  onDismiss: () => void;
};

export function BadgeCelebrationModal({ badge, onDismiss }: BadgeCelebrationModalProps) {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("stats");
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={badge !== null} transparent animationType="fade" onRequestClose={onDismiss}>
      <View className="flex-1 items-center justify-end bg-black/55">
        <View
          className="w-full items-center rounded-t-3xl px-6 pt-6"
          style={{
            borderTopWidth: 1,
            borderTopColor: withAlpha(tokens.accent, 0.3),
            backgroundColor: tokens.card,
            paddingBottom: 28 + Math.max(insets.bottom, 0)
          }}
        >
          <View className="mb-5 h-1.5 w-12 rounded-full" style={{ backgroundColor: withAlpha(tokens.textPrimary, 0.18) }} />

          <View
            className="h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: withAlpha(tokens.accent, 0.16) }}
          >
            <FontAwesome6 name="medal" iconStyle="solid" size={26} color={tokens.accent} />
          </View>

          <Text className="mt-4 text-lg font-semibold" style={{ color: tokens.textPrimary }}>
            {t("stats:badgeCelebration.title")}
          </Text>
          <Text className="mt-1 text-center text-base font-semibold" style={{ color: tokens.accent }}>
            {badge?.label}
          </Text>
          <Text className="mt-2 text-center text-sm leading-5" style={{ color: tokens.textMuted }}>
            {t("stats:badgeCelebration.description")}
          </Text>

          <Pressable
            onPress={onDismiss}
            className="mt-6 w-full rounded-full px-4 py-3"
            style={{ backgroundColor: tokens.accent }}
            accessibilityRole="button"
            accessibilityLabel={t("stats:badgeCelebration.close")}
          >
            <Text className="text-center text-sm font-bold" style={{ color: tokens.bg }}>
              {t("stats:badgeCelebration.great")}
            </Text>
          </Pressable>
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
