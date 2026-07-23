import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import { useTranslation } from "react-i18next";

export function ChatEmptyState() {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("ai-chat");

  return (
    <View className="mb-6 items-center rounded-2xl border border-white/10 bg-[--card] px-5 py-8">
      <FontAwesome6 name="comment-dots" iconStyle="solid" size={22} color={tokens.accent} />
      <Text className="mt-3 text-center text-sm font-semibold text-[--text-primary]">
        {t("ai-chat:emptyState.title")}
      </Text>
      <Text className="mt-1.5 text-center text-xs leading-5 text-[--text-muted]">
        {t("ai-chat:emptyState.subtitle")}
      </Text>
    </View>
  );
}
