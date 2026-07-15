import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

type ProfileLogoutRowProps = {
  onPress: () => void;
};

export function ProfileLogoutRow({ onPress }: ProfileLogoutRowProps) {
  const { t } = useTranslation("profile");

  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-start p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-8 w-8" />
        <Text className="text-base font-medium text-[#EF4444]">{t("profile:sections.other.logout")}</Text>
      </View>
    </Pressable>
  );
}
