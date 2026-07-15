import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import { useTranslation } from "react-i18next";
import { ThemedInput } from "../../../components/ui/themed-input";
import { ThemedTag } from "../../../components/ui/themed-tag";

type IntentInputSectionProps = {
  value: string;
  isLoading: boolean;
  creditBalance?: number;
  onPressCredits?: () => void;
  onChangeValue: (value: string) => void;
  onSend: () => void;
  onSelectPrompt: (value: string) => void;
};

export function IntentInputSection({
  value,
  isLoading,
  creditBalance,
  onPressCredits,
  onChangeValue,
  onSend,
  onSelectPrompt
}: IntentInputSectionProps) {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("ai-guide");
  const promptChips = [
    t("ai-guide:promptChips.sad"),
    t("ai-guide:promptChips.anxious"),
    t("ai-guide:promptChips.grateful")
  ];

  return (
    <View className="mb-8">
      <ThemedInput
        value={value}
        onChangeText={onChangeValue}
        placeholder={t("ai-guide:input.placeholder")}
        shape="xl"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        className="min-h-[132px] pl-5 pr-14 pt-4"
        trailing={
          <Pressable
            onPress={onSend}
            disabled={isLoading}
            className={`h-10 w-10 items-center justify-center rounded-full bg-[--bg] ${isLoading ? "opacity-60" : ""}`}
          >
            <FontAwesome6 name="paper-plane" size={14} color={tokens.accent} />
          </Pressable>
        }
      />

      <View className="mt-3 flex-row flex-wrap items-center gap-2">
        {promptChips.map((chip) => (
          <ThemedTag key={chip} label={chip} onPress={isLoading ? undefined : () => onSelectPrompt(chip)} />
        ))}
        {typeof creditBalance === "number" ? (
          <Pressable
            onPress={onPressCredits}
            disabled={!onPressCredits}
            className="ml-auto flex-row items-center gap-1.5 rounded-full bg-[--bg] px-3 py-1.5"
            accessibilityRole="button"
            accessibilityLabel={t("ai-guide:input.creditBalanceLabel", { count: creditBalance })}
          >
            <FontAwesome6 name="coins" size={12} color={tokens.accent} />
            <Text className="text-xs font-semibold text-[--fg]" style={{ color: tokens.accent }}>
              {t("ai-guide:input.creditBalance", { count: creditBalance })}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
