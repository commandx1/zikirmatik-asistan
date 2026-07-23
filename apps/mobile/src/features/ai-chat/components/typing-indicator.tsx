import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ThemedCard } from "../../../components/ui/themed-card";

type TypingIndicatorProps = {
  stepMessage?: string;
};

export function TypingIndicator({ stepMessage }: TypingIndicatorProps) {
  const { t } = useTranslation("ai-chat");

  return (
    <View className="mb-4 w-full items-start">
      <ThemedCard className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-3" accent="accentSoft">
        <Text className="text-sm text-[--text-muted]">{stepMessage || t("ai-chat:loading.defaultStep")}</Text>
      </ThemedCard>
    </View>
  );
}
