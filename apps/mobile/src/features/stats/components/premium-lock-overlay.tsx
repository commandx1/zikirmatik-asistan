import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import type { PropsWithChildren } from "react";
import { Pressable, Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import { useTranslation } from "react-i18next";

type PremiumLockOverlayProps = PropsWithChildren<{
  locked: boolean;
  onUnlock: () => void;
  message?: string;
}>;

export function PremiumLockOverlay({ locked, onUnlock, message, children }: PremiumLockOverlayProps) {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("stats");

  if (!locked) {
    return <>{children}</>;
  }

  return (
    <View className="relative overflow-hidden rounded-2xl">
      <View pointerEvents="none" style={{ opacity: 0.35 }}>
        {children}
      </View>
      <View className="absolute inset-0 items-center justify-center px-6">
        <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: tokens.accent }}>
          <FontAwesome6 name="lock" iconStyle="solid" size={16} color={tokens.bg} />
        </View>
        <Text className="mt-3 text-center text-sm text-[--text-muted]">
          {message ?? t("stats:premiumLock.message")}
        </Text>
        <Pressable
          onPress={onUnlock}
          className="mt-3 rounded-full px-5 py-2.5"
          style={{ backgroundColor: tokens.accent }}
          accessibilityRole="button"
          accessibilityLabel={t("stats:premiumLock.unlock")}
        >
          <Text className="text-sm font-bold" style={{ color: tokens.bg }}>
            {t("stats:premiumLock.unlock")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
