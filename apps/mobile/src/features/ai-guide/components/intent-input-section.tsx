import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import { useThemeTokens } from "@zikirmatik/ui";
import { ThemedInput } from "../../../components/ui/themed-input";
import { ThemedTag } from "../../../components/ui/themed-tag";
import { AI_GUIDE_INPUT_PLACEHOLDER, AI_GUIDE_PROMPT_CHIPS } from "../data";

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

  return (
    <View className="mb-8">
      <ThemedInput
        value={value}
        onChangeText={onChangeValue}
        placeholder={AI_GUIDE_INPUT_PLACEHOLDER}
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
        {AI_GUIDE_PROMPT_CHIPS.map((chip) => (
          <ThemedTag key={chip} label={chip} onPress={isLoading ? undefined : () => onSelectPrompt(chip)} />
        ))}
        {typeof creditBalance === "number" ? (
          <Pressable
            onPress={onPressCredits}
            disabled={!onPressCredits}
            className="ml-auto flex-row items-center gap-1.5 rounded-full bg-[--bg] px-3 py-1.5"
            accessibilityRole="button"
            accessibilityLabel={`Kalan kredi: ${creditBalance}`}
          >
            <FontAwesome6 name="coins" size={12} color={tokens.accent} />
            <Text className="text-xs font-semibold text-[--fg]" style={{ color: tokens.accent }}>
              {creditBalance} kredi
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
