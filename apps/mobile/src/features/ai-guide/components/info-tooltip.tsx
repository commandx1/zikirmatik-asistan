import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ThemedCard } from "../../../components/ui/themed-card";

type InfoTooltipProps = {
  visible: boolean;
};

export function InfoTooltip({ visible }: InfoTooltipProps) {
  const { t } = useTranslation("ai-guide");

  if (!visible) {
    return null;
  }

  return (
    <ThemedCard
      className="absolute left-5 right-5 top-24 z-50 rounded-xl p-4"
      borderClassName="border-[--accent]/20"
      elevated
    >
      <View className="flex-row items-start gap-3">
        <FontAwesome6 name="shield-halved" size={14} color="#D6A93D" style={{ marginTop: 2 }} />
        <Text className="flex-1 text-sm leading-5 text-[--text-primary]">
          {t("ai-guide:infoTooltip.text")}
        </Text>
      </View>
    </ThemedCard>
  );
}
