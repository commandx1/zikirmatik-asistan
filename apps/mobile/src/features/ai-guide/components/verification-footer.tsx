import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

export function VerificationFooter() {
  const { t } = useTranslation("ai-guide");

  return (
    <View className="mb-2 mt-4 flex-row items-center justify-center gap-2 opacity-60">
      <FontAwesome6 name="circle-check" size={11} color="#C8972A" />
      <Text className="text-xs text-[#9A9080]">{t("ai-guide:verificationFooter.text")}</Text>
    </View>
  );
}
