import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

type DemoControlsProps = {
  onToggleLoading: () => void;
};

export function DemoControls({ onToggleLoading }: DemoControlsProps) {
  const { t } = useTranslation("ai-guide");

  return (
    <View className="absolute right-4 top-4 z-[100] flex-row gap-2 opacity-10">
      <Pressable className="rounded bg-[#1F2937] px-2 py-1.5">
        <Text className="text-xs text-white">{t("ai-guide:demo.theme")}</Text>
      </Pressable>
      <Pressable onPress={onToggleLoading} className="rounded bg-[#C8972A] px-2 py-1.5">
        <Text className="text-xs font-medium text-black">{t("ai-guide:demo.loading")}</Text>
      </Pressable>
    </View>
  );
}
