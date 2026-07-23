import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "@zikirmatik/ui";
import { useTranslation } from "react-i18next";
import { ThemedInput } from "../../../components/ui/themed-input";

type ChatInputProps = {
  value: string;
  isSending: boolean;
  creditBalance?: number;
  onPressCredits?: () => void;
  onChangeValue: (value: string) => void;
  onSend: () => void;
};

export function ChatInput({ value, isSending, creditBalance, onPressCredits, onChangeValue, onSend }: ChatInputProps) {
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("ai-chat");
  const insets = useSafeAreaInsets();
  return (
    // Klavye telafisi ekran seviyesindeki KeyboardAvoidingView'da (iOS) /
    // manuel klavye yüksekliği takibinde (Android) yapılıyor; burada alt
    // boşluk cihazın gesture nav bar / home indicator yüksekliğini de
    // kapsasın diye insets.bottom ile taban alınıyor (min 16).
    <View className="w-full px-5 pt-3 pb-2" style={{ marginBottom: Math.max(insets.bottom, 16) }}>
      {typeof creditBalance === "number" ? (
        <Pressable
          onPress={onPressCredits}
          disabled={!onPressCredits}
          className="mb-2 flex-row items-center gap-1.5 self-end rounded-full bg-[--card] px-3 py-1.5"
          accessibilityRole="button"
          accessibilityLabel={t("ai-chat:input.creditBalanceLabel", { count: creditBalance })}
        >
          <FontAwesome6 name="coins" size={12} color={tokens.accent} />
          <Text className="text-xs font-semibold" style={{ color: tokens.accent }}>
            {t("ai-chat:input.creditBalance", { count: creditBalance })}
          </Text>
        </Pressable>
      ) : null}

      <ThemedInput
        value={value}
        onChangeText={onChangeValue}
        placeholder={t("ai-chat:input.placeholder")}
        shape="xl"
        multiline
        numberOfLines={2}
        textAlignVertical="top"
        className="min-h-[52px] pl-4 pr-14 pt-3"
        trailing={
          <Pressable
            onPress={onSend}
            disabled={isSending || !value.trim()}
            className={`h-10 w-10 items-center justify-center rounded-full bg-[--bg] ${
              isSending || !value.trim() ? "opacity-50" : ""
            }`}
          >
            <FontAwesome6 name="paper-plane" size={14} color={tokens.accent} />
          </Pressable>
        }
      />
    </View>
  );
}
